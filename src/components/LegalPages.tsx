import React, { useState } from 'react';
import {
  ShieldCheck,
  FileText,
  Trash2,
  Lock,
  ExternalLink,
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
  Database,
  Sliders
} from 'lucide-react';
import { REVIEW_DATE } from '../utils/calculations';
import { showAdPrivacyOptions } from '../utils/admobService';

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
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'deletion' | 'health_disclosure'>(initialTab);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletedSuccess, setDeletedSuccess] = useState(false);

  const handleDeleteRequest = () => {
    onWipeAllData();
    setDeletedSuccess(true);
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in">
      
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 tap-active"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Settings</span>
        </button>
        <span className="text-xs font-semibold text-slate-400">
          Last updated: {REVIEW_DATE}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-200/70 dark:bg-slate-800 rounded-2xl p-1 text-xs font-bold overflow-x-auto gap-1">
        {[
          { id: 'privacy' as const, label: 'Privacy Policy', icon: ShieldCheck },
          { id: 'terms' as const, label: 'Terms of Use', icon: FileText },
          { id: 'health_disclosure' as const, label: 'Health Apps Declaration', icon: AlertCircle },
          { id: 'deletion' as const, label: 'Delete Account & Data', icon: Trash2 }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm text-xs text-slate-700 dark:text-slate-300 space-y-4 leading-relaxed">
        
        {/* PRIVACY POLICY */}
        {activeTab === 'privacy' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  SipLumo Privacy Policy
                </h2>
                <p className="text-slate-500 text-[11px]">Effective Date: September 2, 2026 &bull; Package: com.aditya_production_water_reminder.app</p>
              </div>
              <a
                href="/privacy-policy"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline"
              >
                <span>Full Web Policy</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                1. Offline-First Architecture & Privacy by Design
              </h3>
              <p>
                SipLumo is architected as an <strong>offline-first wellness application</strong>. By default, all your personal metrics (body weight, height, age range, biological sex, wake/bed schedules, quiet hours, and fluid intake logs) remain stored strictly on your local device. We do not sell, rent, monetize, or transmit your hydration logs to third-party data brokers.
              </p>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                2. Information We Collect and Purpose
              </h3>
              <ul className="list-disc list-inside space-y-1.5 pl-1">
                <li><strong>Body Weight & Height:</strong> Used strictly on-device to compute the baseline standard wellness estimate (~30 mL/kg reference calculation) based on European Food Safety Authority (EFSA) references.</li>
                <li><strong>Biological Sex & Age Range:</strong> Collected solely to present recognized contextual intake benchmarks published by EFSA and WHO.</li>
                <li><strong>Sleep/Wake Schedule:</strong> Used locally by the device notification scheduler to pause alerts during your bedtime and quiet hours.</li>
                <li><strong>Lifestyle & Environment (Activity, Climate, Pregnancy):</strong> Adjusts hydration baseline estimates according to heat, exercise intensity, or lactation needs.</li>
                <li><strong>Intake Logs & Beverage Types:</strong> Stored locally to render progress charts, calculate hydration index percentages, and track streaks.</li>
              </ul>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                3. Android Device Permissions
              </h3>
              <ul className="list-disc list-inside space-y-1 pl-1 text-[11.5px]">
                <li><code>POST_NOTIFICATIONS</code>: Required on Android 13+ to send scheduled reminders.</li>
                <li><code>RECEIVE_BOOT_COMPLETED</code>: Re-registers your local reminder schedules when your device reboots.</li>
                <li><code>WAKE_LOCK</code>: Briefly awakens the notification alarm service at your designated reminder times.</li>
                <li><code>AD_ID</code> &amp; <code>INTERNET</code>: Used by Google AdMob to deliver banner ads and prevent ad fraud.</li>
              </ul>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                4. Third-Party Services & Google AdMob
              </h3>
              <p>
                To keep SipLumo completely free without subscription paywalls, we display non-intrusive banner advertisements via the <strong>Google Mobile Ads SDK (AdMob)</strong>.
              </p>
              <ul className="list-disc list-inside space-y-1 pl-1 text-[11.5px]">
                <li><strong>Advertising ID (AAID):</strong> Google AdMob processes your device's Android Advertising ID for ad delivery, measurement, frequency capping, and click fraud protection.</li>
                <li><strong>European Economic Area & UK Consent (UMP):</strong> In compliance with GDPR and Google policy, we implement the Google User Messaging Platform (UMP) consent dialog.</li>
              </ul>

              {/* UMP Re-Consent Button */}
              <div className="p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 rounded-2xl flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-xs">Ad Privacy & Consent Settings</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">Review or update your personalized ad consent choices (EEA/UK/GDPR).</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    showAdPrivacyOptions();
                  }}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-[11px] rounded-xl flex items-center gap-1.5 shrink-0 transition-colors shadow-xs"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Update Consent</span>
                </button>
              </div>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                5. Optional Firebase Cloud Backup
              </h3>
              <p>
                If you choose to sign in via Google Authentication, your hydration records are backed up securely to Firebase Firestore under your private authenticated user identifier (UID). All data in transit is encrypted via TLS 1.3 / HTTPS. You may disconnect or permanently delete your cloud account at any moment.
              </p>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                6. Data Deletion & Google Play Compliance
              </h3>
              <p>
                You retain full ownership of your data. You can delete your records at any time:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-1 text-[11.5px]">
                <li><strong>In-App Deletion:</strong> Tap the <em>Account &amp; Data Deletion</em> tab above or in Settings to instantly wipe all local device storage and cloud records.</li>
                <li><strong>Public Web Deletion Portal:</strong> Accessible without having the app installed at <a href="/delete-account" className="font-mono text-sky-600 dark:text-sky-400 font-semibold underline">/delete-account</a>.</li>
              </ul>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                7. Health & Medical Policy Disclaimer
              </h3>
              <p>
                <strong>SipLumo is NOT a medical device.</strong> All targets and estimates are general wellness guidelines for healthy individuals. If you have chronic kidney disease, heart failure, liver disease, or take diuretics, always follow the fluid intake advice prescribed by your doctor.
              </p>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                8. Contact & Developer Support
              </h3>
              <p>
                For questions regarding this policy or data rights requests: <br />
                <span className="font-mono text-sky-600 dark:text-sky-400 font-semibold">adityaa89468@gmail.com</span> &bull; <span className="font-mono text-sky-600 dark:text-sky-400">privacy@siplumo.app</span>
              </p>
            </div>
          </div>
        )}

        {/* TERMS OF USE */}
        {activeTab === 'terms' && (
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              SipLumo Terms of Service
            </h2>
            
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                1. General Wellness Application Only
              </h3>
              <p>
                SipLumo is intended solely as an informational reminder tool for generally healthy adults. <strong>It is NOT a medical device, diagnostic tool, or clinical prescription.</strong>
              </p>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                2. Medical Disclaimers
              </h3>
              <p>
                Calculations provided by the app are baseline wellness approximations. If you have chronic kidney disease, heart failure, liver conditions, or are taking medications that affect fluid balance (such as diuretics), you must adhere to the fluid intake prescribed by your licensed medical practitioner.
              </p>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                3. User Responsibility
              </h3>
              <p>
                You are responsible for listening to your body's natural thirst cues. Never force yourself to drink excess water beyond your physiological comfort or medical advice.
              </p>
            </div>
          </div>
        )}

        {/* HEALTH APPS DECLARATION (GOOGLE PLAY COMPLIANCE) */}
        {activeTab === 'health_disclosure' && (
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Google Play Health Apps & Medical Policy Declaration
            </h2>

            <div className="p-3.5 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-2xl space-y-2">
              <div className="font-bold text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                <span>Declaration Statement</span>
              </div>
              <p className="text-slate-700 dark:text-slate-300">
                SipLumo complies fully with Google Play's Health Apps Policy, User Data Policy, and Data Safety requirements:
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white block mb-1">
                  1. Non-Medical Device Classification
                </span>
                <p>
                  SipLumo does not diagnose, cure, treat, or prevent any illness or disease. Prominently placed disclaimers exist within onboarding, home view, why-target calculation breakdowns, and app settings.
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white block mb-1">
                  2. Evidence-Based Calculations
                </span>
                <p>
                  Calculations utilize peer-reviewed formulas (~30 mL/kg adult physiological baseline) referenced against European Food Safety Authority (EFSA) Scientific Opinions on Dietary Reference Values for Water.
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white block mb-1">
                  3. In-App Account & Data Deletion
                </span>
                <p>
                  In compliance with Google Play's Account Deletion requirement, users can immediately erase all locally stored data and cloud records directly inside this interface without email hurdles.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ACCOUNT & DATA DELETION */}
        {activeTab === 'deletion' && (
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Data & Account Deletion Portal
            </h2>
            <p>
              In accordance with Google Play and global privacy standards (GDPR/CCPA), you have the right to completely and irreversibly delete your profile, water intake history, and preferences.
            </p>

            {deletedSuccess ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-emerald-900 dark:text-emerald-200 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">All Data Successfully Deleted</h4>
                  <p className="mt-1 text-[11px]">
                    Your local storage and cloud records have been purged. The app will restart into its initial onboarding state.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 font-bold text-rose-900 dark:text-rose-200">
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Permanent Wipe Options</span>
                </div>
                <p className="text-rose-800 dark:text-rose-300 text-[11px]">
                  Pressing the button below will immediately wipe all your local device logs, streaks, notification timers, and profile configuration.
                </p>

                <div className="p-3 bg-white/70 dark:bg-slate-900/70 rounded-xl border border-rose-200 dark:border-rose-900/60 text-[11px] text-slate-600 dark:text-slate-400">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    Web-Based Deletion Option:
                  </span>
                  If you have uninstalled the app or need remote data deletion, submit a request anytime at: <br />
                  <span className="font-mono text-sky-600 dark:text-sky-400 font-semibold">/delete-account</span>
                </div>

                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs tap-active"
                  >
                    Request Account & Data Deletion
                  </button>
                ) : (
                  <div className="space-y-2 pt-2">
                    <p className="font-bold text-rose-900 dark:text-white text-xs">
                      Are you completely sure? This action cannot be reversed.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="px-3 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-200 font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteRequest}
                        className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-bold shadow-md"
                      >
                        Yes, Permanently Delete All Data
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
