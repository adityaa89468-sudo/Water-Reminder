import React, { useState } from 'react';
import {
  Droplet,
  ArrowRight,
  ArrowLeft,
  Check,
  Shield,
  HelpCircle,
  AlertCircle,
  Sparkles,
  Info,
  Clock
} from 'lucide-react';
import {
  UserProfile,
  UnitSystem,
  AgeRange,
  BiologicalSex,
  ActivityLevel,
  Climate,
  PregnancyStatus
} from '../types';
import {
  calculateHydrationTarget,
  kgToLb,
  lbToKg,
  cmToFtIn,
  ftInToCm,
  formatVolumeExact,
  getTargetSafetyWarning
} from '../utils/calculations';
import { translations } from '../i18n/translations';
import { AppTutorial } from './AppTutorial';

interface OnboardingModalProps {
  onComplete: (profile: UserProfile) => void;
  language?: 'en' | 'hi';
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  onComplete,
  language = 'en'
}) => {
  const t = translations[language];
  const [showTutorial, setShowTutorial] = useState<boolean>(true);
  const [step, setStep] = useState<number>(1);

  // Form State
  const [displayName, setDisplayName] = useState('');
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
  const [ageRange, setAgeRange] = useState<AgeRange>('18_30');
  const [sex, setSex] = useState<BiologicalSex>('prefer_not_to_say');
  const [weightKg, setWeightKg] = useState<number>(70);
  const [weightInput, setWeightInput] = useState<string>('70');
  const [heightCm, setHeightCm] = useState<number>(172);
  const [heightFt, setHeightFt] = useState<string>('5');
  const [heightIn, setHeightIn] = useState<string>('8');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [climate, setClimate] = useState<Climate>('normal');
  const [wakeUpTime, setWakeUpTime] = useState('07:00');
  const [bedTime, setBedTime] = useState('22:30');
  const [reminderInterval, setReminderInterval] = useState<number>(90);
  const [pregnancyStatus, setPregnancyStatus] = useState<PregnancyStatus>('none');
  const [hasFluidRestriction, setHasFluidRestriction] = useState<boolean>(false);
  const [hasHealthCondition, setHasHealthCondition] = useState<boolean>(false);
  const [customDoctorTargetMl, setCustomDoctorTargetMl] = useState<string>('2000');
  const [applyActivitySuggestion, setApplyActivitySuggestion] = useState(false);
  const [applyClimateSuggestion, setApplyClimateSuggestion] = useState(false);

  // Calculated Preview
  const preview = calculateHydrationTarget({
    weightKg: weightKg || 70,
    sex,
    ageRange,
    activityLevel,
    climate,
    pregnancyStatus,
    hasFluidRestriction,
    hasHealthCondition,
    applyActivitySuggestion,
    applyClimateSuggestion
  });

  const handleUnitToggle = (newUnit: UnitSystem) => {
    if (newUnit === unitSystem) return;
    setUnitSystem(newUnit);
    if (newUnit === 'imperial') {
      setWeightInput(kgToLb(weightKg).toString());
      const { feet, inches } = cmToFtIn(heightCm);
      setHeightFt(feet.toString());
      setHeightIn(inches.toString());
    } else {
      setWeightInput(weightKg.toString());
    }
  };

  const handleWeightChange = (val: string) => {
    setWeightInput(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      if (unitSystem === 'imperial') {
        setWeightKg(lbToKg(num));
      } else {
        setWeightKg(num);
      }
    }
  };

  const handleFinish = () => {
    let finalTarget = preview.totalSuggestedMl;
    let customSet = false;

    if (hasFluidRestriction || hasHealthCondition) {
      const docTarget = parseInt(customDoctorTargetMl, 10);
      if (!isNaN(docTarget) && docTarget > 0) {
        finalTarget = docTarget;
        customSet = true;
      }
    }

    const newProfile: UserProfile = {
      id: 'local_' + Date.now(),
      firebase_uid: null,
      email: null,
      displayName: displayName.trim() || 'Hydration Friend',
      ageRange,
      sex,
      weightKg: Math.round(weightKg) || 70,
      heightCm: Math.round(heightCm) || 172,
      activityLevel,
      climate,
      wakeUpTime,
      bedTime,
      pregnancyStatus,
      hasFluidRestriction,
      hasHealthCondition,
      unitSystem,
      dailyTargetMl: finalTarget,
      recommendedBaseMl: preview.baseEstimateMl,
      customTargetSet: customSet,
      dayTargetOverrides: {},
      presets: [
        { id: 'p1', name: 'Small Cup', amount: 150, icon: 'cup' },
        { id: 'p2', name: 'Glass', amount: 250, icon: 'glass' },
        { id: 'p3', name: 'Mug', amount: 350, icon: 'mug' },
        { id: 'p4', name: 'Bottle', amount: 500, icon: 'bottle' },
        { id: 'p5', name: 'Flask', amount: 750, icon: 'flask' }
      ],
      reminders: {
        enabled: true,
        mode: 'smart',
        startTime: wakeUpTime,
        endTime: bedTime,
        intervalMinutes: reminderInterval,
        quietHoursEnabled: true,
        quietHoursStart: bedTime,
        quietHoursEnd: wakeUpTime,
        activeDays: [0, 1, 2, 3, 4, 5, 6],
        soundEnabled: true,
        vibrationEnabled: true,
        stopAfterGoalReached: false,
        snoozeMinutes: 15,
        pausedUntilDate: null
      },
      darkMode: false,
      celebrationEnabled: true,
      cloudSyncEnabled: false,
      lastSyncedAt: null,
      language,
      onboardingCompleted: true,
      streak: 0,
      bestStreak: 0,
      totalDrankMl: 0
    };

    onComplete(newProfile);
  };

  if (showTutorial) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <AppTutorial
          onFinish={() => setShowTutorial(false)}
          onSkip={() => setShowTutorial(false)}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-6 my-6">
        
        {/* Step Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <Droplet className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                Step {step} of 4
              </span>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                {step === 1 && 'Welcome & Body Baseline'}
                {step === 2 && 'Activity & Environment'}
                {step === 3 && 'Health & Schedule'}
                {step === 4 && 'Your Hydration Target'}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Quick Tour Link */}
            <button
              type="button"
              onClick={() => setShowTutorial(true)}
              className="text-[11px] font-bold text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
              title="Review App Tutorial"
            >
              Tour
            </button>
            {/* Unit Toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 text-xs font-bold">
              <button
                onClick={() => handleUnitToggle('metric')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  unitSystem === 'metric' ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs' : 'text-slate-500'
                }`}
              >
                Metric
              </button>
              <button
                onClick={() => handleUnitToggle('imperial')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  unitSystem === 'imperial' ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs' : 'text-slate-500'
                }`}
              >
                Imperial
              </button>
            </div>
          </div>
        </div>

        {/* STEP 1: Body Baseline */}
        {step === 1 && (
          <div className="space-y-4 text-xs animate-in fade-in">
            {/* Display Name */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Name (Optional)
              </label>
              <input
                type="text"
                placeholder="How should we address you?"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white"
              />
            </div>

            {/* Age Range */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Age Range
                </label>
                <span className="text-[10px] text-slate-400">Required for adult formula validation</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'under_18' as AgeRange, label: 'Under 18' },
                  { id: '18_30' as AgeRange, label: '18–30' },
                  { id: '31_50' as AgeRange, label: '31–50' },
                  { id: '51_65' as AgeRange, label: '51–65' },
                  { id: 'above_65' as AgeRange, label: '65+' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAgeRange(item.id)}
                    className={`py-2 px-2 rounded-xl font-medium border text-center transition-all ${
                      ageRange === item.id
                        ? 'bg-sky-100 dark:bg-sky-950 border-sky-500 text-sky-700 dark:text-sky-300 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Biological Sex */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Biological Sex
                </label>
                <span className="text-[10px] text-slate-400">Used only for EFSA reference display</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'female' as BiologicalSex, label: 'Female' },
                  { id: 'male' as BiologicalSex, label: 'Male' },
                  { id: 'prefer_not_to_say' as BiologicalSex, label: 'Prefer not to say' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSex(item.id)}
                    className={`py-2 px-1 text-[11px] rounded-xl font-medium border text-center transition-all ${
                      sex === item.id
                        ? 'bg-sky-100 dark:bg-sky-950 border-sky-500 text-sky-700 dark:text-sky-300 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Weight Input (Crucial for calculation) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Body Weight ({unitSystem === 'imperial' ? 'lb' : 'kg'}) *
                </label>
                <span className="text-[10px] text-sky-600 font-medium">Basis: 30 mL/kg</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="20"
                  max="300"
                  step="0.5"
                  value={weightInput}
                  onChange={e => handleWeightChange(e.target.value)}
                  className="w-full text-base font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                  {unitSystem === 'imperial' ? 'lb' : 'kg'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Why we ask: Adult fluid baseline is calculated as weight × 30 mL, rounded to the nearest 50 mL.
              </p>
            </div>

            {/* Height (Stored for completeness and BMI, not multiplied) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Height ({unitSystem === 'imperial' ? 'ft/in' : 'cm'})
                </label>
                <span className="text-[10px] text-slate-400">Profile completeness</span>
              </div>
              {unitSystem === 'metric' ? (
                <input
                  type="number"
                  min="100"
                  max="250"
                  value={heightCm}
                  onChange={e => setHeightCm(Number(e.target.value))}
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Feet"
                    value={heightFt}
                    onChange={e => {
                      setHeightFt(e.target.value);
                      setHeightCm(ftInToCm(Number(e.target.value), Number(heightIn)));
                    }}
                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                  <input
                    type="number"
                    placeholder="Inches"
                    value={heightIn}
                    onChange={e => {
                      setHeightIn(e.target.value);
                      setHeightCm(ftInToCm(Number(heightFt), Number(e.target.value)));
                    }}
                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: Activity & Climate */}
        {step === 2 && (
          <div className="space-y-4 text-xs animate-in fade-in">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Daily Physical Activity
                </label>
                <span className="text-[10px] text-slate-400">Optional adjustment</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'low' as ActivityLevel, title: 'Low / Sedentary', desc: 'Desk work, light walking' },
                  { id: 'moderate' as ActivityLevel, title: 'Moderate (+250 mL)', desc: '30-60m workout / active' },
                  { id: 'high' as ActivityLevel, title: 'High (+500 mL)', desc: 'Athletics or physical labor' },
                  { id: 'custom' as ActivityLevel, title: 'Custom', desc: 'Variable daily routine' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActivityLevel(item.id)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      activityLevel === item.id
                        ? 'bg-sky-100 dark:bg-sky-950 border-sky-500 text-sky-900 dark:text-sky-200 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-[11px]">{item.title}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Current Local Climate
                </label>
                <span className="text-[10px] text-slate-400">Optional adjustment</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'cool' as Climate, title: 'Cool / Temperate', desc: 'Mild indoor environment' },
                  { id: 'normal' as Climate, title: 'Normal / AC', desc: 'Moderate room temp' },
                  { id: 'hot' as Climate, title: 'Hot / Humid (+350 mL)', desc: 'Warm weather / sweating' },
                  { id: 'custom' as Climate, title: 'Custom', desc: 'Seasonal changes' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setClimate(item.id)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      climate === item.id
                        ? 'bg-sky-100 dark:bg-sky-950 border-sky-500 text-sky-900 dark:text-sky-200 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-[11px]">{item.title}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Confirmation Toggles for Activity & Climate Additions */}
            <div className="bg-sky-50/70 dark:bg-slate-800/60 p-3 rounded-2xl border border-sky-100 dark:border-slate-700 space-y-2">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-sky-600" />
                <span>Transparent Confirmation</span>
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
                We never silently increase your target. Check below if you want the app to include activity or weather adjustments:
              </p>
              
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={applyActivitySuggestion}
                  onChange={e => setApplyActivitySuggestion(e.target.checked)}
                  className="rounded-sm text-sky-600 focus:ring-sky-500 w-4 h-4"
                />
                <span className="text-slate-800 dark:text-slate-200 font-medium text-[11px]">
                  Apply activity suggestion (+{activityLevel === 'high' ? 500 : 250} mL)
                </span>
              </label>

              {climate === 'hot' && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyClimateSuggestion}
                    onChange={e => setApplyClimateSuggestion(e.target.checked)}
                    className="rounded-sm text-sky-600 focus:ring-sky-500 w-4 h-4"
                  />
                  <span className="text-slate-800 dark:text-slate-200 font-medium text-[11px]">
                    Apply warm weather suggestion (+350 mL)
                  </span>
                </label>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: Health & Schedule */}
        {step === 3 && (
          <div className="space-y-4 text-xs animate-in fade-in">
            {/* Wake-up and Bedtime */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Daily Wake-up & Sleep Schedule
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 block mb-0.5">Wake up</span>
                  <input
                    type="time"
                    value={wakeUpTime}
                    onChange={e => setWakeUpTime(e.target.value)}
                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block mb-0.5">Bedtime</span>
                  <input
                    type="time"
                    value={bedTime}
                    onChange={e => setBedTime(e.target.value)}
                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Reminder Interval */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Preferred Reminder Interval
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { min: 45, label: '45m' },
                  { min: 60, label: '1 hour' },
                  { min: 90, label: '1.5 hr' },
                  { min: 120, label: '2 hours' }
                ].map(item => (
                  <button
                    key={item.min}
                    type="button"
                    onClick={() => setReminderInterval(item.min)}
                    className={`py-2 rounded-xl font-medium border text-center transition-all ${
                      reminderInterval === item.min
                        ? 'bg-sky-100 dark:bg-sky-950 border-sky-500 text-sky-700 dark:text-sky-300 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pregnancy / Breastfeeding if sex === 'female' */}
            {sex === 'female' && (
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pregnancy or Breastfeeding (Optional)
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'none' as PregnancyStatus, label: 'Neither' },
                    { id: 'pregnant' as PregnancyStatus, label: 'Pregnant' },
                    { id: 'breastfeeding' as PregnancyStatus, label: 'Lactating' }
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPregnancyStatus(item.id)}
                      className={`py-2 px-1 text-[11px] rounded-xl font-medium border text-center transition-all ${
                        pregnancyStatus === item.id
                          ? 'bg-sky-100 dark:bg-sky-950 border-sky-500 text-sky-700 dark:text-sky-300 font-bold'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Health Restriction Check */}
            <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-2xl space-y-2">
              <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Medical Fluid Restrictions</span>
              </span>
              <p className="text-[11px] text-amber-800 dark:text-amber-300">
                Has a doctor advised you to restrict fluids, or do you take diuretics / have kidney, heart, or liver conditions?
              </p>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setHasFluidRestriction(false)}
                  className={`flex-1 py-1.5 rounded-xl border text-xs font-semibold ${
                    !hasFluidRestriction
                      ? 'bg-emerald-100 dark:bg-emerald-950 border-emerald-500 text-emerald-800 dark:text-emerald-300'
                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600'
                  }`}
                >
                  No Restrictions
                </button>
                <button
                  type="button"
                  onClick={() => setHasFluidRestriction(true)}
                  className={`flex-1 py-1.5 rounded-xl border text-xs font-semibold ${
                    hasFluidRestriction
                      ? 'bg-amber-200 dark:bg-amber-900 border-amber-600 text-amber-900 dark:text-amber-100'
                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600'
                  }`}
                >
                  Yes, Restricted
                </button>
              </div>

              {hasFluidRestriction && (
                <div className="pt-2">
                  <label className="block text-[11px] font-bold text-amber-900 dark:text-amber-200 mb-1">
                    Enter Doctor-Prescribed Daily Limit (mL):
                  </label>
                  <input
                    type="number"
                    value={customDoctorTargetMl}
                    onChange={e => setCustomDoctorTargetMl(e.target.value)}
                    className="w-full text-sm font-bold bg-white dark:bg-slate-900 border border-amber-400 rounded-xl px-3 py-1.5 text-slate-900 dark:text-white"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: Target Summary & Transparency */}
        {step === 4 && (
          <div className="space-y-4 text-xs animate-in fade-in">
            <div className="bg-gradient-to-br from-sky-500 to-teal-600 text-white rounded-3xl p-5 shadow-lg text-center space-y-2">
              <span className="text-xs uppercase font-bold tracking-wider text-sky-100">
                Recommended Daily Drinking Target
              </span>
              <div className="text-4xl font-extrabold tracking-tight">
                {hasFluidRestriction ? `${customDoctorTargetMl} mL` : formatVolumeExact(preview.totalSuggestedMl, unitSystem)}
              </div>
              <p className="text-xs text-sky-100">
                {hasFluidRestriction
                  ? 'Doctor-prescribed limit applied.'
                  : `Calculated as ~30 mL per kg (${weightKg} kg × 30 = ${preview.baseEstimateMl} mL).`}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl space-y-2 border border-slate-200 dark:border-slate-700 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Adult Recommended Range:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatVolumeExact(preview.recommendedRangeMinMl, unitSystem)} – {formatVolumeExact(preview.recommendedRangeMaxMl, unitSystem)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">EFSA Reference Total Water:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {preview.sexReferenceValLiters} L / day (food + drinks)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Reminders:</span>
                <span className="font-bold text-sky-600 dark:text-sky-400">
                  Every {reminderInterval}m ({wakeUpTime} to {bedTime})
                </span>
              </div>
            </div>

            {/* Offline-First Privacy Assurance */}
            <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 rounded-2xl flex items-start gap-2.5 text-[11px] text-teal-900 dark:text-teal-200">
              <Shield className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">100% Private & Offline Ready</p>
                <p className="text-teal-800 dark:text-teal-300 mt-0.5">
                  All your data stays safely stored on this device. Google Sign-In is optional for cloud backup.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Actions */}
        <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              if (step > 1) {
                setStep(step - 1);
              } else {
                setShowTutorial(true);
              }
            }}
            className="px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-2xl flex items-center gap-1.5 transition-colors tap-active"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{step > 1 ? 'Back' : 'App Tour'}</span>
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="flex-1 py-3 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-2xl flex items-center justify-center gap-1.5 shadow-md transition-all tap-active"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="flex-1 py-3 text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all tap-active"
            >
              <Check className="w-4 h-4" />
              <span>Start Hydrating</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
