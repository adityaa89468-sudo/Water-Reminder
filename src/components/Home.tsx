import React from 'react';
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
  Info
} from 'lucide-react';
import { UserProfile, WaterLog, DrinkType } from '../types';
import { WaveProgress } from './WaveProgress';
import { QuickAddPresets } from './QuickAddPresets';
import { MedicalDisclaimerBanner } from './MedicalDisclaimerBanner';
import { formatVolumeExact } from '../utils/calculations';
import { translations } from '../i18n/translations';
import { BannerAd } from './BannerAd';

interface HomeProps {
  profile: UserProfile;
  todayLogs: WaterLog[];
  todayTotalMl: number;
  onAddWater: (amountMl: number, drinkType?: DrinkType, note?: string) => void;
  onUndoLastLog: () => void;
  onOpenWhyTarget: () => void;
  onOpenReminders: () => void;
  onOpenHistory: () => void;
}

export const Home: React.FC<HomeProps> = ({
  profile,
  todayLogs,
  todayTotalMl,
  onAddWater,
  onUndoLastLog,
  onOpenWhyTarget,
  onOpenReminders,
  onOpenHistory
}) => {
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
          {/* Streak pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-300 font-bold text-xs shadow-xs">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>{profile.streak} {t.streakDays}</span>
          </div>

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

      {/* Centerpiece: Animated Circular Wave Fluid Indicator */}
      <WaveProgress
        currentMl={todayTotalMl}
        targetMl={profile.dailyTargetMl}
        unitSystem={profile.unitSystem}
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

              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-600 dark:text-sky-400">
                      <CupSoda className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatVolumeExact(log.amount, profile.unitSystem)}
                      </span>
                      <span className="text-[10px] text-slate-400 capitalize ml-1.5">
                        {log.drinkType}
                      </span>
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
