import express from "express";
import { createServer as createViteServer } from "vite";
import session from "express-session";
import { OAuth2Client } from "google-auth-library";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import dotenv from "dotenv";
import admin from "firebase-admin";

dotenv.config();

// Initialize Firebase Admin if service account is provided
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
}

const app = express();
const PORT = 3000;
const db = new Database("water_reminder.db");

// Trust proxy is required for secure cookies behind reverse proxy / Cloud Run
app.set("trust proxy", 1);

// Initialize Database Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    google_id TEXT UNIQUE,
    firebase_uid TEXT UNIQUE,
    email TEXT UNIQUE,
    password_hash TEXT,
    name TEXT,
    daily_goal INTEGER DEFAULT 2200,
    weight INTEGER DEFAULT 70,
    gender TEXT DEFAULT 'other',
    wake_up_time TEXT DEFAULT '08:00',
    sleep_time TEXT DEFAULT '22:00',
    profile_json TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Safe migrations for existing SQLite databases
try {
  const tableInfo = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
  const colNames = new Set(tableInfo.map(c => c.name));

  if (!colNames.has("firebase_uid")) {
    db.prepare("ALTER TABLE users ADD COLUMN firebase_uid TEXT").run();
  }
  if (!colNames.has("password_hash")) {
    db.prepare("ALTER TABLE users ADD COLUMN password_hash TEXT").run();
  }
  if (!colNames.has("profile_json")) {
    db.prepare("ALTER TABLE users ADD COLUMN profile_json TEXT").run();
  }
  if (!colNames.has("updated_at")) {
    db.prepare("ALTER TABLE users ADD COLUMN updated_at DATETIME").run();
  }
} catch (error) {
  console.error("Users migration notice:", error);
}

db.exec(`
  CREATE TABLE IF NOT EXISTS intake_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    log_id TEXT,
    amount INTEGER,
    drink_type TEXT DEFAULT 'water',
    note TEXT DEFAULT '',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

try {
  const logTableInfo = db.prepare("PRAGMA table_info(intake_logs)").all() as Array<{ name: string }>;
  const logColNames = new Set(logTableInfo.map(c => c.name));

  if (!logColNames.has("log_id")) {
    db.prepare("ALTER TABLE intake_logs ADD COLUMN log_id TEXT").run();
  }
  if (!logColNames.has("drink_type")) {
    db.prepare("ALTER TABLE intake_logs ADD COLUMN drink_type TEXT DEFAULT 'water'").run();
  }
  if (!logColNames.has("note")) {
    db.prepare("ALTER TABLE intake_logs ADD COLUMN note TEXT DEFAULT ''").run();
  }
} catch (error) {
  console.error("Logs migration notice:", error);
}

app.use(express.json({ limit: "2mb" }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "siplumo-water-reminder-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,
      sameSite: "none",
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
  })
);

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "_siplumo_salt").digest("hex");
}

// Helper to get static file path safely across dev and production
function getPublicFilePath(filename: string): string {
  const publicPath = path.join(process.cwd(), "public", filename);
  if (fs.existsSync(publicPath)) return publicPath;
  const distPath = path.join(process.cwd(), "dist", filename);
  if (fs.existsSync(distPath)) return distPath;
  return publicPath;
}

// Privacy Policy, Terms, and AdMob app-ads.txt Direct Routes
app.get(["/privacy-policy", "/privacy", "/privacy.html"], (req, res) => {
  const filePath = getPublicFilePath("privacy-policy.html");
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send("Privacy Policy not found");
  }
});

app.get(["/terms", "/terms-and-conditions", "/terms.html"], (req, res) => {
  const filePath = getPublicFilePath("terms-and-conditions.html");
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send("Terms and Conditions not found");
  }
});

app.get(["/delete-account", "/account-deletion", "/delete-account.html"], (req, res) => {
  const filePath = getPublicFilePath("delete-account.html");
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send("Account Deletion page not found");
  }
});

app.get("/app-ads.txt", (req, res) => {
  const filePath = getPublicFilePath("app-ads.txt");
  if (fs.existsSync(filePath)) {
    res.type("text/plain").sendFile(filePath);
  } else {
    res.status(404).send("app-ads.txt not found");
  }
});

// ==================== AUTHENTICATION ROUTES ====================

// 1. Check current session
app.get("/api/auth/session", (req, res) => {
  const userId = (req.session as any)?.userId;
  if (!userId) {
    return res.json({ authenticated: false, user: null });
  }
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;
  if (!user) {
    return res.json({ authenticated: false, user: null });
  }
  return res.json({
    authenticated: true,
    user: {
      uid: user.firebase_uid || `local_${user.id}`,
      email: user.email,
      displayName: user.name || user.email?.split("@")[0] || "Hydration Friend",
      providerId: user.google_id ? "google.com" : "password"
    }
  });
});

// 2. Email & Password Login or Registration
app.post("/api/auth/login", (req, res) => {
  try {
    const { email, password, displayName, isSignUp } = req.body;
    const cleanEmail = String(email || "").trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }
    if (!password || String(password).length < 4) {
      return res.status(400).json({ error: "Password must be at least 4 characters." });
    }

    const pwdHash = hashPassword(String(password));
    let user = db.prepare("SELECT * FROM users WHERE LOWER(email) = ?").get(cleanEmail) as any;

    if (user) {
      // If user already has a password hash and is signing in, check it
      if (!isSignUp && user.password_hash && user.password_hash !== pwdHash) {
        return res.status(401).json({ error: "Incorrect password for this account. Please try again." });
      }
      // Update password hash or name if needed
      const updatedName = displayName?.trim() || user.name || cleanEmail.split("@")[0];
      const uid = user.firebase_uid || `user_${user.id}`;
      db.prepare("UPDATE users SET password_hash = ?, name = ?, firebase_uid = ? WHERE id = ?").run(
        pwdHash,
        updatedName,
        uid,
        user.id
      );
      user = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id);
    } else {
      const nameToUse = displayName?.trim() || cleanEmail.split("@")[0];
      const generatedUid = "usr_" + crypto.randomBytes(8).toString("hex");
      const info = db
        .prepare(
          "INSERT INTO users (firebase_uid, email, password_hash, name, daily_goal) VALUES (?, ?, ?, ?, ?)"
        )
        .run(generatedUid, cleanEmail, pwdHash, nameToUse, 2200);
      user = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
    }

    (req.session as any).userId = user.id;

    return res.json({
      success: true,
      user: {
        uid: user.firebase_uid || `user_${user.id}`,
        email: user.email,
        displayName: user.name || cleanEmail.split("@")[0],
        providerId: "password"
      }
    });
  } catch (err: any) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Could not complete sign in. Please try again." });
  }
});

// 3. Google Account Connect / Session Sync (handles both Firebase Google Auth & iframe fallback)
app.post("/api/auth/google-connect", (req, res) => {
  try {
    const { uid, email, displayName } = req.body;
    const cleanEmail = String(email || "").trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return res.status(400).json({ error: "Please enter a valid Google email address." });
    }

    const nameToUse =
      String(displayName || "").trim() ||
      cleanEmail
        .split("@")[0]
        .replace(/[._-]/g, " ")
        .replace(/\b\w/g, l => l.toUpperCase());

    let user = db.prepare("SELECT * FROM users WHERE LOWER(email) = ?").get(cleanEmail) as any;
    if (!user && uid) {
      user = db.prepare("SELECT * FROM users WHERE firebase_uid = ?").get(uid) as any;
    }

    const finalUid = uid || user?.firebase_uid || "ggl_" + crypto.createHash("md5").update(cleanEmail).digest("hex").slice(0, 16);

    if (user) {
      db.prepare("UPDATE users SET firebase_uid = ?, email = ?, name = ?, google_id = ? WHERE id = ?").run(
        finalUid,
        cleanEmail,
        nameToUse,
        finalUid,
        user.id
      );
      user = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id);
    } else {
      const info = db
        .prepare("INSERT INTO users (firebase_uid, google_id, email, name, daily_goal) VALUES (?, ?, ?, ?, ?)")
        .run(finalUid, finalUid, cleanEmail, nameToUse, 2200);
      user = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
    }

    (req.session as any).userId = user.id;

    return res.json({
      success: true,
      user: {
        uid: user.firebase_uid || finalUid,
        email: user.email,
        displayName: user.name || nameToUse,
        providerId: "google.com"
      }
    });
  } catch (err: any) {
    console.error("Google connect error:", err);
    return res.status(500).json({ error: "Could not connect Google account." });
  }
});

// 4. Legacy / Firebase ID token verification route (graceful fallback if Admin SDK not configured)
app.post("/api/auth/firebase", async (req, res) => {
  const { idToken, email, name, uid } = req.body;
  try {
    let resolvedUid = uid;
    let resolvedEmail = email;
    let resolvedName = name;

    if (idToken && admin.apps.length > 0) {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      resolvedUid = decodedToken.uid;
      resolvedEmail = decodedToken.email;
      resolvedName = decodedToken.name;
    } else if (idToken && !resolvedUid) {
      // Decode JWT payload safely when service account env var is not present
      const parts = String(idToken).split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
        resolvedUid = payload.user_id || payload.sub;
        resolvedEmail = payload.email || resolvedEmail;
        resolvedName = payload.name || resolvedName;
      }
    }

    if (!resolvedUid && !resolvedEmail) {
      return res.status(400).json({ error: "Missing user identifier" });
    }

    let user = resolvedUid
      ? db.prepare("SELECT * FROM users WHERE firebase_uid = ?").get(resolvedUid)
      : null;

    if (!user && resolvedEmail) {
      user = db.prepare("SELECT * FROM users WHERE LOWER(email) = ?").get(String(resolvedEmail).toLowerCase());
      if (user && resolvedUid) {
        db.prepare("UPDATE users SET firebase_uid = ? WHERE id = ?").run(resolvedUid, (user as any).id);
      }
    }

    if (!user) {
      const info = db
        .prepare("INSERT INTO users (firebase_uid, email, name) VALUES (?, ?, ?)")
        .run(resolvedUid || `usr_${Date.now()}`, resolvedEmail || "", resolvedName || "Hydration User");
      user = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
    }

    (req.session as any).userId = (user as any).id;
    return res.json({ success: true, user });
  } catch (error) {
    console.error("Firebase auth route error:", error);
    return res.status(401).json({ error: "Authentication failed" });
  }
});

// ==================== CLOUD SYNC BACKUP & RESTORE ROUTES ====================

app.post("/api/sync/backup", (req, res) => {
  try {
    const { uid, email, profile, logs } = req.body;
    if (!uid && !email) {
      return res.status(400).json({ error: "Missing user ID or email for backup" });
    }

    const cleanEmail = email ? String(email).trim().toLowerCase() : null;
    let user = uid ? (db.prepare("SELECT * FROM users WHERE firebase_uid = ?").get(uid) as any) : null;
    if (!user && cleanEmail) {
      user = db.prepare("SELECT * FROM users WHERE LOWER(email) = ?").get(cleanEmail) as any;
    }

    const profileJsonStr = profile ? JSON.stringify(profile) : null;
    const displayName = profile?.displayName || user?.name || "Hydration User";
    const dailyGoal = profile?.dailyTargetMl || user?.daily_goal || 2200;
    const weight = profile?.weightKg || user?.weight || 70;

    if (user) {
      db.prepare(
        `UPDATE users
         SET firebase_uid = COALESCE(?, firebase_uid),
             email = COALESCE(?, email),
             name = ?,
             daily_goal = ?,
             weight = ?,
             profile_json = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      ).run(uid || null, cleanEmail, displayName, dailyGoal, weight, profileJsonStr, user.id);
    } else {
      const info = db
        .prepare(
          `INSERT INTO users (firebase_uid, email, name, daily_goal, weight, profile_json, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
        )
        .run(uid || `usr_${Date.now()}`, cleanEmail, displayName, dailyGoal, weight, profileJsonStr);
      user = { id: info.lastInsertRowid };
    }

    if (Array.isArray(logs)) {
      const recentLogs = logs.slice(-200);
      db.prepare("DELETE FROM intake_logs WHERE user_id = ?").run(user.id);
      const insertLog = db.prepare(
        "INSERT INTO intake_logs (user_id, log_id, amount, drink_type, note, timestamp) VALUES (?, ?, ?, ?, ?, ?)"
      );
      const insertMany = db.transaction((items: any[]) => {
        for (const item of items) {
          insertLog.run(
            user.id,
            item.id || `log_${Date.now()}`,
            Number(item.amount) || 250,
            item.drinkType || "water",
            item.note || "",
            item.timestamp || new Date().toISOString()
          );
        }
      });
      insertMany(recentLogs);
    }

    return res.json({
      success: true,
      syncedAt: new Date().toISOString(),
      logsCount: Array.isArray(logs) ? logs.length : 0
    });
  } catch (err: any) {
    console.error("Backup sync error:", err);
    return res.status(500).json({ error: "Failed to save backup" });
  }
});

app.get("/api/sync/restore", (req, res) => {
  try {
    const uid = req.query.uid as string | undefined;
    const email = req.query.email ? String(req.query.email).trim().toLowerCase() : undefined;

    let user: any = null;
    if (uid) {
      user = db.prepare("SELECT * FROM users WHERE firebase_uid = ?").get(uid);
    }
    if (!user && email) {
      user = db.prepare("SELECT * FROM users WHERE LOWER(email) = ?").get(email);
    }
    if (!user && (req.session as any)?.userId) {
      user = db.prepare("SELECT * FROM users WHERE id = ?").get((req.session as any).userId);
    }

    if (!user) {
      return res.json({ found: false, profile: null, logs: [] });
    }

    let restoredProfile: any = null;
    if (user.profile_json) {
      try {
        restoredProfile = JSON.parse(user.profile_json);
      } catch (e) {
        restoredProfile = null;
      }
    }

    if (!restoredProfile) {
      restoredProfile = {
        displayName: user.name || "Hydration User",
        email: user.email || undefined,
        dailyTargetMl: user.daily_goal || 2200,
        weightKg: user.weight || 70,
        cloudSyncEnabled: true
      };
    }

    const dbLogs = db
      .prepare("SELECT * FROM intake_logs WHERE user_id = ? ORDER BY timestamp ASC")
      .all(user.id) as any[];

    const logs = dbLogs.map(row => ({
      id: row.log_id || `log_${row.id}`,
      amount: Number(row.amount) || 250,
      timestamp: row.timestamp || new Date().toISOString(),
      drinkType: row.drink_type || "water",
      note: row.note || "",
      synced: true
    }));

    return res.json({
      found: true,
      profile: restoredProfile,
      logs
    });
  } catch (err: any) {
    console.error("Restore sync error:", err);
    return res.status(500).json({ error: "Failed to restore backup" });
  }
});

app.post(["/api/logout", "/api/auth/logout"], (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

app.post("/api/delete-account", (req, res) => {
  const { email, uid } = req.body;
  const sessionUserId = (req.session as any)?.userId;

  try {
    if (sessionUserId) {
      db.prepare("DELETE FROM intake_logs WHERE user_id = ?").run(sessionUserId);
      db.prepare("DELETE FROM users WHERE id = ?").run(sessionUserId);
      req.session.destroy(() => {});
    } else if (uid) {
      const user = db.prepare("SELECT id FROM users WHERE firebase_uid = ?").get(uid) as any;
      if (user) {
        db.prepare("DELETE FROM intake_logs WHERE user_id = ?").run(user.id);
        db.prepare("DELETE FROM users WHERE id = ?").run(user.id);
      }
    } else if (email) {
      const user = db.prepare("SELECT id FROM users WHERE LOWER(email) = ?").get(String(email).toLowerCase()) as any;
      if (user) {
        db.prepare("DELETE FROM intake_logs WHERE user_id = ?").run(user.id);
        db.prepare("DELETE FROM users WHERE id = ?").run(user.id);
      }
    }
    res.json({ success: true, message: "Account and records purged." });
  } catch (err) {
    console.error("Delete account error:", err);
    res.status(500).json({ error: "Failed to delete account" });
  }
});

async function startServer() {
  const distPath = path.join(process.cwd(), "dist");
  const hasDist = fs.existsSync(distPath) && fs.existsSync(path.join(distPath, "index.html"));

  if (process.env.NODE_ENV === "production" && hasDist) {
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
