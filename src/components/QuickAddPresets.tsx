import React, { useState } from 'react';
import { Plus, RotateCcw, SlidersHorizontal, X } from 'lucide-react';
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
    <div className="w-full">
      <div className="adaptive-card space-y-4">
        {/* Header with Undo */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Add a Drink
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Choose your drink type and tap a cup size
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {hasLogsToUndo && (
              <button
                type="button"
                onClick={onUndo}
                className="text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-950/50 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl transition-colors tap-active min-h-[38px]"
                title="Undo last entry"
              >
                <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                <span>Undo</span>
              </button>
            )}
            {onManagePresets && (
              <button
                type="button"
                onClick={onManagePresets}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[38px] min-w-[38px] flex items-center justify-center"
                title="Customize cup sizes"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Drink Type Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {ALL_DRINK_TYPES.map(type => {
            const isSelected = selectedDrinkType === type;
            const meta = getDrinkTypeMetadata(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedDrinkType(type)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all tap-active border min-h-[38px] ${
                  isSelected
                    ? `${meta.badgeBg} ${meta.badgeBorder} ${meta.badgeText}`
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

        {/* Cup Presets Grid + Custom Amount Button */}
        <div className="grid grid-cols-2 min-[380px]:grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-2.5">
          {presets.map(preset => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onAddWater(preset.amount, selectedDrinkType)}
              className={`flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl border transition-all duration-150 active:scale-95 min-h-[76px] min-w-0 ${
                selectedDrinkType === 'water'
                  ? 'bg-sky-50/60 hover:bg-sky-100/80 dark:bg-slate-800/80 dark:hover:bg-slate-700 border-sky-200/80 dark:border-slate-700 text-sky-900 dark:text-sky-100'
                  : `${currentMeta.badgeBg} hover:opacity-95 ${currentMeta.badgeBorder} ${currentMeta.badgeText}`
              }`}
              title={`Add ${formatVolumeExact(preset.amount, unitSystem)} of ${currentMeta.shortLabel}`}
            >
              <div className="mb-1.5">
                <DrinkTypeIcon type={selectedDrinkType} className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold leading-tight tabular-nums truncate max-w-full">
                +{formatVolumeExact(preset.amount, unitSystem)}
              </span>
              <span className="text-[11px] opacity-75 truncate max-w-full mt-0.5">
                {preset.name}
              </span>
            </button>
          ))}

          {/* Custom Amount Button */}
          <button
            type="button"
            onClick={() => {
              setCustomAmountInput(unitSystem === 'imperial' ? '8' : '250');
              setShowCustomModal(true);
            }}
            className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-sky-500 dark:hover:border-sky-500 text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition-colors active:scale-95 min-h-[76px] min-w-0"
            title="Enter a custom drink amount"
          >
            <div className="mb-1.5">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold leading-tight">
              Custom
            </span>
            <span className="text-[11px] opacity-75 mt-0.5">
              Any size
            </span>
          </button>
        </div>
      </div>

      {/* Custom Log Dialog */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 w-full max-w-sm shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Add Custom Amount
              </h3>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Amount ({unitSystem === 'imperial' ? 'fl oz' : 'mL'})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max={unitSystem === 'imperial' ? '200' : '5000'}
                    step={unitSystem === 'imperial' ? '0.5' : '10'}
                    value={customAmountInput}
                    onChange={e => setCustomAmountInput(e.target.value)}
                    className="w-full text-2xl font-bold bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-3 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 tabular-nums"
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
                  Drink Type
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
                        className={`p-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 tap-active min-w-0 ${
                          isSelected
                            ? `${meta.badgeBg} ${meta.badgeBorder} ${meta.badgeText}`
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <DrinkTypeIcon type={type} className="w-4 h-4 shrink-0" />
                        <span className="font-bold truncate">{meta.shortLabel}</span>
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
                  placeholder="e.g., After morning walk"
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
                  className="flex-1 py-2.5 text-xs font-bold text-white rounded-xl bg-sky-600 hover:bg-sky-700 transition-colors"
                >
                  Add Drink
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
