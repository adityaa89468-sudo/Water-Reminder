import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit2,
  Trash2,
  Plus,
  CupSoda,
  CheckCircle2,
  Coffee,
  Sparkles,
  Droplet
} from 'lucide-react';
import { WaterLog, UserProfile, UnitSystem, DrinkType } from '../types';
import { formatVolumeExact } from '../utils/calculations';
import { EditLogModal } from './EditLogModal';
import { BannerAd } from './BannerAd';

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
  onAddLogForDate,
  onSetDayTargetOverride
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [editingLog, setEditingLog] = useState<WaterLog | null>(null);
  const [showAddForDate, setShowAddForDate] = useState(false);
  const [addAmountInput, setAddAmountInput] = useState('250');

  // Change selected date
  const handleShiftDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Filter logs for selected date
  const dayLogs = logs.filter(l => l.timestamp.startsWith(selectedDate));
  const dayTotalMl = dayLogs.reduce((sum, l) => sum + l.amount, 0);

  // Target for this specific date
  const dayTargetMl =
    profile.dayTargetOverrides?.[selectedDate] || profile.dailyTargetMl || 2000;
  const dayPercent = Math.min(100, Math.round((dayTotalMl / dayTargetMl) * 100));
  const isTargetMet = dayTotalMl >= dayTargetMl;

  // Time of Day distribution
  const timeOfDay = {
    morning: 0, // 05:00 - 11:59
    afternoon: 0, // 12:00 - 16:59
    evening: 0, // 17:00 - 21:59
    night: 0 // 22:00 - 04:59
  };

  dayLogs.forEach(l => {
    const hours = new Date(l.timestamp).getHours();
    if (hours >= 5 && hours < 12) timeOfDay.morning += l.amount;
    else if (hours >= 12 && hours < 17) timeOfDay.afternoon += l.amount;
    else if (hours >= 17 && hours < 22) timeOfDay.evening += l.amount;
    else timeOfDay.night += l.amount;
  });

  const selectedDateObj = new Date(selectedDate + 'T00:00:00');
  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(addAmountInput, 10);
    if (!isNaN(val) && val > 0) {
      const now = new Date();
      const targetDate = new Date(selectedDate);
      targetDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
      onAddLogForDate(val, targetDate.toISOString(), 'water');
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
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Intake Logs ({dayLogs.length})
          </h3>
          <button
            onClick={() => setShowAddForDate(true)}
            className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-50 dark:bg-slate-800"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Log</span>
          </button>
        </div>

        {dayLogs.length === 0 ? (
          <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
            <Droplet className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <p>No water recorded for this date yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {dayLogs.map(log => {
              const timeStr = new Date(log.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800 hover:border-slate-200 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-600 dark:text-sky-400">
                      <CupSoda className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {formatVolumeExact(log.amount, unitSystem)}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 capitalize">
                          • {log.drinkType}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{timeStr}</span>
                        {log.note && <span className="italic ml-1">— {log.note}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingLog(log)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700"
                      title="Edit entry"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteLog(log.id)}
                      className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-xs shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Log for {selectedDate}
            </h3>
            <form onSubmit={handleAddSubmit} className="space-y-3">
              <input
                type="number"
                min="10"
                max="2000"
                step="10"
                value={addAmountInput}
                onChange={e => setAddAmountInput(e.target.value)}
                className="w-full text-lg font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                required
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForDate(false)}
                  className="flex-1 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold bg-sky-600 text-white rounded-xl shadow-xs"
                >
                  Add
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
