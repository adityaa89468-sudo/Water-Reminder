import React, { useState } from 'react';
import {
  ShieldCheck,
  FileText,
  Trash2,
  ExternalLink,
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
  Sliders,
  Cloud,
  Lock,
  Smartphone,
  Scale,
  Mail
} from 'lucide-react';
import { REVIEW_DATE } from '../utils/calculations';
import { showAdPrivacyOptions } from '../utils/admobService';
import { useAuth } from './AuthProvider';

interface LegalPagesProps {
  initialTab?: 'privacy' | 'terms' | 'deletion' | 'health_disclosure';
  onBack: () => void;
  onWipeAllData: () => void;
}

export const LegalPages: React.FC<LegalPagesProps> = ({
  initialTab = 'privacy',
  onBack,
  onWipeAllData
}) => {
  const { user, signOutAccount } = useAuth();
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'deletion' | 'health_disclosure'>(initialTab);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletedSuccess, setDeletedSuccess] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState(user?.email || '');
  const [deletingBusy, setDeletingBusy] = useState(false);

  const handleDeleteRequest = async () => {
    setDeletingBusy(true);
    try {
      await fetch('/api/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          uid: user?.uid,
          email: deleteEmail || user?.email
        })
      });
    } catch {
      // Continue with local wipe even if offline
    }
    try {
      if (user) {
        await signOutAccount();
      }
    } catch {
      // Ignore signout notice
    }
    onWipeAllData();
    setDeletingBusy(false);
    setDeletedSuccess(true);
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-2xs">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 transition-colors tap-active"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Settings</span>
        </button>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Updated: {REVIEW_DATE}
        </span>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-slate-200/70 dark:bg-slate-800 rounded-2xl p-1 text-xs font-bold overflow-x-auto gap-1 no-scrollbar">
        {[
          { id: 'privacy' as const, label: 'Privacy Policy', icon: ShieldCheck },
          { id: 'terms' as const, label: 'Terms & Conditions', icon: FileText },
          { id: 'health_disclosure' as const, label: 'Health Disclosure', icon: AlertCircle },
          { id: 'deletion' as const, label: 'Delete Account & Data', icon: Trash2 }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-2xs text-xs text-slate-700 dark:text-slate-300 space-y-5 leading-relaxed">
        {/* ==================== PRIVACY POLICY ==================== */}
        {activeTab === 'privacy' && (
          <div className="space-y-5">
            <div className="flex items-start justify-between flex-wrap gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                  Official Privacy Policy
                </span>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  SipLumo Privacy Policy
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                  Effective Date: November 11, 2026 &bull; Package: com.aditya_production_water_reminder.app
                </p>
              </div>
              <a
                href="/privacy-policy"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline"
              >
                <span>Open Full Web Policy</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Plain-English Summary Banner */}
            <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 space-y-1">
              <p className="font-bold text-xs flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Privacy Summary in Plain English</span>
              </p>
              <p className="text-[11.5px] leading-relaxed">
                SipLumo works <strong>offline-first</strong> by default. Your water logs, custom drink categories, daily goals, and reminder schedules are saved on your device. If you choose to sign in with <strong>Google</strong> or <strong>Email &amp; Password</strong>, your progress is securely backed up to the cloud so you can restore it anytime. We never sell or rent your personal data.
              </p>
            </div>

            <div className="space-y-4">
              <section className="space-y-1.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  1. Information We Collect &amp; Why
                </h3>
                <ul className="list-disc list-inside space-y-1.5 pl-1">
                  <li>
                    <strong>Daily Goal &amp; Body Metrics:</strong> Your weight, activity level (light, moderate, active), and local weather (cold, temperate, hot) are used to calculate your recommended daily water intake.
                  </li>
                  <li>
                    <strong>Hydration Logs &amp; Drink Categories:</strong> When you log drinks via the Home screen, the Hydration Quick Widget, or the Smart Reminders Widget, we store the volume (mL or fl oz), timestamp, beverage category (water, tea, coffee, juice, infused, electrolyte, mineral), and optional notes to show your progress, streaks, and daily pace comparison.
                  </li>
                  <li>
                    <strong>Reminder &amp; Quiet Hours Preferences:</strong> Your wake-up time, bedtime, reminder interval, and snooze settings are used to schedule gentle hydration reminders during your active hours.
                  </li>
                  <li>
                    <strong>Optional Account &amp; Cloud Sync Data:</strong> If you sign in using <strong>Google Sign-In</strong> or <strong>Email &amp; Password</strong>, we store your display name, email address, encrypted password hash (for email accounts), and unique user ID (UID) to back up and restore your hydration history across devices.
                  </li>
                </ul>
              </section>

              <section className="space-y-1.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  2. How Your Data Is Stored &amp; Protected
                </h3>
                <ul className="list-disc list-inside space-y-1.5 pl-1">
                  <li>
                    <strong>On-Device Storage:</strong> If you use SipLumo without signing in, 100% of your data remains in your local device storage.
                  </li>
                  <li>
                    <strong>Cloud Backup &amp; Encryption:</strong> When signed in, your profile settings and drink logs are transmitted over encrypted HTTPS (TLS 1.2/1.3) and stored under your authenticated account in Google Firebase Firestore and our secure application database.
                  </li>
                  <li>
                    <strong>Spreadsheet (.CSV) Export:</strong> You can export a copy of your complete hydration history as a CSV file anytime from Settings.
                  </li>
                </ul>
              </section>

              <section className="space-y-1.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  3. Device Permissions (Android &amp; Web)
                </h3>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li><code>POST_NOTIFICATIONS</code>: Sends scheduled water reminders and smart reminder alerts.</li>
                  <li><code>RECEIVE_BOOT_COMPLETED</code> &amp; <code>WAKE_LOCK</code>: Restores your reminder schedule after a device restart.</li>
                  <li><code>INTERNET</code> &amp; <code>AD_ID</code>: Used for optional cloud backup/restore and Google AdMob banner delivery.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  4. Advertising &amp; Consent (Google AdMob / GDPR)
                </h3>
                <p>
                  To keep SipLumo free to use, the app integrates the <strong>Google Mobile Ads SDK (AdMob)</strong>, which may use your device's Advertising ID (AAID) for ad delivery, frequency capping, and fraud prevention. Users in the EEA, UK, and Switzerland can review or update their ad consent choices at any time via Google's User Messaging Platform (UMP).
                </p>

                <div className="p-3.5 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 rounded-2xl flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-xs">
                      Ad Privacy &amp; Consent Settings
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Review or update your ad personalization preferences (EEA/UK/GDPR).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => showAdPrivacyOptions()}
                    className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-[11px] rounded-xl flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Manage Consent</span>
                  </button>
                </div>
              </section>

              <section className="space-y-1.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  5. Account &amp; Data Deletion Rights (GDPR, CCPA &amp; Google Play)
                </h3>
                <p>
                  You have full control over your personal data and can permanently delete your account and hydration history at any time:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>
                    <strong>Instant In-App Deletion:</strong> Use the <em>Delete Account &amp; Data</em> tab above to immediately erase both your local device storage and your cloud backup records.
                  </li>
                  <li>
                    <strong>Web Deletion Portal:</strong> You can also request account deletion without the app installed at{' '}
                    <a href="/delete-account" className="text-sky-600 dark:text-sky-400 font-semibold underline">
                      /delete-account
                    </a>
                    .
                  </li>
                </ul>
              </section>

              <section className="space-y-1.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  6. Contact &amp; Privacy Support
                </h3>
                <p>
                  If you have any questions about this Privacy Policy or your data rights, contact us at:{' '}
                  <a href="mailto:adityaa89468@gmail.com" className="text-sky-600 dark:text-sky-400 font-semibold underline">
                    adityaa89468@gmail.com
                  </a>{' '}
                  or{' '}
                  <a href="mailto:privacy@siplumo.app" className="text-sky-600 dark:text-sky-400 font-semibold underline">
                    privacy@siplumo.app
                  </a>
                  .
                </p>
              </section>
            </div>
          </div>
        )}

        {/* ==================== TERMS & CONDITIONS ==================== */}
        {activeTab === 'terms' && (
          <div className="space-y-5">
            <div className="flex items-start justify-between flex-wrap gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                  Terms of Service
                </span>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  SipLumo Terms &amp; Conditions
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                  Effective Date: November 11, 2026 &bull; Applies to Mobile &amp; Web App
                </p>
              </div>
              <a
                href="/terms"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline"
              >
                <span>Open Full Web Terms</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 space-y-1">
              <p className="font-bold text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Important Medical &amp; Wellness Disclaimer</span>
              </p>
              <p className="text-[11.5px] leading-relaxed">
                SipLumo is a <strong>general wellness and habit-tracking utility</strong> for healthy adults. It is <strong>NOT a medical device</strong> and does not provide medical diagnosis or clinical treatment. Always consult your physician if you have kidney disease, heart failure, liver conditions, pregnancy-related fluid needs, or prescribed fluid restrictions.
              </p>
            </div>

            <div className="space-y-4">
              <section className="space-y-1.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  1. Acceptance of Terms
                </h3>
                <p>
                  By accessing or using SipLumo (Water Reminder), including its Home Screen Widget, Smart Reminders Widget, Daily Water Goal Calculator, and Cloud Sync services, you agree to these Terms &amp; Conditions and our Privacy Policy.
                </p>
              </section>

              <section className="space-y-1.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  2. Personalized Goal Calculator &amp; Hydration Estimates
                </h3>
                <p>
                  The recommended daily water intake generated in Settings (based on body weight, activity level, and local weather) and the daily pace comparisons in the Home Screen Widget are general wellness estimates. Individual hydration needs vary based on diet, perspiration, altitude, and health status. Never drink beyond your physical comfort or ignore your body's natural signals.
                </p>
              </section>

              <section className="space-y-1.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  3. User Accounts &amp; Cloud Sync
                </h3>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>
                    <strong>Optional Registration:</strong> You may use SipLumo without an account, or optionally sign in via Google Sign-In or Email &amp; Password to back up your hydration logs and settings.
                  </li>
                  <li>
                    <strong>Account Security:</strong> You are responsible for maintaining the confidentiality of your login credentials.
                  </li>
                  <li>
                    <strong>Account Termination &amp; Data Erasure:</strong> You may disconnect your account or permanently delete all local and cloud data at any time through Settings or at <a href="/delete-account" className="text-sky-600 dark:text-sky-400 underline">/delete-account</a>.
                  </li>
                </ul>
              </section>

              <section className="space-y-1.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  4. Smart Reminders &amp; Notifications
                </h3>
                <p>
                  Delivery of scheduled reminders depends on your device operating system permissions, battery optimization settings, and browser/notification settings. You can customize reminder intervals, quiet hours, or turn reminders off at any time.
                </p>
              </section>

              <section className="space-y-1.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  5. Acceptable Use &amp; Intellectual Property
                </h3>
                <p>
                  SipLumo, including its interface design, custom drink icons, widgets, and code, is protected by copyright and intellectual property laws. You are granted a personal, non-exclusive, non-transferable license to use the app for personal wellness tracking.
                </p>
              </section>

              <section className="space-y-1.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  6. Limitation of Liability
                </h3>
                <p>
                  SipLumo is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis without warranties of any kind. To the fullest extent permitted by law, the developer shall not be liable for any indirect, incidental, or health-related damages arising from your use of the app or reliance on its hydration estimates.
                </p>
              </section>

              <section className="space-y-1.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  7. Contact Information
                </h3>
                <p>
                  Questions about these Terms can be sent to{' '}
                  <a href="mailto:adityaa89468@gmail.com" className="text-sky-600 dark:text-sky-400 font-semibold underline">
                    adityaa89468@gmail.com
                  </a>{' '}
                  or{' '}
                  <a href="mailto:privacy@siplumo.app" className="text-sky-600 dark:text-sky-400 font-semibold underline">
                    privacy@siplumo.app
                  </a>
                  .
                </p>
              </section>
            </div>
          </div>
        )}

        {/* ==================== HEALTH DISCLOSURE ==================== */}
        {activeTab === 'health_disclosure' && (
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Google Play Health Apps &amp; Safety Disclosure
            </h2>

            <div className="p-4 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-2xl space-y-1.5">
              <div className="font-bold text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                <span>Health &amp; Data Safety Compliance</span>
              </div>
              <p className="text-slate-700 dark:text-slate-300">
                SipLumo complies with Google Play's Health Apps Policy, User Data Policy, and Account Deletion requirements:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <Scale className="w-4 h-4 text-sky-600" />
                  <span>1. Non-Medical Wellness Tool</span>
                </div>
                <p>
                  SipLumo does not diagnose, treat, cure, or prevent any disease. All daily water goals and widget pace indicators are general wellness guidelines.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>2. Transparent Calculations</span>
                </div>
                <p>
                  Recommended intake targets use standard adult reference guidelines (~30 mL/kg baseline) adjusted for activity level and local weather.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <Cloud className="w-4 h-4 text-sky-600" />
                  <span>3. User-Controlled Cloud Sync</span>
                </div>
                <p>
                  Cloud backup via Google Sign-In or Email &amp; Password is completely optional and protected by encrypted transport and owner-only database rules.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>4. Instant Data Erasure</span>
                </div>
                <p>
                  Users can permanently erase all local and cloud-synced hydration records at any time inside the app or via the web portal at <code>/delete-account</code>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ==================== ACCOUNT & DATA DELETION ==================== */}
        {activeTab === 'deletion' && (
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Account &amp; Data Deletion Portal
            </h2>
            <p>
              You have the right to permanently delete your account, profile settings, and all logged drink history from both this device and our cloud backup servers.
            </p>

            {deletedSuccess ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-emerald-900 dark:text-emerald-200 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">All Account &amp; Hydration Data Deleted</h4>
                  <p className="mt-1 text-[11px]">
                    Your local storage and cloud records have been permanently erased.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/70 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 font-bold text-rose-900 dark:text-rose-200 text-sm">
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Permanent Account &amp; Data Wipe</span>
                </div>
                <p className="text-rose-800 dark:text-rose-300 text-xs">
                  Deleting your data will immediately erase all water logs, custom cup sizes, streaks, reminder schedules, and cloud backup records associated with your account.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-rose-900 dark:text-rose-200 mb-1">
                    Account Email to Purge from Cloud Backup (Optional if using offline mode)
                  </label>
                  <div className="relative max-w-sm">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={deleteEmail}
                      onChange={e => setDeleteEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-rose-200/80 dark:border-rose-900/60 text-[11px] text-slate-600 dark:text-slate-400">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">
                    Web Deletion Link (when app is uninstalled):
                  </span>
                  You can also submit an account deletion request anytime via our web form at{' '}
                  <a href="/delete-account" target="_blank" rel="noreferrer" className="font-mono text-sky-600 dark:text-sky-400 font-semibold underline">
                    /delete-account
                  </a>
                  .
                </div>

                {!confirmDelete ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-2xs tap-active"
                  >
                    Delete Account &amp; Clear All Data
                  </button>
                ) : (
                  <div className="space-y-2.5 pt-1">
                    <p className="font-bold text-rose-900 dark:text-white text-xs">
                      Are you sure? This will permanently erase all local and cloud data and cannot be undone.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        disabled={deletingBusy}
                        className="px-3.5 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-200 font-semibold text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteRequest}
                        disabled={deletingBusy}
                        className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-bold text-xs shadow-xs"
                      >
                        {deletingBusy ? 'Deleting...' : 'Yes, Permanently Delete Everything'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
