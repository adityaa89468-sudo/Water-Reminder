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
  Filter
} from 'lucide-react';
import { WaterLog, UserProfile, UnitSystem, DrinkType } from '../types';
import { formatVolumeExact } from '../utils/calculations';
import { EditLogModal } from './EditLogModal';
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

  const handleShiftDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
    setSelectedCategoryFilter('all');
  };

  const dayLogs = useMemo(() => {
    return logs.filter(l => l.timestamp.startsWith(selectedDate));
  }, [logs, selectedDate]);

  const dayTotalMl = useMemo(() => {
    return dayLogs.reduce((sum, l) => sum + l.amount, 0);
  }, [dayLogs]);

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
    <div className="space-y-5 pb-8 animate-in fade-in">
      
      {/* Date Navigation Strip */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => handleShiftDate(-1)}
          className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 flex items-center justify-center tap-active"
          aria-label="Previous day"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>{isToday ? 'Today' : selectedDateObj.toLocaleDateString(undefined, { weekday: 'long' })}</span>
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
            {selectedDateObj.toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </h2>
        </div>

        <button
          type="button"
          onClick={() => handleShiftDate(1)}
          disabled={isToday}
          className={`w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center tap-active ${
            isToday ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-200'
          }`}
          aria-label="Next day"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Daily Progress Summary Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Drank
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white flex items-baseline gap-1.5 tabular-nums mt-0.5">
              <span>{formatVolumeExact(dayTotalMl, unitSystem)}</span>
              <span className="text-xs font-normal text-slate-400">
                of {formatVolumeExact(dayTargetMl, unitSystem)}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className={`inline-flex items-center gap-1 text-xs font-bold ${
              isTargetMet
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-sky-600 dark:text-sky-400'
            }`}>
              {isTargetMet && <CheckCircle2 className="w-4 h-4" />}
              <span className="tabular-nums">{dayPercent}% of goal</span>
            </span>
          </div>
        </div>

        {/* Simple Progress Bar */}
        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isTargetMet ? 'bg-emerald-500' : 'bg-sky-500'
            }`}
            style={{ width: `${dayPercent}%` }}
          />
        </div>
      </div>

      {/* Drink Categories Breakdown (with Custom Icons) */}
      {dayTotalMl > 0 && categoryBreakdown.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Drinks by Type
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tap a category below to filter your drinks
              </p>
            </div>
            {selectedCategoryFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedCategoryFilter('all')}
                className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
              >
                <Filter className="w-3 h-3" />
                <span>Show all</span>
              </button>
            )}
          </div>

          {/* Segmented Bar */}
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
            {categoryBreakdown.map(cat => {
              if (cat.percent <= 0) return null;
              return (
                <div
                  key={cat.type}
                  style={{ width: `${cat.percent}%` }}
                  className={`h-full transition-all ${cat.meta.barColor}`}
                  title={`${cat.meta.label}: ${formatVolumeExact(cat.amountMl, unitSystem)}`}
                />
              );
            })}
          </div>

          {/* Category Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {categoryBreakdown.map(cat => {
              const isSelected = selectedCategoryFilter === cat.type;

              return (
                <button
                  key={cat.type}
                  type="button"
                  onClick={() =>
                    setSelectedCategoryFilter(prev => (prev === cat.type ? 'all' : cat.type))
                  }
                  className={`p-3 rounded-2xl border transition-all text-left flex items-center gap-3 tap-active ${
                    isSelected
                      ? `${cat.meta.badgeBg} ${cat.meta.badgeBorder} ring-2 ring-sky-500/30`
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800 hover:border-slate-200'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl ${cat.meta.iconBg} ${cat.meta.iconColor} flex items-center justify-center shrink-0`}
                  >
                    <DrinkTypeIcon type={cat.type} className="w-4 h-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white block truncate">
                      {cat.meta.shortLabel}
                    </span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 tabular-nums block">
                      {formatVolumeExact(cat.amountMl, unitSystem)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Drinks List for Selected Date */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Logged Drinks <span className="text-slate-400 font-normal">· {filteredLogs.length}</span>
          </h3>

          <button
            type="button"
            onClick={() => setShowAddForDate(true)}
            className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-800 flex items-center gap-1 px-3 py-1.5 rounded-xl transition-colors tap-active"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Drink</span>
          </button>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="py-10 text-center text-slate-400 dark:text-slate-500 text-xs">
            <Droplet className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
            <p>
              {dayLogs.length === 0
                ? 'No drinks logged on this day.'
                : `No ${selectedCategoryFilter} drinks logged on this day.`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredLogs.map(log => {
              const timeStr = new Date(log.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              });
              const meta = getDrinkTypeMetadata(log.drinkType);

              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between py-3 first:pt-1 last:pb-1"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl ${meta.iconBg} ${meta.iconColor} flex items-center justify-center shrink-0`}
                      title={meta.label}
                    >
                      <DrinkTypeIcon type={log.drinkType} className="w-4 h-4" />
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                          {formatVolumeExact(log.amount, unitSystem)}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300 capitalize">
                          {meta.shortLabel}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 tabular-nums">
                        <Clock className="w-3 h-3" />
                        <span>{timeStr}</span>
                        {log.note && <span className="text-slate-500 dark:text-slate-400">· {log.note}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingLog(log)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 tap-active"
                      title="Edit drink"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteLog(log.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 tap-active"
                      title="Delete drink"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Add Drink for {selectedDate}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Choose the amount and type of drink
              </p>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
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
                  className="w-full text-lg font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white tabular-nums"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Drink Type
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
                            ? `${meta.badgeBg} ${meta.badgeBorder} ${meta.badgeText}`
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
                  className="flex-1 py-2.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl"
                >
                  Save Drink
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
