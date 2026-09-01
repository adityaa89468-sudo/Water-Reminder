import React, { useState } from 'react';
import { Plus, RotateCcw, CupSoda, Coffee, Sparkles, Check, X, SlidersHorizontal } from 'lucide-react';
import { GlassPreset, UnitSystem, DrinkType } from '../types';
import { formatVolumeExact, flOzToMl, mlToFlOz } from '../utils/calculations';

interface QuickAddPresetsProps {
  presets: GlassPreset[];
  unitSystem: UnitSystem;
  onAddWater: (amountMl: number, drinkType?: DrinkType, note?: string) => void;
  onUndo: () => void;
  hasLogsToUndo: boolean;
  onManagePresets?: () => void;
}

export const QuickAddPresets: React.FC<QuickAddPresetsProps> = ({
  presets,
  unitSystem,
  onAddWater,
  onUndo,
  hasLogsToUndo,
  onManagePresets
}) => {
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customAmountInput, setCustomAmountInput] = useState<string>('250');
  const [selectedDrinkType, setSelectedDrinkType] = useState<DrinkType>('water');
  const [customNote, setCustomNote] = useState<string>('');

  const standardQuickButtons = [
    { label: unitSystem === 'imperial' ? '3.4 oz' : '+100 mL', ml: 100 },
    { label: unitSystem === 'imperial' ? '6.8 oz' : '+200 mL', ml: 200 },
    { label: unitSystem === 'imperial' ? '8.5 oz' : '+250 mL', ml: 250 },
    { label: unitSystem === 'imperial' ? '16.9 oz' : '+500 mL', ml: 500 }
  ];

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(customAmountInput);
    if (!val || val <= 0) return;

    const finalMl = unitSystem === 'imperial' ? flOzToMl(val) : Math.round(val);
    onAddWater(finalMl, selectedDrinkType, customNote.trim() || undefined);
    setShowCustomModal(false);
    setCustomNote('');
  };

  return (
    <div className="w-full space-y-4">
      {/* Primary Presets Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Quick Log Presets
          </h3>
          <div className="flex items-center gap-1">
            {hasLogsToUndo && (
              <button
                onClick={onUndo}
                className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 inline-flex items-center gap-1 px-2.5 py-1 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors tap-active"
                title="Undo last entry"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>
            )}
            {onManagePresets && (
              <button
                onClick={onManagePresets}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Customize presets"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* User Presets Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {presets.map(preset => (
            <button
              key={preset.id}
              onClick={() => onAddWater(preset.amount, 'water')}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-sky-50/70 hover:bg-sky-100/90 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 border border-sky-100 dark:border-slate-700 text-sky-900 dark:text-sky-100 transition-all duration-150 shadow-xs active:scale-95 min-h-[76px]"
            >
              <CupSoda className="w-5 h-5 text-sky-600 dark:text-sky-400 mb-1" />
              <span className="text-xs font-bold leading-tight">
                {formatVolumeExact(preset.amount, unitSystem)}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-full">
                {preset.name}
              </span>
            </button>
          ))}
        </div>

        {/* Quick Sizes & Custom Button */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-2">
          {standardQuickButtons.map((btn, idx) => (
            <button
              key={idx}
              onClick={() => onAddWater(btn.ml, 'water')}
              className="flex-1 py-2 px-2.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors tap-active min-h-[40px]"
            >
              {btn.label}
            </button>
          ))}
          <button
            onClick={() => {
              setCustomAmountInput(unitSystem === 'imperial' ? '8' : '250');
              setShowCustomModal(true);
            }}
            className="flex-1 py-2 px-3 text-xs font-bold rounded-xl bg-gradient-to-r from-sky-600 to-teal-600 text-white hover:from-sky-700 hover:to-teal-700 shadow-xs transition-all tap-active flex items-center justify-center gap-1 min-h-[40px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Custom</span>
          </button>
        </div>
      </div>

      {/* Custom Log Dialog */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Log Custom Amount
              </h3>
              <button
                onClick={() => setShowCustomModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Volume ({unitSystem === 'imperial' ? 'fl oz' : 'mL'})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max={unitSystem === 'imperial' ? '200' : '5000'}
                    step={unitSystem === 'imperial' ? '0.5' : '10'}
                    value={customAmountInput}
                    onChange={e => setCustomAmountInput(e.target.value)}
                    className="w-full text-2xl font-bold bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-3 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    autoFocus
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                    {unitSystem === 'imperial' ? 'fl oz' : 'mL'}
                  </span>
                </div>
              </div>

              {/* Drink Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Beverage Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['water', 'infused', 'tea', 'mineral', 'electrolyte'] as DrinkType[]).map(type => (
                    <button
                      type="button"
                      key={type}
                      onClick={() => setSelectedDrinkType(type)}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold capitalize border transition-all ${
                        selectedDrinkType === type
                          ? 'bg-sky-100 dark:bg-sky-950 border-sky-500 text-sky-700 dark:text-sky-300'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Post-workout, with lunch"
                  maxLength={50}
                  value={customNote}
                  onChange={e => setCustomNote(e.target.value)}
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="flex-1 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-bold text-white rounded-xl bg-sky-600 hover:bg-sky-700 shadow-md transition-colors"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
