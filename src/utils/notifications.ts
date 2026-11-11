import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { UserProfile, ReminderSettings } from '../types';

export interface NextReminderInfo {
  nextTime: Date | null;
  formattedTime: string;
  isPaused: boolean;
  statusMessage: string;
  isDueNow?: boolean;
}

export interface FiredReminderAlert {
  id: string;
  title: string;
  body: string;
  firedAt: string;
  suggestedAmountMl: number;
}

export type ReminderFiredEvent = FiredReminderAlert;

const NEXT_TARGET_STORAGE_KEY = 'siplumo_next_reminder_target_ms_v1';
const LAST_FIRED_STORAGE_KEY = 'siplumo_last_fired_reminder_ms_v1';
const SNOOZE_UNTIL_STORAGE_KEY = 'siplumo_snooze_until_ms_v1';

let webSchedulerIntervalId: ReturnType<typeof setInterval> | null = null;
let activeReminderCallback: ((alert: FiredReminderAlert) => void) | null = null;

/**
 * Play a gentle crystal water-drop chime using Web Audio API
 */
export function playReminderChime(): void {
  try {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Note 1: C6 (1046.5 Hz) -> Note 2: E6 (1318.5 Hz) -> Note 3: G6 (1567.98 Hz)
    const notes = [
      { freq: 587.33, start: 0, duration: 0.16 },
      { freq: 880.0, start: 0.14, duration: 0.18 },
      { freq: 1174.66, start: 0.28, duration: 0.35 }
    ];

    notes.forEach(n => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.freq, now + n.start);

      gain.gain.setValueAtTime(0.001, now + n.start);
      gain.gain.exponentialRampToValueAtTime(0.22, now + n.start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + n.start + n.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + n.start);
      osc.stop(now + n.start + n.duration + 0.02);
    });

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 1000);
  } catch {
    // AudioContext may be blocked if user hasn't interacted yet
  }
}

/**
 * Trigger device vibration if supported and enabled
 */
export function triggerReminderVibration(): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate([180, 90, 220]);
    }
  } catch {
    // Ignore on unsupported devices
  }
}

/**
 * Check current browser / OS notification permission state
 */
export function getNotificationPermissionState(): 'granted' | 'denied' | 'default' | 'unsupported' {
  if (typeof window === 'undefined') return 'unsupported';
  if ('Notification' in window) {
    return Notification.permission;
  }
  return 'unsupported';
}

/**
 * Request notification permission across Web and Capacitor Android
 */
export async function requestAppNotificationPermission(): Promise<boolean> {
  try {
    if (Capacitor.isNativePlatform()) {
      const perm = await LocalNotifications.requestPermissions();
      return perm.display === 'granted';
    }
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') return true;
      const status = await Notification.requestPermission();
      return status === 'granted';
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if the current time falls inside quiet hours
 */
export function isInsideQuietHours(
  now: Date,
  quietStart: string, // "22:30"
  quietEnd: string // "07:00"
): boolean {
  const [sHour, sMin] = (quietStart || '22:00').split(':').map(Number);
  const [eHour, eMin] = (quietEnd || '07:00').split(':').map(Number);

  const curHour = now.getHours();
  const curMin = now.getMinutes();
  const curMins = curHour * 60 + curMin;
  const startMins = sHour * 60 + sMin;
  const endMins = eHour * 60 + eMin;

  if (startMins < endMins) {
    return curMins >= startMins && curMins < endMins;
  } else {
    return curMins >= startMins || curMins < endMins;
  }
}

/**
 * Get or set snooze timestamp
 */
export function getSnoozeUntilTimestamp(): number | null {
  try {
    const raw = localStorage.getItem(SNOOZE_UNTIL_STORAGE_KEY);
    if (!raw) return null;
    const val = Number(raw);
    if (isNaN(val) || val <= Date.now()) {
      localStorage.removeItem(SNOOZE_UNTIL_STORAGE_KEY);
      return null;
    }
    return val;
  } catch {
    return null;
  }
}

export function setSnoozeUntilTimestamp(timestampMs: number | null): void {
  try {
    if (timestampMs && timestampMs > Date.now()) {
      localStorage.setItem(SNOOZE_UNTIL_STORAGE_KEY, String(timestampMs));
      localStorage.setItem(NEXT_TARGET_STORAGE_KEY, String(timestampMs));
    } else {
      localStorage.removeItem(SNOOZE_UNTIL_STORAGE_KEY);
    }
  } catch {
    // Ignore storage notice
  }
}

/**
 * Reset the next reminder countdown from right now + intervalMinutes
 * (Called when user logs a drink or updates reminder interval)
 */
export function resetNextReminderFromNow(intervalMinutes: number): Date {
  const safeInterval = Math.max(1, intervalMinutes || 60);
  const nextTargetMs = Date.now() + safeInterval * 60 * 1000;
  try {
    localStorage.setItem(NEXT_TARGET_STORAGE_KEY, String(nextTargetMs));
    localStorage.removeItem(SNOOZE_UNTIL_STORAGE_KEY);
  } catch {
    // Ignore storage notice
  }
  return new Date(nextTargetMs);
}

/**
 * Calculate the next scheduled reminder time based on user settings and progress
 */
export function getNextReminderTime(
  profile: UserProfile,
  todayDrankMl: number,
  todayTargetMl: number
): NextReminderInfo {
  const { reminders } = profile;

  if (!reminders || !reminders.enabled) {
    return {
      nextTime: null,
      formattedTime: 'Disabled',
      isPaused: false,
      statusMessage: 'Reminders are turned off'
    };
  }

  const todayStr = new Date().toISOString().split('T')[0];
  if (reminders.pausedUntilDate === todayStr) {
    return {
      nextTime: null,
      formattedTime: 'Paused',
      isPaused: true,
      statusMessage: 'Reminders are paused for today'
    };
  }

  if (reminders.stopAfterGoalReached && todayDrankMl >= todayTargetMl) {
    return {
      nextTime: null,
      formattedTime: 'Goal Reached',
      isPaused: false,
      statusMessage: 'Target achieved! Enjoy your day.'
    };
  }

  const now = new Date();
  const currentDayOfWeek = now.getDay();

  if (Array.isArray(reminders.activeDays) && !reminders.activeDays.includes(currentDayOfWeek)) {
    return {
      nextTime: null,
      formattedTime: 'Off Day',
      isPaused: false,
      statusMessage: 'Scheduled off for today'
    };
  }

  // Check if a snooze is active
  const snoozeMs = getSnoozeUntilTimestamp();
  if (snoozeMs && snoozeMs > now.getTime()) {
    const snoozeDate = new Date(snoozeMs);
    const minsLeft = Math.max(1, Math.ceil((snoozeMs - now.getTime()) / 60000));
    return {
      nextTime: snoozeDate,
      formattedTime: snoozeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isPaused: false,
      statusMessage: `Snoozed · Next alert in ${minsLeft} min`
    };
  }

  const [startH, startM] = (reminders.startTime || '08:00').split(':').map(Number);
  const [endH, endM] = (reminders.endTime || '22:00').split(':').map(Number);

  const startToday = new Date(now);
  startToday.setHours(startH, startM, 0, 0);

  const endToday = new Date(now);
  endToday.setHours(endH, endM, 0, 0);

  // Handle overnight active window if endTime <= startTime
  if (endToday.getTime() <= startToday.getTime()) {
    endToday.setDate(endToday.getDate() + 1);
  }

  // If now is before start time today
  if (now.getTime() < startToday.getTime()) {
    return {
      nextTime: startToday,
      formattedTime: startToday.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isPaused: false,
      statusMessage:
        'First reminder scheduled at ' +
        startToday.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  // If now is after end time today
  if (now.getTime() >= endToday.getTime()) {
    const tomorrowStart = new Date(startToday);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    return {
      nextTime: tomorrowStart,
      formattedTime:
        'Tomorrow ' + tomorrowStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isPaused: false,
      statusMessage: 'Evening window complete. Rest well!'
    };
  }

  // Active window: check if we have a stored target slot or compute next interval slot
  const intervalMs = Math.max(1, reminders.intervalMinutes || 60) * 60 * 1000;
  let nextSlot: Date | null = null;

  try {
    const storedTargetRaw =
      typeof localStorage !== 'undefined' ? localStorage.getItem(NEXT_TARGET_STORAGE_KEY) : null;
    if (storedTargetRaw) {
      const storedMs = Number(storedTargetRaw);
      const lastFiredRaw = localStorage.getItem(LAST_FIRED_STORAGE_KEY);
      const lastFiredMs = lastFiredRaw ? Number(lastFiredRaw) : 0;

      // Keep stored target if it's in the future (within 2x interval) OR if it just became due within the last 45s and hasn't fired yet
      if (
        !isNaN(storedMs) &&
        storedMs <= now.getTime() + intervalMs * 1.5 &&
        (storedMs > now.getTime() || (now.getTime() - storedMs < 45000 && lastFiredMs < storedMs))
      ) {
        nextSlot = new Date(storedMs);
      }
    }
  } catch {
    // Ignore localStorage errors in headless test environments
  }

  if (!nextSlot) {
    nextSlot = new Date(startToday.getTime());
    while (nextSlot.getTime() <= now.getTime()) {
      nextSlot = new Date(nextSlot.getTime() + intervalMs);
    }
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(NEXT_TARGET_STORAGE_KEY, String(nextSlot.getTime()));
      }
    } catch {
      // Ignore
    }
  }

  // Check if next slot is beyond end time
  if (nextSlot.getTime() > endToday.getTime()) {
    const tomorrowStart = new Date(startToday);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    return {
      nextTime: tomorrowStart,
      formattedTime:
        'Tomorrow ' + tomorrowStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isPaused: false,
      statusMessage: 'Final interval of the day passed'
    };
  }

  // Check quiet hours
  if (
    reminders.quietHoursEnabled &&
    isInsideQuietHours(nextSlot, reminders.quietHoursStart, reminders.quietHoursEnd)
  ) {
    const [qEndH, qEndM] = (reminders.quietHoursEnd || '07:00').split(':').map(Number);
    const resumeTime = new Date(nextSlot);
    resumeTime.setHours(qEndH, qEndM, 0, 0);
    if (resumeTime.getTime() < nextSlot.getTime()) {
      resumeTime.setDate(resumeTime.getDate() + 1);
    }
    return {
      nextTime: resumeTime,
      formattedTime: resumeTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isPaused: false,
      statusMessage:
        'Quiet hours active until ' +
        resumeTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  const diffMins = Math.max(0, Math.ceil((nextSlot.getTime() - now.getTime()) / 60000));
  const isDueNow = nextSlot.getTime() <= now.getTime();

  return {
    nextTime: nextSlot,
    formattedTime: nextSlot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isPaused: false,
    isDueNow,
    statusMessage: isDueNow
      ? 'Time for a refreshing glass of water!'
      : `Next reminder in ~${diffMins} min${diffMins === 1 ? '' : 's'}`
  };
}

/**
 * Trigger an immediate hydration notification across Web Notification API, Audio Chime, Vibration, and In-App Banner
 */
export async function fireHydrationReminderNow(
  reminders: ReminderSettings,
  todayDrankMl: number,
  todayTargetMl: number,
  isTest = false
): Promise<FiredReminderAlert> {
  const remainingMl = Math.max(0, todayTargetMl - todayDrankMl);
  const title = isTest ? 'SipLumo Test Reminder' : 'Time to Drink Water!';
  const body =
    remainingMl > 0
      ? `Take a refreshing 250 mL sip! You have ${remainingMl} mL left to reach today's goal.`
      : `Stay refreshed with a glass of water!`;

  if (reminders.soundEnabled !== false) {
    playReminderChime();
  }
  if (reminders.vibrationEnabled !== false) {
    triggerReminderVibration();
  }

  // 1. Trigger Browser Notification if permission is granted
  try {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const notif = new Notification(title, {
        body,
        icon: '/logo.png',
        badge: '/logo.png',
        tag: isTest ? 'siplumo-test-reminder' : 'siplumo-hydration-reminder'
      });
      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    }
  } catch {
    // Fallback if Notification constructor requires ServiceWorker on mobile Chrome
    try {
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg && typeof reg.showNotification === 'function') {
          await reg.showNotification(title, {
            body,
            icon: '/logo.png',
            tag: 'siplumo-hydration-reminder'
          });
        }
      }
    } catch {
      // In-app banner still fires below
    }
  }

  // 2. Trigger Capacitor Local Notification if on Native Android
  try {
    if (Capacitor.isNativePlatform()) {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: isTest ? 8888 : Math.floor(Date.now() % 100000),
            title,
            body,
            schedule: { at: new Date(Date.now() + 400) },
            actionTypeId: 'SIP_WATER_ACTIONS'
          }
        ]
      });
    }
  } catch {
    // Ignore native notice on web
  }

  const alertPayload: FiredReminderAlert = {
    id: 'rem_' + Date.now(),
    title,
    body,
    firedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    suggestedAmountMl: 250
  };

  if (activeReminderCallback) {
    activeReminderCallback(alertPayload);
  }

  return alertPayload;
}

/**
 * Subscribe to real-time in-app reminder triggers
 */
export function setOnReminderFiredListener(
  callback: ((alert: FiredReminderAlert) => void) | null
): void {
  activeReminderCallback = callback;
}

/**
 * Register Android local notifications and action categories
 */
export async function setupLocalNotificationChannels(): Promise<boolean> {
  try {
    if (!Capacitor.isNativePlatform()) return true;

    await LocalNotifications.registerActionTypes({
      types: [
        {
          id: 'SIP_WATER_ACTIONS',
          actions: [
            { id: 'ADD_200', title: '+200 mL', foreground: false },
            { id: 'ADD_250', title: '+250 mL', foreground: false },
            { id: 'SNOOZE_15', title: 'Snooze 15m', foreground: false }
          ]
        }
      ]
    });

    return true;
  } catch (err) {
    console.warn('Local notification setup notice:', err);
    return false;
  }
}

/**
 * Schedule Local Notifications for Native Android AND run a precision 1-second Web Scheduler
 */
export async function scheduleReminders(
  profile: UserProfile,
  todayDrankMl: number,
  todayTargetMl: number
): Promise<void> {
  try {
    // 1. Clear existing Web scheduler interval
    if (webSchedulerIntervalId) {
      clearInterval(webSchedulerIntervalId);
      webSchedulerIntervalId = null;
    }

    if (!profile?.reminders?.enabled) {
      return;
    }

    // Ensure next target timestamp is initialized
    const initialNext = getNextReminderTime(profile, todayDrankMl, todayTargetMl);
    if (initialNext.nextTime) {
      try {
        const existingTarget = Number(localStorage.getItem(NEXT_TARGET_STORAGE_KEY) || '0');
        if (!existingTarget || existingTarget < Date.now() - 60000) {
          localStorage.setItem(NEXT_TARGET_STORAGE_KEY, String(initialNext.nextTime.getTime()));
        }
      } catch {
        // Ignore storage notice
      }
    }

    // 2. Start precision 1-second Web & Foreground Reminder Watcher
    if (typeof window !== 'undefined') {
      webSchedulerIntervalId = setInterval(() => {
        if (!profile.reminders.enabled) return;

        const todayStr = new Date().toISOString().split('T')[0];
        if (profile.reminders.pausedUntilDate === todayStr) return;
        if (profile.reminders.stopAfterGoalReached && todayDrankMl >= todayTargetMl) return;

        const now = new Date();
        if (
          profile.reminders.quietHoursEnabled &&
          isInsideQuietHours(
            now,
            profile.reminders.quietHoursStart,
            profile.reminders.quietHoursEnd
          )
        ) {
          return;
        }

        const targetRaw = localStorage.getItem(NEXT_TARGET_STORAGE_KEY);
        if (!targetRaw) return;
        const targetMs = Number(targetRaw);
        if (isNaN(targetMs) || targetMs <= 0) return;

        const lastFiredRaw = localStorage.getItem(LAST_FIRED_STORAGE_KEY);
        const lastFiredMs = lastFiredRaw ? Number(lastFiredRaw) : 0;

        // Fire right on time when now.getTime() crosses targetMs!
        if (now.getTime() >= targetMs && lastFiredMs < targetMs) {
          localStorage.setItem(LAST_FIRED_STORAGE_KEY, String(now.getTime()));

          // Advance the next target slot by intervalMinutes
          const intervalMs = Math.max(1, profile.reminders.intervalMinutes || 60) * 60 * 1000;
          const nextTargetMs = now.getTime() + intervalMs;
          localStorage.setItem(NEXT_TARGET_STORAGE_KEY, String(nextTargetMs));
          localStorage.removeItem(SNOOZE_UNTIL_STORAGE_KEY);

          fireHydrationReminderNow(profile.reminders, todayDrankMl, todayTargetMl, false);
        }
      }, 1000);
    }

    // 3. Also schedule Native Android LocalNotifications when running in Capacitor
    if (Capacitor.isNativePlatform()) {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({
          notifications: pending.notifications.map(n => ({ id: n.id }))
        });
      }

      const nextInfo = getNextReminderTime(profile, todayDrankMl, todayTargetMl);
      if (!nextInfo.nextTime) return;

      const scheduleList: ScheduleOptions['notifications'] = [];
      const intervalMs = Math.max(1, profile.reminders.intervalMinutes || 60) * 60 * 1000;
      let slot = new Date(nextInfo.nextTime);

      for (let i = 0; i < 8; i++) {
        if (
          profile.reminders.quietHoursEnabled &&
          isInsideQuietHours(
            slot,
            profile.reminders.quietHoursStart,
            profile.reminders.quietHoursEnd
          )
        ) {
          slot = new Date(slot.getTime() + intervalMs);
          continue;
        }

        scheduleList.push({
          id: 1000 + i,
          title: 'SipLumo Hydration Reminder',
          body: 'Time for a refreshing glass of water!',
          schedule: { at: new Date(slot) },
          sound: profile.reminders.soundEnabled ? 'beep.wav' : undefined,
          actionTypeId: 'SIP_WATER_ACTIONS',
          extra: {
            slotIndex: i
          }
        });

        slot = new Date(slot.getTime() + intervalMs);
      }

      if (scheduleList.length > 0) {
        await LocalNotifications.schedule({ notifications: scheduleList });
      }
    }
  } catch (err) {
    console.warn('Failed to schedule local notifications:', err);
  }
}

/**
 * Snooze reminders for X minutes
 */
export async function snoozeReminder(minutes: number): Promise<Date> {
  const safeMins = Math.max(1, minutes || 15);
  const snoozeTimeMs = Date.now() + safeMins * 60 * 1000;
  setSnoozeUntilTimestamp(snoozeTimeMs);
  const snoozeTime = new Date(snoozeTimeMs);

  try {
    if (Capacitor.isNativePlatform()) {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 9999,
            title: 'SipLumo - Snooze Done',
            body: 'Your snooze break has ended. Take a fresh sip of water!',
            schedule: { at: snoozeTime },
            actionTypeId: 'SIP_WATER_ACTIONS'
          }
        ]
      });
    }
  } catch (e) {
    console.warn('Snooze schedule error:', e);
  }
  return snoozeTime;
}

/**
 * Initialize notification action types and listeners
 */
export async function initializeNotifications(): Promise<void> {
  try {
    if (!Capacitor.isNativePlatform()) return;

    await LocalNotifications.registerActionTypes({
      types: [
        {
          id: 'SIP_WATER_ACTIONS',
          actions: [
            { id: 'ADD_250', title: '+250 mL Log', foreground: false },
            { id: 'SNOOZE', title: 'Snooze 15m', foreground: false }
          ]
        }
      ]
    });
  } catch (e) {
    console.warn('Notifications init notice:', e);
  }
}

/**
 * Schedule daily reminders for current progress
 */
export async function scheduleDailyReminders(
  reminders: ReminderSettings,
  todayDrankMl: number,
  todayTargetMl: number
): Promise<void> {
  const dummyProfile: any = { reminders };
  await scheduleReminders(dummyProfile, todayDrankMl, todayTargetMl);
}
