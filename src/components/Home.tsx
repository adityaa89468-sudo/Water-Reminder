import React from 'react';
import {
  Flame,
  Bell,
  ChevronRight,
  Trophy,
  Cloud,
  CheckCircle2,
  UserCheck
} from 'lucide-react';
import { UserProfile, WaterLog, DrinkType } from '../types';
import { RadialProgressBar } from './RadialProgressBar';
import { QuickAddPresets } from './QuickAddPresets';
import { formatVolumeExact } from '../utils/calculations';
import { translations } from '../i18n/translations';
import { HomeScreenWidget } from './HomeScreenWidget';
import { SmartRemindersWidget } from './SmartRemindersWidget';
import { DrinkTypeIcon, getDrinkTypeMetadata } from '../utils/drinkTypes';
import { useAuth } from './AuthProvider';

interface HomeProps {
  profile: UserProfile;
  todayLogs: WaterLog[];
  allLogs?: WaterLog[];
  todayTotalMl: number;
  onAddWater: (amountMl: number, drinkType?: DrinkType, note?: string) => void;
  onUndoLastLog: () => void;
  onOpenWhyTarget: () => void;
  onOpenReminders: () => void;
  onOpenHistory: () => void;
  onOpenAchievements: () => void;
  onOpenAuthModal?: () => void;
}

export const Home: React.FC<HomeProps> = ({
  profile,
  todayLogs,
  allLogs,
  todayTotalMl,
  onAddWater,
  onUndoLastLog,
  onOpenWhyTarget,
  onOpenReminders,
  onOpenHistory,
  onOpenAchievements,
  onOpenAuthModal
}) => {
  const { user } = useAuth();
  const t = translations[profile.language || 'en'];
  const todayDateStr = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  const displayTitle = user?.displayName || profile.displayName || 'Hydration Friend';

  return (
    <div className="space-y-4 sm:space-y-6 pb-8 animate-in fade-in">
      {/* Top App Header & Quick Status */}
      <div className="adaptive-card !p-3.5 sm:!p-4 flex items-center justify-between gap-2.5 flex-wrap">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
            {todayDateStr}
          </p>
          <h1 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-0.5 truncate">
            {displayTitle}
          </h1>
        </div>

        {/* Account Sign-In, Streak & Reminders Quick Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
          {onOpenAuthModal && (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl border text-xs font-semibold transition-colors tap-active min-h-[42px] ${
                user
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/70 text-emerald-800 dark:text-emerald-200'
                  : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-sky-600 dark:text-sky-400 hover:border-sky-300 dark:hover:border-sky-700'
              }`}
              title={user ? `Signed in as ${user.email}` : 'Sign in & backup progress'}
              data-testid="home-auth-btn"
            >
              {user ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="hidden min-[400px]:inline max-w-[96px] truncate">
                    {user.displayName || 'Synced'}
                  </span>
                  <UserCheck className="w-3.5 h-3.5 min-[400px]:hidden shrink-0" />
                </>
              ) : (
                <>
                  <Cloud className="w-3.5 h-3.5 shrink-0" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onOpenAchievements}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs hover:border-amber-300 dark:hover:border-amber-700 transition-colors tap-active min-h-[42px]"
            title="View Achievements & Streaks"
          >
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
            <span className="tabular-nums">{profile.streak} {t.streakDays}</span>
            <Trophy className="w-3.5 h-3.5 text-amber-500 hidden sm:inline shrink-0" />
          </button>

          <button
            type="button"
            onClick={onOpenReminders}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition-colors tap-active shrink-0"
            title="Reminder Settings"
            aria-label="Reminder Settings"
          >
            <Bell className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Interactive Home Screen Hydration Widget */}
      <HomeScreenWidget
        currentMl={todayTotalMl}
        targetMl={profile.dailyTargetMl}
        unitSystem={profile.unitSystem}
        streak={profile.streak}
        logs={allLogs && allLogs.length > 0 ? allLogs : todayLogs}
        onAddWater={onAddWater}
        onUndoLastLog={onUndoLastLog}
        hasLogsToUndo={todayLogs.length > 0}
        onOpenAchievements={onOpenAchievements}
        onOpenWhyTarget={onOpenWhyTarget}
      />

      {/* Main Responsive Grid: Left Progress Ring + Right Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
        {/* Left Column: Daily Hydration Progress Ring */}
        <div className="lg:col-span-5 adaptive-card flex flex-col items-center justify-between">
          <div className="w-full flex items-center justify-between gap-2 mb-2">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Today's Water Goal
            </h2>
            <button
              type="button"
              onClick={onOpenWhyTarget}
              className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline shrink-0"
            >
              Adjust Goal
            </button>
          </div>

          <div className="w-full py-2 flex-1 flex items-center justify-center">
            <RadialProgressBar
              currentMl={todayTotalMl}
              targetMl={profile.dailyTargetMl}
              unitSystem={profile.unitSystem}
              onOpenWhyTarget={onOpenWhyTarget}
            />
          </div>
        </div>

        {/* Right Column: Quick Logging & Smart Reminders */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4 sm:space-y-5">
          {/* Quick Add Presets Card */}
          <QuickAddPresets
            presets={profile.presets}
            unitSystem={profile.unitSystem}
            onAddWater={onAddWater}
            onUndo={onUndoLastLog}
            hasLogsToUndo={todayLogs.length > 0}
          />

          {/* Smart Reminders Widget: Time Remaining & One-Tap Log 250ml */}
          <SmartRemindersWidget
            profile={profile}
            todayTotalMl={todayTotalMl}
            onAddWater={onAddWater}
            onOpenReminders={onOpenReminders}
          />
        </div>
      </div>

      {/* Today's Recent Drinks */}
      {todayLogs.length > 0 && (
        <div className="adaptive-card space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Today's Drinks <span className="text-slate-400 font-normal">· {todayLogs.length}</span>
            </h3>
            <button
              type="button"
              onClick={onOpenHistory}
              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-0.5 shrink-0"
            >
              <span>See History</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {todayLogs.slice(-4).reverse().map(log => {
              const timeStr = new Date(log.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              });

              const meta = getDrinkTypeMetadata(log.drinkType);

              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-1 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl ${meta.iconBg} ${meta.iconColor} flex items-center justify-center shrink-0`}>
                      <DrinkTypeIcon type={log.drinkType} className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-slate-900 dark:text-white flex-wrap">
                        <span className="font-bold text-sm tabular-nums">
                          {formatVolumeExact(log.amount, profile.unitSystem)}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300 capitalize">
                          {meta.shortLabel}
                        </span>
                      </div>
                      {log.note && (
                        <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px] sm:max-w-xs">
                          {log.note}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 font-medium tabular-nums shrink-0">
                    {timeStr}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
