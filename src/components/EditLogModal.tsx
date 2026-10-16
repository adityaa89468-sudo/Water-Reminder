import React, { useState } from 'react';
import { X, Trash2, Check, Clock } from 'lucide-react';
import { WaterLog, UnitSystem, DrinkType } from '../types';
import { formatVolumeExact, flOzToMl, mlToFlOz } from '../utils/calculations';
import {
  DrinkTypeIcon,
  getDrinkTypeMetadata,
  ALL_DRINK_TYPES
} from '../utils/drinkTypes';

interface EditLogModalProps {
  log: WaterLog;
  unitSystem: UnitSystem;
  onSave: (id: string, amountMl: number, timestamp: string, drinkType: DrinkType, note?: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export const EditLogModal: React.FC<EditLogModalProps> = ({
  log,
  unitSystem,
  onSave,
  onDelete,
  onClose
}) => {
  const initialAmount = unitSystem === 'imperial' ? mlToFlOz(log.amount).toString() : log.amount.toString();
  const [amountInput, setAmountInput] = useState(initialAmount);
  const [selectedType, setSelectedType] = useState<DrinkType>(log.drinkType || 'water');
  const [note, setNote] = useState(log.note || '');

  // Format datetime-local string
  const dateObj = new Date(log.timestamp);
  const formattedTimeStr = dateObj.toISOString().slice(0, 16);
  const [timestampInput, setTimestampInput] = useState(formattedTimeStr);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amountInput);
    if (!val || val <= 0) return;

    const finalMl = unitSystem === 'imperial' ? flOzToMl(val) : Math.round(val);
    const finalDateIso = new Date(timestampInput).toISOString();

    onSave(log.id, finalMl, finalDateIso, selectedType, note.trim() || undefined);
    onClose();
  };

  const selectedMeta = getDrinkTypeMetadata(selectedType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl ${selectedMeta.iconBg} ${selectedMeta.iconColor} flex items-center justify-center`}>
              <DrinkTypeIcon type={selectedType} className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Edit Hydration Entry
              </h3>
              <p className="text-[10px] text-slate-400 capitalize">
                Category: {selectedMeta.label}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Amount ({unitSystem === 'imperial' ? 'fl oz' : 'mL'})
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="5000"
                step={unitSystem === 'imperial' ? '0.5' : '10'}
                value={amountInput}
                onChange={e => setAmountInput(e.target.value)}
                className="w-full text-lg font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                {unitSystem === 'imperial' ? 'fl oz' : 'mL'}
              </span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Date &amp; Time
            </label>
            <input
              type="datetime-local"
              value={timestampInput}
              onChange={e => setTimestampInput(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
              required
            />
          </div>

          {/* Beverage Category Selector with Custom Icons */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Beverage Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {ALL_DRINK_TYPES.map(t => {
                const isSelected = selectedType === t;
                const meta = getDrinkTypeMetadata(t);
                return (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setSelectedType(t)}
                    className={`p-2 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all tap-active ${
                      isSelected
                        ? `${meta.badgeBg} ${meta.badgeBorder} ${meta.badgeText} shadow-xs ring-1 ring-sky-500/30 font-bold`
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <DrinkTypeIcon type={t} className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{meta.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Note (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. morning espresso, green tea"
              maxLength={40}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                onDelete(log.id);
                onClose();
              }}
              className="p-2.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold flex items-center gap-1 tap-active"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold flex items-center gap-1 shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
