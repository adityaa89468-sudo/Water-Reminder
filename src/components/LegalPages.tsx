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
  Database
} from 'lucide-react';
import { REVIEW_DATE } from '../utils/calculations';

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
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              SipLumo Privacy Policy
            </h2>
            <p className="text-slate-500">Effective Date: August 30, 2026</p>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                1. Offline-First Architecture & Data Ownership
              </h3>
              <p>
                SipLumo is built as an <strong>offline-first wellness tracking application</strong>. By default, all your personal parameters (body weight, age range, schedule, and fluid intake logs) are stored strictly on your local device storage. We do not sell, rent, monetize, or transmit your personal hydration logs to third-party ad brokers.
              </p>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                2. Information We Collect and Why
              </h3>
              <ul className="list-disc list-inside space-y-1.5 pl-1">
                <li><strong>Body Weight:</strong> Utilized strictly on-device to compute the baseline standard wellness estimate (~30 mL/kg).</li>
                <li><strong>Biological Sex & Age Range:</strong> Collected to present recognized contextual intake benchmarks published by the European Food Safety Authority (EFSA) and WHO.</li>
                <li><strong>Sleep/Wake Schedule:</strong> Used locally by the Android notification engine to pause alerts during bedtime and quiet hours.</li>
                <li><strong>Intake Logs:</strong> Stored locally to render progress charts and daily streak records.</li>
              </ul>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                3. Optional Firebase Cloud Sync
              </h3>
              <p>
                If you optionally choose to sign in via Google Authentication, your hydration records are backed up securely to Firebase Firestore under your private authenticated user identifier (UID). You may disconnect cloud sync or permanently delete your cloud account at any moment via the Account Deletion portal.
              </p>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                4. Third-Party Analytics & Advertising
              </h3>
              <p>
                SipLumo contains <strong>ZERO third-party advertisement networks</strong>, no tracking cookies, and no data broker integrations.
              </p>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                5. Contact & Data Protection Officer
              </h3>
              <p>
                For privacy questions or data deletion requests, contact us at: <span className="font-mono text-sky-600">privacy@siplumo.app</span>
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
