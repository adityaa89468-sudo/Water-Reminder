import { UserProfile, WaterLog, GlassPreset, DrinkType } from '../types';

const PROFILE_KEY = 'siplumo_user_profile';
const LOGS_KEY = 'siplumo_water_logs';
const SYNC_QUEUE_KEY = 'siplumo_sync_queue';

export const DEFAULT_PRESETS: GlassPreset[] = [
  { id: 'p1', name: 'Small Cup', amount: 150, icon: 'cup' },
  { id: 'p2', name: 'Glass', amount: 250, icon: 'glass' },
  { id: 'p3', name: 'Mug', amount: 350, icon: 'mug' },
  { id: 'p4', name: 'Water Bottle', amount: 500, icon: 'bottle' },
  { id: 'p5', name: 'Large Flask', amount: 750, icon: 'flask' }
];

export const DEFAULT_PROFILE: UserProfile = {
  id: 'guest_local',
  firebase_uid: null,
  email: null,
  displayName: 'Hydration Friend',
  ageRange: '18_30',
  sex: 'prefer_not_to_say',
  weightKg: 70,
  heightCm: 172,
  activityLevel: 'moderate',
  climate: 'normal',
  wakeUpTime: '07:00',
  bedTime: '22:30',
  pregnancyStatus: 'none',
  hasFluidRestriction: false,
  hasHealthCondition: false,
  unitSystem: 'metric',
  dailyTargetMl: 2100,
  recommendedBaseMl: 2100,
  customTargetSet: false,
  dayTargetOverrides: {},
  presets: DEFAULT_PRESETS,
  reminders: {
    enabled: true,
    mode: 'smart',
    startTime: '07:30',
    endTime: '22:00',
    intervalMinutes: 90,
    quietHoursEnabled: true,
    quietHoursStart: '22:30',
    quietHoursEnd: '07:00',
    activeDays: [0, 1, 2, 3, 4, 5, 6],
    soundEnabled: true,
    vibrationEnabled: true,
    stopAfterGoalReached: false,
    snoozeMinutes: 15,
    pausedUntilDate: null
  },
  darkMode: false,
  celebrationEnabled: true,
  cloudSyncEnabled: false,
  lastSyncedAt: null,
  language: 'en',
  onboardingCompleted: false,
  streak: 0,
  bestStreak: 0,
  totalDrankMl: 0
};

export function getStoredProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PROFILE, ...parsed };
  } catch (err) {
    console.error('Error loading stored profile, using default:', err);
    return { ...DEFAULT_PROFILE };
  }
}

export function saveStoredProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to save profile to localStorage:', err);
  }
}

export function getStoredLogs(): WaterLog[] {
  try {
    const raw = localStorage.getItem(LOGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error loading stored logs:', err);
    return [];
  }
}

export function saveStoredLogs(logs: WaterLog[]): void {
  try {
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  } catch (err) {
    console.error('Failed to save logs to localStorage:', err);
  }
}

export function addWaterLog(
  amountMl: number,
  drinkType: DrinkType = 'water',
  note?: string,
  timestamp?: string
): WaterLog {
  const logs = getStoredLogs();
  const newLog: WaterLog = {
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    amount: amountMl,
    timestamp: timestamp || new Date().toISOString(),
    drinkType,
    note,
    synced: false
  };
  
  const updatedLogs = [newLog, ...logs];
  saveStoredLogs(updatedLogs);

  // Update profile totals and streaks
  const profile = getStoredProfile();
  const { currentStreak, bestStreak } = calculateStreak(updatedLogs, profile);
  const totalDrank = updatedLogs.reduce((sum, l) => sum + l.amount, 0);

  saveStoredProfile({
    ...profile,
    streak: currentStreak,
    bestStreak: Math.max(bestStreak, profile.bestStreak || 0),
    totalDrankMl: totalDrank
  });

  return newLog;
}

export function undoLastWaterLog(): WaterLog | null {
  const logs = getStoredLogs();
  if (logs.length === 0) return null;

  const [removed, ...remaining] = logs;
  saveStoredLogs(remaining);

  const profile = getStoredProfile();
  const { currentStreak, bestStreak } = calculateStreak(remaining, profile);
  const totalDrank = remaining.reduce((sum, l) => sum + l.amount, 0);

  saveStoredProfile({
    ...profile,
    streak: currentStreak,
    bestStreak: Math.max(bestStreak, profile.bestStreak || 0),
    totalDrankMl: totalDrank
  });

  return removed;
}

export function deleteWaterLog(id: string): void {
  const logs = getStoredLogs();
  const filtered = logs.filter(l => l.id !== id);
  saveStoredLogs(filtered);

  const profile = getStoredProfile();
  const { currentStreak, bestStreak } = calculateStreak(filtered, profile);
  const totalDrank = filtered.reduce((sum, l) => sum + l.amount, 0);

  saveStoredProfile({
    ...profile,
    streak: currentStreak,
    bestStreak: Math.max(bestStreak, profile.bestStreak || 0),
    totalDrankMl: totalDrank
  });
}

export function updateWaterLog(
  id: string,
  amount: number,
  timestamp?: string,
  drinkType?: DrinkType,
  note?: string
): void {
  const logs = getStoredLogs();
  const updated = logs.map(l => {
    if (l.id === id) {
      return {
        ...l,
        amount,
        timestamp: timestamp || l.timestamp,
        drinkType: drinkType || l.drinkType,
        note: note !== undefined ? note : l.note,
        synced: false
      };
    }
    return l;
  });
  saveStoredLogs(updated);

  const profile = getStoredProfile();
  const { currentStreak, bestStreak } = calculateStreak(updated, profile);
  const totalDrank = updated.reduce((sum, l) => sum + l.amount, 0);

  saveStoredProfile({
    ...profile,
    streak: currentStreak,
    bestStreak: Math.max(bestStreak, profile.bestStreak || 0),
    totalDrankMl: totalDrank
  });
}

export function clearAllLocalData(): void {
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(LOGS_KEY);
  localStorage.removeItem(SYNC_QUEUE_KEY);
}

// Aliases for seamless imports
export const loadUserProfile = getStoredProfile;
export const saveUserProfile = saveStoredProfile;
export const loadWaterLogs = getStoredLogs;
export const saveWaterLogs = saveStoredLogs;
export const undoLastLog = undoLastWaterLog;
export const clearAllData = clearAllLocalData;

/**
 * Streak Calculation
 */
export function calculateStreak(
  logs: WaterLog[],
  profile: UserProfile
): { currentStreak: number; bestStreak: number } {
  if (logs.length === 0) return { currentStreak: 0, bestStreak: 0 };

  const dayTotals: Record<string, number> = {};
  logs.forEach(log => {
    const dayKey = log.timestamp.split('T')[0];
    dayTotals[dayKey] = (dayTotals[dayKey] || 0) + log.amount;
  });

  const today = new Date();
  const todayKey = today.toISOString().split('T')[0];

  const getTargetForDate = (dateKey: string) => {
    return profile.dayTargetOverrides?.[dateKey] || profile.dailyTargetMl || 2000;
  };

  let currentStreak = 0;
  let cursor = new Date(today);

  // Check today first
  if ((dayTotals[todayKey] || 0) >= getTargetForDate(todayKey)) {
    currentStreak++;
  }

  // Count backwards day by day
  cursor.setDate(cursor.getDate() - 1);
  while (true) {
    const key = cursor.toISOString().split('T')[0];
    const target = getTargetForDate(key);
    const drank = dayTotals[key] || 0;
    if (drank >= target) {
      currentStreak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  // Calculate best all-time streak
  const sortedDates = Object.keys(dayTotals).sort();
  let maxStreak = 0;
  let tempStreak = 0;
  let lastDate: Date | null = null;

  sortedDates.forEach(dateStr => {
    const target = getTargetForDate(dateStr);
    const drank = dayTotals[dateStr];
    if (drank >= target) {
      const thisDate = new Date(dateStr);
      if (lastDate) {
        const diffDays = Math.round((thisDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      lastDate = thisDate;
      if (tempStreak > maxStreak) maxStreak = tempStreak;
    }
  });

  return {
    currentStreak,
    bestStreak: Math.max(maxStreak, currentStreak)
  };
}

/**
 * Export helpers
 */
export function exportDataAsJSON(profile: UserProfile, logs: WaterLog[]): string {
  const exportPayload = {
    exportDate: new Date().toISOString(),
    app: 'SipLumo',
    version: '1.0.0',
    profile: {
      displayName: profile.displayName,
      ageRange: profile.ageRange,
      sex: profile.sex,
      weightKg: profile.weightKg,
      heightCm: profile.heightCm,
      activityLevel: profile.activityLevel,
      climate: profile.climate,
      dailyTargetMl: profile.dailyTargetMl,
      unitSystem: profile.unitSystem
    },
    intakeHistory: logs.map(l => ({
      id: l.id,
      amountMl: l.amount,
      timestamp: l.timestamp,
      drinkType: l.drinkType,
      note: l.note || ''
    }))
  };
  return JSON.stringify(exportPayload, null, 2);
}

export function exportDataAsCSV(logs: WaterLog[]): string {
  const headers = ['ID', 'Date', 'Time', 'Amount (mL)', 'Drink Type', 'Note'];
  const rows = logs.map(l => {
    const dateObj = new Date(l.timestamp);
    const dateStr = dateObj.toLocaleDateString();
    const timeStr = dateObj.toLocaleTimeString();
    return [
      `"${l.id}"`,
      `"${dateStr}"`,
      `"${timeStr}"`,
      l.amount,
      `"${l.drinkType}"`,
      `"${(l.note || '').replace(/"/g, '""')}"`
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
