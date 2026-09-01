import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { UserProfile } from '../types';

export interface NextReminderInfo {
  nextTime: Date | null;
  formattedTime: string;
  isPaused: boolean;
  statusMessage: string;
}

/**
 * Check if the current time falls inside quiet hours
 */
export function isInsideQuietHours(
  now: Date,
  quietStart: string, // "22:30"
  quietEnd: string // "07:00"
): boolean {
  const [sHour, sMin] = quietStart.split(':').map(Number);
  const [eHour, eMin] = quietEnd.split(':').map(Number);

  const curHour = now.getHours();
  const curMin = now.getMinutes();
  const curMins = curHour * 60 + curMin;
  const startMins = sHour * 60 + sMin;
  const endMins = eHour * 60 + eMin;

  if (startMins < endMins) {
    // e.g. 13:00 to 15:00
    return curMins >= startMins && curMins < endMins;
  } else {
    // Overnight e.g. 22:30 to 07:00
    return curMins >= startMins || curMins < endMins;
  }
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

  if (!reminders.enabled) {
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

  if (!reminders.activeDays.includes(currentDayOfWeek)) {
    return {
      nextTime: null,
      formattedTime: 'Off Day',
      isPaused: false,
      statusMessage: 'Scheduled off for today'
    };
  }

  const [startH, startM] = reminders.startTime.split(':').map(Number);
  const [endH, endM] = reminders.endTime.split(':').map(Number);

  const startToday = new Date(now);
  startToday.setHours(startH, startM, 0, 0);

  const endToday = new Date(now);
  endToday.setHours(endH, endM, 0, 0);

  // If now is before start time today
  if (now.getTime() < startToday.getTime()) {
    return {
      nextTime: startToday,
      formattedTime: startToday.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isPaused: false,
      statusMessage: 'First reminder scheduled at ' + startToday.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  // If now is after end time today
  if (now.getTime() >= endToday.getTime()) {
    const tomorrowStart = new Date(startToday);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    return {
      nextTime: tomorrowStart,
      formattedTime: 'Tomorrow ' + tomorrowStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isPaused: false,
      statusMessage: 'Evening window complete. Rest well!'
    };
  }

  // Active window: compute next interval slot
  const intervalMs = reminders.intervalMinutes * 60 * 1000;
  let nextSlot = new Date(startToday.getTime());

  while (nextSlot.getTime() <= now.getTime()) {
    nextSlot = new Date(nextSlot.getTime() + intervalMs);
  }

  // Check if next slot is beyond end time
  if (nextSlot.getTime() > endToday.getTime()) {
    const tomorrowStart = new Date(startToday);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    return {
      nextTime: tomorrowStart,
      formattedTime: 'Tomorrow ' + tomorrowStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isPaused: false,
      statusMessage: 'Final interval of the day passed'
    };
  }

  // Check quiet hours
  if (
    reminders.quietHoursEnabled &&
    isInsideQuietHours(nextSlot, reminders.quietHoursStart, reminders.quietHoursEnd)
  ) {
    const [qEndH, qEndM] = reminders.quietHoursEnd.split(':').map(Number);
    const resumeTime = new Date(nextSlot);
    resumeTime.setHours(qEndH, qEndM, 0, 0);
    if (resumeTime.getTime() < nextSlot.getTime()) {
      resumeTime.setDate(resumeTime.getDate() + 1);
    }
    return {
      nextTime: resumeTime,
      formattedTime: resumeTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isPaused: false,
      statusMessage: 'Quiet hours active until ' + resumeTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  return {
    nextTime: nextSlot,
    formattedTime: nextSlot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isPaused: false,
    statusMessage: `Next reminder in ~${Math.round((nextSlot.getTime() - now.getTime()) / 60000)} mins`
  };
}

/**
 * Register Android local notifications and action categories
 */
export async function setupLocalNotificationChannels(): Promise<boolean> {
  try {
    if (!Capacitor.isNativePlatform()) return true;

    // Register Notification Action Types: Quick Log & Snooze
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
 * Schedule Local Notifications for the upcoming window
 */
export async function scheduleReminders(
  profile: UserProfile,
  todayDrankMl: number,
  todayTargetMl: number
): Promise<void> {
  try {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // Cancel existing pending notifications to prevent duplicate stacking
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({
        notifications: pending.notifications.map(n => ({ id: n.id }))
      });
    }

    if (!profile.reminders.enabled) return;

    const nextInfo = getNextReminderTime(profile, todayDrankMl, todayTargetMl);
    if (!nextInfo.nextTime) return;

    const scheduleList: ScheduleOptions['notifications'] = [];
    const intervalMs = profile.reminders.intervalMinutes * 60 * 1000;
    let slot = new Date(nextInfo.nextTime);

    // Schedule next 8 upcoming reminder slots without spamming
    for (let i = 0; i < 8; i++) {
      if (
        profile.reminders.quietHoursEnabled &&
        isInsideQuietHours(slot, profile.reminders.quietHoursStart, profile.reminders.quietHoursEnd)
      ) {
        slot = new Date(slot.getTime() + intervalMs);
        continue;
      }

      scheduleList.push({
        id: 1000 + i,
        title: 'SipLumo Hydration',
        body: 'Time for a mindful sip of water. Keep your body comfortably refreshed!',
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
  } catch (err) {
    console.warn('Failed to schedule local notifications:', err);
  }
}

/**
 * Snooze reminders for X minutes
 */
export async function snoozeReminder(minutes: number): Promise<Date> {
  const snoozeTime = new Date(Date.now() + minutes * 60 * 1000);
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
  reminders: any,
  todayDrankMl: number,
  todayTargetMl: number
): Promise<void> {
  const dummyProfile: any = { reminders };
  await scheduleReminders(dummyProfile, todayDrankMl, todayTargetMl);
}
