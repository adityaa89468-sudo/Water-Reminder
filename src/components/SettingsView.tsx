import React, { useState } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { UserProfile, UnitSystem, GlassPreset, WaterLog } from '../types';
import { kgToLb, lbToKg, formatVolumeExact, flOzToMl, mlToFlOz } from '../utils/calculations';
import { translations } from '../i18n/translations';
import { useAuth } from './AuthProvider';
import { loginWithGoogle, logout } from '../firebase';
import { syncProgressToFirestore, restoreProgressFromFirestore } from '../utils/cloudSync';
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
  onResetApp
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
