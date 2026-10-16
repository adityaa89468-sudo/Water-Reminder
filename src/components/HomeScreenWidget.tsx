import React, { useState, useMemo } from 'react';
import {
  Droplet,
  Plus,
  RotateCcw,
  CupSoda,
  Coffee,
  Sparkles,
  Flame,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Smartphone,
  Zap,
  Waves,
  Star,
  Layers,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Activity,
  ChevronDown,
  ChevronUp
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
  DrinkTypeIcon,
  getDrinkTypeMetadata,
  ALL_DRINK_TYPES
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
  const [selectedDrinkType, setSelectedDrinkType] = useState<DrinkType>('water');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [widgetMode, setWidgetMode] = useState<'standard' | 'compact_square' | 'linear_bar'>('standard');
  const [showPhoneGuide, setShowPhoneGuide] = useState(false);
  const [showTrendDetail, setShowTrendDetail] = useState(false);

  // Determine logs to analyze: use prop or fallback to stored logs
  const effectiveLogs = useMemo(() => {
    if (logs && logs.length > 0) return logs;
    return getStoredLogs();
  }, [logs]);

  // Compute the user's most frequently consumed drink volume
  const mostFrequent: MostFrequentDrinkVolume = useMemo(() => {
    return getMostFrequentDrinkVolume(effectiveLogs, defaultMl, selectedDrinkType);
  }, [effectiveLogs, defaultMl, selectedDrinkType]);

  // Compute Hydration Intake Velocity Trend (today vs yesterday at same time)
  const hydrationTrend: HydrationVelocityTrend = useMemo(() => {
    return calculateHydrationVelocityTrend(effectiveLogs, new Date(), unitSystem);
  }, [effectiveLogs, unitSystem]);

  // Hydration percentage & completion calculations
  const percentage = targetMl > 0 ? Math.round((currentMl / targetMl) * 100) : 0;
  const isTargetMet = currentMl >= targetMl;
  const remainingMl = Math.max(0, targetMl - currentMl);

  // SVG Circular Gauge calculations
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  const handleQuickAdd = (amountMl: number, drinkType: DrinkType = selectedDrinkType) => {
    onAddWater(amountMl, drinkType);

    const formattedAmount = formatVolumeExact(amountMl, unitSystem);
    setFeedbackMsg(`+${formattedAmount} ${drinkType} logged!`);

    // Celebrate milestone if goal is achieved or surpassed
    if (currentMl + amountMl >= targetMl && currentMl < targetMl) {
      try {
        if (typeof confetti === 'function') {
          confetti({
            particleCount: 55,
            spread: 65,
            origin: { y: 0.6 }
          });
        }
      } catch (e) {
        // Safe in test or headless environments
      }
    }

    setTimeout(() => {
      setFeedbackMsg(null);
    }, 2400);
  };

  const renderDrinkIcon = (iconType: CommonDrinkSize['icon'], iconClass = 'w-4 h-4') => {
    switch (iconType) {
      case 'sip':
        return <Droplet className={iconClass} />;
      case 'mug':
        return <Coffee className={iconClass} />;
      case 'bottle':
        return <Sparkles className={iconClass} />;
      case 'tumbler':
        return <Waves className={iconClass} />;
      case 'glass':
      default:
        return <CupSoda className={iconClass} />;
    }
  };

  // Helper to render the specific arrow icon based on velocity comparison
  const renderTrendArrowIcon = (direction: HydrationTrendDirection, iconClass = 'w-3.5 h-3.5') => {
    switch (direction) {
      case 'up':
        return <ArrowUp className={`${iconClass} stroke-[2.75]`} aria-label="Upward velocity trend" />;
      case 'down':
        return <ArrowDown className={`${iconClass} stroke-[2.75]`} aria-label="Downward velocity trend" />;
      case 'flat':
      default:
        return <ArrowRight className={`${iconClass} stroke-[2.75]`} aria-label="Flat velocity trend" />;
    }
  };

  // Styles dynamically paired with trend direction
  const trendTheme = useMemo(() => {
    switch (hydrationTrend.direction) {
      case 'up':
        return {
          badge: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300',
          badgeText: 'text-emerald-700 dark:text-emerald-300',
          iconBg: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400',
          bannerBg: 'bg-gradient-to-r from-emerald-50/90 via-teal-50/80 to-sky-50/60 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-slate-900/40 border-emerald-200/80 dark:border-emerald-900/60',
          accent: 'text-emerald-600 dark:text-emerald-400',
          ring: 'ring-emerald-500/20'
        };
      case 'down':
        return {
          badge: 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300',
          badgeText: 'text-amber-700 dark:text-amber-300',
          iconBg: 'bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400',
          bannerBg: 'bg-gradient-to-r from-amber-50/90 via-orange-50/70 to-rose-50/50 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-slate-900/40 border-amber-200/80 dark:border-amber-900/60',
          accent: 'text-amber-600 dark:text-amber-400',
          ring: 'ring-amber-500/20'
        };
      case 'flat':
      default:
        return {
          badge: 'bg-sky-50 dark:bg-sky-950/60 border-sky-300 dark:border-sky-800 text-sky-800 dark:text-sky-300',
          badgeText: 'text-sky-700 dark:text-sky-300',
          iconBg: 'bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-400',
          bannerBg: 'bg-gradient-to-r from-sky-50/90 via-cyan-50/70 to-slate-50/50 dark:from-sky-950/40 dark:via-cyan-950/30 dark:to-slate-900/40 border-sky-200/80 dark:border-sky-900/60',
          accent: 'text-sky-600 dark:text-sky-400',
          ring: 'ring-sky-500/20'
        };
    }
  }, [hydrationTrend.direction]);

  return (
    <section
      aria-label="Home Screen Hydration Widget"
      className={`relative bg-gradient-to-br from-white via-sky-50/40 to-cyan-50/30 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-800/80 border border-sky-200/70 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm transition-all overflow-hidden ${className}`}
      data-testid="home-screen-widget"
    >
      {/* Ambient background aura */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-sky-400/15 dark:bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Widget Header & Format Controls */}
      <div className="flex items-center justify-between gap-2 mb-3.5 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-400 text-white flex items-center justify-center font-bold shadow-xs">
            <Droplet className="w-4 h-4 fill-white/80" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Home Screen Widget
              </h3>
              <span className="px-1.5 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950/80 text-[10px] font-bold text-sky-700 dark:text-sky-300">
                Live
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Current hydration percentage, intake velocity &amp; quick log
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {hasLogsToUndo && onUndoLastLog && (
            <button
              onClick={onUndoLastLog}
              className="p-1.5 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors tap-active"
              title="Undo last log"
              aria-label="Undo last log"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Guide for installing as an Android / iOS home screen widget */}
          <button
            onClick={() => setShowPhoneGuide(!showPhoneGuide)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors tap-active"
            title="Home Screen Widget installation instructions"
            aria-label="Home Screen Widget installation instructions"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>

          {/* Widget format toggle */}
          <button
            onClick={() => {
              if (widgetMode === 'standard') setWidgetMode('compact_square');
              else if (widgetMode === 'compact_square') setWidgetMode('linear_bar');
              else setWidgetMode('standard');
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors tap-active"
            title={`Current layout: ${widgetMode}. Tap to switch format.`}
            aria-label="Switch widget view layout"
          >
            {widgetMode === 'standard' ? (
              <Layers className="w-3.5 h-3.5" />
            ) : widgetMode === 'compact_square' ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Instant Action Feedback Toast */}
      {feedbackMsg && (
        <div className="mb-3 p-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold flex items-center justify-between shadow-md animate-in fade-in slide-in-from-top-1 duration-150 relative z-20">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-extrabold uppercase">
            Updated
          </span>
        </div>
      )}

      {/* Phone Home Screen Pinning Guide */}
      {showPhoneGuide && (
        <div className="mb-3.5 p-3.5 rounded-2xl bg-sky-50 dark:bg-slate-800/90 border border-sky-200/80 dark:border-slate-700 text-xs space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-sky-800 dark:text-sky-300">
              <Smartphone className="w-4 h-4 text-sky-600" />
              <span>How to add SipLumo Widget to your Phone</span>
            </div>
            <button
              onClick={() => setShowPhoneGuide(false)}
              className="text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Close
            </button>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
            Install SipLumo as a PWA / App to place this quick-log widget directly onto your Android or iPhone home screen. In Chrome, tap <span className="font-semibold text-slate-800 dark:text-white">Menu &rarr; Add to Home screen</span>. On iOS Safari, tap <span className="font-semibold text-slate-800 dark:text-white">Share &rarr; Add to Home Screen</span>.
          </p>
        </div>
      )}

      {/* MODE 1: STANDARD EXPANDED BENTO WIDGET */}
      {widgetMode === 'standard' && (
        <div className="space-y-3">
          {/* Main Widget Grid: Percentage Gauge on Left + Primary Most-Frequent Quick Log Button on Right */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-center bg-white/80 dark:bg-slate-900/80 border border-sky-100 dark:border-slate-800/80 rounded-2xl p-3.5 shadow-2xs">
            
            {/* Left: Hydration Percentage Circular Gauge & Quick Stats */}
            <div className="sm:col-span-5 flex items-center justify-center sm:justify-start gap-3">
              <div
                className="relative w-20 h-20 shrink-0 flex items-center justify-center"
                role="progressbar"
                aria-valuenow={percentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Current hydration percentage"
              >
                <svg className="w-20 h-20 -rotate-90 transform" viewBox="0 0 90 90">
                  <circle
                    cx="45"
                    cy="45"
                    r={radius}
                    className="text-slate-100 dark:text-slate-800"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  <circle
                    cx="45"
                    cy="45"
                    r={radius}
                    className={`transition-all duration-700 ease-out ${
                      isTargetMet
                        ? 'text-emerald-500 dark:text-emerald-400'
                        : 'text-sky-500 dark:text-sky-400'
                    }`}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                  />
                </svg>

                {/* Percentage Text Center */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                    {percentage}%
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {isTargetMet ? 'Goal Met' : 'Hydrated'}
                  </span>
                </div>
              </div>

              {/* Volume stats & Hydration Trend Chip */}
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white tabular-nums">
                    {formatVolume(currentMl, unitSystem)}
                  </span>
                  <span className="text-xs text-slate-400">/</span>
                  <button
                    onClick={onOpenWhyTarget}
                    className="text-xs text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-300 font-semibold underline-offset-2 hover:underline"
                    title="View hydration formula details"
                  >
                    {formatVolume(targetMl, unitSystem)}
                  </button>
                </div>

                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {isTargetMet ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Target Achieved!
                    </span>
                  ) : (
                    <span>{formatVolume(remainingMl, unitSystem)} remaining</span>
                  )}
                </p>

                {/* Hydration Trend Indicator Badge (with arrow icon) */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <button
                    type="button"
                    onClick={() => setShowTrendDetail(prev => !prev)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold transition-all tap-active ${trendTheme.badge}`}
                    title="Hydration Trend: Click to view velocity details"
                    data-testid="widget-hydration-trend-indicator"
                    aria-label={`Hydration trend: ${hydrationTrend.label}, ${hydrationTrend.statusBadge}`}
                  >
                    <span className={`p-0.5 rounded-full ${trendTheme.iconBg} flex items-center justify-center shrink-0`}>
                      {renderTrendArrowIcon(hydrationTrend.arrow, 'w-2.5 h-2.5')}
                    </span>
                    <span className="truncate">{hydrationTrend.label}</span>
                  </button>

                  {streak > 0 && onOpenAchievements && (
                    <button
                      onClick={onOpenAchievements}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-md hover:bg-amber-100 transition-colors"
                    >
                      <Flame className="w-3 h-3 fill-amber-500" />
                      <span>{streak}d</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right: PRIMARY 'QUICK LOG' BUTTON FOR USER'S MOST FREQUENT DRINK VOLUME */}
            <div className="sm:col-span-7 flex flex-col justify-center sm:border-l sm:border-slate-100 sm:dark:border-slate-800 sm:pl-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-bold">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>Most Frequent Drink</span>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                  {mostFrequent.isFallback
                    ? 'Default preset'
                    : `Logged ${mostFrequent.count} ${mostFrequent.count === 1 ? 'time' : 'times'}`}
                </span>
              </div>

              {/* The Dedicated 'Quick Log' Button */}
              <button
                type="button"
                onClick={() => handleQuickAdd(mostFrequent.amountMl, mostFrequent.drinkType)}
                className="w-full py-3 px-3.5 bg-gradient-to-r from-sky-500 via-sky-600 to-teal-500 hover:from-sky-600 hover:via-sky-700 hover:to-teal-600 active:scale-[0.98] text-white font-extrabold text-sm rounded-2xl shadow-sm hover:shadow-md flex items-center justify-between gap-2 transition-all tap-active group border border-sky-400/30"
                title={`Quick Log ${formatVolumeExact(mostFrequent.amountMl, unitSystem)} (Your most frequent drink)`}
                data-testid="widget-quick-log-frequent-btn"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                    <Plus className="w-4 h-4 stroke-[3px]" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1.5 leading-tight">
                      <span className="tracking-tight">Quick Log</span>
                      <span className="px-1.5 py-0.2 rounded bg-white/25 text-[11px] font-black uppercase">
                        +{formatVolumeExact(mostFrequent.amountMl, unitSystem)}
                      </span>
                    </div>
                    <span className="text-[10px] text-white/80 font-medium capitalize">
                      {mostFrequent.drinkType} &bull; 1-Tap Log
                    </span>
                  </div>
                </div>

                <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center">
                  <CupSoda className="w-3.5 h-3.5 text-white" />
                </div>
              </button>
            </div>
          </div>

          {/* DEDICATED HYDRATION TREND INDICATOR & IMMEDIATE ACTIONABLE FEEDBACK CARD */}
          <div
            className={`p-3 rounded-2xl border transition-all ${trendTheme.bannerBg}`}
            data-testid="widget-hydration-trend-actionable-card"
          >
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-2.5 min-w-0">
                <div className={`mt-0.5 p-1.5 rounded-xl ${trendTheme.iconBg} shrink-0 shadow-2xs`}>
                  {renderTrendArrowIcon(hydrationTrend.arrow, 'w-4 h-4')}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1">
                      <span>Hydration Trend</span>
                      <span className="text-slate-400">&bull;</span>
                      <span className={trendTheme.accent}>{hydrationTrend.label}</span>
                    </span>
                    <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${trendTheme.iconBg}`}>
                      {hydrationTrend.statusBadge}
                    </span>
                  </div>

                  {/* Immediate Actionable Feedback */}
                  <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300 leading-snug mt-1">
                    {hydrationTrend.actionableFeedback}
                  </p>
                </div>
              </div>

              {/* Details toggle */}
              <button
                type="button"
                onClick={() => setShowTrendDetail(!showTrendDetail)}
                className="text-[10px] font-bold text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-300 shrink-0 px-2 py-1 rounded-lg hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors flex items-center gap-0.5"
                title="Toggle velocity details"
              >
                <span>{showTrendDetail ? 'Less' : 'Velocity'}</span>
                {showTrendDetail ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {/* Expanded Velocity Comparison Details */}
            {showTrendDetail && (
              <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60 grid grid-cols-2 gap-2 text-[10px] animate-in fade-in">
                <div className="bg-white/70 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-100 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400 block font-semibold">Today's Intake Velocity:</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-100 tabular-nums text-xs">
                    {hydrationTrend.todayVelocityMlPerHour} mL/h
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">
                    ({formatVolume(hydrationTrend.todayMlSoFar, unitSystem)} so far)
                  </span>
                </div>
                <div className="bg-white/70 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-100 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400 block font-semibold">Yesterday (at this time):</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-100 tabular-nums text-xs">
                    {hydrationTrend.yesterdayVelocityMlPerHour} mL/h
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">
                    ({formatVolume(hydrationTrend.yesterdayMlAtSameTime, unitSystem)} at this hour)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Beverage Type Quick Selector */}
          <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
              Drink:
            </span>
            <div className="flex items-center gap-1">
              {ALL_DRINK_TYPES.map(type => {
                const isSelected = selectedDrinkType === type;
                const meta = getDrinkTypeMetadata(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedDrinkType(type)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all tap-active shrink-0 ${
                      isSelected
                        ? `${meta.badgeBg} ${meta.badgeBorder} ${meta.badgeText} shadow-xs ring-1 ring-sky-500/30 font-extrabold`
                        : 'bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <DrinkTypeIcon type={type} className="w-3 h-3 shrink-0" />
                    <span>{meta.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick-Add Drink Sizes Grid (Alternative sizes) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Alternative Sizes
              </span>
              <span className="text-[10px] text-slate-400">
                1-tap log to dashboard
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {COMMON_DRINK_SIZES.map(size => {
                const isUserMostFrequent = size.ml === mostFrequent.amountMl;
                const displayVol =
                  unitSystem === 'imperial' ? `${size.flOz} oz` : `${size.ml} mL`;

                return (
                  <button
                    key={size.id}
                    type="button"
                    onClick={() => handleQuickAdd(size.ml, selectedDrinkType)}
                    className={`p-2.5 rounded-2xl border transition-all text-center flex flex-col items-center justify-center gap-1 tap-active min-h-[72px] relative group ${
                      isUserMostFrequent
                        ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-700 text-sky-900 dark:text-sky-100 shadow-xs'
                        : 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-sky-200 hover:bg-sky-50/50 dark:hover:bg-slate-750'
                    }`}
                    title={`Log ${displayVol} ${size.name}`}
                  >
                    {isUserMostFrequent && (
                      <span className="absolute -top-1.5 right-2 px-1.5 py-0.2 bg-amber-500 text-white text-[9px] font-black rounded-full shadow-2xs">
                        ★ Top
                      </span>
                    )}

                    <div className="w-7 h-7 rounded-xl bg-sky-100/80 dark:bg-slate-700 flex items-center justify-center text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform">
                      {renderDrinkIcon(size.icon, 'w-3.5 h-3.5')}
                    </div>

                    <span className="text-xs font-black leading-none text-slate-900 dark:text-white tabular-nums">
                      +{displayVol}
                    </span>

                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate max-w-full">
                      {size.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: COMPACT 2x2 ANDROID HOME SCREEN WIDGET */}
      {widgetMode === 'compact_square' && (
        <div className="p-3 flex flex-col items-center text-center space-y-2.5 bg-white/70 dark:bg-slate-900/60 rounded-2xl border border-sky-100/80 dark:border-slate-800">
          <div className="flex items-center justify-between w-full px-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              2x2 Widget
            </span>
            <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400">
              {formatVolume(currentMl, unitSystem)} / {formatVolume(targetMl, unitSystem)}
            </span>
          </div>

          {/* Centered Circular Gauge with Percentage */}
          <div
            className="relative w-28 h-28 flex items-center justify-center"
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Hydration progress percentage"
          >
            <svg className="w-28 h-28 -rotate-90 transform" viewBox="0 0 90 90">
              <circle
                cx="45"
                cy="45"
                r={radius}
                className="text-slate-100 dark:text-slate-800"
                strokeWidth="7"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="45"
                cy="45"
                r={radius}
                className={`transition-all duration-700 ease-out ${
                  isTargetMet
                    ? 'text-emerald-500 dark:text-emerald-400'
                    : 'text-sky-500 dark:text-sky-400'
                }`}
                strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                {percentage}%
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                {isTargetMet ? 'Complete' : 'Hydrated'}
              </span>
            </div>
          </div>

          {/* Hydration Trend Indicator Pill with Arrow Icon */}
          <div
            className={`w-full py-1 px-2.5 rounded-xl border flex items-center justify-between text-[10px] font-bold transition-all ${trendTheme.badge}`}
            data-testid="widget-trend-compact-indicator"
            title={hydrationTrend.actionableFeedback}
          >
            <div className="flex items-center gap-1.5 truncate">
              <span className={`p-0.5 rounded-full ${trendTheme.iconBg} shrink-0`}>
                {renderTrendArrowIcon(hydrationTrend.arrow, 'w-2.5 h-2.5')}
              </span>
              <span className="truncate">{hydrationTrend.label}</span>
            </div>
            <span className="text-[9px] font-black shrink-0">{hydrationTrend.statusBadge}</span>
          </div>

          {/* Single Prominent 'Quick Log' Button for Most Frequent Drink Volume */}
          <button
            type="button"
            onClick={() => handleQuickAdd(mostFrequent.amountMl, mostFrequent.drinkType)}
            className="w-full py-2.5 px-3 bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all tap-active"
            title={`Quick Log ${formatVolumeExact(mostFrequent.amountMl, unitSystem)}`}
          >
            <Plus className="w-4 h-4 stroke-[3px]" />
            <span>Quick Log {formatVolumeExact(mostFrequent.amountMl, unitSystem)}</span>
            <span className="text-[10px] opacity-80">({mostFrequent.isFallback ? 'Favorite' : `${mostFrequent.count}x`})</span>
          </button>

          {/* Immediate Actionable Feedback */}
          <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-tight px-1 text-center font-medium">
            {hydrationTrend.actionableFeedback}
          </p>
        </div>
      )}

      {/* MODE 3: HORIZONTAL LINEAR BAR WIDGET */}
      {widgetMode === 'linear_bar' && (
        <div className="space-y-2.5 bg-white/70 dark:bg-slate-900/60 p-3 rounded-2xl border border-sky-100/80 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                {percentage}%
              </span>
              <span className="text-slate-400 text-[11px]">
                ({formatVolume(currentMl, unitSystem)} / {formatVolume(targetMl, unitSystem)})
              </span>
            </div>

            {/* Inline Hydration Trend Indicator with Arrow Icon */}
            <div
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold ${trendTheme.badge}`}
              title={hydrationTrend.actionableFeedback}
              data-testid="widget-trend-linear-indicator"
            >
              {renderTrendArrowIcon(hydrationTrend.arrow, 'w-2.5 h-2.5')}
              <span>{hydrationTrend.label}</span>
              <span className="opacity-80 font-normal">({hydrationTrend.statusBadge})</span>
            </div>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                isTargetMet ? 'bg-emerald-500' : 'bg-gradient-to-r from-sky-500 to-teal-400'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>

          {/* Actionable Feedback summary */}
          <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-tight flex items-center gap-1.5 px-0.5">
            <span className={`p-0.5 rounded-full ${trendTheme.iconBg} shrink-0`}>
              {renderTrendArrowIcon(hydrationTrend.arrow, 'w-2.5 h-2.5')}
            </span>
            <span className="truncate font-medium">{hydrationTrend.actionableFeedback}</span>
          </p>

          {/* Quick Log Button for Most Frequent Drink Volume */}
          <div className="pt-0.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleQuickAdd(mostFrequent.amountMl, mostFrequent.drinkType)}
              className="flex-1 py-2 px-3 bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all tap-active"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5px]" />
              <span>Quick Log {formatVolumeExact(mostFrequent.amountMl, unitSystem)}</span>
              <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded font-semibold">★ Most Frequent</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
