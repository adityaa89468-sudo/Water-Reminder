import {
  auth,
  db,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  OperationType,
  handleFirestoreError
} from '../firebase';
import { UserProfile, WaterLog } from '../types';

export interface CloudSyncStatus {
  isSyncing: boolean;
  lastSyncedAt: string | null;
  error: string | null;
}

/**
 * Uploads user profile and water logs to Firestore (when Firebase Auth is active)
 * AND to the server SQLite backup endpoint (/api/sync/backup) for 100% reliability.
 */
export async function syncProgressToFirestore(
  userId: string,
  profile: UserProfile,
  logs: WaterLog[]
): Promise<boolean> {
  if (!userId) return false;

  let firestoreSucceeded = false;
  let serverBackupSucceeded = false;

  // 1. Sync to server SQLite database (/api/sync/backup)
  try {
    const resp = await fetch('/api/sync/backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        uid: userId,
        email: profile.email || auth.currentUser?.email || '',
        profile: {
          ...profile,
          firebase_uid: userId,
          cloudSyncEnabled: true
        },
        logs
      })
    });
    if (resp.ok) {
      serverBackupSucceeded = true;
    }
  } catch (e) {
    // Continue to Firestore sync if server endpoint is unreachable
  }

  // 2. Sync to Firebase Firestore if signed in with Firebase Auth matching userId
  if (auth.currentUser && auth.currentUser.uid === userId) {
    try {
      const userDocRef = doc(db, 'users', userId);
      const profilePayload = {
        firebase_uid: userId,
        name: profile.displayName || auth.currentUser.displayName || 'Hydration User',
        email: profile.email || auth.currentUser.email || '',
        daily_goal: profile.dailyTargetMl,
        weight: profile.weightKg,
        gender: profile.sex || 'other',
        streak: profile.streak || 0,
        bestStreak: profile.bestStreak || 0,
        unitSystem: profile.unitSystem,
        notifications_enabled: profile.reminders?.enabled ?? false,
        reminder_interval: profile.reminders?.intervalMinutes ?? 90,
        wake_up_time: profile.reminders?.startTime ?? '08:00',
        sleep_time: profile.reminders?.endTime ?? '22:00',
        dark_mode: profile.darkMode ?? false,
        total_liters: Number(((profile.totalDrankMl || 0) / 1000).toFixed(2)),
        lastSyncedAt: new Date().toISOString()
      };

      await setDoc(userDocRef, profilePayload, { merge: true });

      const logsCollectionRef = collection(db, 'users', userId, 'logs');
      const recentLogs = logs.slice(-50);
      const syncPromises = recentLogs.map(log => {
        const logDocRef = doc(logsCollectionRef, log.id);
        return setDoc(
          logDocRef,
          {
            user_id: userId,
            amount: log.amount,
            timestamp: log.timestamp,
            drinkType: log.drinkType || 'water',
            note: log.note || ''
          },
          { merge: true }
        );
      });

      await Promise.all(syncPromises);
      firestoreSucceeded = true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
    }
  }

  return serverBackupSucceeded || firestoreSucceeded;
}

/**
 * Pulls synced logs & profile from Firestore and/or server SQLite backup
 */
export async function restoreProgressFromFirestore(
  userId: string,
  email?: string | null
): Promise<{
  profile: Partial<UserProfile> | null;
  logs: WaterLog[];
}> {
  if (!userId && !email) return { profile: null, logs: [] };

  // 1. Try Firebase Firestore if signed in with Firebase Auth
  if (auth.currentUser && auth.currentUser.uid === userId) {
    try {
      const userDocRef = doc(db, 'users', userId);
      const docSnap = await getDoc(userDocRef);

      let restoredProfile: Partial<UserProfile> | null = null;
      if (docSnap.exists()) {
        const data = docSnap.data();
        restoredProfile = {
          displayName: data.name || 'Hydration User',
          email: data.email || auth.currentUser.email || undefined,
          dailyTargetMl: data.daily_goal || 2200,
          weightKg: data.weight || 70,
          streak: data.streak || 0,
          bestStreak: data.bestStreak || 0,
          unitSystem: data.unitSystem || 'metric',
          cloudSyncEnabled: true
        };
      }

      const logsCollectionRef = collection(db, 'users', userId, 'logs');
      const logsSnap = await getDocs(logsCollectionRef);
      const restoredLogs: WaterLog[] = [];

      logsSnap.forEach(docItem => {
        const lData = docItem.data();
        restoredLogs.push({
          id: docItem.id,
          amount: Number(lData.amount) || 250,
          timestamp: lData.timestamp || new Date().toISOString(),
          drinkType: lData.drinkType || 'water',
          note: lData.note || '',
          synced: true
        });
      });

      if (restoredProfile || restoredLogs.length > 0) {
        return { profile: restoredProfile, logs: restoredLogs };
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${userId}`);
    }
  }

  // 2. Fallback / Primary restore from server SQLite database (/api/sync/restore)
  try {
    const params = new URLSearchParams();
    if (userId) params.set('uid', userId);
    if (email) params.set('email', email);

    const resp = await fetch(`/api/sync/restore?${params.toString()}`, {
      method: 'GET',
      credentials: 'include'
    });
    if (resp.ok) {
      const data = await resp.json();
      if (data.found) {
        return {
          profile: data.profile
            ? {
                ...data.profile,
                cloudSyncEnabled: true
              }
            : null,
          logs: Array.isArray(data.logs) ? data.logs : []
        };
      }
    }
  } catch (e) {
    // Ignore network notice
  }

  return { profile: null, logs: [] };
}
