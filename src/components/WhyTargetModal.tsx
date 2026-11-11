import React, { useState } from 'react';
import { X, Droplet, AlertTriangle, RefreshCw, Edit3, Check } from 'lucide-react';
import { UserProfile, UnitSystem } from '../types';
import {
  calculateHydrationTarget,
  formatVolumeExact,
  getTargetSafetyWarning
} from '../utils/calculations';

interface WhyTargetModalProps {
  profile: UserProfile;
  onClose: () => void;
  onUpdateTarget: (newTargetMl: number, isCustom: boolean) => void;
  unitSystem: UnitSystem;
}

export const WhyTargetModal: React.FC<WhyTargetModalProps> = ({
  profile,
  onClose,
  onUpdateTarget,
  unitSystem
}) => {
  const breakdown = calculateHydrationTarget({
    weightKg: profile.weightKg,
    sex: profile.sex,
    ageRange: profile.ageRange,
    activityLevel: profile.activityLevel,
    climate: profile.climate,
    pregnancyStatus: profile.pregnancyStatus,
    hasFluidRestriction: profile.hasFluidRestriction,
    hasHealthCondition: profile.hasHealthCondition
  });

  const [isEditingCustom, setIsEditingCustom] = useState(false);
  const [customInput, setCustomInput] = useState(profile.dailyTargetMl.toString());
  const safetyCheck = getTargetSafetyWarning(profile.dailyTargetMl);

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customInput, 10);
    if (!isNaN(val) && val > 0) {
      onUpdateTarget(val, true);
      setIsEditingCustom(false);
    }
  };

  const handleResetToCalculated = () => {
    onUpdateTarget(breakdown.baseEstimateMl, false);
    setIsEditingCustom(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5 my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Droplet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Your Daily Water Goal
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personalized for your body and daily routine
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Target Display */}
        <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block">
              Current Daily Goal
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white flex items-baseline gap-2 tabular-nums mt-0.5">
              <span>{formatVolumeExact(profile.dailyTargetMl, unitSystem)}</span>
              {profile.customTargetSet && (
                <span className="text-xs font-medium text-sky-600 dark:text-sky-400">
                  · Custom
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditingCustom && (
              <button
                type="button"
                onClick={() => {
                  setCustomInput(profile.dailyTargetMl.toString());
                  setIsEditingCustom(true);
                }}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 flex items-center gap-1.5 tap-active"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Change</span>
              </button>
            )}
            {profile.customTargetSet && (
              <button
                type="button"
                onClick={handleResetToCalculated}
                className="px-3 py-2 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-xs font-semibold hover:bg-sky-100 flex items-center gap-1 tap-active"
                title="Reset to recommended goal"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Custom Edit Form */}
        {isEditingCustom && (
          <form onSubmit={handleSaveCustom} className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl space-y-3 border border-slate-200 dark:border-slate-700">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Set Your Own Daily Goal (in mL)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="500"
                max="6000"
                step="50"
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                className="flex-1 text-base font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white tabular-nums"
                required
              />
              <button
                type="submit"
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditingCustom(false)}
                className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Safety Warning if target is unusually high or low */}
        {safetyCheck.isWarning && (
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{safetyCheck.message}</p>
          </div>
        )}

        {/* Simple, Human Explanation */}
        <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <h4 className="font-bold text-slate-900 dark:text-white">
            How we suggest your goal
          </h4>
          <p>
            Your recommended goal is tailored to your body weight, how active you are during the day, and your local weather.
          </p>
          <p>
            On warmer days or days when you exercise more, your body naturally needs a little extra water to stay refreshed and energized.
          </p>
        </div>

        {/* Done Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Done</span>
          </button>
        </div>

      </div>
    </div>
  );
};
