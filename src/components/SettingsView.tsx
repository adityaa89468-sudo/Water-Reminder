import React, { useState, useMemo, useEffect } from 'react';
import {
  User,
  Bell,
  Scale,
  Sun,
  Moon,
  Globe,
  Sparkles,
  Cloud,
  Shield,
  FileText,
  Trash2,
  Sliders,
  ChevronRight,
  Plus,
  Check,
  Edit2,
  ExternalLink,
  Lock,
  Code,
  LogIn,
  LogOut,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Award,
  FileSpreadsheet,
  Download,
  Calculator,
  Activity,
  Thermometer,
  CloudSnow,
  Droplets,
  Flame,
  Minus
} from 'lucide-react';
import { UserProfile, UnitSystem, GlassPreset, WaterLog, ActivityLevel, Climate } from '../types';
import {
  kgToLb,
  lbToKg,
  formatVolume,
  formatVolumeExact,
  flOzToMl,
  mlToFlOz,
  calculateRecommendedIntake
} from '../utils/calculations';
import { translations } from '../i18n/translations';
import { useAuth } from './AuthProvider';
import { loginWithGoogle, logout } from '../firebase';
import { syncProgressToFirestore, restoreProgressFromFirestore } from '../utils/cloudSync';
import { downloadLogsAsCSV } from '../utils/storage';
import { BannerAd } from './BannerAd';
import { ADMOB_CONFIG } from '../utils/admobService';

interface SettingsViewProps {
  profile: UserProfile;
  logs: WaterLog[];
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onRestoreLogs?: (logs: WaterLog[]) => void;
  onOpenReminders: () => void;
  onOpenWhyTarget: () => void;
  onOpenTutorial: () => void;
  onOpenLegal: (tab: 'privacy' | 'terms' | 'deletion' | 'health_disclosure') => void;
  onOpenSelfTest: () => void;
  onResetApp: () => void;
  onOpenAchievements?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  logs,
  onUpdateProfile,
  onRestoreLogs,
  onOpenReminders,
  onOpenWhyTarget,
  onOpenTutorial,
  onOpenLegal,
  onOpenSelfTest,
  onResetApp,
  onOpenAchievements
}) => {
  const { user, loading: authLoading } = useAuth();
  const t = translations[profile.language || 'en'];
  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const [weightVal, setWeightVal] = useState(
    profile.unitSystem === 'imperial'
      ? kgToLb(profile.weightKg).toString()
      : profile.weightKg.toString()
  );

  const [editingPresets, setEditingPresets] = useState(false);
  const [presetList, setPresetList] = useState<GlassPreset[]>(profile.presets);

  // Recommended Daily Water Intake Calculator state
  const [calcWeightKg, setCalcWeightKg] = useState<number>(profile.weightKg || 70);
  const [calcActivity, setCalcActivity] = useState<ActivityLevel>(profile.activityLevel || 'moderate');
  const [calcClimate, setCalcClimate] = useState<Climate>(
    profile.climate === 'hot' || profile.climate === 'cool' ? profile.climate : 'normal'
  );
  const [calcFeedback, setCalcFeedback] = useState<string | null>(null);

  // Keep calculator in sync if profile changes
  useEffect(() => {
    if (profile.weightKg) {
      setCalcWeightKg(profile.weightKg);
    }
  }, [profile.weightKg]);

  // Compute live recommendation
  const recommendation = useMemo(() => {
    return calculateRecommendedIntake(calcWeightKg, calcActivity, calcClimate);
  }, [calcWeightKg, calcActivity, calcClimate]);

  const handleApplyRecommendedTarget = () => {
    onUpdateProfile({
      weightKg: calcWeightKg,
      activityLevel: calcActivity,
      climate: calcClimate,
      dailyTargetMl: recommendation.totalSuggestedMl,
      recommendedBaseMl: recommendation.totalSuggestedMl,
      customTargetSet: false
    });

    const displayVol = formatVolumeExact(recommendation.totalSuggestedMl, profile.unitSystem);
    const climateName = calcClimate === 'cool' ? 'cold' : calcClimate === 'normal' ? 'temperate' : 'hot';
    setCalcFeedback(`Daily goal updated to ${displayVol} based on your weight (${Math.round(calcWeightKg)} kg), ${calcActivity} activity, and ${climateName} climate!`);
    setTimeout(() => {
      setCalcFeedback(null);
    }, 4500);
  };

  // Auth & Cloud Sync States
  const [authActionLoading, setAuthActionLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      setAuthActionLoading(true);
      setAuthError(null);
      const res = await loginWithGoogle();
      if (res?.user) {
        onUpdateProfile({
          email: res.user.email || undefined,
          cloudSyncEnabled: true
        });
        // Auto sync current local progress
        await syncProgressToFirestore(res.user.uid, profile, logs);
        setSyncSuccessMsg('Signed in! Progress backed up to cloud.');
        setTimeout(() => setSyncSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      console.warn('Sign-in error:', err);
      setAuthError(err?.message || 'Could not complete Google Sign-In. Please try again.');
    } finally {
      setAuthActionLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setAuthActionLoading(true);
      await logout();
      onUpdateProfile({ cloudSyncEnabled: false });
      setSyncSuccessMsg('Signed out successfully.');
      setTimeout(() => setSyncSuccessMsg(null), 3000);
    } catch (err: any) {
      console.warn('Sign-out error:', err);
      setAuthError('Error signing out. Please try again.');
    } finally {
      setAuthActionLoading(false);
    }
  };

  const handleManualBackup = async () => {
    if (!user) return;
    try {
      setAuthActionLoading(true);
      setAuthError(null);
      const success = await syncProgressToFirestore(user.uid, profile, logs);
      if (success) {
        setSyncSuccessMsg('Backup complete! Your logs & streak are safely saved.');
      } else {
        setAuthError('Backup encountered an issue. Please try again.');
      }
      setTimeout(() => setSyncSuccessMsg(null), 4000);
    } catch (err: any) {
      setAuthError('Backup failed: ' + (err?.message || 'Unknown error'));
    } finally {
      setAuthActionLoading(false);
    }
  };

  const handleManualRestore = async () => {
    if (!user) return;
    try {
      setAuthActionLoading(true);
      setAuthError(null);
      const { profile: cloudProfile, logs: cloudLogs } = await restoreProgressFromFirestore(user.uid);
      if (cloudProfile) {
        onUpdateProfile(cloudProfile);
      }
      if (cloudLogs.length > 0 && onRestoreLogs) {
        onRestoreLogs(cloudLogs);
        setSyncSuccessMsg(`Restored ${cloudLogs.length} hydration records from cloud!`);
      } else {
        setSyncSuccessMsg('Cloud records up-to-date.');
      }
      setTimeout(() => setSyncSuccessMsg(null), 4000);
    } catch (err: any) {
      setAuthError('Restore failed: ' + (err?.message || 'Unknown error'));
    } finally {
      setAuthActionLoading(false);
    }
  };

  const handleSaveWeight = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(weightVal);
    if (!isNaN(num) && num > 0) {
      const finalKg = profile.unitSystem === 'imperial' ? lbToKg(num) : Math.round(num);
      onUpdateProfile({ weightKg: finalKg });
      setIsEditingWeight(false);
    }
  };

  const handleToggleUnit = () => {
    const nextUnit: UnitSystem = profile.unitSystem === 'metric' ? 'imperial' : 'metric';
    onUpdateProfile({ unitSystem: nextUnit });
  };

  const handleToggleLanguage = () => {
    const nextLang = profile.language === 'en' ? 'hi' : 'en';
    onUpdateProfile({ language: nextLang });
  };

  const handleUpdatePresetAmount = (id: string, newAmount: number) => {
    const updated = presetList.map(p => (p.id === id ? { ...p, amount: newAmount } : p));
    setPresetList(updated);
    onUpdateProfile({ presets: updated });
  };

  const [csvDownloadFeedback, setCsvDownloadFeedback] = useState<string | null>(null);

  const handleExportLogsCSV = () => {
    if (logs.length === 0) {
      setCsvDownloadFeedback('No hydration records logged yet to export.');
      setTimeout(() => setCsvDownloadFeedback(null), 4000);
      return;
    }
    const success = downloadLogsAsCSV(logs);
    if (success) {
      setCsvDownloadFeedback(`Successfully exported ${logs.length} logs as CSV to your device!`);
      setTimeout(() => setCsvDownloadFeedback(null), 4000);
    }
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in">
      
      {/* User Profile Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-teal-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              {profile.displayName.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {profile.displayName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                {profile.sex} • {profile.ageRange.replace('_', ' ')}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenWhyTarget}
            className="px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-sky-400 text-xs font-bold hover:bg-sky-100 dark:hover:bg-slate-700 transition-colors"
          >
            Target Details
          </button>
        </div>

        {/* Weight Edit */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500">Body Weight:</span>
            <span className="text-xs font-bold text-slate-900 dark:text-white ml-1.5">
              {profile.unitSystem === 'imperial'
                ? `${kgToLb(profile.weightKg)} lb`
                : `${profile.weightKg} kg`}
            </span>
          </div>

          {!isEditingWeight ? (
            <button
              onClick={() => setIsEditingWeight(true)}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 p-1"
            >
              Edit
            </button>
          ) : (
            <form onSubmit={handleSaveWeight} className="flex items-center gap-1">
              <input
                type="number"
                value={weightVal}
                onChange={e => setWeightVal(e.target.value)}
                className="w-16 px-2 py-1 text-xs border rounded-lg dark:bg-slate-800"
                autoFocus
              />
              <button type="submit" className="p-1 text-emerald-600">
                <Check className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Recommended Daily Water Intake Auto-Calculator Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Daily Intake Auto-Calculator
                </h3>
                <span className="px-1.5 py-0.2 rounded-md bg-sky-100 dark:bg-sky-950 text-[10px] font-bold text-sky-700 dark:text-sky-300">
                  Auto-Calculate
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Personalized water goal based on weight, activity &amp; climate
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Current Goal
            </span>
            <span className="text-xs font-extrabold text-slate-900 dark:text-white tabular-nums">
              {formatVolumeExact(profile.dailyTargetMl, profile.unitSystem)}
            </span>
          </div>
        </div>

        {/* Feedback message */}
        {calcFeedback && (
          <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{calcFeedback}</span>
          </div>
        )}

        {/* Input 1: User Body Weight */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                1. Body Weight
              </label>
            </div>
            <span className="text-[11px] text-slate-400">
              Rule: 30 mL/kg ({formatVolume(recommendation.baseMl, profile.unitSystem)} base)
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCalcWeightKg(prev => Math.max(30, prev - (profile.unitSystem === 'imperial' ? Math.round(lbToKg(5)) : 2)))}
                className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-600 tap-active"
                title="Decrease weight"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-baseline gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-2xs">
                <input
                  type="number"
                  min="30"
                  max="250"
                  value={profile.unitSystem === 'imperial' ? kgToLb(calcWeightKg) : Math.round(calcWeightKg)}
                  onChange={e => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val > 0) {
                      setCalcWeightKg(profile.unitSystem === 'imperial' ? lbToKg(val) : val);
                    }
                  }}
                  className="w-16 font-black text-slate-900 dark:text-white text-base text-center bg-transparent focus:outline-none"
                />
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {profile.unitSystem === 'imperial' ? 'lb' : 'kg'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setCalcWeightKg(prev => Math.min(250, prev + (profile.unitSystem === 'imperial' ? Math.round(lbToKg(5)) : 2)))}
                className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-600 tap-active"
                title="Increase weight"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium text-right">
              {profile.unitSystem === 'imperial'
                ? `≈ ${Math.round(calcWeightKg)} kg`
                : `≈ ${kgToLb(calcWeightKg)} lb`}
            </span>
          </div>
        </div>

        {/* Input 2: Activity Level */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                2. Daily Activity Level
              </label>
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
              +{formatVolume(recommendation.activityAdjustmentMl, profile.unitSystem)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'low' as const, label: 'Low', desc: 'Sedentary', bonus: '+0 mL' },
              { id: 'moderate' as const, label: 'Moderate', desc: '30-60m walk/gym', bonus: '+250 mL' },
              { id: 'high' as const, label: 'High', desc: 'Intense sports', bonus: '+500 mL' }
            ].map(act => {
              const isSelected = calcActivity === act.id;
              return (
                <button
                  key={act.id}
                  type="button"
                  onClick={() => setCalcActivity(act.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all tap-active flex flex-col justify-between ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-xs ring-1 ring-emerald-500/30'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold leading-none">{act.label}</span>
                    {isSelected && <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight block mb-1">
                    {act.desc}
                  </span>
                  <span className="text-[9px] font-black uppercase text-emerald-700 dark:text-emerald-400">
                    {profile.unitSystem === 'imperial'
                      ? act.id === 'low' ? '+0 oz' : act.id === 'moderate' ? '+8.5 oz' : '+17 oz'
                      : act.bonus}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Input 3: Local Climate (Hot / Cold / Temperate) */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-amber-500" />
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                3. Local Climate
              </label>
            </div>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">
              +{formatVolume(recommendation.climateAdjustmentMl, profile.unitSystem)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              {
                id: 'cool' as const,
                label: 'Cold',
                desc: 'Winter / Chilly',
                bonus: '+0 mL',
                icon: CloudSnow,
                color: 'text-sky-600'
              },
              {
                id: 'normal' as const,
                label: 'Temperate',
                desc: 'Mild 18–24°C',
                bonus: '+0 mL',
                icon: Thermometer,
                color: 'text-teal-600'
              },
              {
                id: 'hot' as const,
                label: 'Hot',
                desc: 'Warm / Humid',
                bonus: '+350 mL',
                icon: Sun,
                color: 'text-amber-500'
              }
            ].map(clim => {
              const isSelected = calcClimate === clim.id;
              const Icon = clim.icon;
              return (
                <button
                  key={clim.id}
                  type="button"
                  onClick={() => setCalcClimate(clim.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all tap-active flex flex-col justify-between ${
                    isSelected
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 dark:border-amber-500 text-amber-950 dark:text-amber-200 shadow-xs ring-1 ring-amber-500/30'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <Icon className={`w-3.5 h-3.5 ${clim.color}`} />
                      <span className="text-xs font-bold leading-none">{clim.label}</span>
                    </div>
                    {isSelected && <Check className="w-3 h-3 text-amber-600 dark:text-amber-400" />}
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight block mb-1">
                    {clim.desc}
                  </span>
                  <span className="text-[9px] font-black uppercase text-amber-700 dark:text-amber-400">
                    {profile.unitSystem === 'imperial'
                      ? clim.id === 'hot' ? '+12 fl oz' : '+0 fl oz'
                      : clim.bonus}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Calculation Result Summary Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-500/10 via-indigo-500/10 to-teal-500/10 border border-sky-200 dark:border-sky-800 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-700 dark:text-sky-300 block">
                Calculated Recommended Intake
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                  {formatVolumeExact(recommendation.totalSuggestedMl, profile.unitSystem)}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  / day
                </span>
              </div>
            </div>

            <div className="text-right text-[11px] text-slate-500 dark:text-slate-400">
              <span className="block font-semibold">Healthy Range:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {formatVolume(recommendation.recommendedRangeMinMl, profile.unitSystem)} – {formatVolume(recommendation.recommendedRangeMaxMl, profile.unitSystem)}
              </span>
            </div>
          </div>

          {/* Formula calculation trace */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 flex-wrap pt-1 border-t border-sky-200/50 dark:border-sky-800/50">
            <span>Formula:</span>
            <span className="font-bold">{formatVolume(recommendation.baseMl, profile.unitSystem)} (base)</span>
            <span>+</span>
            <span className="font-bold">{formatVolume(recommendation.activityAdjustmentMl, profile.unitSystem)} ({calcActivity})</span>
            <span>+</span>
            <span className="font-bold">{formatVolume(recommendation.climateAdjustmentMl, profile.unitSystem)} ({calcClimate === 'cool' ? 'cold' : calcClimate === 'normal' ? 'temperate' : 'hot'})</span>
          </div>

          {/* CTA: Apply Recommended Target */}
          <button
            type="button"
            onClick={handleApplyRecommendedTarget}
            className="w-full py-3 px-4 bg-gradient-to-r from-sky-600 via-indigo-600 to-teal-600 hover:from-sky-700 hover:via-indigo-700 hover:to-teal-700 active:scale-[0.98] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xs hover:shadow-md flex items-center justify-center gap-2 transition-all tap-active"
          >
            <Check className="w-4 h-4 stroke-[3px]" />
            <span>Apply Recommended Target: {formatVolumeExact(recommendation.totalSuggestedMl, profile.unitSystem)}</span>
          </button>
        </div>

      </div>

      {/* Reminders & Notifications Quick Link */}
      <button
        onClick={onOpenReminders}
        className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-sm flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Smart Reminders & Schedule
            </h4>
            <p className="text-xs text-slate-500">
              {profile.reminders.enabled
                ? `Active every ${profile.reminders.intervalMinutes}m (${profile.reminders.startTime} - ${profile.reminders.endTime})`
                : 'Reminders are currently paused'}
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-400" />
      </button>

      {/* Quick App Tutorial / Walkthrough Button */}
      <button
        onClick={onOpenTutorial}
        className="w-full bg-gradient-to-r from-sky-500/10 via-teal-500/10 to-blue-500/10 border border-sky-200/80 dark:border-sky-800/80 rounded-3xl p-4 shadow-xs flex items-center justify-between hover:bg-sky-100/40 dark:hover:bg-sky-950/40 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-teal-500 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Quick App Tutorial</span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-sky-500 text-white uppercase tracking-wider">
                Tour
              </span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Review core features, target formulas & tips
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-400" />
      </button>

      {/* Achievements & Streak Badges Showcase Link */}
      {onOpenAchievements && (
        <button
          onClick={onOpenAchievements}
          className="w-full bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/10 border border-amber-200/80 dark:border-amber-800/80 rounded-3xl p-4 shadow-xs flex items-center justify-between hover:bg-amber-100/40 dark:hover:bg-amber-950/40 transition-colors text-left tap-active"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white flex items-center justify-center shadow-xs">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Achievements & Badges</span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-500 text-white uppercase tracking-wider">
                  Medals
                </span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                View your unlocked streak milestones & badges
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>
      )}

      {/* Preferences Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Preferences & Controls
        </h3>

        {/* Units Toggle */}
        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Scale className="w-4 h-4 text-sky-600" />
            <span className="text-xs font-semibold text-slate-900 dark:text-white">
              Measurement Units
            </span>
          </div>
          <button
            onClick={handleToggleUnit}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
          >
            {profile.unitSystem === 'metric' ? 'Metric (mL, kg)' : 'Imperial (fl oz, lb)'}
          </button>
        </div>

        {/* Dedicated Dark Mode & Theme Toggle */}
        <div className="py-3 border-b border-slate-100 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                profile.darkMode 
                  ? 'bg-indigo-500/15 text-indigo-400' 
                  : 'bg-amber-500/15 text-amber-500'
              }`}>
                {profile.darkMode ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <Sun className="w-4 h-4" />
                )}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Appearance & Dark Mode
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500">
                  {profile.darkMode ? 'Dark theme active' : 'Light theme active'}
                </div>
              </div>
            </div>

            {/* Direct Switch Pill */}
            <button
              type="button"
              role="switch"
              aria-checked={profile.darkMode}
              onClick={() => onUpdateProfile({ darkMode: !profile.darkMode })}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                profile.darkMode ? 'bg-indigo-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
              }`}
              title="Toggle Dark / Light theme"
            >
              <span className="w-4 h-4 rounded-full bg-white shadow-xs transform transition-transform" />
            </button>
          </div>

          {/* Segmented Light / Dark / System Override Controls */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
            <button
              type="button"
              onClick={() => onUpdateProfile({ darkMode: false })}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                !profile.darkMode
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Light Mode</span>
            </button>

            <button
              type="button"
              onClick={() => onUpdateProfile({ darkMode: true })}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                profile.darkMode
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-indigo-300" />
              <span>Dark Mode</span>
            </button>
          </div>

          {/* Optional System Preference Sync Helper */}
          <div className="flex items-center justify-between px-1 pt-0.5">
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              Manual override enabled
            </span>
            <button
              type="button"
              onClick={() => {
                const isSysDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                onUpdateProfile({ darkMode: isSysDark });
              }}
              className="text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:underline"
            >
              Sync with System
            </button>
          </div>
        </div>

        {/* Goal Reached Celebration Toggle */}
        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-semibold text-slate-900 dark:text-white">
              Target Celebration Animation
            </span>
          </div>
          <input
            type="checkbox"
            checked={profile.celebrationEnabled}
            onChange={e => onUpdateProfile({ celebrationEnabled: e.target.checked })}
            className="rounded-sm text-sky-600"
          />
        </div>

        {/* Language Selection */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2.5">
            <Globe className="w-4 h-4 text-sky-600" />
            <span className="text-xs font-semibold text-slate-900 dark:text-white">
              Language
            </span>
          </div>
          <button
            onClick={handleToggleLanguage}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
          >
            {profile.language === 'hi' ? 'हिन्दी (Hindi)' : 'English'}
          </button>
        </div>
      </div>

      {/* Presets Customization */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Quick Cup Presets
          </h3>
          <button
            onClick={() => setEditingPresets(!editingPresets)}
            className="text-xs font-semibold text-sky-600"
          >
            {editingPresets ? 'Done' : 'Customize Sizes'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {presetList.map(preset => (
            <div
              key={preset.id}
              className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  {preset.name}
                </span>
                <span className="text-[11px] text-slate-500">
                  {formatVolumeExact(preset.amount, profile.unitSystem)}
                </span>
              </div>
              {editingPresets && (
                <input
                  type="number"
                  step="25"
                  value={preset.amount}
                  onChange={e => handleUpdatePresetAmount(preset.id, Number(e.target.value))}
                  className="w-16 px-2 py-1 text-xs border rounded-lg dark:bg-slate-900"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Save Progress & Cloud Backup Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Save Progress & Sync
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                {user ? 'Cloud account connected' : 'Backup your streaks & water logs'}
              </p>
            </div>
          </div>

          {user && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>Synced</span>
            </span>
          )}
        </div>

        {/* Feedback Messages */}
        {syncSuccessMsg && (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{syncSuccessMsg}</span>
          </div>
        )}

        {authError && (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span className="leading-snug">{authError}</span>
          </div>
        )}

        {!user ? (
          /* When NOT Signed In: Promo Call-to-Action to Sign In */
          <div className="bg-gradient-to-br from-slate-50 to-sky-50/50 dark:from-slate-800/50 dark:to-sky-950/20 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-3">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span>Never Lose Your Hydration Streak</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Sign in with your Google account to backup your daily water intake records, streaks, and target settings to the cloud. You can restore them anytime on any device.
              </p>
            </div>

            <button
              onClick={handleSignIn}
              disabled={authActionLoading || authLoading}
              className="w-full py-3 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-center gap-2.5 transition-all tap-active disabled:opacity-50"
            >
              {authActionLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-sky-500" />
                  <span>Connecting Google Account...</span>
                </>
              ) : (
                <>
                  {/* Google G Logo SVG */}
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Sign in with Google to Save Progress</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* When Signed In: User Account Details & Sync Controls */
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/80">
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-teal-500 text-white flex items-center justify-center font-bold text-sm">
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {user.displayName || 'Google Account'}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {user.email}
                  </p>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                disabled={authActionLoading}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors tap-active"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Sync Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleManualBackup}
                disabled={authActionLoading}
                className="py-2.5 px-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors tap-active disabled:opacity-50"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>Backup Now</span>
              </button>

              <button
                onClick={handleManualRestore}
                disabled={authActionLoading}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors tap-active disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${authActionLoading ? 'animate-spin' : ''}`} />
                <span>Restore Data</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Personal Health Records & CSV Export Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Health Records & CSV Export
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                {logs.length > 0 ? `${logs.length} intake entries recorded` : 'No logs recorded yet'}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
            .CSV
          </span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Export your complete hydration history directly to your device as a CSV spreadsheet for doctor consultations, dietitian reviews, or personal health tracking in Microsoft Excel, Numbers, and Google Sheets.
        </p>

        {csvDownloadFeedback && (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{csvDownloadFeedback}</span>
          </div>
        )}

        <button
          onClick={handleExportLogsCSV}
          disabled={logs.length === 0}
          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-xs flex items-center justify-center gap-2 transition-all tap-active disabled:opacity-50"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>{logs.length > 0 ? `Export ${logs.length} Hydration Logs (.CSV)` : 'Export Hydration Logs (.CSV)'}</span>
        </button>
      </div>

      {/* Auto-Resizing Banner Ad */}
      <BannerAd />

      {/* Legal, Compliance & Self-Test Links */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
          Legal & Compliance
        </h3>

        {[
          { label: 'Privacy Policy', tab: 'privacy' as const, icon: Shield },
          { label: 'Terms of Use & Medical Disclaimers', tab: 'terms' as const, icon: FileText },
          { label: 'Google Play Health Apps Declaration', tab: 'health_disclosure' as const, icon: Lock },
          { label: 'Delete Account & Clear All Data', tab: 'deletion' as const, icon: Trash2 }
        ].map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.tab}
              onClick={() => onOpenLegal(item.tab)}
              className="w-full flex items-center justify-between py-2.5 px-1 text-xs text-slate-700 dark:text-slate-300 hover:text-sky-600 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 text-slate-400" />
                <span>{item.label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          );
        })}

        {/* Self-Test Logic Suite */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onOpenSelfTest}
            className="w-full flex items-center justify-between py-2 px-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800"
          >
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              <span>Run Automated Formula & Logic Tests</span>
            </div>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Version Footer */}
      <div className="text-center text-[11px] text-slate-400 dark:text-slate-600 space-y-0.5">
        <p>SipLumo Hydration Tracker • v1.0.0 (Production Release)</p>
        <p>Offline-First • No Data Selling • MD3 Fluid System</p>
      </div>

    </div>
  );
};
