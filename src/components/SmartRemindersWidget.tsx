import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell,
  Clock,
  Droplet,
  Plus,
  Moon,
  CheckCircle2,
  Sliders,
  Sparkles,
  AlertCircle,
  Timer,
  Zap,
  RotateCcw
} from 'lucide-react';
import { UserProfile, ReminderSettings, UnitSystem, DrinkType } from '../types';
import { getNextReminderTime, NextReminderInfo } from '../utils/notifications';
import { formatVolume, formatVolumeExact, mlToFlOz } from '../utils/calculations';
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
  onSaveReminderSettings,
  className = ''
}) => {
  const [now, setNow] = useState(new Date());
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [snoozeActive, setSnoozeActive] = useState<number | null>(null);

  // Update clock every 10 seconds for real-time countdown precision
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Compute next scheduled reminder info
  const reminderInfo: NextReminderInfo = useMemo(() => {
    return getNextReminderTime(profile, todayTotalMl, profile.dailyTargetMl);
  }, [profile, todayTotalMl, now]);

  // Calculate time remaining in ms, minutes and human string
  const timeRemaining = useMemo(() => {
    if (!reminderInfo.nextTime) return null;

    // Account for local quick snooze if applied
    const targetTimestamp = snoozeActive
      ? Math.max(reminderInfo.nextTime.getTime(), snoozeActive)
      : reminderInfo.nextTime.getTime();

    const diffMs = targetTimestamp - now.getTime();

    if (diffMs <= 0) {
      return {
        diffMs: 0,
        formatted: 'Due now!',
        isDue: true,
        minutes: 0,
        hours: 0
      };
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    let formatted = '';
    if (hours > 0) {
      formatted = `${hours}h ${minutes}m remaining`;
    } else if (minutes > 0) {
      formatted = `${minutes}m remaining`;
    } else {
      formatted = `${totalSeconds}s remaining`;
    }

    return {
      diffMs,
      formatted,
      isDue: false,
      minutes,
      hours
    };
  }, [reminderInfo.nextTime, now, snoozeActive]);

  // One-tap 'Log 250ml' action handler
  const handleLog250ml = () => {
    const amountMl = 250;
    onAddWater(amountMl, 'water', 'Smart Reminder Quick Log');

    const formattedAmount =
      profile.unitSystem === 'imperial'
        ? `${mlToFlOz(amountMl)} fl oz`
        : `${amountMl} mL`;

    setFeedbackMsg(`+${formattedAmount} logged! Target updated.`);

    // Celebrate if this reaches the daily target
    if (todayTotalMl + amountMl >= profile.dailyTargetMl && todayTotalMl < profile.dailyTargetMl) {
      try {
        if (typeof confetti === 'function') {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 }
          });
        }
      } catch (e) {
        // Safe in test/headless
      }
    }

    // Reset snooze if user just logged
    setSnoozeActive(null);

    setTimeout(() => {
      setFeedbackMsg(null);
    }, 2500);
  };

  // Quick 15-minute Snooze
  const handleQuickSnooze = () => {
    const snoozeDurationMs = (profile.reminders?.snoozeMinutes || 15) * 60 * 1000;
    const newTarget = Date.now() + snoozeDurationMs;
    setSnoozeActive(newTarget);
    setFeedbackMsg(`Snoozed for ${profile.reminders?.snoozeMinutes || 15} minutes`);
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 2500);
  };

  const isGoalReached = todayTotalMl >= profile.dailyTargetMl;
  const isEnabled = profile.reminders?.enabled;

  return (
    <section
      aria-label="Smart Reminders Widget"
      className={`relative bg-gradient-to-br from-indigo-50/70 via-sky-50/50 to-white dark:from-slate-900/95 dark:via-slate-900 dark:to-indigo-950/20 border border-indigo-100 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm transition-all overflow-hidden ${className}`}
      data-testid="smart-reminders-widget"
    >
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-indigo-400/10 dark:bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 mb-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 dark:bg-indigo-400/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shadow-xs">
            <Bell className="w-4 h-4 fill-indigo-500/20 animate-wiggle" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Smart Reminders
              </h3>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-extrabold ${
                isEnabled
                  ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                {isEnabled ? 'Active' : 'Off'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Next hydration milestone &amp; quick log
            </p>
          </div>
        </div>

        {/* Configure Schedule Button */}
        <button
          type="button"
          onClick={onOpenReminders}
          className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors tap-active"
          title="Configure reminder schedule, quiet hours and frequency"
          aria-label="Configure reminder schedule"
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>

      {/* Feedback Toast */}
      {feedbackMsg && (
        <div className="mb-3 p-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 text-white text-xs font-bold flex items-center justify-between shadow-md animate-in fade-in slide-in-from-top-1 duration-150 relative z-20">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-extrabold uppercase">
            Updated
          </span>
        </div>
      )}

      {/* Main Widget Body */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-white/80 dark:bg-slate-900/80 border border-indigo-100/80 dark:border-slate-800/80 rounded-2xl p-3.5 shadow-2xs">
        
        {/* Left: Time Remaining Display */}
        <div className="sm:col-span-6 flex flex-col justify-center space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Next Hydration Goal
            </span>
          </div>

          {isEnabled ? (
            reminderInfo.isPaused ? (
              <div>
                <span className="text-base font-extrabold text-amber-600 dark:text-amber-400">
                  Paused for Today
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Resumes tomorrow automatically
                </p>
              </div>
            ) : isGoalReached && profile.reminders?.stopAfterGoalReached ? (
              <div>
                <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-4 h-4" /> Goal Met!
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  All scheduled reminders fulfilled today
                </p>
              </div>
            ) : timeRemaining ? (
              <div className="space-y-0.5">
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-xl font-black tabular-nums tracking-tight ${
                      timeRemaining.isDue
                        ? 'text-rose-600 dark:text-rose-400 animate-pulse'
                        : 'text-indigo-950 dark:text-white'
                    }`}
                  >
                    {timeRemaining.formatted}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    ({reminderInfo.formattedTime})
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {reminderInfo.statusMessage}
                </p>
              </div>
            ) : (
              <div>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {reminderInfo.formattedTime}
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {reminderInfo.statusMessage}
                </p>
              </div>
            )
          ) : (
            <div className="space-y-1">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Reminders are turned off
              </span>
              <button
                type="button"
                onClick={onOpenReminders}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>Enable Reminders &rarr;</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: One-Tap 'Log 250ml' Button & Actions */}
        <div className="sm:col-span-6 flex flex-col gap-2 justify-center sm:border-l sm:border-slate-100 sm:dark:border-slate-800 sm:pl-3">
          {/* THE ONE-TAP 'LOG 250ML' BUTTON */}
          <button
            type="button"
            onClick={handleLog250ml}
            className="w-full py-2.5 px-3.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-sky-600 hover:from-indigo-700 hover:via-indigo-800 hover:to-sky-700 active:scale-[0.98] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xs hover:shadow-md flex items-center justify-between gap-2 transition-all tap-active border border-indigo-400/30 group"
            title="Log 250 mL of water immediately"
            data-testid="smart-reminders-log-250ml-btn"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                <Plus className="w-4 h-4 stroke-[3px]" />
              </div>
              <span className="tracking-tight">
                Log {profile.unitSystem === 'imperial' ? '8.5 fl oz (250ml)' : '250ml'}
              </span>
            </div>

            <span className="px-2 py-0.5 rounded-md bg-white/25 text-[10px] font-black uppercase tracking-wider">
              1-Tap
            </span>
          </button>

          {/* Quick Snooze / Schedule Helper Row */}
          <div className="flex items-center justify-between text-[11px] px-1 text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 font-medium">
              <Droplet className="w-3 h-3 text-sky-500 fill-sky-500" />
              Standard glass
            </span>

            {isEnabled && !isGoalReached && (
              <button
                type="button"
                onClick={handleQuickSnooze}
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline flex items-center gap-1 tap-active"
                title="Snooze next reminder by 15 minutes"
              >
                <RotateCcw className="w-3 h-3" />
                <span>+15m snooze</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
