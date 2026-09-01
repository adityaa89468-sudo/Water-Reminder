import React, { useState } from 'react';
import { X, BookOpen, AlertTriangle, ShieldCheck, RefreshCw, Edit3, HelpCircle, Check } from 'lucide-react';
import { UserProfile, UnitSystem } from '../types';
import {
  calculateHydrationTarget,
  formatVolumeExact,
  getTargetSafetyWarning,
  REVIEW_DATE
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5 my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Why this daily target?
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Transparent calculation & science breakdown
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Target Display */}
        <div className="bg-gradient-to-r from-sky-50 to-teal-50 dark:from-sky-950/40 dark:to-teal-950/40 border border-sky-200/70 dark:border-sky-800/60 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300">
              Your Daily Target
            </span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-baseline gap-1.5">
              <span>{formatVolumeExact(profile.dailyTargetMl, unitSystem)}</span>
              {profile.customTargetSet && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  Custom Set
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditingCustom ? (
              <button
                onClick={() => {
                  setCustomInput(profile.dailyTargetMl.toString());
                  setIsEditingCustom(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1 tap-active"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Change</span>
              </button>
            ) : null}
            {profile.customTargetSet && (
              <button
                onClick={handleResetToCalculated}
                className="px-3 py-1.5 rounded-xl bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 text-xs font-bold hover:bg-sky-200 dark:hover:bg-sky-900 flex items-center gap-1 tap-active"
                title="Reset to calculated formula"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Custom Edit Form */}
        {isEditingCustom && (
          <form onSubmit={handleSaveCustom} className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl space-y-3 border border-slate-200 dark:border-slate-700">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Enter Custom Daily Target (in mL)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="500"
                max="6000"
                step="50"
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                className="flex-1 text-base font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                required
              />
              <button
                type="submit"
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs"
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

        {/* Safety Warning if target is out of normal range */}
        {safetyCheck.isWarning && (
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>{safetyCheck.message}</p>
          </div>
        )}

        {/* Special Health Condition Alert */}
        {breakdown.hasSpecialMedicalNotice && (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Medical Consideration Notice</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-800 dark:text-rose-300">
              {breakdown.medicalNoticeReason.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
            <p className="text-[11px] font-medium pt-1">
              Please use the custom target input above to set the exact fluid volume prescribed by your physician.
            </p>
          </div>
        )}

        {/* Transparent Step-by-Step Formula */}
        <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Formula & Methodology
          </h4>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl space-y-2 border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-600 dark:text-slate-400">Your Body Weight:</span>
              <span className="font-bold text-slate-900 dark:text-white">{profile.weightKg} kg</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-600 dark:text-slate-400">Baseline Rate (30 mL/kg):</span>
              <span className="font-bold text-sky-600 dark:text-sky-400">
                {formatVolumeExact(breakdown.baseEstimateMl, unitSystem)}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-600 dark:text-slate-400">Recommended Adult Range (25-35 mL/kg):</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {formatVolumeExact(breakdown.recommendedRangeMinMl, unitSystem)} – {formatVolumeExact(breakdown.recommendedRangeMaxMl, unitSystem)}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-600 dark:text-slate-400">Activity & Climate:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">
                {profile.activityLevel} activity, {profile.climate} climate
              </span>
            </div>
          </div>

          {/* Reference vs Drinking Water Clarity */}
          <div className="p-3 bg-sky-50/50 dark:bg-slate-800/40 rounded-2xl border border-sky-100 dark:border-slate-800 text-[11px] space-y-1.5 leading-relaxed text-slate-600 dark:text-slate-300">
            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-sky-600" />
              <span>Drinking Water vs. Total Fluid Intake</span>
            </div>
            <p>{breakdown.sexReferenceText}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              * Note: About 20-30% of total hydration comes from moisture in foods (fruits, vegetables, soups). SipLumo tracks your direct drinking water target.
            </p>
          </div>
        </div>

        {/* Source and Review Date */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>Guidance reviewed: {REVIEW_DATE}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl shadow-xs"
          >
            Got it
          </button>
        </div>

      </div>
    </div>
  );
};
