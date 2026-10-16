import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit2,
  Trash2,
  Plus,
  CheckCircle2,
  Droplet,
  FileSpreadsheet,
  Filter,
  PieChart
} from 'lucide-react';
import { WaterLog, UserProfile, UnitSystem, DrinkType } from '../types';
import { formatVolumeExact, formatVolume } from '../utils/calculations';
import { EditLogModal } from './EditLogModal';
import { BannerAd } from './BannerAd';
import { downloadLogsAsCSV } from '../utils/storage';
import {
  DrinkTypeIcon,
  getDrinkTypeMetadata,
  ALL_DRINK_TYPES
} from '../utils/drinkTypes';

interface HistoryViewProps {
  logs: WaterLog[];
  profile: UserProfile;
  unitSystem: UnitSystem;
  onUpdateLog: (id: string, amount: number, timestamp: string, drinkType: DrinkType, note?: string) => void;
  onDeleteLog: (id: string) => void;
  onAddLogForDate: (amount: number, dateIso: string, drinkType?: DrinkType) => void;
  onSetDayTargetOverride?: (dateKey: string, targetMl: number) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  logs,
  profile,
  unitSystem,
  onUpdateLog,
  onDeleteLog,
  onAddLogForDate
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [editingLog, setEditingLog] = useState<WaterLog | null>(null);
  const [showAddForDate, setShowAddForDate] = useState(false);
  const [addAmountInput, setAddAmountInput] = useState('250');
  const [addDrinkType, setAddDrinkType] = useState<DrinkType>('water');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<DrinkType | 'all'>('all');

  // Change selected date
  const handleShiftDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
    setSelectedCategoryFilter('all');
  };

  // Filter logs for selected date
  const dayLogs = useMemo(() => {
    return logs.filter(l => l.timestamp.startsWith(selectedDate));
  }, [logs, selectedDate]);

  const dayTotalMl = useMemo(() => {
    return dayLogs.reduce((sum, l) => sum + l.amount, 0);
  }, [dayLogs]);

  // Target for this specific date
  const dayTargetMl =
    profile.dayTargetOverrides?.[selectedDate] || profile.dailyTargetMl || 2000;
  const dayPercent = Math.min(100, Math.round((dayTotalMl / dayTargetMl) * 100));
  const isTargetMet = dayTotalMl >= dayTargetMl;

  // Beverage Category Breakdown for the day
  const categoryBreakdown = useMemo(() => {
    const map = new Map<DrinkType, { amountMl: number; count: number }>();

    dayLogs.forEach(l => {
      const dt: DrinkType = l.drinkType || 'water';
      const existing = map.get(dt) || { amountMl: 0, count: 0 };
      existing.amountMl += l.amount;
      existing.count += 1;
      map.set(dt, existing);
    });

    return Array.from(map.entries())
      .map(([type, data]) => {
        const meta = getDrinkTypeMetadata(type);
        const percent = dayTotalMl > 0 ? Math.round((data.amountMl / dayTotalMl) * 100) : 0;
        return {
          type,
          meta,
          amountMl: data.amountMl,
          count: data.count,
          percent
        };
      })
      .sort((a, b) => b.amountMl - a.amountMl);
  }, [dayLogs, dayTotalMl]);

  // Time of Day distribution
  const timeOfDay = useMemo(() => {
    const dist = {
      morning: 0, // 05:00 - 11:59
      afternoon: 0, // 12:00 - 16:59
      evening: 0, // 17:00 - 21:59
      night: 0 // 22:00 - 04:59
    };
    dayLogs.forEach(l => {
      const hours = new Date(l.timestamp).getHours();
      if (hours >= 5 && hours < 12) dist.morning += l.amount;
      else if (hours >= 12 && hours < 17) dist.afternoon += l.amount;
      else if (hours >= 17 && hours < 22) dist.evening += l.amount;
      else dist.night += l.amount;
    });
    return dist;
  }, [dayLogs]);

  // Filtered logs based on category pill
  const filteredLogs = useMemo(() => {
    if (selectedCategoryFilter === 'all') return dayLogs;
    return dayLogs.filter(l => (l.drinkType || 'water') === selectedCategoryFilter);
  }, [dayLogs, selectedCategoryFilter]);

  const selectedDateObj = new Date(selectedDate + 'T00:00:00');
  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(addAmountInput, 10);
    if (!isNaN(val) && val > 0) {
      const now = new Date();
      const targetDate = new Date(selectedDate);
      targetDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
      onAddLogForDate(val, targetDate.toISOString(), addDrinkType);
      setShowAddForDate(false);
    }
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in">
      
      {/* Date Navigation Strip */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-sm flex items-center justify-between">
        <button
          onClick={() => handleShiftDate(-1)}
          className="p-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 tap-active"
          aria-label="Previous day"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>{isToday ? 'Today' : selectedDateObj.toLocaleDateString(undefined, { weekday: 'short' })}</span>
          </div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            {selectedDateObj.toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </h2>
        </div>

        <button
          onClick={() => handleShiftDate(1)}
          disabled={isToday}
          className={`p-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 tap-active ${
            isToday ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-200'
          }`}
          aria-label="Next day"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Daily Progress Card */}
      <div className="bg-gradient-to-br from-sky-50 to-teal-50 dark:from-slate-900 dark:to-slate-850 border border-sky-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total Intake
            </span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-baseline gap-1.5">
              <span>{formatVolumeExact(dayTotalMl, unitSystem)}</span>
              <span className="text-xs font-semibold text-slate-500">
                / {formatVolumeExact(dayTargetMl, unitSystem)}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
              isTargetMet
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
            }`}>
              {isTargetMet && <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>{dayPercent}% Met</span>
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-3 bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isTargetMet ? 'bg-emerald-500' : 'bg-gradient-to-r from-sky-500 to-teal-400'
            }`}
            style={{ width: `${dayPercent}%` }}
          />
        </div>
      </div>

      {/* BEVERAGE CATEGORIES VISUALIZATION SECTION */}
      {dayTotalMl > 0 && categoryBreakdown.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <PieChart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Beverage Categories
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Hydration breakdown by drink category
                </p>
              </div>
            </div>

            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {categoryBreakdown.length} {categoryBreakdown.length === 1 ? 'type' : 'types'}
            </span>
          </div>

          {/* Segmented Category Ratio Progress Bar */}
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-2xs">
            {categoryBreakdown.map(cat => {
              if (cat.percent <= 0) return null;
              return (
                <div
                  key={cat.type}
                  style={{ width: `${cat.percent}%` }}
                  className={`h-full transition-all ${cat.meta.barColor}`}
                  title={`${cat.meta.label}: ${cat.percent}% (${formatVolumeExact(cat.amountMl, unitSystem)})`}
                />
              );
            })}
          </div>

          {/* Interactive Category Cards / Filter Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {categoryBreakdown.map(cat => {
              const isSelected = selectedCategoryFilter === cat.type;

              return (
                <button
                  key={cat.type}
                  type="button"
                  onClick={() =>
                    setSelectedCategoryFilter(prev => (prev === cat.type ? 'all' : cat.type))
                  }
                  className={`p-2.5 rounded-2xl border transition-all text-left flex items-start gap-2.5 tap-active group relative ${
                    isSelected
                      ? `${cat.meta.badgeBg} ${cat.meta.badgeBorder} ring-2 ring-sky-500/30 shadow-xs`
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                  }`}
                  title={`Filter by ${cat.meta.label}`}
                >
                  {/* Category Custom Icon */}
                  <div
                    className={`w-8 h-8 rounded-xl ${cat.meta.iconBg} ${cat.meta.iconColor} flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}
                  >
                    <DrinkTypeIcon type={cat.type} className="w-4 h-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {cat.meta.shortLabel}
                      </span>
                      <span className="text-[10px] font-extrabold text-slate-400 tabular-nums">
                        {cat.percent}%
                      </span>
                    </div>

                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-100 tabular-nums">
                        {formatVolumeExact(cat.amountMl, unitSystem)}
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-400 block truncate">
                      {cat.count} {cat.count === 1 ? 'log' : 'logs'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Filter Indicator */}
          {selectedCategoryFilter !== 'all' && (
            <div className="flex items-center justify-between p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-xs text-sky-800 dark:text-sky-300">
              <div className="flex items-center gap-1.5 font-semibold">
                <Filter className="w-3.5 h-3.5" />
                <span>Filtered by: <span className="capitalize font-bold">{selectedCategoryFilter}</span></span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCategoryFilter('all')}
                className="text-[11px] font-bold underline hover:text-sky-950 dark:hover:text-white"
              >
                Clear filter
              </button>
            </div>
          )}
        </div>
      )}

      {/* Time of Day Distribution */}
      {dayTotalMl > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Time of Day Distribution
          </h3>
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 block">Morning</span>
              <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                {formatVolumeExact(timeOfDay.morning, unitSystem)}
              </span>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 block">Afternoon</span>
              <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                {formatVolumeExact(timeOfDay.afternoon, unitSystem)}
              </span>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 block">Evening</span>
              <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                {formatVolumeExact(timeOfDay.evening, unitSystem)}
              </span>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 block">Night</span>
              <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                {formatVolumeExact(timeOfDay.night, unitSystem)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Logs List for this day */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Intake Logs ({filteredLogs.length})
            </h3>
            {selectedCategoryFilter !== 'all' && (
              <span className="text-[10px] bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold px-1.5 py-0.2 rounded">
                Filtered
              </span>
            )}
          </div>

          <button
            onClick={() => setShowAddForDate(true)}
            className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-50 dark:bg-slate-800 tap-active"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Log</span>
          </button>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
            <Droplet className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <p>
              {dayLogs.length === 0
                ? 'No water recorded for this date yet.'
                : `No ${selectedCategoryFilter} entries found for this date.`}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredLogs.map(log => {
              const timeStr = new Date(log.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              });
              const meta = getDrinkTypeMetadata(log.drinkType);

              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800 hover:border-slate-200 transition-all"
                >
                  <div className="flex items-center gap-3">
                    {/* Custom Drink Icon */}
                    <div
                      className={`w-9 h-9 rounded-xl ${meta.iconBg} ${meta.iconColor} flex items-center justify-center shrink-0 shadow-2xs`}
                      title={meta.label}
                    >
                      <DrinkTypeIcon type={log.drinkType} className="w-4 h-4" />
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {formatVolumeExact(log.amount, unitSystem)}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder} capitalize`}
                        >
                          {meta.shortLabel}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{timeStr}</span>
                        {log.note && <span className="italic ml-1 text-slate-600 dark:text-slate-400">— {log.note}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingLog(log)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 tap-active"
                      title="Edit entry"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteLog(log.id)}
                      className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 tap-active"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CSV Export for Health Record Keeping */}
      {logs.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Health Record Keeping
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Export all {logs.length} intake entries to spreadsheet
              </p>
            </div>
          </div>
          <button
            onClick={() => downloadLogsAsCSV(logs)}
            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-colors tap-active border border-emerald-200/60 dark:border-emerald-800/60"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>
        </div>
      )}

      {/* Edit Log Modal */}
      {editingLog && (
        <EditLogModal
          log={editingLog}
          unitSystem={unitSystem}
          onSave={onUpdateLog}
          onDelete={onDeleteLog}
          onClose={() => setEditingLog(null)}
        />
      )}

      {/* Quick Add Log for Date Dialog */}
      {showAddForDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Log Entry for {selectedDate}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Select volume and beverage category
                </p>
              </div>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Amount ({unitSystem === 'imperial' ? 'fl oz' : 'mL'})
                </label>
                <input
                  type="number"
                  min="10"
                  max="5000"
                  step={unitSystem === 'imperial' ? '0.5' : '10'}
                  value={addAmountInput}
                  onChange={e => setAddAmountInput(e.target.value)}
                  className="w-full text-lg font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  required
                  autoFocus
                />
              </div>

              {/* Drink Type Selector with Custom Icons */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Beverage Type
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {ALL_DRINK_TYPES.map(type => {
                    const isSelected = addDrinkType === type;
                    const meta = getDrinkTypeMetadata(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setAddDrinkType(type)}
                        className={`p-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all tap-active ${
                          isSelected
                            ? `${meta.badgeBg} ${meta.badgeBorder} ${meta.badgeText} ring-2 ring-sky-500/30`
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <DrinkTypeIcon type={type} className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{meta.shortLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForDate(false)}
                  className="flex-1 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-xs"
                >
                  Add Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auto-Resizing Banner Ad */}
      <BannerAd />

    </div>
  );
};
