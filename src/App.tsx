import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, WaterLog, ActiveTab, DrinkType, ReminderSettings } from './types';
import {
  loadUserProfile,
  saveUserProfile,
  loadWaterLogs,
  saveWaterLogs,
  addWaterLog,
  deleteWaterLog,
  updateWaterLog,
  undoLastLog,
  calculateStreak,
  clearAllData
} from './utils/storage';
import {
  initializeNotifications,
  scheduleDailyReminders,
  setOnReminderFiredListener,
  resetNextReminderFromNow,
  snoozeReminder,
  ReminderFiredEvent
} from './utils/notifications';
import { Droplets, BellRing, Plus, RotateCcw, X } from 'lucide-react';
import { initAdMob } from './utils/admobService';
import { useAuth } from './components/AuthProvider';
import { syncProgressToFirestore } from './utils/cloudSync';

// UI Subcomponents
import { Navigation } from './components/Navigation';
import { Home } from './components/Home';
import { HistoryView } from './components/HistoryView';
import { InsightsView } from './components/InsightsView';
import { HydrationTipsView } from './components/HydrationTipsView';
import { SettingsView } from './components/SettingsView';
import { OnboardingModal } from './components/OnboardingModal';
import { WhyTargetModal } from './components/WhyTargetModal';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { TargetReachedCelebration } from './components/TargetReachedCelebration';
import { LegalPages } from './components/LegalPages';
import { SelfTestModal } from './components/SelfTestModal';
import { AppTutorial } from './components/AppTutorial';
import { Achievements } from './components/Achievements';
import { MilestoneCelebrationModal } from './components/MilestoneCelebrationModal';
import { AuthModal } from './components/AuthModal';
import { calculateAchievements, UserAchievement } from './utils/achievements';

export const App: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(loadUserProfile());
  const [logs, setLogs] = useState<WaterLog[]>(loadWaterLogs());
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');

  // Modals & Subview States
  const [showWhyTarget, setShowWhyTarget] = useState(false);
  const [showRemindersModal, setShowRemindersModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showSelfTest, setShowSelfTest] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [unlockedMilestoneToCelebrate, setUnlockedMilestoneToCelebrate] = useState<UserAchievement | null>(null);
  const [legalTab, setLegalTab] = useState<'privacy' | 'terms' | 'deletion' | 'health_disclosure' | null>(null);
  const [activeReminderAlert, setActiveReminderAlert] = useState<ReminderFiredEvent | null>(null);

  // Today's date string YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter(l => l.timestamp.startsWith(todayStr));
  const todayTotalMl = todayLogs.reduce((sum, l) => sum + l.amount, 0);

  // Apply Dark Mode class to <html> element
  useEffect(() => {
    if (profile.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [profile.darkMode]);

  // Listen for on-time hydration reminder alerts
  useEffect(() => {
    setOnReminderFiredListener(event => {
      setActiveReminderAlert(event);
    });
    return () => {
      setOnReminderFiredListener(null);
    };
  }, []);

  // Sync authenticated user metadata into profile automatically
  useEffect(() => {
    if (user) {
      setProfile(prev => {
        const nextName =
          user.displayName && (prev.displayName === 'Hydration Friend' || !prev.displayName)
            ? user.displayName
            : prev.displayName;
        if (
          prev.firebase_uid === user.uid &&
          prev.email === (user.email || prev.email) &&
          prev.displayName === nextName &&
          prev.cloudSyncEnabled
        ) {
          return prev;
        }
        const updated: UserProfile = {
          ...prev,
          firebase_uid: user.uid,
          email: user.email || prev.email,
          displayName: nextName,
          cloudSyncEnabled: true
        };
        saveUserProfile(updated);
        return updated;
      });
    }
  }, [user]);

  // Initialize notifications and AdMob on boot
  useEffect(() => {
    initializeNotifications();
    initAdMob();
    if (profile.onboardingCompleted) {
      scheduleDailyReminders(profile.reminders, todayTotalMl, profile.dailyTargetMl);
    }
  }, [profile.onboardingCompleted, profile.reminders, todayTotalMl, profile.dailyTargetMl]);

  // Recalculate streak whenever logs or target changes
  useEffect(() => {
    const { currentStreak, bestStreak } = calculateStreak(logs, profile);
    const totalMl = logs.reduce((sum, l) => sum + l.amount, 0);

    if (currentStreak !== profile.streak || totalMl !== profile.totalDrankMl) {
      const updated: UserProfile = {
        ...profile,
        streak: currentStreak,
        bestStreak: Math.max(profile.bestStreak || 0, bestStreak),
        totalDrankMl: totalMl
      };
      setProfile(updated);
      saveUserProfile(updated);
    }
  }, [logs, profile.dailyTargetMl, profile.dayTargetOverrides]);

  // Check and persist newly unlocked achievements
  useEffect(() => {
    if (!profile.onboardingCompleted) return;
    const { achievements, newlyUnlockedIds } = calculateAchievements(profile, logs);
    if (newlyUnlockedIds.length > 0) {
      const nowIso = new Date().toISOString();
      const updatedMap = { ...(profile.unlockedBadges || {}) };
      newlyUnlockedIds.forEach(id => {
        updatedMap[id] = nowIso;
      });

      const updatedProfile = {
        ...profile,
        unlockedBadges: updatedMap
      };
      setProfile(updatedProfile);
      saveUserProfile(updatedProfile);

      // Trigger celebration modal for the first newly unlocked milestone
      const firstNewlyUnlocked = achievements.find(a => newlyUnlockedIds.includes(a.id));
      if (firstNewlyUnlocked && profile.celebrationEnabled) {
        setUnlockedMilestoneToCelebrate(firstNewlyUnlocked);
      }
    }
  }, [profile.streak, profile.bestStreak, profile.totalDrankMl, logs.length, profile.onboardingCompleted]);

  // Update profile helper
  const handleUpdateProfile = useCallback((updatedProps: Partial<UserProfile>) => {
    setProfile(prev => {
      const merged = { ...prev, ...updatedProps };
      saveUserProfile(merged);
      return merged;
    });
  }, []);

  // Water Log Actions
  const handleAddWater = useCallback((amountMl: number, drinkType?: DrinkType, note?: string) => {
    const prevTotal = todayTotalMl;
    addWaterLog(amountMl, drinkType, note);
    const updatedLogs = loadWaterLogs();
    setLogs(updatedLogs);

    if (profile.reminders?.enabled) {
      resetNextReminderFromNow(profile.reminders.intervalMinutes || 90);
    }

    if (user?.uid) {
      syncProgressToFirestore(user.uid, profile, updatedLogs).catch(() => {});
    }

    // Trigger celebration if target reached just now
    const newTotal = prevTotal + amountMl;
    if (prevTotal < profile.dailyTargetMl && newTotal >= profile.dailyTargetMl && profile.celebrationEnabled) {
      setShowCelebration(true);
    }
  }, [todayTotalMl, profile, user]);

  const handleUndoLastLog = useCallback(() => {
    undoLastLog();
    const updatedLogs = loadWaterLogs();
    setLogs(updatedLogs);
    if (user?.uid) {
      syncProgressToFirestore(user.uid, profile, updatedLogs).catch(() => {});
    }
  }, [user, profile]);

  const handleUpdateLog = useCallback((id: string, amount: number, timestamp: string, drinkType: DrinkType, note?: string) => {
    updateWaterLog(id, amount, timestamp, drinkType, note);
    const updatedLogs = loadWaterLogs();
    setLogs(updatedLogs);
    if (user?.uid) {
      syncProgressToFirestore(user.uid, profile, updatedLogs).catch(() => {});
    }
  }, [user, profile]);

  const handleDeleteLog = useCallback((id: string) => {
    deleteWaterLog(id);
    const updatedLogs = loadWaterLogs();
    setLogs(updatedLogs);
    if (user?.uid) {
      syncProgressToFirestore(user.uid, profile, updatedLogs).catch(() => {});
    }
  }, [user, profile]);

  const handleAddLogForDate = useCallback((amount: number, dateIso: string, drinkType: DrinkType = 'water') => {
    const newLog: WaterLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      amount,
      timestamp: dateIso,
      drinkType,
      synced: false
    };
    const current = loadWaterLogs();
    const updated = [...current, newLog];
    saveWaterLogs(updated);
    setLogs(updated);
    if (user?.uid) {
      syncProgressToFirestore(user.uid, profile, updated).catch(() => {});
    }
  }, [user, profile]);

  const handleUpdateTarget = useCallback((newTargetMl: number, isCustom: boolean) => {
    handleUpdateProfile({
      dailyTargetMl: newTargetMl,
      customTargetSet: isCustom
    });
  }, [handleUpdateProfile]);

  const handleSaveReminderSettings = useCallback((newSettings: ReminderSettings) => {
    if (newSettings.enabled) {
      resetNextReminderFromNow(newSettings.intervalMinutes || 90);
    }
    handleUpdateProfile({ reminders: newSettings });
    scheduleDailyReminders(newSettings, todayTotalMl, profile.dailyTargetMl);
  }, [handleUpdateProfile, todayTotalMl, profile.dailyTargetMl]);

  const handleWipeAllData = useCallback(() => {
    clearAllData();
    const fresh = loadUserProfile();
    setProfile(fresh);
    setLogs([]);
    setActiveTab('home');
    setLegalTab(null);
  }, []);

  // First Launch Onboarding
  if (!profile.onboardingCompleted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <OnboardingModal
          onComplete={newProfile => {
            setProfile(newProfile);
            saveUserProfile(newProfile);
          }}
          language={profile.language}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 flex flex-col font-sans overflow-x-hidden">
      {/* On-Time Floating Hydration Reminder Alert Banner */}
      {activeReminderAlert && (
        <div
          role="alert"
          data-testid="active-reminder-banner"
          className="fixed top-3 left-3 right-3 sm:left-auto sm:right-6 sm:w-full sm:max-w-md z-50 bg-slate-900/95 dark:bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-sky-500/50 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/40 text-sky-400 flex items-center justify-center shrink-0">
                <BellRing className="w-5 h-5 animate-bounce" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white truncate">
                    {activeReminderAlert.title}
                  </h4>
                  <span className="text-[11px] font-medium text-sky-300 shrink-0">
                    {activeReminderAlert.firedAt}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  {activeReminderAlert.body}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveReminderAlert(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 shrink-0"
              aria-label="Dismiss reminder"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                handleAddWater(250, 'water');
                setActiveReminderAlert(null);
              }}
              className="flex-1 py-2 px-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors tap-active"
            >
              <Droplets className="w-3.5 h-3.5 shrink-0" />
              <Plus className="w-3.5 h-3.5 shrink-0 -ml-1" />
              <span>Drink {profile.unitSystem === 'imperial' ? '8.5 oz' : '250 mL'} Now</span>
            </button>

            <button
              type="button"
              onClick={() => {
                snoozeReminder(profile.reminders?.snoozeMinutes || 15);
                setActiveReminderAlert(null);
              }}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors tap-active shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span>Snooze {profile.reminders?.snoozeMinutes || 15}m</span>
            </button>
          </div>
        </div>
      )}

      {/* Responsive App Canvas Container */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-5 md:px-8 pt-[max(0.875rem,env(safe-area-inset-top))] pb-28 sm:pb-32 overflow-x-hidden">
        {/* Render Active View / Tab */}
        {legalTab !== null ? (
          <LegalPages
            initialTab={legalTab}
            onBack={() => setLegalTab(null)}
            onWipeAllData={handleWipeAllData}
          />
        ) : (
          <>
            {activeTab === 'home' && (
              <Home
                profile={profile}
                todayLogs={todayLogs}
                allLogs={logs}
                todayTotalMl={todayTotalMl}
                onAddWater={handleAddWater}
                onUndoLastLog={handleUndoLastLog}
                onOpenWhyTarget={() => setShowWhyTarget(true)}
                onOpenReminders={() => setShowRemindersModal(true)}
                onOpenHistory={() => setActiveTab('history')}
                onOpenAchievements={() => setShowAchievementsModal(true)}
                onOpenAuthModal={() => setShowAuthModal(true)}
              />
            )}

            {activeTab === 'history' && (
              <HistoryView
                logs={logs}
                profile={profile}
                unitSystem={profile.unitSystem}
                onUpdateLog={handleUpdateLog}
                onDeleteLog={handleDeleteLog}
                onAddLogForDate={handleAddLogForDate}
              />
            )}

            {activeTab === 'insights' && (
              <InsightsView
                logs={logs}
                profile={profile}
                unitSystem={profile.unitSystem}
                onClearAllHistory={handleWipeAllData}
                onOpenAchievements={() => setShowAchievementsModal(true)}
              />
            )}

            {activeTab === 'achievements' && (
              <Achievements
                profile={profile}
                logs={logs}
                onBack={() => setActiveTab('home')}
              />
            )}

            {activeTab === 'tips' && <HydrationTipsView />}

            {activeTab === 'settings' && (
              <SettingsView
                profile={profile}
                logs={logs}
                onUpdateProfile={handleUpdateProfile}
                onRestoreLogs={restoredLogs => {
                  setLogs(restoredLogs);
                  saveWaterLogs(restoredLogs);
                }}
                onOpenReminders={() => setShowRemindersModal(true)}
                onOpenWhyTarget={() => setShowWhyTarget(true)}
                onOpenTutorial={() => setShowTutorialModal(true)}
                onOpenLegal={tab => setLegalTab(tab)}
                onOpenSelfTest={() => setShowSelfTest(true)}
                onResetApp={handleWipeAllData}
                onOpenAchievements={() => setShowAchievementsModal(true)}
                onOpenAuthModal={() => setShowAuthModal(true)}
              />
            )}
          </>
        )}
      </main>

      {/* Bottom Navigation Bar */}
      {legalTab === null && (
        <Navigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          language={profile.language}
        />
      )}

      {/* Account & Cloud Backup Modal */}
      {showAuthModal && (
        <AuthModal
          profile={profile}
          logs={logs}
          onUpdateProfile={handleUpdateProfile}
          onRestoreLogs={restoredLogs => {
            setLogs(restoredLogs);
            saveWaterLogs(restoredLogs);
          }}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {/* Quick Tutorial Modal */}
      {showTutorialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <AppTutorial
            isModal
            onFinish={() => setShowTutorialModal(false)}
          />
        </div>
      )}

      {/* Why Target Modal */}
      {showWhyTarget && (
        <WhyTargetModal
          profile={profile}
          onClose={() => setShowWhyTarget(false)}
          onUpdateTarget={handleUpdateTarget}
          unitSystem={profile.unitSystem}
        />
      )}

      {/* Notification Settings Modal */}
      {showRemindersModal && (
        <NotificationSettingsModal
          reminders={profile.reminders}
          onSave={handleSaveReminderSettings}
          onClose={() => setShowRemindersModal(false)}
        />
      )}

      {/* Target Reached Celebration Modal */}
      {showCelebration && (
        <TargetReachedCelebration
          dailyTargetMl={profile.dailyTargetMl}
          unitSystem={profile.unitSystem}
          onDismiss={() => setShowCelebration(false)}
        />
      )}

      {/* Automated Self Test Modal */}
      {showSelfTest && (
        <SelfTestModal onClose={() => setShowSelfTest(false)} />
      )}

      {/* Achievements & Virtual Medals Modal */}
      {showAchievementsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-md my-auto">
            <Achievements
              profile={profile}
              logs={logs}
              onBack={() => setShowAchievementsModal(false)}
              isModal
            />
          </div>
        </div>
      )}

      {/* Streak Milestone Celebration Modal */}
      {unlockedMilestoneToCelebrate && (
        <MilestoneCelebrationModal
          achievement={unlockedMilestoneToCelebrate}
          onDismiss={() => setUnlockedMilestoneToCelebrate(null)}
          onViewAllBadges={() => {
            setUnlockedMilestoneToCelebrate(null);
            setShowAchievementsModal(true);
          }}
        />
      )}
    </div>
  );
};

export default App;
