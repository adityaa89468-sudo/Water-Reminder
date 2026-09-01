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
  Download,
  FileSpreadsheet,
  Trash2,
  Calendar,
  Sparkles,
  Info,
  CheckCircle2
} from 'lucide-react';
import { WaterLog, UserProfile, UnitSystem } from '../types';
import { formatVolume, formatVolumeExact, mlToFlOz } from '../utils/calculations';
import { BannerAd } from './BannerAd';
import { exportDataAsJSON, exportDataAsCSV } from '../utils/storage';

interface InsightsViewProps {
  logs: WaterLog[];
  profile: UserProfile;
  unitSystem: UnitSystem;
  onClearAllHistory: () => void;
}

export const InsightsView: React.FC<InsightsViewProps> = ({
  logs,
  profile,
  unitSystem,
  onClearAllHistory
}) => {
  const [range, setRange] = useState<'7d' | '30d'>('7d');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Group logs by day key (YYYY-MM-DD)
  const dayMap: Record<string, number> = {};
  logs.forEach(l => {
    const dKey = l.timestamp.split('T')[0];
    dayMap[dKey] = (dayMap[dKey] || 0) + l.amount;
  });

  // Generate date series for the last 7 or 30 days
  const numDays = range === '7d' ? 7 : 30;
  const chartData: Array<{
    date: string;
    dayLabel: string;
    amount: number;
    target: number;
    isMet: boolean;
  }> = [];

  const now = new Date();
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
    const csvStr = exportDataAsCSV(logs);
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `siplumo_intake_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentTargetDisplay =
    unitSystem === 'imperial'
      ? mlToFlOz(profile.dailyTargetMl)
      : profile.dailyTargetMl;

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
        <div className="w-full h-64 pt-2">
          <ResponsiveContainer width="100%" height="100%">
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
