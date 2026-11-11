import React, { useState } from 'react';
import {
  Droplet,
  ArrowRight,
  ArrowLeft,
  Check
} from 'lucide-react';
import {
  UserProfile,
  UnitSystem,
  ActivityLevel,
  Climate
} from '../types';
import {
  calculateRecommendedIntake,
  kgToLb,
  lbToKg,
  formatVolumeExact
} from '../utils/calculations';

interface OnboardingModalProps {
  onComplete: (profile: UserProfile) => void;
  language?: 'en' | 'hi';
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  onComplete,
  language = 'en'
}) => {
  const [step, setStep] = useState<number>(1);

  const [displayName, setDisplayName] = useState('');
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
  const [weightKg, setWeightKg] = useState<number>(70);
  const [weightInput, setWeightInput] = useState<string>('70');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [climate, setClimate] = useState<Climate>('normal');
  const [wakeUpTime, setWakeUpTime] = useState('07:30');
  const [bedTime, setBedTime] = useState('22:00');
  const [reminderInterval, setReminderInterval] = useState<number>(90);

  const recommendation = calculateRecommendedIntake(weightKg || 70, activityLevel, climate);

  const handleUnitToggle = (newUnit: UnitSystem) => {
    if (newUnit === unitSystem) return;
    setUnitSystem(newUnit);
    if (newUnit === 'imperial') {
      setWeightInput(kgToLb(weightKg).toString());
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
    const newProfile: UserProfile = {
      id: 'local_' + Date.now(),
      firebase_uid: null,
      email: null,
      displayName: displayName.trim() || 'Hydration Friend',
      ageRange: '18_30',
      sex: 'prefer_not_to_say',
      weightKg: Math.round(weightKg) || 70,
      heightCm: 172,
      activityLevel,
      climate,
      wakeUpTime,
      bedTime,
      pregnancyStatus: 'none',
      hasFluidRestriction: false,
      hasHealthCondition: false,
      unitSystem,
      dailyTargetMl: recommendation.totalSuggestedMl,
      recommendedBaseMl: recommendation.baseMl,
      customTargetSet: false,
      dayTargetOverrides: {},
      presets: [
        { id: 'p1', name: 'Small Cup', amount: 150, icon: 'cup' },
        { id: 'p2', name: 'Glass', amount: 250, icon: 'glass' },
        { id: 'p3', name: 'Mug', amount: 350, icon: 'mug' },
        { id: 'p4', name: 'Bottle', amount: 500, icon: 'bottle' },
        { id: 'p5', name: 'Large Flask', amount: 750, icon: 'flask' }
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-6 my-6">
        
        {/* Step Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-sm">
              <Droplet className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
                Step {step} of 2
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {step === 1 ? 'Welcome to SipLumo' : 'Your Daily Goal'}
              </h2>
            </div>
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleUnitToggle('metric')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                unitSystem === 'metric' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
              }`}
            >
              mL / kg
            </button>
            <button
              type="button"
              onClick={() => handleUnitToggle('imperial')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                unitSystem === 'imperial' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
              }`}
            >
              oz / lb
            </button>
          </div>
        </div>

        {/* STEP 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4 text-xs animate-in fade-in">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Your Name (Optional)
              </label>
              <input
                type="text"
                placeholder="What should we call you?"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Your Weight ({unitSystem === 'imperial' ? 'lb' : 'kg'})
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="20"
                  max="300"
                  step="1"
                  value={weightInput}
                  onChange={e => handleWeightChange(e.target.value)}
                  className="w-full text-base font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white tabular-nums"
                  required
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">
                  {unitSystem === 'imperial' ? 'lb' : 'kg'}
                </span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Daily Activity
              </label>
              <div className="grid grid-cols-1 min-[380px]:grid-cols-3 gap-2">
                {[
                  { id: 'low' as ActivityLevel, title: 'Light', desc: 'Mostly sitting' },
                  { id: 'moderate' as ActivityLevel, title: 'Moderate', desc: 'Daily walks' },
                  { id: 'high' as ActivityLevel, title: 'Active', desc: 'Regular sports' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActivityLevel(item.id)}
                    className={`p-3 rounded-2xl border text-left transition-all min-w-0 ${
                      activityLevel === item.id
                        ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 text-sky-900 dark:text-sky-200'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs truncate">{item.title}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Local Weather
              </label>
              <div className="grid grid-cols-1 min-[380px]:grid-cols-3 gap-2">
                {[
                  { id: 'cool' as Climate, title: 'Cold', desc: 'Chilly' },
                  { id: 'normal' as Climate, title: 'Temperate', desc: 'Mild' },
                  { id: 'hot' as Climate, title: 'Hot', desc: 'Warm / Humid' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setClimate(item.id)}
                    className={`p-3 rounded-2xl border text-left transition-all min-w-0 ${
                      climate === item.id
                        ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 text-sky-900 dark:text-sky-200'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs truncate">{item.title}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Goal Summary & Reminder Schedule */}
        {step === 2 && (
          <div className="space-y-5 text-xs animate-in fade-in">
            <div className="bg-sky-600 text-white rounded-3xl p-5 sm:p-6 text-center space-y-1.5">
              <span className="text-xs font-medium text-sky-100">
                Your Recommended Daily Goal
              </span>
              <div className="text-3xl sm:text-4xl font-bold tracking-tight tabular-nums">
                {formatVolumeExact(recommendation.totalSuggestedMl, unitSystem)}
              </div>
              <p className="text-xs text-sky-100">
                You can change this anytime in Settings.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Remind Me Every
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { min: 60, label: '1 hour' },
                  { min: 90, label: '1.5 hours' },
                  { min: 120, label: '2 hours' },
                  { min: 180, label: '3 hours' }
                ].map(item => (
                  <button
                    key={item.min}
                    type="button"
                    onClick={() => setReminderInterval(item.min)}
                    className={`py-2.5 px-2 rounded-xl font-semibold border text-center transition-all ${
                      reminderInterval === item.min
                        ? 'bg-sky-50 dark:bg-sky-950 border-sky-500 text-sky-700 dark:text-sky-300'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Start Reminders
                </span>
                <input
                  type="time"
                  value={wakeUpTime}
                  onChange={e => setWakeUpTime(e.target.value)}
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Stop Reminders
                </span>
                <input
                  type="time"
                  value={bedTime}
                  onChange={e => setBedTime(e.target.value)}
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation Actions */}
        <div className="flex gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-2xl flex items-center gap-1.5 transition-colors tap-active"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}

          {step === 1 ? (
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex-1 py-3 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-2xl flex items-center justify-center gap-1.5 transition-all tap-active"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="flex-1 py-3 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-2xl flex items-center justify-center gap-2 transition-all tap-active"
            >
              <Check className="w-4 h-4" />
              <span>Get Started</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
