import React, { useState } from 'react';
import { X, Trash2, Check, Clock } from 'lucide-react';
import { WaterLog, UnitSystem, DrinkType } from '../types';
import { formatVolumeExact, flOzToMl, mlToFlOz } from '../utils/calculations';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
        
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Edit Water Entry
          </h3>
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
              Date & Time
            </label>
            <input
              type="datetime-local"
              value={timestampInput}
              onChange={e => setTimestampInput(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Drink Type
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['water', 'infused', 'tea', 'mineral', 'electrolyte'] as DrinkType[]).map(t => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={`py-1.5 px-2 rounded-xl capitalize font-semibold border ${
                    selectedType === t
                      ? 'bg-sky-100 dark:bg-sky-950 border-sky-500 text-sky-700 dark:text-sky-300'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {t}
                </button>
              ))}
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
              placeholder="e.g. morning glass"
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
              className="p-2.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold shadow-xs flex items-center gap-1"
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
