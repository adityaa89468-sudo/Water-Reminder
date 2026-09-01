import React, { useState } from 'react';
import {
  Bell,
  Clock,
  Moon,
  Volume2,
  Vibrate,
  Calendar,
  Zap,
  Check,
  X,
  PauseCircle,
  PlayCircle,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { ReminderSettings, ReminderMode } from '../types';
import { LocalNotifications } from '@capacitor/local-notifications';

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
  const [settings, setSettings] = useState<ReminderSettings>({ ...reminders });
  const [permissionRequested, setPermissionRequested] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleDayToggle = (dayIdx: number) => {
    const active = [...settings.activeDays];
    const index = active.indexOf(dayIdx);
    if (index > -1) {
      if (active.length > 1) {
        active.splice(index, 1);
      }
    } else {
      active.push(dayIdx);
      active.sort();
    }
    setSettings({ ...settings, activeDays: active });
  };

  const handleRequestPermission = async () => {
    try {
      setPermissionRequested(true);
      const isCapacitor = typeof (window as any).Capacitor !== 'undefined';
      if (isCapacitor) {
        const perm = await LocalNotifications.requestPermissions();
        setPermissionGranted(perm.display === 'granted');
      } else if ('Notification' in window) {
        const res = await Notification.requestPermission();
        setPermissionGranted(res === 'granted');
      } else {
        setPermissionGranted(true);
      }
    } catch (e) {
      console.warn('Permission request error:', e);
      setPermissionGranted(true);
    }
  };

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const isPausedToday = settings.pausedUntilDate === todayStr;

  const togglePauseToday = () => {
    setSettings({
      ...settings,
      pausedUntilDate: isPausedToday ? null : todayStr
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5 my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Smart Reminders
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Customizable, gentle hydration alerts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master Enabled Toggle */}
        <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white block">
              Enable Reminders
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Receive periodic notifications during active hours
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={e => setSettings({ ...settings, enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
          </label>
        </div>

        {/* Quick Pause for the day */}
        {settings.enabled && (
          <div className="flex items-center justify-between px-3 py-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
              {isPausedToday ? <PauseCircle className="w-4 h-4 text-amber-600" /> : <PlayCircle className="w-4 h-4 text-emerald-600" />}
              <span>{isPausedToday ? 'Reminders currently paused today' : 'Reminders active today'}</span>
            </div>
            <button
              type="button"
              onClick={togglePauseToday}
              className={`px-3 py-1 rounded-xl font-bold text-xs transition-colors ${
                isPausedToday
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 hover:bg-amber-300'
              }`}
            >
              {isPausedToday ? 'Resume' : 'Pause Today'}
            </button>
          </div>
        )}

        {/* Reminder Settings List */}
        {settings.enabled && (
          <div className="space-y-4 text-xs">
            
            {/* Mode: Smart vs Fixed */}
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Scheduling Logic
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, mode: 'smart' })}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    settings.mode === 'smart'
                      ? 'bg-sky-100 dark:bg-sky-950 border-sky-500 text-sky-900 dark:text-sky-200 font-bold'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1 font-bold">
                    <Zap className="w-3.5 h-3.5 text-sky-600" />
                    <span>Smart Pace</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 font-normal leading-tight">
                    Reminds you only when behind your hourly target pace.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, mode: 'fixed' })}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    settings.mode === 'fixed'
                      ? 'bg-sky-100 dark:bg-sky-950 border-sky-500 text-sky-900 dark:text-sky-200 font-bold'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1 font-bold">
                    <Clock className="w-3.5 h-3.5 text-sky-600" />
                    <span>Fixed Interval</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 font-normal leading-tight">
                    Strict, rhythmic timer every X minutes.
                  </p>
                </button>
              </div>
            </div>

            {/* Active Window: Start & End Times */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="font-bold text-slate-900 dark:text-white block">
                Active Reminder Hours
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 block mb-0.5">Start Time</span>
                  <input
                    type="time"
                    value={settings.startTime}
                    onChange={e => setSettings({ ...settings, startTime: e.target.value })}
                    className="w-full text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block mb-0.5">End Time</span>
                  <input
                    type="time"
                    value={settings.endTime}
                    onChange={e => setSettings({ ...settings, endTime: e.target.value })}
                    className="w-full text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Interval Options */}
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Reminder Interval
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { min: 30, label: '30m' },
                  { min: 45, label: '45m' },
                  { min: 60, label: '1 hour' },
                  { min: 90, label: '1.5 hr' },
                  { min: 120, label: '2 hours' },
                  { min: 180, label: '3 hours' },
                  { min: 240, label: '4 hours' }
                ].map(item => (
                  <button
                    key={item.min}
                    type="button"
                    onClick={() => setSettings({ ...settings, intervalMinutes: item.min })}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      settings.intervalMinutes === item.min
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Days Selection */}
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Active Weekdays
              </label>
              <div className="grid grid-cols-7 gap-1">
                {daysOfWeek.map((day, idx) => {
                  const isActive = settings.activeDays.includes(idx);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayToggle(idx)}
                      className={`py-2 rounded-xl text-[11px] font-bold border text-center transition-all ${
                        isActive
                          ? 'bg-sky-600 text-white border-sky-600'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quiet Hours */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                  <Moon className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Quiet Hours</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.quietHoursEnabled}
                  onChange={e => setSettings({ ...settings, quietHoursEnabled: e.target.checked })}
                  className="rounded-sm text-sky-600"
                />
              </div>

              {settings.quietHoursEnabled && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-0.5">Silence From</span>
                    <input
                      type="time"
                      value={settings.quietHoursStart}
                      onChange={e => setSettings({ ...settings, quietHoursStart: e.target.value })}
                      className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-1"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-0.5">Until</span>
                    <input
                      type="time"
                      value={settings.quietHoursEnd}
                      onChange={e => setSettings({ ...settings, quietHoursEnd: e.target.value })}
                      className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-1"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Notification Permission Request Explainer */}
            <div className="p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-2xl flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2 text-sky-900 dark:text-sky-200">
                <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Local notification permissions</span>
              </div>
              <button
                type="button"
                onClick={handleRequestPermission}
                className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold"
              >
                {permissionGranted ? 'Granted' : 'Check / Allow'}
              </button>
            </div>

          </div>
        )}

        {/* Save Actions */}
        <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-2xl"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-2xl shadow-md flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Apply Reminders</span>
          </button>
        </div>

      </div>
    </div>
  );
};
