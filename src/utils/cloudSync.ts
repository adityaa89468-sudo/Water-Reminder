import {
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
 * Uploads user profile and water logs to Firestore under users/{userId}
 */
export async function syncProgressToFirestore(
  userId: string,
  profile: UserProfile,
  logs: WaterLog[]
): Promise<boolean> {
  if (!userId) return false;

  try {
    // 1. Sync User Profile doc
    const userDocRef = doc(db, 'users', userId);
    const profilePayload = {
      firebase_uid: userId,
      name: profile.displayName || 'Hydration User',
      email: profile.email || '',
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

    // 2. Sync Recent Logs to subcollection
    const logsCollectionRef = collection(db, 'users', userId, 'logs');
    
    // Sync last 50 logs to keep operations fast and within quota
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
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
    return false;
  }
}

/**
 * Pulls synced logs & profile from Firestore if available
 */
export async function restoreProgressFromFirestore(userId: string): Promise<{
  profile: Partial<UserProfile> | null;
  logs: WaterLog[];
}> {
  if (!userId) return { profile: null, logs: [] };

  try {
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);

    let restoredProfile: Partial<UserProfile> | null = null;
    if (docSnap.exists()) {
      const data = docSnap.data();
      restoredProfile = {
        displayName: data.name || 'Hydration User',
        dailyTargetMl: data.daily_goal || 2200,
        weightKg: data.weight || 70,
        streak: data.streak || 0,
        bestStreak: data.bestStreak || 0,
        unitSystem: data.unitSystem || 'metric',
        cloudSyncEnabled: true
      };
    }

    // Pull logs
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

    return { profile: restoredProfile, logs: restoredLogs };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${userId}`);
    return { profile: null, logs: [] };
  }
}
