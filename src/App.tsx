import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, WaterLog, ActiveTab, UnitSystem, DrinkType, ReminderSettings } from './types';
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
import { initializeNotifications, scheduleDailyReminders } from './utils/notifications';
import { initAdMob } from './utils/admobService';

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

export const App: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>(loadUserProfile());
  const [logs, setLogs] = useState<WaterLog[]>(loadWaterLogs());
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');

  // Modals & Subview States
  const [showWhyTarget, setShowWhyTarget] = useState(false);
  const [showRemindersModal, setShowRemindersModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showSelfTest, setShowSelfTest] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [legalTab, setLegalTab] = useState<'privacy' | 'terms' | 'deletion' | 'health_disclosure' | null>(null);

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

  // Initialize notifications and AdMob on boot
  useEffect(() => {
    initializeNotifications();
    initAdMob();
    if (profile.onboardingCompleted && profile.reminders.enabled) {
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
    setLogs(loadWaterLogs());

    // Trigger celebration if target reached just now
    const newTotal = prevTotal + amountMl;
    if (prevTotal < profile.dailyTargetMl && newTotal >= profile.dailyTargetMl && profile.celebrationEnabled) {
      setShowCelebration(true);
    }
  }, [todayTotalMl, profile.dailyTargetMl, profile.celebrationEnabled]);

  const handleUndoLastLog = useCallback(() => {
    undoLastLog();
    setLogs(loadWaterLogs());
  }, []);

  const handleUpdateLog = useCallback((id: string, amount: number, timestamp: string, drinkType: DrinkType, note?: string) => {
    updateWaterLog(id, amount, timestamp, drinkType, note);
    setLogs(loadWaterLogs());
  }, []);

  const handleDeleteLog = useCallback((id: string) => {
    deleteWaterLog(id);
    setLogs(loadWaterLogs());
  }, []);

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
  }, []);

  const handleUpdateTarget = useCallback((newTargetMl: number, isCustom: boolean) => {
    handleUpdateProfile({
      dailyTargetMl: newTargetMl,
      customTargetSet: isCustom
    });
  }, [handleUpdateProfile]);

  const handleSaveReminderSettings = useCallback((newSettings: ReminderSettings) => {
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 flex flex-col font-sans">
      
      {/* Main App Canvas Container (Constrained for mobile app feel on desktop) */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 pt-4 pb-24 overflow-x-hidden">
        
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
                todayTotalMl={todayTotalMl}
                onAddWater={handleAddWater}
                onUndoLastLog={handleUndoLastLog}
                onOpenWhyTarget={() => setShowWhyTarget(true)}
                onOpenReminders={() => setShowRemindersModal(true)}
                onOpenHistory={() => setActiveTab('history')}
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
              />
            )}

            {activeTab === 'tips' && <HydrationTipsView />}

            {activeTab === 'settings' && (
              <SettingsView
                profile={profile}
                logs={logs}
                onUpdateProfile={handleUpdateProfile}
                onRestoreLogs={(restoredLogs) => {
                  setLogs(restoredLogs);
                  saveWaterLogs(restoredLogs);
                }}
                onOpenReminders={() => setShowRemindersModal(true)}
                onOpenWhyTarget={() => setShowWhyTarget(true)}
                onOpenTutorial={() => setShowTutorialModal(true)}
                onOpenLegal={tab => setLegalTab(tab)}
                onOpenSelfTest={() => setShowSelfTest(true)}
                onResetApp={handleWipeAllData}
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

    </div>
  );
};

export default App;
