import React, { useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
  Cell
} from 'recharts';
import {
  Flame,
  Award,
  TrendingUp,
  TrendingDown,
  Download,
  FileSpreadsheet,
  Trash2,
  Calendar,
  Sparkles,
  Info,
  CheckCircle2,
  Activity,
  Droplet,
  LineChart as LineChartIcon,
  BarChart3,
  Layers,
  Trophy,
  ChevronRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { WaterLog, UserProfile, UnitSystem } from '../types';
import { formatVolume, formatVolumeExact, mlToFlOz } from '../utils/calculations';
import { BannerAd } from './BannerAd';
import { exportDataAsJSON, exportDataAsCSV, downloadLogsAsCSV } from '../utils/storage';
import { calculateAchievements, TIER_CONFIG } from '../utils/achievements';

interface InsightsViewProps {
  logs: WaterLog[];
  profile: UserProfile;
  unitSystem: UnitSystem;
  onClearAllHistory: () => void;
  onOpenAchievements?: () => void;
}

export const InsightsView: React.FC<InsightsViewProps> = ({
  logs,
  profile,
  unitSystem,
  onClearAllHistory,
  onOpenAchievements
}) => {
  const [weeklyViewMode, setWeeklyViewMode] = useState<'bar' | 'line' | 'area'>('bar');
  const [weeklyCurveType, setWeeklyCurveType] = useState<'monotone' | 'linear'>('monotone');
  const [showAverageLine, setShowAverageLine] = useState(true);
  const [showMonthlyView, setShowMonthlyView] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  // Group logs by day key (YYYY-MM-DD)
  const dayMap: Record<string, number> = {};
  logs.forEach(l => {
    const dKey = l.timestamp.split('T')[0];
    dayMap[dKey] = (dayMap[dKey] || 0) + l.amount;
  });

  const now = new Date();

  // Dedicated 7-Day Trend Dataset
  const trend7DaysData: Array<{
    date: string;
    dayLabel: string;
    fullDate: string;
    amount: number;
    amountMl: number;
    target: number;
    targetMl: number;
    isMet: boolean;
    percent: number;
    average: number;
  }> = [];

  let last7TotalMl = 0;
  let prev7TotalMl = 0;
  let daysMetLast7 = 0;

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().split('T')[0];
    const amountMl = dayMap[dateKey] || 0;
    const targetMl =
      profile.dayTargetOverrides?.[dateKey] || profile.dailyTargetMl || 2000;

    last7TotalMl += amountMl;
    if (amountMl >= targetMl) daysMetLast7++;

    const displayVal = unitSystem === 'imperial' ? mlToFlOz(amountMl) : amountMl;
    const targetVal = unitSystem === 'imperial' ? mlToFlOz(targetMl) : targetMl;

    trend7DaysData.push({
      date: dateKey,
      dayLabel: d.toLocaleDateString(undefined, { weekday: 'short' }),
      fullDate: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      amount: displayVal,
      amountMl,
      target: targetVal,
      targetMl,
      isMet: amountMl >= targetMl,
      percent: targetMl > 0 ? Math.round((amountMl / targetMl) * 100) : 0,
      average: 0
    });
  }

  // Previous 7 days (days 7 to 13 ago) for trend difference calculation
  for (let i = 13; i >= 7; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().split('T')[0];
    prev7TotalMl += dayMap[dateKey] || 0;
  }

  const last7DailyAvgMl = Math.round(last7TotalMl / 7);
  const displayLast7Avg = unitSystem === 'imperial' ? mlToFlOz(last7DailyAvgMl) : last7DailyAvgMl;

  trend7DaysData.forEach(item => {
    item.average = displayLast7Avg;
  });

  // Calculate percentage delta vs previous 7-day period
  let trendDeltaPercent = 0;
  if (prev7TotalMl > 0) {
    trendDeltaPercent = Math.round(((last7TotalMl - prev7TotalMl) / prev7TotalMl) * 100);
  } else if (last7TotalMl > 0) {
    trendDeltaPercent = 100;
  }

  // Find peak day in the last 7 days
  const peakDay = trend7DaysData.reduce(
    (max, cur) => (cur.amountMl > max.amountMl ? cur : max),
    trend7DaysData[0]
  );

  // Generate date series for the last 7 or 30 days
  const numDays = range === '7d' ? 7 : 30;
  const chartData: Array<{
    date: string;
    dayLabel: string;
    amount: number;
    target: number;
    isMet: boolean;
  }> = [];

  let totalRangeIntake = 0;
  let daysMetTargetCount = 0;

  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().split('T')[0];
    const amountMl = dayMap[dateKey] || 0;
    const targetMl =
      profile.dayTargetOverrides?.[dateKey] || profile.dailyTargetMl || 2000;

    totalRangeIntake += amountMl;
    if (amountMl >= targetMl) daysMetTargetCount++;

    const displayVal = unitSystem === 'imperial' ? mlToFlOz(amountMl) : amountMl;
    const targetVal = unitSystem === 'imperial' ? mlToFlOz(targetMl) : targetMl;

    chartData.push({
      date: dateKey,
      dayLabel: range === '7d'
        ? d.toLocaleDateString(undefined, { weekday: 'short' })
        : d.getDate().toString(),
      amount: displayVal,
      target: targetVal,
      isMet: amountMl >= targetMl
    });
  }

  const averageDailyMl = Math.round(totalRangeIntake / numDays);
  const completionRate = Math.round((daysMetTargetCount / numDays) * 100);

  // Export handlers
  const handleExportJSON = () => {
    const jsonStr = exportDataAsJSON(profile, logs);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `siplumo_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    if (logs.length === 0) {
      setExportFeedback('No intake logs to export yet. Add your first drink!');
      setTimeout(() => setExportFeedback(null), 4000);
      return;
    }
    const success = downloadLogsAsCSV(logs);
    if (success) {
      setExportFeedback(`Successfully downloaded ${logs.length} hydration logs as CSV!`);
      setTimeout(() => setExportFeedback(null), 4000);
    }
  };

  const currentTargetDisplay =
    unitSystem === 'imperial'
      ? mlToFlOz(profile.dailyTargetMl)
      : profile.dailyTargetMl;

  const maxVal7Days = Math.max(
    ...trend7DaysData.map(d => Math.max(d.amount, d.target)),
    currentTargetDisplay,
    50
  );
  const yDomainMax = Math.ceil(maxVal7Days * 1.15);

  const renderIntakeDot = (dotProps: any) => {
    const { cx, cy, payload } = dotProps;
    if (cx === undefined || cy === undefined) return null;
    const isMet = payload?.isMet;
    return (
      <g key={`intake-dot-${payload?.date || Math.random()}`}>
        {isMet && (
          <circle
            cx={cx}
            cy={cy}
            r={8}
            fill="#10b981"
            opacity={0.25}
          />
        )}
        <circle
          cx={cx}
          cy={cy}
          r={isMet ? 5 : 4}
          fill={isMet ? '#10b981' : '#0284c7'}
          stroke="#ffffff"
          strokeWidth={2}
        />
      </g>
    );
  };

  const renderGoalDot = (dotProps: any) => {
    const { cx, cy, payload } = dotProps;
    if (cx === undefined || cy === undefined) return null;
    return (
      <circle
        key={`goal-dot-${payload?.date || Math.random()}`}
        cx={cx}
        cy={cy}
        r={3.5}
        fill="#10b981"
        stroke="#ffffff"
        strokeWidth={1.5}
      />
    );
  };

  const renderTrendTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      const unitLabel = unitSystem === 'imperial' ? 'fl oz' : 'mL';
      const diffFromTarget = dataPoint.amount - dataPoint.target;

      return (
        <div className="bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-xl border border-slate-700/80 backdrop-blur-md text-xs space-y-2 min-w-[200px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-extrabold text-slate-100">
              {dataPoint.dayLabel}, {dataPoint.fullDate}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                dataPoint.isMet
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {dataPoint.isMet ? 'Goal Achieved' : `${dataPoint.percent}% of goal`}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
                Water Intake:
              </span>
              <span className="font-black text-white text-sm">
                {dataPoint.amount} {unitLabel}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 border-t-2 border-emerald-500 border-dashed inline-block" />
                Daily Goal:
              </span>
              <span className="text-emerald-400 font-bold">
                {dataPoint.target} {unitLabel}
              </span>
            </div>
          </div>

          <div className="pt-1.5 border-t border-slate-800 text-[10px] flex items-center justify-between">
            <span className="text-slate-400">Target Comparison:</span>
            <span
              className={`font-bold ${
                diffFromTarget >= 0 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {diffFromTarget >= 0
                ? `+${Math.abs(Math.round(diffFromTarget))} ${unitLabel} surplus`
                : `${Math.abs(Math.round(diffFromTarget))} ${unitLabel} to go`}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in">
      
      {/* Top Streak & High-Level Metrics Bento */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-900 dark:to-slate-850 border border-amber-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold text-xs">
            <Flame className="w-4 h-4" />
            <span>Current Streak</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {profile.streak} <span className="text-xs font-semibold text-slate-500">days</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-slate-900 dark:to-slate-850 border border-sky-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-bold text-xs">
            <Award className="w-4 h-4" />
            <span>Best Streak</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {profile.bestStreak || profile.streak} <span className="text-xs font-semibold text-slate-500">days</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-slate-900 dark:to-slate-850 border border-teal-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400 font-bold text-xs">
            <TrendingUp className="w-4 h-4" />
            <span>Daily Average</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 truncate">
            {formatVolumeExact(averageDailyMl, unitSystem)}
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-900 dark:to-slate-850 border border-indigo-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>Goal Hit Rate</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {completionRate}%
          </div>
        </div>

      </div>

      {/* Streak Milestones & Badges Showcase Card */}
      {(() => {
        const { unlockedCount, totalCount, nextStreakMilestone, streakMilestones } = calculateAchievements(profile, logs);
        return (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>Streak Milestones & Badges</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {unlockedCount} of {totalCount} medals earned
                </p>
              </div>

              {onOpenAchievements && (
                <button
                  type="button"
                  onClick={onOpenAchievements}
                  className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-0.5 tap-active"
                >
                  <span>View All Badges</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Next Milestone Challenge Banner */}
            {nextStreakMilestone && (
              <div
                onClick={onOpenAchievements}
                className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-slate-800/80 dark:to-slate-800/40 border border-amber-200/80 dark:border-amber-900/40 rounded-2xl cursor-pointer hover:border-amber-300 dark:hover:border-amber-700 transition-all space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                      <Flame className="w-4 h-4 fill-white" />
                    </div>
                    <div>
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        Next: {nextStreakMilestone.title}
                      </span>
                      <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold ml-1.5">
                        ({nextStreakMilestone.targetValue}-Day Streak)
                      </span>
                    </div>
                  </div>
                  <span className="font-extrabold text-amber-600 dark:text-amber-400">
                    {nextStreakMilestone.progressPercent}%
                  </span>
                </div>

                <div className="w-full bg-amber-200/60 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${nextStreakMilestone.progressPercent}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
                  <span>{nextStreakMilestone.remainingToUnlock} more consecutive days needed</span>
                  <span className="font-semibold text-sky-600 dark:text-sky-400">Tap to inspect</span>
                </p>
              </div>
            )}

            {/* Preview of key streak medals */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              {streakMilestones.slice(0, 4).map(sm => {
                const tier = TIER_CONFIG[sm.tier];
                return (
                  <button
                    key={sm.id}
                    type="button"
                    onClick={onOpenAchievements}
                    className={`p-2 rounded-2xl border text-center transition-all ${
                      sm.unlocked
                        ? 'bg-amber-50/50 dark:bg-slate-800/60 border-amber-200 dark:border-amber-800/60'
                        : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800/40 opacity-70'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center mb-1 ${
                        sm.unlocked
                          ? `bg-gradient-to-tr ${tier.gradient} shadow-xs text-white`
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                      }`}
                    >
                      <Award className="w-4 h-4" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate">
                      {sm.targetValue}d
                    </p>
                    <p className="text-[9px] text-slate-500 truncate">
                      {sm.unlocked ? 'Earned' : `${sm.progressPercent}%`}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* 7-Day Water Consumption Trends vs Daily Goal Line Graph (Recharts) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-sky-500" />
                <span>7-Day Water Consumption Trends vs Daily Goal</span>
              </h3>
              {trendDeltaPercent > 0 ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60">
                  <TrendingUp className="w-3 h-3" />
                  +{trendDeltaPercent}% vs prior week
                </span>
              ) : trendDeltaPercent < 0 ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                  <TrendingDown className="w-3 h-3" />
                  {trendDeltaPercent}% vs prior week
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300">
                  <Activity className="w-3 h-3" />
                  Consistent
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Visual line graph tracking actual water consumption against your daily goal over the last 7 days
            </p>
          </div>

          {/* Graph Controls: Line/Area Toggle, Curve Style & Average Baseline */}
          <div className="flex items-center gap-1.5 flex-wrap self-start sm:self-auto">
            {/* View Mode Toggle: Line Graph vs Filled Area */}
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setTrendViewMode('line')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                  trendViewMode === 'line'
                    ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
                title="Line Graph View"
              >
                <LineChartIcon className="w-3.5 h-3.5" />
                <span>Line</span>
              </button>
              <button
                type="button"
                onClick={() => setTrendViewMode('area')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                  trendViewMode === 'area'
                    ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
                title="Filled Area View"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Area</span>
              </button>
            </div>

            {/* Curve Style: Smooth vs Linear */}
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setTrendCurveType('monotone')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  trendCurveType === 'monotone'
                    ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                Smooth
              </button>
              <button
                type="button"
                onClick={() => setTrendCurveType('linear')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  trendCurveType === 'linear'
                    ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                Linear
              </button>
            </div>

            {/* Average Reference Line Toggle */}
            <button
              type="button"
              onClick={() => setShowAverageLine(!showAverageLine)}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all border ${
                showAverageLine
                  ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-300 dark:border-teal-800 text-teal-700 dark:text-teal-300'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
              }`}
              title="Toggle 7-day average baseline"
            >
              Avg
            </button>
          </div>
        </div>

        {/* 7-Day Trend High-Level Micro Bento */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
              7D Average
            </span>
            <span className="text-sm font-extrabold text-slate-900 dark:text-white">
              {formatVolumeExact(last7DailyAvgMl, unitSystem)}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
              Peak Day
            </span>
            <span className="text-sm font-extrabold text-slate-900 dark:text-white truncate block">
              {peakDay.dayLabel} ({formatVolumeExact(peakDay.amountMl, unitSystem)})
            </span>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
              Goal Met
            </span>
            <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
              {daysMetLast7} / 7 days <span className="text-[10px] font-medium text-slate-400">({Math.round((daysMetLast7 / 7) * 100)}%)</span>
            </span>
          </div>
        </div>

        {/* Recharts Container: Visual Line Graph or Area Graph */}
        <div className="w-full h-64 min-h-[256px] pt-2" style={{ minHeight: '256px', width: '100%' }}>
          <ResponsiveContainer width="100%" height={256} minWidth={0} minHeight={240}>
            {trendViewMode === 'line' ? (
              <LineChart
                data={trend7DaysData}
                margin={{ top: 16, right: 12, left: -18, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#94a3b8"
                  strokeOpacity={0.2}
                />

                <XAxis
                  dataKey="dayLabel"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  dy={6}
                />

                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  domain={[0, yDomainMax]}
                />

                <Tooltip content={renderTrendTooltip} />

                {/* Optional 7-Day Average Reference Line */}
                {showAverageLine && (
                  <ReferenceLine
                    y={displayLast7Avg}
                    stroke="#0d9488"
                    strokeDasharray="3 3"
                    strokeWidth={1.5}
                    label={{
                      value: '7D Avg',
                      position: 'insideTopRight',
                      fill: '#0d9488',
                      fontSize: 10,
                      fontWeight: 700
                    }}
                  />
                )}

                {/* Daily Goal Line (Visual Target Comparison) */}
                <Line
                  type="monotone"
                  dataKey="target"
                  name="Daily Goal"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  dot={renderGoalDot}
                  activeDot={{ r: 5, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
                  isAnimationActive={true}
                />

                {/* Water Intake Consumption Trend Line */}
                <Line
                  type={trendCurveType}
                  dataKey="amount"
                  name="Water Intake"
                  stroke="#0284c7"
                  strokeWidth={3.5}
                  dot={renderIntakeDot}
                  activeDot={{
                    r: 7,
                    fill: '#0284c7',
                    stroke: '#ffffff',
                    strokeWidth: 2
                  }}
                  isAnimationActive={true}
                />
              </LineChart>
            ) : (
              <AreaChart
                data={trend7DaysData}
                margin={{ top: 16, right: 12, left: -18, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="hydrationTrendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#94a3b8"
                  strokeOpacity={0.2}
                />

                <XAxis
                  dataKey="dayLabel"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  dy={6}
                />

                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  domain={[0, yDomainMax]}
                />

                <Tooltip content={renderTrendTooltip} />

                {/* Daily Target Goal Comparison Line */}
                <ReferenceLine
                  y={currentTargetDisplay}
                  stroke="#10b981"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{
                    value: 'Daily Goal',
                    position: 'insideTopLeft',
                    fill: '#10b981',
                    fontSize: 10,
                    fontWeight: 700
                  }}
                />

                {/* 7-Day Average Reference Line */}
                {showAverageLine && (
                  <ReferenceLine
                    y={displayLast7Avg}
                    stroke="#0d9488"
                    strokeDasharray="3 3"
                    strokeWidth={1.5}
                    label={{
                      value: '7D Avg',
                      position: 'insideTopRight',
                      fill: '#0d9488',
                      fontSize: 10,
                      fontWeight: 700
                    }}
                  />
                )}

                <Area
                  type={trendCurveType}
                  dataKey="amount"
                  stroke="#0284c7"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#hydrationTrendGrad)"
                  activeDot={{
                    r: 6,
                    fill: '#0284c7',
                    stroke: '#ffffff',
                    strokeWidth: 2
                  }}
                  isAnimationActive={true}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Visual Line Graph Legend & Comparison Key */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 bg-sky-600 rounded-full inline-block" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Water Consumption (Actual)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 border-t-2 border-emerald-500 border-dashed inline-block" />
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Daily Goal Target</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-900 inline-block" />
            <span>Goal Reached Day</span>
          </div>
          {showAverageLine && (
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 border-t-2 border-teal-600 border-dashed inline-block" />
              <span>7-Day Average Baseline</span>
            </div>
          )}
        </div>
      </div>

      {/* Primary Chart Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Hydration vs Target
            </h3>
            <p className="text-xs text-slate-500">
              Tracking your daily drinking consistency
            </p>
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 text-xs font-bold">
            <button
              onClick={() => setRange('7d')}
              className={`px-3 py-1 rounded-lg transition-all ${
                range === '7d'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setRange('30d')}
              className={`px-3 py-1 rounded-lg transition-all ${
                range === '30d'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              30 Days
            </button>
          </div>
        </div>

        {/* Recharts Bar Container */}
        <div className="w-full h-64 min-h-[256px] pt-2" style={{ minHeight: '256px', width: '100%' }}>
          <ResponsiveContainer width="100%" height={256} minWidth={0} minHeight={240}>
            <BarChart data={chartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="dayLabel"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '16px',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)'
                }}
                formatter={(value: any) => [
                  `${value} ${unitSystem === 'imperial' ? 'fl oz' : 'mL'}`,
                  'Intake'
                ]}
                labelFormatter={label => `Day: ${label}`}
              />
              <ReferenceLine
                y={currentTargetDisplay}
                stroke="#0284c7"
                strokeDasharray="4 4"
                strokeWidth={1.5}
              />
              <Bar dataKey="amount" radius={[8, 8, 4, 4]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isMet ? '#0d9488' : '#0284c7'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-md bg-teal-600" />
            <span>Target Achieved</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-md bg-sky-600" />
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-0.5 border-t-2 border-sky-600 border-dashed" />
            <span>Daily Target Line</span>
          </div>
        </div>
      </div>

      {/* Export & Data Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Data Portability & Management
        </h3>

        {exportFeedback && (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{exportFeedback}</span>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all tap-active"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all tap-active"
          >
            <Download className="w-4 h-4 text-sky-600" />
            <span>Export JSON</span>
          </button>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <span className="text-xs text-slate-500">Need a fresh start?</span>
          <button
            onClick={() => setShowClearConfirm(true)}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Clear All Intake Logs?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              This will remove all recorded water logs and reset streaks on this device. Your profile settings will remain. This cannot be undone.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClearAllHistory();
                  setShowClearConfirm(false);
                }}
                className="flex-1 py-2.5 text-xs font-bold bg-rose-600 text-white rounded-xl shadow-xs"
              >
                Yes, Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Resizing Banner Ad */}
      <BannerAd />

    </div>
  );
};
