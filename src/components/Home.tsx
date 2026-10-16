import React, { useState } from 'react';
import {
  Flame,
  Bell,
  Clock,
  Droplet,
  Sparkles,
  CupSoda,
  ChevronRight,
  RotateCcw,
  Zap,
  Info,
  Gauge,
  Waves
} from 'lucide-react';
import { UserProfile, WaterLog, DrinkType } from '../types';
import { RadialProgressBar } from './RadialProgressBar';
import { WaveProgress } from './WaveProgress';
import { QuickAddPresets } from './QuickAddPresets';
import { MedicalDisclaimerBanner } from './MedicalDisclaimerBanner';
import { formatVolumeExact } from '../utils/calculations';
import { translations } from '../i18n/translations';
import { BannerAd } from './BannerAd';
import { Trophy } from 'lucide-react';
import { HomeScreenWidget } from './HomeScreenWidget';
import { SmartRemindersWidget } from './SmartRemindersWidget';
import { DrinkTypeIcon, getDrinkTypeMetadata } from '../utils/drinkTypes';

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
  onOpenAchievements
}) => {
  const [centerpieceStyle, setCenterpieceStyle] = useState<'radial' | 'wave'>('radial');
  const t = translations[profile.language || 'en'];
  const todayDateStr = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  const isCompleted = todayTotalMl >= profile.dailyTargetMl;

  return (
    <div className="space-y-4 pb-12 animate-in fade-in">
      
      {/* Top App Header & Quick Streak Status */}
      <div className="flex items-center justify-between px-1">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>{todayDateStr}</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {profile.displayName || 'Hydration Friend'}
          </h1>
        </div>

        {/* Streak & Reminders Quick Icons */}
        <div className="flex items-center gap-2">
          {/* Interactive Streak & Achievements pill */}
          <button
            type="button"
            onClick={onOpenAchievements}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 to-orange-500/15 hover:from-amber-500/25 hover:to-orange-500/25 border border-amber-500/30 text-amber-900 dark:text-amber-300 font-bold text-xs shadow-xs tap-active transition-all"
            title="View Achievements & Streak Badges"
          >
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>{profile.streak} {t.streakDays}</span>
            <Trophy className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          </button>

          {/* Quick reminder status button */}
          <button
            onClick={onOpenReminders}
            className="p-2 rounded-full bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors tap-active"
            title="Configure Reminders"
          >
            <Bell className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Prominent Radial Progress Bar Centerpiece on Home Screen */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Daily Hydration Progress
            </h2>
          </div>

          {/* Style Selector: Radial Dial vs Fluid Wave */}
          <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs">
            <button
              type="button"
              onClick={() => setCenterpieceStyle('radial')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
                centerpieceStyle === 'radial'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="Radial Progress Bar"
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>Radial Dial</span>
            </button>
            <button
              type="button"
              onClick={() => setCenterpieceStyle('wave')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
                centerpieceStyle === 'wave'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="Fluid Wave Indicator"
            >
              <Waves className="w-3.5 h-3.5" />
              <span>Wave</span>
            </button>
          </div>
        </div>

        {/* Prominent Centerpiece Visual */}
        <div className="flex justify-center py-1">
          {centerpieceStyle === 'radial' ? (
            <RadialProgressBar
              currentMl={todayTotalMl}
              targetMl={profile.dailyTargetMl}
              unitSystem={profile.unitSystem}
              onOpenWhyTarget={onOpenWhyTarget}
            />
          ) : (
            <WaveProgress
              currentMl={todayTotalMl}
              targetMl={profile.dailyTargetMl}
              unitSystem={profile.unitSystem}
              onOpenWhyTarget={onOpenWhyTarget}
            />
          )}
        </div>
      </div>

      {/* Smart Reminders Widget: Time Remaining & One-Tap Log 250ml */}
      <SmartRemindersWidget
        profile={profile}
        todayTotalMl={todayTotalMl}
        onAddWater={onAddWater}
        onOpenReminders={onOpenReminders}
      />

      {/* Dashboard Home Screen Hydration Widget */}
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

      {/* Quick Add Presets Card */}
      <QuickAddPresets
        presets={profile.presets}
        unitSystem={profile.unitSystem}
        onAddWater={onAddWater}
        onUndo={onUndoLastLog}
        hasLogsToUndo={todayLogs.length > 0}
      />

      {/* Today's Recent Logs Preview */}
      {todayLogs.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Today's Activity ({todayLogs.length} logs)
            </h3>
            <button
              onClick={onOpenHistory}
              className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-0.5"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5">
            {todayLogs.slice(-3).reverse().map(log => {
              const timeStr = new Date(log.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              });

              const meta = getDrinkTypeMetadata(log.drinkType);

              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl ${meta.iconBg} ${meta.iconColor} flex items-center justify-center shrink-0 shadow-2xs`}>
                      <DrinkTypeIcon type={log.drinkType} className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatVolumeExact(log.amount, profile.unitSystem)}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder} capitalize`}>
                          {meta.shortLabel}
                        </span>
                      </div>
                      {log.note && (
                        <p className="text-[10px] text-slate-500 italic mt-0.5 truncate max-w-[160px]">
                          {log.note}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {timeStr}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Auto-Resizing Banner Ad */}
      <BannerAd />

      {/* Compact Medical Disclaimer Banner */}
      <MedicalDisclaimerBanner language={profile.language} compact />

    </div>
  );
};
