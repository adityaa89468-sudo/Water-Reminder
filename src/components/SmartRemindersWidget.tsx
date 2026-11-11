import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell,
  BellRing,
  Clock,
  Plus,
  CheckCircle2,
  Sliders,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { UserProfile, ReminderSettings, DrinkType } from '../types';
import {
  getNextReminderTime,
  NextReminderInfo,
  snoozeReminder,
  resetNextReminderFromNow,
  fireHydrationReminderNow,
  requestAppNotificationPermission
} from '../utils/notifications';
import { mlToFlOz } from '../utils/calculations';
import confetti from 'canvas-confetti';

export interface SmartRemindersWidgetProps {
  profile: UserProfile;
  todayTotalMl: number;
  onAddWater: (amountMl: number, drinkType?: DrinkType, note?: string) => void;
  onOpenReminders: () => void;
  onSaveReminderSettings?: (newSettings: ReminderSettings) => void;
  className?: string;
}

export const SmartRemindersWidget: React.FC<SmartRemindersWidgetProps> = ({
  profile,
  todayTotalMl,
  onAddWater,
  onOpenReminders,
  className = ''
}) => {
  const [now, setNow] = useState(new Date());
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Tick every 1 second so the countdown is accurate and triggers right on time
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const reminderInfo: NextReminderInfo = useMemo(() => {
    return getNextReminderTime(profile, todayTotalMl, profile.dailyTargetMl);
  }, [profile, todayTotalMl, now]);

  const timeRemaining = useMemo(() => {
    if (!reminderInfo.nextTime) return null;

    const targetTimestamp = reminderInfo.nextTime.getTime();
    const diffMs = targetTimestamp - now.getTime();

    if (diffMs <= 0) {
      return {
        diffMs: 0,
        formatted: 'Time for a drink!',
        isDue: true
      };
    }

    const totalSeconds = Math.max(1, Math.ceil(diffMs / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let formatted = '';
    if (hours > 0) {
      formatted = `In ${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      formatted = `In ${minutes}m ${seconds < 10 ? `0${seconds}` : seconds}s`;
    } else {
      formatted = `In ${seconds}s`;
    }

    return {
      diffMs,
      formatted,
      isDue: false
    };
  }, [reminderInfo.nextTime, now]);

  const handleLog250ml = () => {
    const amountMl = 250;
    onAddWater(amountMl, 'water');

    if (profile.reminders?.enabled) {
      resetNextReminderFromNow(profile.reminders.intervalMinutes || 90);
    }

    const formattedAmount =
      profile.unitSystem === 'imperial'
        ? `${mlToFlOz(amountMl)} fl oz`
        : `${amountMl} mL`;

    setFeedbackMsg(`Added ${formattedAmount} · Next timer reset`);

    if (todayTotalMl + amountMl >= profile.dailyTargetMl && todayTotalMl < profile.dailyTargetMl) {
      try {
        if (typeof confetti === 'function') {
          confetti({
            particleCount: 45,
            spread: 60,
            origin: { y: 0.6 }
          });
        }
      } catch {
        // Safe in test/headless
      }
    }

    setNow(new Date());
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 2400);
  };

  const handleQuickSnooze = () => {
    const snoozeMins = profile.reminders?.snoozeMinutes || 15;
    snoozeReminder(snoozeMins);
    setNow(new Date());
    setFeedbackMsg(`Reminder snoozed for ${snoozeMins} minutes`);
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 2400);
  };

  const handleTestReminderNow = async () => {
    await requestAppNotificationPermission();
    await fireHydrationReminderNow(
      profile.reminders,
      todayTotalMl,
      profile.dailyTargetMl,
      true
    );
    setFeedbackMsg('Test water alert sent!');
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 2400);
  };

  const isGoalReached = todayTotalMl >= profile.dailyTargetMl;
  const isEnabled = profile.reminders?.enabled;

  return (
    <section
      aria-label="Smart Reminders Widget"
      className={`adaptive-card space-y-3.5 ${className}`}
      data-testid="smart-reminders-widget"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950 border border-sky-100 dark:border-sky-900/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                Next Reminder
              </h3>
              {isEnabled && !reminderInfo.isPaused && (
                <span
                  className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"
                  title="Active timer running"
                />
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {isEnabled
                ? `Every ${profile.reminders.intervalMinutes} min (${profile.reminders.startTime || '08:00'}–${profile.reminders.endTime || '22:00'})`
                : 'Reminders are turned off'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleTestReminderNow}
            className="px-2.5 py-1.5 rounded-xl border border-sky-200 dark:border-sky-800/80 bg-sky-50/70 dark:bg-sky-950/60 text-xs font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-colors flex items-center gap-1 tap-active min-h-[38px]"
            title="Test water notification & sound right now"
            data-testid="test-reminder-btn"
          >
            <BellRing className="w-3.5 h-3.5 shrink-0" />
            <span>Test</span>
          </button>

          <button
            type="button"
            onClick={onOpenReminders}
            className="px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 tap-active min-h-[38px]"
            title="Change reminder schedule"
          >
            <Sliders className="w-3.5 h-3.5 shrink-0" />
            <span>Schedule</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedbackMsg && (
        <div className="p-2.5 rounded-2xl bg-sky-600 text-white text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="truncate">{feedbackMsg}</span>
        </div>
      )}

      {/* Main Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        {/* Left: Next Reminder Time */}
        <div className="min-w-0">
          {isEnabled ? (
            reminderInfo.isPaused ? (
              <div>
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                  Paused for today
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Starts again tomorrow morning
                </p>
              </div>
            ) : isGoalReached && profile.reminders?.stopAfterGoalReached ? (
              <div>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-4 h-4 shrink-0" /> Daily goal complete!
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No more reminders needed today
                </p>
              </div>
            ) : timeRemaining ? (
              <div>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                    {timeRemaining.formatted}
                  </span>
                  <span className="text-xs text-slate-400 tabular-nums">
                    · {reminderInfo.formattedTime}
                  </span>
                </div>
                {!isGoalReached && (
                  <button
                    type="button"
                    onClick={handleQuickSnooze}
                    className="mt-0.5 text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3 shrink-0" />
                    <span>Snooze {profile.reminders?.snoozeMinutes || 15} min</span>
                  </button>
                )}
              </div>
            ) : (
              <div>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {reminderInfo.formattedTime}
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {reminderInfo.statusMessage}
                </p>
              </div>
            )
          ) : (
            <button
              type="button"
              onClick={onOpenReminders}
              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>Turn on reminders &rarr;</span>
            </button>
          )}
        </div>

        {/* Right: One-Tap 'Log 250ml' Button */}
        <button
          type="button"
          onClick={handleLog250ml}
          className="w-full sm:w-auto py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors tap-active min-h-[44px] shrink-0"
          title="Log 250 mL of water"
          data-testid="smart-reminders-log-250ml-btn"
        >
          <Plus className="w-4 h-4 stroke-[2.5px] shrink-0" />
          <span>
            Log {profile.unitSystem === 'imperial' ? '8.5 oz' : '250 mL'} Glass
          </span>
        </button>
      </div>
    </section>
  );
};
