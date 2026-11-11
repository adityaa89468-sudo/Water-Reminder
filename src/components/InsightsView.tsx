import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';
import {
  Flame,
  Award,
  TrendingUp,
  Trash2,
  CheckCircle2,
  Trophy,
  ChevronRight
} from 'lucide-react';
import { WaterLog, UserProfile, UnitSystem } from '../types';
import { formatVolumeExact, mlToFlOz } from '../utils/calculations';
import { calculateAchievements } from '../utils/achievements';

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
  const [range, setRange] = useState<'7d' | '30d'>('7d');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const dayMap: Record<string, number> = {};
  logs.forEach(l => {
    const dKey = l.timestamp.split('T')[0];
    dayMap[dKey] = (dayMap[dKey] || 0) + l.amount;
  });

  const now = new Date();
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
  const currentTargetDisplay =
    unitSystem === 'imperial'
      ? mlToFlOz(profile.dailyTargetMl)
      : profile.dailyTargetMl;

  const { unlockedCount, totalCount } = calculateAchievements(profile, logs);

  return (
    <div className="space-y-5 pb-8 animate-in fade-in">
      
      {/* Simple Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4">
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold text-xs">
            <Flame className="w-4 h-4" />
            <span>Current Streak</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5 tabular-nums">
            {profile.streak} <span className="text-xs font-normal text-slate-500">days</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4">
          <div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-semibold text-xs">
            <Award className="w-4 h-4" />
            <span>Best Streak</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5 tabular-nums">
            {profile.bestStreak || profile.streak} <span className="text-xs font-normal text-slate-500">days</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4">
          <div className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400 font-semibold text-xs">
            <TrendingUp className="w-4 h-4" />
            <span>Daily Average</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5 truncate tabular-nums">
            {formatVolumeExact(averageDailyMl, unitSystem)}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>Goals Reached</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5 tabular-nums">
            {daysMetTargetCount} <span className="text-xs font-normal text-slate-500">of {numDays} days</span>
          </div>
        </div>

      </div>

      {/* Single Clean Chart Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Your Drinking Progress
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Green bars show days you reached your daily water goal
            </p>
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setRange('7d')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                range === '7d'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={() => setRange('30d')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                range === '30d'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              30 Days
            </button>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="w-full h-64 min-h-[256px] pt-2">
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
                  borderRadius: '14px',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12px'
                }}
                formatter={(value: any) => [
                  `${value} ${unitSystem === 'imperial' ? 'fl oz' : 'mL'}`,
                  'Drank'
                ]}
                labelFormatter={label => `${label}`}
              />
              <ReferenceLine
                y={currentTargetDisplay}
                stroke="#10b981"
                strokeDasharray="4 4"
                strokeWidth={1.5}
              />
              <Bar dataKey="amount" radius={[8, 8, 4, 4]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isMet ? '#10b981' : '#0284c7'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Simple Legend */}
        <div className="flex items-center justify-center gap-5 text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-emerald-500" />
            <span>Goal Reached</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-sky-600" />
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 border-t-2 border-emerald-500 border-dashed" />
            <span>Daily Goal</span>
          </div>
        </div>
      </div>

      {/* Achievements & Badges Link Card */}
      {onOpenAchievements && (
        <button
          type="button"
          onClick={onOpenAchievements}
          className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 flex items-center justify-between hover:border-amber-300 dark:hover:border-amber-700 transition-colors text-left tap-active"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Achievements & Streak Badges
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {unlockedCount} of {totalCount} badges unlocked
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>
      )}

      {/* Simple Reset History Option */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 flex justify-between items-center">
        <span className="text-xs text-slate-500">Want to start fresh?</span>
        <button
          type="button"
          onClick={() => setShowClearConfirm(true)}
          className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear History</span>
        </button>
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Clear All Drink History?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              This will erase all your logged drinks and reset your streak. Your profile settings will stay saved.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearAllHistory();
                  setShowClearConfirm(false);
                }}
                className="flex-1 py-2.5 text-xs font-bold bg-rose-600 text-white rounded-xl"
              >
                Yes, Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
