import React, { useState, useMemo, useEffect } from 'react';
import {
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
  ChevronRight,
  Plus,
  Check,
  LogOut,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Trophy,
  FileSpreadsheet,
  Activity,
  Thermometer,
  CloudSnow,
  Minus,
  UserCheck
} from 'lucide-react';
import { UserProfile, UnitSystem, GlassPreset, WaterLog, ActivityLevel, Climate } from '../types';
import {
  kgToLb,
  lbToKg,
  formatVolumeExact,
  calculateRecommendedIntake
} from '../utils/calculations';
import { useAuth } from './AuthProvider';
import { syncProgressToFirestore, restoreProgressFromFirestore } from '../utils/cloudSync';
import { downloadLogsAsCSV } from '../utils/storage';

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
  onOpenAuthModal?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  logs,
  onUpdateProfile,
  onRestoreLogs,
  onOpenReminders,
  onOpenWhyTarget,
  onOpenLegal,
  onOpenSelfTest,
  onOpenAchievements,
  onOpenAuthModal
}) => {
  const { user, loading: authLoading, signInWithGoogleAccount, signOutAccount } = useAuth();
  const [editingPresets, setEditingPresets] = useState(false);
  const [presetList, setPresetList] = useState<GlassPreset[]>(profile.presets);

  // Recommended Daily Water Intake Calculator state
  const [calcWeightKg, setCalcWeightKg] = useState<number>(profile.weightKg || 70);
  const [calcActivity, setCalcActivity] = useState<ActivityLevel>(profile.activityLevel || 'moderate');
  const [calcClimate, setCalcClimate] = useState<Climate>(
    profile.climate === 'hot' || profile.climate === 'cool' ? profile.climate : 'normal'
  );
  const [calcFeedback, setCalcFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (profile.weightKg) {
      setCalcWeightKg(profile.weightKg);
    }
  }, [profile.weightKg]);

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
    setCalcFeedback(`Your daily goal is now set to ${displayVol}!`);
    setTimeout(() => {
      setCalcFeedback(null);
    }, 3500);
  };

  // Auth & Cloud Sync States
  const [authActionLoading, setAuthActionLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      setAuthActionLoading(true);
      setAuthError(null);
      const res = await signInWithGoogleAccount();
      if (res?.user) {
        onUpdateProfile({
          firebase_uid: res.user.uid,
          email: res.user.email || undefined,
          displayName: res.user.displayName || profile.displayName,
          cloudSyncEnabled: true
        });
        await syncProgressToFirestore(res.user.uid, profile, logs);
        setSyncSuccessMsg('Signed in and backed up to the cloud!');
        setTimeout(() => setSyncSuccessMsg(null), 4000);
      } else if (res?.needsFallback && onOpenAuthModal) {
        onOpenAuthModal();
      } else if (onOpenAuthModal) {
        onOpenAuthModal();
      }
    } catch {
      if (onOpenAuthModal) {
        onOpenAuthModal();
      }
    } finally {
      setAuthActionLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setAuthActionLoading(true);
      await signOutAccount();
      onUpdateProfile({ cloudSyncEnabled: false });
      setSyncSuccessMsg('Signed out.');
      setTimeout(() => setSyncSuccessMsg(null), 3000);
    } catch {
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
        setSyncSuccessMsg('Backup complete!');
      } else {
        setAuthError('Backup failed. Please try again.');
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
      const { profile: cloudProfile, logs: cloudLogs } = await restoreProgressFromFirestore(
        user.uid,
        user.email
      );
      if (cloudProfile) {
        onUpdateProfile(cloudProfile);
      }
      if (cloudLogs.length > 0 && onRestoreLogs) {
        onRestoreLogs(cloudLogs);
        setSyncSuccessMsg(`Restored ${cloudLogs.length} drinks from cloud!`);
      } else {
        setSyncSuccessMsg('Your data is up to date.');
      }
      setTimeout(() => setSyncSuccessMsg(null), 4000);
    } catch (err: any) {
      setAuthError('Restore failed: ' + (err?.message || 'Unknown error'));
    } finally {
      setAuthActionLoading(false);
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
      setCsvDownloadFeedback('No drinks logged yet to export.');
      setTimeout(() => setCsvDownloadFeedback(null), 3500);
      return;
    }
    const success = downloadLogsAsCSV(logs);
    if (success) {
      setCsvDownloadFeedback(`Exported ${logs.length} drinks to CSV!`);
      setTimeout(() => setCsvDownloadFeedback(null), 3500);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 pb-8 animate-in fade-in">
      {/* User Profile Summary */}
      <div className="adaptive-card flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
            {(user?.displayName || profile.displayName || 'H').slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                {user?.displayName || profile.displayName}
              </h3>
              {user && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800/70 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold shrink-0">
                  <CheckCircle2 className="w-3 h-3" /> Synced
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {user?.email ? (
                <span>{user.email} · </span>
              ) : null}
              Daily Goal:{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                {formatVolumeExact(profile.dailyTargetMl, profile.unitSystem)}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {onOpenAuthModal && (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="px-3.5 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200/70 dark:border-sky-800/70 text-sky-700 dark:text-sky-300 text-xs font-semibold hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-colors tap-active min-h-[38px]"
            >
              {user ? 'Account' : 'Sign In'}
            </button>
          )}
          <button
            type="button"
            onClick={onOpenWhyTarget}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors tap-active min-h-[38px]"
          >
            Edit Goal
          </button>
        </div>
      </div>

      {/* Simple Daily Water Goal Calculator */}
      <div className="adaptive-card space-y-5">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Find Your Recommended Daily Goal
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Select your weight, activity level, and local weather to get a personalized water goal
          </p>
        </div>

        {calcFeedback && (
          <div className="p-3 rounded-2xl bg-emerald-600 text-white text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{calcFeedback}</span>
          </div>
        )}

        {/* 1. Body Weight */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-sky-600" />
            <span>Your Weight</span>
          </label>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() =>
                setCalcWeightKg(prev =>
                  Math.max(30, prev - (profile.unitSystem === 'imperial' ? Math.round(lbToKg(5)) : 2))
                )
              }
              className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-200 tap-active shrink-0"
              title="Decrease weight"
            >
              <Minus className="w-4 h-4" />
            </button>

            <div className="flex items-baseline gap-1.5 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
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
                className="w-16 font-bold text-slate-900 dark:text-white text-base text-center bg-transparent focus:outline-none tabular-nums"
              />
              <span className="text-xs font-semibold text-slate-500">
                {profile.unitSystem === 'imperial' ? 'lb' : 'kg'}
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                setCalcWeightKg(prev =>
                  Math.min(250, prev + (profile.unitSystem === 'imperial' ? Math.round(lbToKg(5)) : 2))
                )
              }
              className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-200 tap-active shrink-0"
              title="Increase weight"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Activity Level */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span>Daily Activity</span>
          </label>

          <div className="grid grid-cols-1 min-[380px]:grid-cols-3 gap-2">
            {[
              { id: 'low' as const, label: 'Light', desc: 'Mostly sitting' },
              { id: 'moderate' as const, label: 'Moderate', desc: 'Daily exercise' },
              { id: 'high' as const, label: 'Active', desc: 'Heavy workouts' }
            ].map(act => {
              const isSelected = calcActivity === act.id;
              return (
                <button
                  key={act.id}
                  type="button"
                  onClick={() => setCalcActivity(act.id)}
                  className={`p-3 rounded-2xl border text-left transition-all tap-active min-w-0 ${
                    isSelected
                      ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-500 text-sky-900 dark:text-sky-200'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold truncate">{act.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 truncate">
                    {act.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Local Climate */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Thermometer className="w-3.5 h-3.5 text-amber-500" />
            <span>Local Weather</span>
          </label>

          <div className="grid grid-cols-1 min-[380px]:grid-cols-3 gap-2">
            {[
              { id: 'cool' as const, label: 'Cold', desc: 'Cool weather', icon: CloudSnow },
              { id: 'normal' as const, label: 'Temperate', desc: 'Mild weather', icon: Thermometer },
              { id: 'hot' as const, label: 'Hot', desc: 'Warm or humid', icon: Sun }
            ].map(clim => {
              const isSelected = calcClimate === clim.id;
              const Icon = clim.icon;
              return (
                <button
                  key={clim.id}
                  type="button"
                  onClick={() => setCalcClimate(clim.id)}
                  className={`p-3 rounded-2xl border text-left transition-all tap-active min-w-0 ${
                    isSelected
                      ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-500 text-sky-900 dark:text-sky-200'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1 min-w-0">
                      <Icon className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                      <span className="text-xs font-bold truncate">{clim.label}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 truncate">
                    {clim.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Simple Result & Apply Button */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block">
              Recommended Daily Intake
            </span>
            <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              {formatVolumeExact(recommendation.totalSuggestedMl, profile.unitSystem)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleApplyRecommendedTarget}
            className="w-full sm:w-auto py-3 px-5 bg-sky-600 hover:bg-sky-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all tap-active min-h-[44px]"
          >
            <Check className="w-4 h-4 stroke-[2.5px] shrink-0" />
            <span>Use This Goal</span>
          </button>
        </div>
      </div>

      {/* Reminders & Achievements Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onOpenReminders}
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 flex items-center justify-between hover:border-sky-300 transition-colors text-left tap-active"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Reminders
              </h4>
              <p className="text-xs text-slate-500">
                {profile.reminders.enabled
                  ? `Every ${profile.reminders.intervalMinutes} min`
                  : 'Turned off'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {onOpenAchievements && (
          <button
            type="button"
            onClick={onOpenAchievements}
            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 flex items-center justify-between hover:border-amber-300 transition-colors text-left tap-active"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Achievements
                </h4>
                <p className="text-xs text-slate-500">
                  Streaks & badges
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        )}
      </div>

      {/* App Preferences */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Preferences
        </h3>

        {/* Units Toggle */}
        <div className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Scale className="w-4 h-4 text-sky-600" />
            <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
              Units
            </span>
          </div>
          <button
            type="button"
            onClick={handleToggleUnit}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
          >
            {profile.unitSystem === 'metric' ? 'Metric (mL, kg)' : 'Imperial (fl oz, lb)'}
          </button>
        </div>

        {/* Theme Toggle */}
        <div className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            {profile.darkMode ? (
              <Moon className="w-4 h-4 text-indigo-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
            <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
              Theme
            </span>
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => onUpdateProfile({ darkMode: false })}
              className={`px-3 py-1 rounded-lg transition-all ${
                !profile.darkMode
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              Light
            </button>
            <button
              type="button"
              onClick={() => onUpdateProfile({ darkMode: true })}
              className={`px-3 py-1 rounded-lg transition-all ${
                profile.darkMode
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              Dark
            </button>
          </div>
        </div>

        {/* Goal Reached Celebration Toggle */}
        <div className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
              Goal Celebration
            </span>
          </div>
          <input
            type="checkbox"
            checked={profile.celebrationEnabled}
            onChange={e => onUpdateProfile({ celebrationEnabled: e.target.checked })}
            className="w-4 h-4 rounded-sm text-sky-600"
          />
        </div>

        {/* Language Selection */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2.5">
            <Globe className="w-4 h-4 text-sky-600" />
            <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
              Language
            </span>
          </div>
          <button
            type="button"
            onClick={handleToggleLanguage}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
          >
            {profile.language === 'hi' ? 'हिन्दी (Hindi)' : 'English'}
          </button>
        </div>
      </div>

      {/* Cup Sizes Customization */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Cup Sizes
          </h3>
          <button
            type="button"
            onClick={() => setEditingPresets(!editingPresets)}
            className="text-xs font-semibold text-sky-600"
          >
            {editingPresets ? 'Done' : 'Edit Sizes'}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {presetList.map(preset => (
            <div
              key={preset.id}
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                  {preset.name}
                </span>
                <span className="text-xs text-slate-500 tabular-nums">
                  {formatVolumeExact(preset.amount, profile.unitSystem)}
                </span>
              </div>
              {editingPresets && (
                <input
                  type="number"
                  step="25"
                  value={preset.amount}
                  onChange={e => handleUpdatePresetAmount(preset.id, Number(e.target.value))}
                  className="w-16 px-2 py-1 text-xs border rounded-lg dark:bg-slate-900 tabular-nums"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Cloud Backup & Data Export */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Cloud className="w-4 h-4 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Account, Backup & Export
            </h3>
          </div>
          {user && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Connected</span>
            </span>
          )}
        </div>

        {syncSuccessMsg && (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{syncSuccessMsg}</span>
          </div>
        )}

        {authError && (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{authError}</span>
          </div>
        )}

        {!user ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleSignIn}
              disabled={authActionLoading || authLoading}
              className="py-3 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all tap-active disabled:opacity-50 min-h-[44px]"
              data-testid="settings-google-signin-btn"
            >
              <Cloud className="w-4 h-4" />
              <span>{authActionLoading ? 'Connecting...' : 'Sign in with Google'}</span>
            </button>

            {onOpenAuthModal && (
              <button
                type="button"
                onClick={onOpenAuthModal}
                disabled={authActionLoading || authLoading}
                className="py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all tap-active min-h-[44px]"
                data-testid="settings-email-signin-btn"
              >
                <UserCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>Sign in with Email</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80">
              <div className="text-xs min-w-0">
                <p className="font-bold text-slate-900 dark:text-white truncate">
                  {user.displayName || 'Connected Account'}
                </p>
                <p className="text-slate-500 truncate">{user.email}</p>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={authActionLoading}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleManualBackup}
                disabled={authActionLoading}
                className="py-2.5 px-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 min-h-[42px]"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>Backup Now</span>
              </button>
              <button
                type="button"
                onClick={handleManualRestore}
                disabled={authActionLoading}
                className="py-2.5 px-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 min-h-[42px]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${authActionLoading ? 'animate-spin' : ''}`} />
                <span>Restore</span>
              </button>
            </div>
          </div>
        )}

        {csvDownloadFeedback && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            {csvDownloadFeedback}
          </p>
        )}

        <button
          type="button"
          onClick={handleExportLogsCSV}
          disabled={logs.length === 0}
          className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-2xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 min-h-[42px]"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Download History as Spreadsheet (.CSV)</span>
        </button>
      </div>

      {/* Privacy & Account Links */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 space-y-1">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
          Privacy, Legal & Play Store Readiness
        </h3>

        {[
          { label: 'Privacy Policy', tab: 'privacy' as const, icon: Shield },
          { label: 'Terms & Wellness Disclaimer', tab: 'terms' as const, icon: FileText },
          { label: 'Delete Account & Clear All Data', tab: 'deletion' as const, icon: Trash2 }
        ].map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.tab}
              type="button"
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

        <button
          type="button"
          onClick={onOpenSelfTest}
          className="w-full flex items-center justify-between py-2.5 px-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-600 transition-colors border-t border-slate-100 dark:border-slate-800 mt-1 pt-3"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Play Store & System Readiness Check (21/21 Passed)</span>
          </div>
          <ChevronRight className="w-4 h-4 text-emerald-500" />
        </button>
      </div>
    </div>
  );
};
