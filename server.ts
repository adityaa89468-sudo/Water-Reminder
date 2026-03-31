import express from "express";
import { createServer as createViteServer } from "vite";
import session from "express-session";
import { OAuth2Client } from "google-auth-library";
import Database from "better-sqlite3";
import path from "path";
import dotenv from "dotenv";
import admin from "firebase-admin";

dotenv.config();

// Initialize Firebase Admin
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log("Firebase Admin initialized with service account.");
    }
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
  }
} else {
  console.warn("⚠️ WARNING: FIREBASE_SERVICE_ACCOUNT is not set. Firebase token verification will fail.");
}

// Validate environment variables
const requiredEnv = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"];
requiredEnv.forEach(env => {
  if (!process.env[env]) {
    console.warn(`⚠️ WARNING: ${env} is not set in environment variables!`);
  }
});

const app = express();
const PORT = 3000;
const db = new Database("water_reminder.db");

// Trust proxy is required for secure cookies in some environments
app.set('trust proxy', 1);

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    google_id TEXT UNIQUE,
    firebase_uid TEXT UNIQUE,
    email TEXT,
    name TEXT,
    daily_goal INTEGER DEFAULT 2000,
    weight INTEGER,
    gender TEXT,
    wake_up_time TEXT DEFAULT '07:00',
    sleep_time TEXT DEFAULT '22:00'
  );
`);

// Migration: Add firebase_uid if it's missing
try {
  const tableInfo = db.prepare("PRAGMA table_info(users)").all();
  const hasFirebaseUid = tableInfo.some((col: any) => col.name === 'firebase_uid');
  if (!hasFirebaseUid) {
    db.prepare("ALTER TABLE users ADD COLUMN firebase_uid TEXT UNIQUE").run();
    console.log("Migration: Added firebase_uid column to users table.");
  }
} catch (error) {
  console.error("Migration error:", error);
}

db.exec(`
  CREATE TABLE IF NOT EXISTS intake_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    amount INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || "water-reminder-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    sameSite: 'none',
    httpOnly: true,
  }
}));

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Auth Routes
app.get("/api/auth/url", (req, res) => {
  // Dynamically determine the base URL from request headers or environment
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const baseUrl = `${protocol}://${host}`;
  
  const redirectUri = `${baseUrl}/auth/callback`;
  console.log("Using Redirect URI:", redirectUri);
  
  if (!process.env.GOOGLE_CLIENT_ID) {
    console.error("GOOGLE_CLIENT_ID is not set in environment variables!");
    return res.status(500).json({ error: "Google Client ID not configured" });
  }

  const url = `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent"
  }).toString();
  res.json({ url });
});

app.post("/api/auth/firebase", async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ error: "Missing ID token" });

  if (admin.apps.length === 0) {
    console.error("Firebase Admin not initialized. Check FIREBASE_SERVICE_ACCOUNT env var.");
    return res.status(500).json({ 
      error: "Firebase Admin not initialized on the server. Please ensure you have added the FIREBASE_SERVICE_ACCOUNT JSON to your app settings." 
    });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name } = decodedToken;

    let user = db.prepare("SELECT * FROM users WHERE firebase_uid = ?").get(uid);
    
    if (!user) {
      // Check if user exists by email (to link accounts if they previously used Google OAuth)
      user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
      if (user) {
        db.prepare("UPDATE users SET firebase_uid = ? WHERE id = ?").run(uid, (user as any).id);
      } else {
        const info = db.prepare("INSERT INTO users (firebase_uid, email, name) VALUES (?, ?, ?)").run(uid, email, name || "");
        user = { id: info.lastInsertRowid, firebase_uid: uid, email, name: name || "", daily_goal: 2000 };
      }
    }

    (req.session as any).userId = (user as any).id;
    res.json({ success: true, user });
  } catch (error) {
    console.error("Firebase auth error:", error);
    res.status(401).json({ error: "Invalid ID token" });
  }
});

app.get("/auth/callback", async (req, res) => {
  const { code } = req.query;
  const redirectUri = `${process.env.APP_URL}/auth/callback`;

  try {
    const { tokens } = await client.getToken({
      code: code as string,
      redirect_uri: redirectUri
    });
    
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    if (!payload) throw new Error("No payload");

    let user = db.prepare("SELECT * FROM users WHERE google_id = ?").get(payload.sub);
    
    if (!user) {
      const info = db.prepare("INSERT INTO users (google_id, email, name) VALUES (?, ?, ?)").run(payload.sub, payload.email, payload.name);
      user = { id: info.lastInsertRowid, google_id: payload.sub, email: payload.email, name: payload.name, daily_goal: 2000 };
    }

    (req.session as any).userId = (user as any).id;

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Auth error:", error);
    res.status(500).send("Authentication failed");
  }
});

app.get("/api/me", (req, res) => {
  const userId = (req.session as any).userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  // Calculate Streak
  const logs = db.prepare(`
    SELECT date(timestamp, 'localtime') as log_date, SUM(amount) as total_amount
    FROM intake_logs
    WHERE user_id = ?
    GROUP BY log_date
    ORDER BY log_date DESC
  `).all(userId);

  let streak = 0;
  const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-CA');

  let checkDate = today;
  let logIndex = 0;

  // If today's goal is met, start from today. 
  // If not, but yesterday's was, start from yesterday.
  // Otherwise streak is 0.
  
  const todayLog = logs.find(l => (l as any).log_date === today);
  const yesterdayLog = logs.find(l => (l as any).log_date === yesterday);

  const goalMet = (log: any) => log && log.total_amount >= (user as any).daily_goal;

  if (goalMet(todayLog)) {
    checkDate = today;
  } else if (goalMet(yesterdayLog)) {
    checkDate = yesterday;
  } else {
    return res.json({ ...user, streak: 0 });
  }

  // Iterate backwards
  let currentCheck = new Date(checkDate);
  while (true) {
    const dateStr = currentCheck.toLocaleDateString('en-CA');
    const log = logs.find(l => (l as any).log_date === dateStr);
    
    if (goalMet(log)) {
      streak++;
      currentCheck.setDate(currentCheck.getDate() - 1);
    } else {
      break;
    }
  }

  res.json({ ...user, streak });
});

app.post("/api/me", (req, res) => {
  const userId = (req.session as any).userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  
  const { daily_goal, weight, gender, wake_up_time, sleep_time } = req.body;
  db.prepare("UPDATE users SET daily_goal = ?, weight = ?, gender = ?, wake_up_time = ?, sleep_time = ? WHERE id = ?")
    .run(daily_goal, weight, gender, wake_up_time, sleep_time, userId);
  
  res.json({ success: true });
});

app.get("/api/logs", (req, res) => {
  const userId = (req.session as any).userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  
  const logs = db.prepare("SELECT * FROM intake_logs WHERE user_id = ? AND date(timestamp) = date('now', 'localtime') ORDER BY timestamp DESC").all(userId);
  res.json(logs);
});

app.post("/api/logs", (req, res) => {
  const userId = (req.session as any).userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  
  const { amount } = req.body;
  db.prepare("INSERT INTO intake_logs (user_id, amount) VALUES (?, ?)").run(userId, amount);
  res.json({ success: true });
});

app.delete("/api/logs/:id", (req, res) => {
  const userId = (req.session as any).userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  
  db.prepare("DELETE FROM intake_logs WHERE id = ? AND user_id = ?").run(req.params.id, userId);
  res.json({ success: true });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
