import React, { useState, useMemo } from 'react';
import {
  Droplet,
  Plus,
  RotateCcw,
  Flame,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Maximize2,
  Minimize2,
  Sparkles
} from 'lucide-react';
import { UnitSystem, DrinkType, WaterLog } from '../types';
import {
  formatVolume,
  formatVolumeExact,
  getMostFrequentDrinkVolume,
  MostFrequentDrinkVolume,
  calculateHydrationVelocityTrend,
  HydrationVelocityTrend,
  HydrationTrendDirection
} from '../utils/calculations';
import { getStoredLogs } from '../utils/storage';
import {
  ALL_DRINK_TYPES,
  DrinkTypeIcon,
  getDrinkTypeMetadata
} from '../utils/drinkTypes';
import confetti from 'canvas-confetti';

export interface HomeScreenWidgetProps {
  currentMl: number;
  targetMl: number;
  unitSystem: UnitSystem;
  streak?: number;
  logs?: WaterLog[];
  defaultMl?: number;
  onAddWater: (amountMl: number, drinkType?: DrinkType, note?: string) => void;
  onUndoLastLog?: () => void;
  hasLogsToUndo?: boolean;
  onOpenAchievements?: () => void;
  onOpenWhyTarget?: () => void;
  className?: string;
}

export interface CommonDrinkSize {
  id: string;
  name: string;
  ml: number;
  flOz: number;
  icon: 'sip' | 'glass' | 'mug' | 'bottle' | 'tumbler';
}

export const COMMON_DRINK_SIZES: CommonDrinkSize[] = [
  { id: 'sip', name: 'Quick Sip', ml: 150, flOz: 5, icon: 'sip' },
  { id: 'glass', name: 'Standard Glass', ml: 250, flOz: 8.5, icon: 'glass' },
  { id: 'mug', name: 'Warm Mug', ml: 350, flOz: 12, icon: 'mug' },
  { id: 'bottle', name: 'Sports Bottle', ml: 500, flOz: 16.9, icon: 'bottle' },
  { id: 'tumbler', name: 'Large Tumbler', ml: 750, flOz: 25.4, icon: 'tumbler' }
];

const WIDGET_MODE_STORAGE_KEY = 'siplumo_widget_compact_mode_v1';

export const HomeScreenWidget: React.FC<HomeScreenWidgetProps> = ({
  currentMl,
  targetMl,
  unitSystem,
  streak = 0,
  logs,
  defaultMl = 250,
  onAddWater,
  onUndoLastLog,
  hasLogsToUndo = false,
  onOpenAchievements,
  onOpenWhyTarget,
  className = ''
}) => {
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [selectedDrinkType, setSelectedDrinkType] = useState<DrinkType>('water');
  const [isCompactMode, setIsCompactMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(WIDGET_MODE_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const toggleCompactMode = () => {
    setIsCompactMode(prev => {
      const next = !prev;
      try {
        localStorage.setItem(WIDGET_MODE_STORAGE_KEY, String(next));
      } catch {
        // Ignore storage notice
      }
      return next;
    });
  };

  const effectiveLogs = useMemo(() => {
    if (logs && logs.length > 0) return logs;
    return getStoredLogs();
  }, [logs]);

  const mostFrequent: MostFrequentDrinkVolume = useMemo(() => {
    return getMostFrequentDrinkVolume(effectiveLogs, defaultMl, 'water');
  }, [effectiveLogs, defaultMl]);

  const hydrationTrend: HydrationVelocityTrend = useMemo(() => {
    return calculateHydrationVelocityTrend(effectiveLogs, new Date(), unitSystem);
  }, [effectiveLogs, unitSystem]);

  const percentage = targetMl > 0 ? Math.round((currentMl / targetMl) * 100) : 0;
  const clampedPct = Math.min(100, Math.max(0, percentage));
  const isTargetMet = currentMl >= targetMl;
  const remainingMl = Math.max(0, targetMl - currentMl);

  // SVG Ring Geometry
  const ringSize = 112;
  const strokeWidth = 10;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedPct / 100) * circumference;

  const handleQuickAdd = (amountMl: number, drinkType: DrinkType = selectedDrinkType) => {
    onAddWater(amountMl, drinkType);

    const formattedAmount = formatVolumeExact(amountMl, unitSystem);
    const drinkMeta = getDrinkTypeMetadata(drinkType);
    setFeedbackMsg(`Added +${formattedAmount} of ${drinkMeta.shortLabel}`);

    if (currentMl + amountMl >= targetMl && currentMl < targetMl) {
      try {
        if (typeof confetti === 'function') {
          confetti({
            particleCount: 50,
            spread: 65,
            origin: { y: 0.65 }
          });
        }
      } catch {
        // Safe in headless/test environments
      }
    }

    setTimeout(() => {
      setFeedbackMsg(null);
    }, 2500);
  };

  const renderTrendArrowIcon = (direction: HydrationTrendDirection, iconClass = 'w-4 h-4') => {
    switch (direction) {
      case 'up':
        return <ArrowUp className={`${iconClass} stroke-[2.5]`} aria-label="Ahead of yesterday" />;
      case 'down':
        return <ArrowDown className={`${iconClass} stroke-[2.5]`} aria-label="Behind yesterday" />;
      case 'flat':
      default:
        return <ArrowRight className={`${iconClass} stroke-[2.5]`} aria-label="Same pace as yesterday" />;
    }
  };

  const friendlyTrendMessage = useMemo(() => {
    if (hydrationTrend.direction === 'up') {
      return {
        title: 'Ahead of yesterday',
        badgeLabel: 'Ahead',
        subtitle: "You've had more water by this time than yesterday. Great job!",
        color: 'text-emerald-700 dark:text-emerald-300',
        bg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
      };
    }
    if (hydrationTrend.direction === 'down') {
      return {
        title: 'Behind yesterday',
        badgeLabel: 'Catch up',
        subtitle: 'Have a quick glass now to catch up to your usual daily pace.',
        color: 'text-amber-700 dark:text-amber-300',
        bg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
      };
    }
    return {
      title: 'Right on track',
      badgeLabel: 'On pace',
      subtitle:
        currentMl === 0
          ? 'Tap Quick Log below to log your first drink of the day!'
          : "You're drinking at the same steady pace as yesterday.",
      color: 'text-sky-700 dark:text-sky-300',
      bg: 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/60'
    };
  }, [hydrationTrend.direction, currentMl]);

  const frequentDrinkMeta = getDrinkTypeMetadata(mostFrequent.drinkType);
  const selectedDrinkMeta = getDrinkTypeMetadata(selectedDrinkType);

  return (
    <section
      aria-label="Home Screen Hydration Widget"
      className={`adaptive-card space-y-4 sm:space-y-5 ${className}`}
      data-testid="home-screen-widget"
    >
      {/* Top Widget Header Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-2xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-100 dark:border-sky-900/60 shrink-0">
            <Droplet className="w-4 h-4 fill-sky-500/20" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                Hydration Quick Widget
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950 border border-sky-200/70 dark:border-sky-800/70 text-sky-700 dark:text-sky-300 text-[10px] font-bold uppercase tracking-wider shrink-0">
                Live
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {isTargetMet
                ? 'Daily goal reached!'
                : `${formatVolume(remainingMl, unitSystem)} left to reach your goal`}
            </p>
          </div>
        </div>

        {/* Right Header Actions: Undo + Compact/Full Toggle */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          {hasLogsToUndo && onUndoLastLog && (
            <button
              type="button"
              onClick={onUndoLastLog}
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-950/60 transition-colors flex items-center gap-1.5 tap-active min-h-[38px]"
              title="Undo last drink"
              data-testid="widget-undo-btn"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span>Undo</span>
            </button>
          )}

          <button
            type="button"
            onClick={toggleCompactMode}
            className="p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors tap-active min-h-[38px] min-w-[38px] flex items-center justify-center"
            title={isCompactMode ? 'Expand widget controls' : 'Switch to compact widget'}
            aria-label={isCompactMode ? 'Expand widget controls' : 'Switch to compact widget'}
          >
            {isCompactMode ? (
              <Maximize2 className="w-4 h-4" />
            ) : (
              <Minimize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Live Feedback Toast Banner */}
      {feedbackMsg && (
        <div className="p-3 rounded-2xl bg-emerald-600 text-white text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="truncate">{feedbackMsg}</span>
          </div>
          {hasLogsToUndo && onUndoLastLog && (
            <button
              type="button"
              onClick={() => {
                onUndoLastLog();
                setFeedbackMsg(null);
              }}
              className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold transition-colors shrink-0"
            >
              Undo
            </button>
          )}
        </div>
      )}

      {/* Main Widget Core: Live Circular Percentage Gauge + Trend + 1-Tap Quick Log */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5 items-center bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 sm:p-5">
        {/* Left: Circular Hydration Percentage Ring + Volume Readout */}
        <div className="md:col-span-5 flex items-center gap-3.5 sm:gap-4 min-w-0">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 flex items-center justify-center">
            <svg
              className="w-full h-full -rotate-90"
              viewBox={`0 0 ${ringSize} ${ringSize}`}
              aria-label={`Hydration progress ${percentage}%`}
            >
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-slate-200 dark:text-slate-700/70"
              />
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className={`transition-all duration-500 ease-out ${
                  isTargetMet
                    ? 'text-emerald-500 dark:text-emerald-400'
                    : 'text-sky-500 dark:text-sky-400'
                }`}
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span
                className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums leading-none"
                data-testid="widget-hydration-percentage"
              >
                {percentage}%
              </span>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
                {isTargetMet ? 'Complete' : 'Hydrated'}
              </span>
            </div>
          </div>

          {/* Current / Target Volume & Streak */}
          <div className="min-w-0 flex-1 space-y-1.5">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                Today's Intake
              </span>
              <div className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tabular-nums leading-tight truncate">
                {formatVolumeExact(currentMl, unitSystem)}
              </div>
              <button
                type="button"
                onClick={onOpenWhyTarget}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 tabular-nums transition-colors text-left"
              >
                of {formatVolumeExact(targetMl, unitSystem)} goal
              </button>
            </div>

            {streak > 0 && (
              <button
                type="button"
                onClick={onOpenAchievements}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200/70 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 text-[11px] font-bold tap-active"
              >
                <Flame className="w-3 h-3 fill-amber-500 text-amber-500 shrink-0" />
                <span className="tabular-nums">{streak} day streak</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Hydration Trend Indicator + 1-Tap Most Frequent Drink Quick Log */}
        <div className="md:col-span-7 space-y-3 min-w-0">
          {/* Hydration Trend Indicator Card */}
          <div
            className="flex items-start gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800"
            data-testid="widget-hydration-trend-actionable-card"
          >
            <div
              className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${friendlyTrendMessage.bg}`}
              data-testid="widget-hydration-trend-indicator"
            >
              {renderTrendArrowIcon(hydrationTrend.arrow, 'w-4 h-4')}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className={`text-xs font-bold ${friendlyTrendMessage.color}`}>
                  {friendlyTrendMessage.title}
                </span>
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                  vs. yesterday
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                {friendlyTrendMessage.subtitle}
              </p>
            </div>
          </div>

          {/* 1-Tap Quick Log Button for Most Frequently Consumed Drink Volume */}
          <button
            type="button"
            onClick={() => handleQuickAdd(mostFrequent.amountMl, mostFrequent.drinkType)}
            className="w-full py-3 sm:py-3.5 px-3.5 sm:px-4 bg-sky-600 hover:bg-sky-700 active:scale-[0.99] text-white font-bold text-sm rounded-2xl border border-sky-500/40 shadow-xs flex items-center justify-between gap-2.5 transition-all tap-active min-h-[54px]"
            title={`Quick Log ${formatVolumeExact(mostFrequent.amountMl, unitSystem)} of ${frequentDrinkMeta.shortLabel}`}
            data-testid="widget-quick-log-frequent-btn"
          >
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                <Plus className="w-5 h-5 stroke-[2.5px]" />
              </div>
              <div className="text-left min-w-0">
                <span className="block leading-tight text-xs sm:text-sm font-extrabold tabular-nums truncate">
                  Quick Log +{formatVolumeExact(mostFrequent.amountMl, unitSystem)}
                </span>
                <span className="text-[11px] text-sky-100 font-medium block mt-0.5 truncate">
                  {mostFrequent.isFallback
                    ? `Standard ${frequentDrinkMeta.shortLabel} glass`
                    : `Your favorite ${frequentDrinkMeta.shortLabel} (${mostFrequent.count}x logged)`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/15 border border-white/20 text-xs font-semibold text-white shrink-0">
              <DrinkTypeIcon type={mostFrequent.drinkType} className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden min-[360px]:inline">1-Tap</span>
            </div>
          </button>
        </div>
      </div>

      {/* Expanded Interactive Widget Controls: Drink Type Selector + Instant Cup Sizes */}
      {!isCompactMode && (
        <div className="space-y-3 pt-1">
          {/* Drink Type Selector Row */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Widget Quick-Tap Sizes ({selectedDrinkMeta.shortLabel})
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              Tap any size to log immediately
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {ALL_DRINK_TYPES.map(type => {
              const isSelected = selectedDrinkType === type;
              const meta = getDrinkTypeMetadata(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedDrinkType(type)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all tap-active border min-h-[38px] ${
                    isSelected
                      ? `${meta.badgeBg} ${meta.badgeBorder} ${meta.badgeText}`
                      : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <DrinkTypeIcon type={type} className="w-3.5 h-3.5 shrink-0" />
                  <span>{meta.shortLabel}</span>
                </button>
              );
            })}
          </div>

          {/* 5 Common Cup Size Buttons - Responsive Auto-Adjusting Grid */}
          <div className="grid grid-cols-2 min-[420px]:grid-cols-3 sm:grid-cols-5 gap-2">
            {COMMON_DRINK_SIZES.map((size, idx) => (
              <button
                key={size.id}
                type="button"
                onClick={() => handleQuickAdd(size.ml, selectedDrinkType)}
                className={`p-2.5 sm:p-3 rounded-2xl bg-slate-50 hover:bg-sky-50/80 dark:bg-slate-800/70 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-600 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 tap-active min-h-[60px] ${
                  idx === COMMON_DRINK_SIZES.length - 1 ? 'col-span-2 min-[420px]:col-span-1' : ''
                }`}
                title={`Log ${formatVolumeExact(size.ml, unitSystem)} of ${selectedDrinkMeta.shortLabel}`}
                data-testid={`widget-size-btn-${size.id}`}
              >
                <div className="flex items-center gap-1.5">
                  <DrinkTypeIcon
                    type={selectedDrinkType}
                    className={`w-3.5 h-3.5 shrink-0 ${selectedDrinkMeta.iconColor}`}
                  />
                  <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                    +{formatVolumeExact(size.ml, unitSystem)}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-full">
                  {size.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Goal Reached Banner inside Widget */}
      {isTargetMet && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between gap-2 text-xs text-emerald-800 dark:text-emerald-200">
          <div className="flex items-center gap-2 font-semibold min-w-0">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">You hit 100% of your daily hydration goal today!</span>
          </div>
          <span className="font-bold tabular-nums shrink-0">{percentage}%</span>
        </div>
      )}
    </section>
  );
};
