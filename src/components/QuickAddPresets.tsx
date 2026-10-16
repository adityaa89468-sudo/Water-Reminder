import React, { useState } from 'react';
import { Plus, RotateCcw, SlidersHorizontal, Check, X } from 'lucide-react';
import { GlassPreset, UnitSystem, DrinkType } from '../types';
import { formatVolumeExact, flOzToMl } from '../utils/calculations';
import {
  DrinkTypeIcon,
  getDrinkTypeMetadata,
  ALL_DRINK_TYPES
} from '../utils/drinkTypes';

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

  const currentMeta = getDrinkTypeMetadata(selectedDrinkType);

  return (
    <div className="w-full space-y-4">
      {/* Primary Presets Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-3">
        
        {/* Header with Undo & Manage */}
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Quick Log Presets
            </h3>
            <p className="text-[11px] text-slate-400">
              Logging as: <span className="font-bold capitalize text-slate-700 dark:text-slate-200">{currentMeta.label}</span>
            </p>
          </div>

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

        {/* Drink Type Quick Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {ALL_DRINK_TYPES.map(type => {
            const isSelected = selectedDrinkType === type;
            const meta = getDrinkTypeMetadata(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedDrinkType(type)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all tap-active border ${
                  isSelected
                    ? `${meta.badgeBg} ${meta.badgeBorder} ${meta.badgeText} shadow-xs ring-1 ring-sky-500/30`
                    : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
                title={`Log as ${meta.label}`}
              >
                <DrinkTypeIcon type={type} className="w-3.5 h-3.5 shrink-0" />
                <span>{meta.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* User Presets Grid with Dynamic Custom Drink Icon */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {presets.map(preset => (
            <button
              key={preset.id}
              onClick={() => onAddWater(preset.amount, selectedDrinkType)}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-150 shadow-xs active:scale-95 min-h-[76px] ${
                selectedDrinkType === 'water'
                  ? 'bg-sky-50/70 hover:bg-sky-100/90 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 border-sky-100 dark:border-slate-700 text-sky-900 dark:text-sky-100'
                  : `${currentMeta.badgeBg} hover:opacity-95 ${currentMeta.badgeBorder} ${currentMeta.badgeText}`
              }`}
              title={`Log ${formatVolumeExact(preset.amount, unitSystem)} of ${currentMeta.shortLabel}`}
            >
              <div className="mb-1">
                <DrinkTypeIcon type={selectedDrinkType} className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold leading-tight">
                {formatVolumeExact(preset.amount, unitSystem)}
              </span>
              <span className="text-[10px] opacity-75 truncate max-w-full">
                {preset.name}
              </span>
            </button>
          ))}
        </div>

        {/* Quick Sizes & Custom Button */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-2">
          {standardQuickButtons.map((btn, idx) => (
            <button
              key={idx}
              onClick={() => onAddWater(btn.ml, selectedDrinkType)}
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
            className="flex-1 py-2 px-3 text-xs font-bold rounded-xl bg-gradient-to-r from-sky-600 via-indigo-600 to-teal-600 text-white hover:opacity-95 shadow-xs transition-all tap-active flex items-center justify-center gap-1 min-h-[40px]"
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

              {/* Drink Type Selector with Custom Icons */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Beverage Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ALL_DRINK_TYPES.map(type => {
                    const isSelected = selectedDrinkType === type;
                    const meta = getDrinkTypeMetadata(type);
                    return (
                      <button
                        type="button"
                        key={type}
                        onClick={() => setSelectedDrinkType(type)}
                        className={`p-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 tap-active ${
                          isSelected
                            ? `${meta.badgeBg} ${meta.badgeBorder} ${meta.badgeText} shadow-xs ring-2 ring-sky-500/30`
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-lg ${meta.iconBg} ${meta.iconColor} flex items-center justify-center shrink-0`}>
                          <DrinkTypeIcon type={type} className="w-3.5 h-3.5" />
                        </div>
                        <div className="text-left min-w-0">
                          <span className="font-bold block truncate">{meta.shortLabel}</span>
                          <span className="text-[9px] text-slate-400 block truncate">{meta.category}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Morning espresso, fresh orange juice"
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
