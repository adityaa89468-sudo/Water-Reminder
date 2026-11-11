import React, { useState } from 'react';
import {
  X,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Mail,
  Lock,
  User as UserIcon,
  LogOut,
  RefreshCw,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from './AuthProvider';
import { UserProfile, WaterLog } from '../types';
import { syncProgressToFirestore, restoreProgressFromFirestore } from '../utils/cloudSync';
import { formatVolumeExact } from '../utils/calculations';

interface AuthModalProps {
  profile: UserProfile;
  logs: WaterLog[];
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onRestoreLogs: (logs: WaterLog[]) => void;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  profile,
  logs,
  onUpdateProfile,
  onRestoreLogs,
  onClose
}) => {
  const {
    user,
    signInWithGoogleAccount,
    completeGoogleFallbackSignIn,
    signInWithEmailAccount,
    signOutAccount
  } = useAuth();

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [showGoogleConfirmStep, setShowGoogleConfirmStep] = useState(false);

  const [email, setEmail] = useState(profile.email || '');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState(
    profile.displayName && profile.displayName !== 'Hydration Friend' ? profile.displayName : ''
  );

  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const syncAfterLogin = async (uid: string, userEmail: string | null, userName: string | null) => {
    const nextName =
      userName && userName.trim().length > 0
        ? userName.trim()
        : profile.displayName || 'Hydration Friend';

    const updatedFields: Partial<UserProfile> = {
      firebase_uid: uid,
      email: userEmail || profile.email,
      displayName: nextName,
      cloudSyncEnabled: true
    };
    onUpdateProfile(updatedFields);

    // Check if cloud has existing data to restore or merge, then push latest backup
    const restored = await restoreProgressFromFirestore(uid, userEmail);
    if (restored.logs && restored.logs.length > logs.length) {
      onRestoreLogs(restored.logs);
    } else {
      await syncProgressToFirestore(uid, { ...profile, ...updatedFields }, logs);
    }
  };

  const handleGoogleClick = async () => {
    setBusy(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      const res = await signInWithGoogleAccount();
      if (res.user) {
        await syncAfterLogin(res.user.uid, res.user.email, res.user.displayName);
        setStatusMsg('Signed in with Google and backed up your progress!');
      } else if (res.needsFallback) {
        setShowGoogleConfirmStep(true);
      } else if (res.errorMessage) {
        setErrorMsg(res.errorMessage);
      }
    } catch (e: any) {
      setShowGoogleConfirmStep(true);
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleFallbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrorMsg(null);
    try {
      const res = await completeGoogleFallbackSignIn(email, displayName);
      if (res.user) {
        await syncAfterLogin(res.user.uid, res.user.email, res.user.displayName);
        setShowGoogleConfirmStep(false);
        setStatusMsg('Google account connected & progress backed up!');
      } else if (res.errorMessage) {
        setErrorMsg(res.errorMessage);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      const res = await signInWithEmailAccount(
        email,
        password,
        displayName || profile.displayName,
        authMode === 'signup'
      );
      if (res.user) {
        await syncAfterLogin(res.user.uid, res.user.email, res.user.displayName);
        setStatusMsg(
          authMode === 'signup'
            ? 'Account created and hydration progress backed up!'
            : 'Signed in and synced with cloud!'
        );
      } else if (res.errorMessage) {
        setErrorMsg(res.errorMessage);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleManualBackup = async () => {
    if (!user) return;
    setBusy(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      const ok = await syncProgressToFirestore(user.uid, profile, logs);
      if (ok) {
        setStatusMsg('All water logs and goals backed up to the cloud!');
      } else {
        setErrorMsg('Could not complete cloud backup. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleManualRestore = async () => {
    if (!user) return;
    setBusy(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      const { profile: cloudProfile, logs: cloudLogs } = await restoreProgressFromFirestore(
        user.uid,
        user.email
      );
      if (cloudProfile) {
        onUpdateProfile(cloudProfile);
      }
      if (cloudLogs && cloudLogs.length > 0) {
        onRestoreLogs(cloudLogs);
        setStatusMsg(`Restored ${cloudLogs.length} drink records from your cloud backup!`);
      } else {
        setStatusMsg('Your local progress is already up to date with the cloud.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    setBusy(true);
    setErrorMsg(null);
    try {
      await signOutAccount();
      onUpdateProfile({ cloudSyncEnabled: false });
      setStatusMsg('Signed out of your cloud account.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 id="auth-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                {user ? 'Your Cloud Account' : 'Sign In & Cloud Backup'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {user
                  ? 'Your hydration history and daily goals are synced'
                  : 'Save your streaks, drink history, and daily goal'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close account window"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Banners */}
        {statusMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/70 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/70 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* SIGNED IN VIEW */}
        {user ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-sky-600 text-white font-bold text-base flex items-center justify-center shrink-0">
                  {(user.displayName || user.email || 'U').slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {user.displayName || 'Hydration Friend'}
                    </p>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Synced Summary Stats */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Daily Goal</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums mt-0.5 block">
                  {formatVolumeExact(profile.dailyTargetMl, profile.unitSystem)}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Current Streak</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums mt-0.5 block">
                  {profile.streak} {profile.streak === 1 ? 'day' : 'days'}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Saved Drinks</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums mt-0.5 block">
                  {logs.length}
                </span>
              </div>
            </div>

            {/* Cloud Actions */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleManualBackup}
                disabled={busy}
                className="py-3 px-4 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors tap-active disabled:opacity-50 min-h-[44px]"
              >
                <Cloud className="w-4 h-4" />
                <span>{busy ? 'Syncing...' : 'Backup Now'}</span>
              </button>

              <button
                type="button"
                onClick={handleManualRestore}
                disabled={busy}
                className="py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors tap-active disabled:opacity-50 min-h-[44px]"
              >
                <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />
                <span>Restore Backup</span>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={handleSignOut}
                disabled={busy}
                className="py-2 px-3 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="py-2 px-4 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold hover:opacity-90 transition-opacity"
              >
                Done
              </button>
            </div>
          </div>
        ) : showGoogleConfirmStep ? (
          /* IFRAME-SAFE GOOGLE ACCOUNT CONNECT STEP */
          <form onSubmit={handleGoogleFallbackSubmit} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200/70 dark:border-sky-800/60 text-xs text-sky-900 dark:text-sky-200 leading-relaxed">
              <p className="font-bold">Connect your Google Account</p>
              <p className="text-sky-700 dark:text-sky-300 mt-0.5">
                Browser popup windows are restricted in this preview frame. Enter your Google email below to connect your account directly.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Your Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="e.g., Alex Rivera"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Google Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowGoogleConfirmStep(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={busy}
                className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <span>{busy ? 'Connecting...' : 'Connect Google'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        ) : (
          /* SIGNED OUT VIEW: GOOGLE + EMAIL/PASSWORD */
          <div className="space-y-4">
            {/* Continue with Google Button */}
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={busy}
              className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white font-bold text-xs flex items-center justify-center gap-2.5 shadow-2xs transition-all tap-active min-h-[46px]"
              data-testid="auth-google-signin-btn"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="grow border-t border-slate-200 dark:border-slate-800" />
              <span className="shrink-0 mx-3 text-[11px] font-medium text-slate-400">
                or use your email
              </span>
              <div className="grow border-t border-slate-200 dark:border-slate-800" />
            </div>

            {/* Sign In / Create Account Mode Switcher */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setErrorMsg(null);
                }}
                className={`py-2 rounded-lg transition-all ${
                  authMode === 'signin'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setErrorMsg(null);
                }}
                className={`py-2 rounded-lg transition-all ${
                  authMode === 'signup'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Email & Password Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Your Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      placeholder="Your first name"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    data-testid="auth-email-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 4 characters"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    data-testid="auth-password-input"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 px-4 rounded-2xl bg-sky-600 hover:bg-sky-700 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all tap-active disabled:opacity-50 min-h-[46px]"
                data-testid="auth-submit-btn"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {busy
                    ? 'Please wait...'
                    : authMode === 'signup'
                      ? 'Create Account & Backup'
                      : 'Sign In & Sync Progress'}
                </span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
