import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  Clock,
  Moon,
  X,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Volume2,
  Vibrate,
  ShieldCheck
} from 'lucide-react';
import { ReminderSettings } from '../types';
import {
  getNotificationPermissionState,
  requestAppNotificationPermission,
  fireHydrationReminderNow,
  resetNextReminderFromNow
} from '../utils/notifications';

interface NotificationSettingsModalProps {
  reminders: ReminderSettings;
  onSave: (newSettings: ReminderSettings) => void;
  onClose: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  reminders,
  onSave,
  onClose
}) => {
  const [settings, setSettings] = useState<ReminderSettings>({
    ...reminders,
    soundEnabled: reminders.soundEnabled !== false,
    vibrationEnabled: reminders.vibrationEnabled !== false,
    snoozeMinutes: reminders.snoozeMinutes || 15
  });
  const [permissionState, setPermissionState] = useState<'granted' | 'denied' | 'default' | 'unsupported'>('default');
  const [testSentMessage, setTestSentMessage] = useState<string | null>(null);

  useEffect(() => {
    setPermissionState(getNotificationPermissionState());
  }, []);

  const intervalOptions = [
    { label: '1 min (Test)', value: 1 },
    { label: '15m', value: 15 },
    { label: '30m', value: 30 },
    { label: '45m', value: 45 },
    { label: '1 hour', value: 60 },
    { label: '1.5 hr', value: 90 },
    { label: '2 hours', value: 120 },
    { label: '3 hours', value: 180 }
  ];

  const handleRequestPermission = async () => {
    const granted = await requestAppNotificationPermission();
    setPermissionState(getNotificationPermissionState());
    if (granted) {
      setTestSentMessage('Browser & system notifications enabled!');
      setTimeout(() => setTestSentMessage(null), 2600);
    }
  };

  const handleSendTestAlert = async () => {
    await requestAppNotificationPermission();
    setPermissionState(getNotificationPermissionState());
    await fireHydrationReminderNow(settings, 1000, 2200, true);
    setTestSentMessage('Test reminder triggered on time!');
    setTimeout(() => setTestSentMessage(null), 2600);
  };

  const handleSave = () => {
    if (settings.enabled) {
      resetNextReminderFromNow(settings.intervalMinutes || 90);
    }
    onSave(settings);
    onClose();
  };

  const togglePauseToday = () => {
    if (settings.pausedUntilDate) {
      setSettings({ ...settings, pausedUntilDate: null });
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(6, 0, 0, 0);
      setSettings({ ...settings, pausedUntilDate: tomorrow.toISOString() });
    }
  };

  const isPausedToday =
    settings.pausedUntilDate && new Date(settings.pausedUntilDate) > new Date();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-md my-auto bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 shadow-2xl border border-slate-200/90 dark:border-slate-800 space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950 border border-sky-200/80 dark:border-sky-800/80 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                Water Reminders
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                On-time alerts, sound & quiet hours
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Banner */}
        {testSentMessage && (
          <div className="p-3 rounded-2xl bg-sky-600 text-white text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{testSentMessage}</span>
          </div>
        )}

        {/* Master Toggle */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 flex items-center justify-between gap-3">
          <div>
            <span className="text-sm font-semibold text-slate-900 dark:text-white block">
              Daily Water Reminders
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Notify me on time throughout the day
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
            className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors shrink-0 ${
              settings.enabled ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                settings.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {settings.enabled && (
          <div className="space-y-4">
            {/* Browser/System Notification Status + Test Button */}
            <div className="p-3.5 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-900/60 space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    System Permission:{' '}
                    <span
                      className={
                        permissionState === 'granted'
                          ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                          : 'text-amber-600 dark:text-amber-400 font-bold'
                      }
                    >
                      {permissionState === 'granted'
                        ? 'Allowed'
                        : permissionState === 'denied'
                          ? 'Blocked (In-App + Chime Active)'
                          : 'Tap to Allow'}
                    </span>
                  </span>
                </div>
                {permissionState !== 'granted' && permissionState !== 'unsupported' && (
                  <button
                    type="button"
                    onClick={handleRequestPermission}
                    className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-colors"
                  >
                    Allow Alerts
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleSendTestAlert}
                className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 hover:bg-sky-100/60 dark:hover:bg-slate-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors tap-active"
              >
                <BellRing className="w-4 h-4 shrink-0" />
                <span>Send Test Notification & Chime Now</span>
              </button>
            </div>

            {/* Pause Today Action */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {isPausedToday ? (
                  <PlayCircle className="w-4 h-4 text-amber-600 shrink-0" />
                ) : (
                  <PauseCircle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <span className="text-xs font-medium text-amber-900 dark:text-amber-200 truncate">
                  {isPausedToday ? 'Paused until tomorrow' : 'Pause reminders for today'}
                </span>
              </div>
              <button
                type="button"
                onClick={togglePauseToday}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-300 transition-colors shrink-0"
              >
                {isPausedToday ? 'Resume' : 'Pause Today'}
              </button>
            </div>

            {/* Reminder Frequency */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-500" /> Remind Me Every
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {intervalOptions.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSettings({ ...settings, intervalMinutes: opt.value })}
                    className={`py-2.5 px-2 rounded-xl font-semibold text-xs border transition-all ${
                      settings.intervalMinutes === opt.value
                        ? 'border-sky-500 bg-sky-500 text-white shadow-sm'
                        : 'border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Hours / Quiet Hours */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Moon className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>Active Hours (Silent at Night)</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                    Morning Start
                  </span>
                  <input
                    type="time"
                    value={settings.startTime || '08:00'}
                    onChange={e => setSettings({ ...settings, startTime: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                    Night Stop
                  </span>
                  <input
                    type="time"
                    value={settings.endTime || '22:00'}
                    onChange={e => setSettings({ ...settings, endTime: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Sound, Vibration & Stop After Goal Options */}
            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 cursor-pointer gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Volume2 className="w-4 h-4 text-sky-500 shrink-0" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                    Play water drop chime sound
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={e => setSettings({ ...settings, soundEnabled: e.target.checked })}
                  className="w-4 h-4 accent-sky-500 rounded shrink-0"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 cursor-pointer gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Vibrate className="w-4 h-4 text-sky-500 shrink-0" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                    Vibrate on reminder
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.vibrationEnabled}
                  onChange={e => setSettings({ ...settings, vibrationEnabled: e.target.checked })}
                  className="w-4 h-4 accent-sky-500 rounded shrink-0"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 cursor-pointer gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                    Stop reminders after reaching daily goal
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.stopAfterGoalReached}
                  onChange={e =>
                    setSettings({ ...settings, stopAfterGoalReached: e.target.checked })
                  }
                  className="w-4 h-4 accent-sky-500 rounded shrink-0"
                />
              </label>
            </div>
          </div>
        )}

        {/* Save Button */}
        <button
          type="button"
          onClick={handleSave}
          className="w-full py-3.5 px-6 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm shadow-lg shadow-sky-500/20 transition-all"
        >
          Save Schedule
        </button>
      </div>
    </div>
  );
};
