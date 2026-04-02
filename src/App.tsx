import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Droplets,
  Plus, 
  History, 
  Settings as SettingsIcon, 
  LogOut, 
  User, 
  ChevronRight, 
  Trash2,
  Bell,
  CheckCircle2,
  Trophy,
  ShieldCheck,
  FileText,
  X
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart,
  Bar,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from './components/AuthProvider';
import BannerAd from './components/BannerAd';
import { AdMob } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { 
  loginWithGoogle, 
  logout as firebaseLogout,
  requestNotificationPermissions,
  getFCMToken,
  addNotificationListener,
  db,
  auth,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  Timestamp,
  handleFirestoreError,
  OperationType
} from './firebase';

// --- Error Boundary ---
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      let message = "Something went wrong.";
      try {
        const errObj = JSON.parse(this.state.error.message);
        message = `Firestore Error: ${errObj.error} during ${errObj.operationType} on ${errObj.path}`;
      } catch (e) {
        message = this.state.error?.message || message;
      }

      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-red-50 p-6 rounded-3xl border border-red-100 max-w-md">
            <h2 className="text-xl font-bold text-red-600 mb-2">Application Error</h2>
            <p className="text-slate-600 mb-6">{message}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-700 transition-colors"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
const GUEST_USER: UserData = {
  id: 0,
  google_id: '',
  firebase_uid: 'guest',
  email: 'Guest User',
  name: 'Guest',
  daily_goal: 2000,
  weight: null,
  gender: null,
  wake_up_time: '07:00',
  sleep_time: '22:00',
  streak: 0
};

interface UserData {
  id: number;
  google_id: string;
  firebase_uid: string;
  email: string;
  name: string;
  daily_goal: number;
  weight: number | null;
  gender: string | null;
  wake_up_time: string;
  sleep_time: string;
  streak: number;
}

interface IntakeLog {
  id: string;
  amount: number;
  timestamp: string;
}

// --- Components ---

const AppLogo = ({ className = "w-12 h-12" }: { className?: string, color?: string }) => (
  <div className={cn("relative flex items-center justify-center overflow-hidden rounded-2xl", className)}>
    <img 
      src="/logo.png" 
      alt="Water Reminder Logo" 
      className="w-full h-full object-contain"
      referrerPolicy="no-referrer"
    />
  </div>
);

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      className="fixed inset-0 bg-blue-600 flex flex-col items-center justify-center z-50"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="relative"
      >
        <AppLogo className="w-32 h-32" color="white" />
      </motion.div>
      <motion.h1 
        className="text-white text-3xl font-bold mt-6 tracking-tight uppercase"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        Water Reminder
      </motion.h1>
      <motion.p 
        className="text-teal-100 mt-1 font-bold uppercase tracking-[0.3em] text-[10px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        Stay Hydrated
      </motion.p>
    </motion.div>
  );
};

const Dashboard = ({ user, logs, onAddLog }: { user: UserData, logs: IntakeLog[], onAddLog: (amount: number) => void }) => {
  const currentIntake = logs.reduce((acc, log) => acc + log.amount, 0);
  const progress = Math.min((currentIntake / user.daily_goal) * 100, 100);
  
  return (
    <div className="space-y-8">
      {/* Progress Circle */}
      <div className="relative flex justify-center py-8">
        <div className="relative w-64 h-64">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              className="text-slate-100"
            />
            <motion.circle
              cx="128"
              cy="128"
              r="120"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 120}
              initial={{ strokeDashoffset: 2 * Math.PI * 120 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 120 * (1 - progress / 100) }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="text-blue-500"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-slate-900">{currentIntake}</span>
            <span className="text-slate-400 font-medium">/ {user.daily_goal} ml</span>
            <div className="mt-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider">
              {Math.round(progress)}% Goal
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add */}
      <div className="grid grid-cols-3 gap-4">
        {[100, 200, 500].map((amount) => (
          <button
            key={amount}
            onClick={() => onAddLog(amount)}
            className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group"
          >
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mb-2 group-hover:bg-blue-100 transition-colors">
              <Plus className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-bold text-slate-700">{amount}ml</span>
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Bell className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Next Reminder</span>
          </div>
          <p className="text-xl font-bold text-slate-900">14:30</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Trophy className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Daily Streak</span>
          </div>
          <p className="text-xl font-bold text-slate-900">{user.streak} Days</p>
        </div>
      </div>

      {/* Inline Ad */}
      <div className="pt-4">
        <BannerAd unitId="ca-app-pub-9364231981895017/8732039399" />
      </div>
    </div>
  );
};

const HistoryView = ({ logs, onDelete, dailyGoal }: { logs: IntakeLog[], onDelete: (id: string) => void, dailyGoal: number }) => {
  // Today's hourly activity
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayLogs = logs.filter(log => new Date(log.timestamp) >= today);
  
  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    const hour = i;
    const amount = todayLogs
      .filter(log => new Date(log.timestamp).getHours() === hour)
      .reduce((sum, log) => sum + log.amount, 0);
    return { hour: `${hour}:00`, amount };
  }).filter(d => d.amount > 0 || (parseInt(d.hour) % 4 === 0));

  // Weekly progress
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const total = logs
      .filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate.getDate() === d.getDate() && 
               logDate.getMonth() === d.getMonth() && 
               logDate.getFullYear() === d.getFullYear();
      })
      .reduce((sum, log) => sum + log.amount, 0);
      
    return { day: dayName, amount: total, goal: dailyGoal };
  });

  return (
    <div className="space-y-6">
      {/* Weekly Progress Chart */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Weekly Progress</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                itemStyle={{ fontWeight: 'bold' }}
              />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                {last7Days.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.amount >= entry.goal ? '#3b82f6' : '#94a3b8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs font-medium text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
            <span>Goal Met</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-slate-300 rounded-sm"></div>
            <span>Below Goal</span>
          </div>
        </div>
      </div>

      {/* Today's Hourly Activity */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Today's Activity</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyData}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Log List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-2">Today's Logs</h3>
        <AnimatePresence>
          {todayLogs.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
              <History className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-sm">No logs for today yet</p>
            </div>
          ) : (
            todayLogs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Droplets className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{log.amount}ml</p>
                    <p className="text-xs text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onDelete(log.id)}
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Inline Ad */}
      <div className="pt-4">
        <BannerAd unitId="ca-app-pub-9364231981895017/8732039399" />
      </div>
    </div>
  );
};

const LegalModal = ({ isOpen, onClose, title, content }: { isOpen: boolean, onClose: () => void, title: string, content: string }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="relative w-full max-w-lg bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">{title}</h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto text-slate-600 leading-relaxed space-y-4">
              {content.split('\n\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const SettingsView = ({ user, onUpdate, onLogout }: { user: UserData, onUpdate: (data: Partial<UserData>) => void, onLogout: () => void }) => {
  const [legalModal, setLegalModal] = useState<{ isOpen: boolean, title: string, content: string }>({
    isOpen: false,
    title: '',
    content: ''
  });
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      await loginWithGoogle();
    } catch (error: any) {
      console.error('Login error:', error);
      alert(`Login failed: ${error.message}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const privacyPolicy = `Privacy Policy for Water Reminder

Last updated: March 31, 2026

At Water Reminder, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your information.

1. Information Collection
We collect information you provide directly to us, such as your name, email address, weight, and gender, to provide personalized hydration goals. We also store your water intake logs.

2. Data Storage
Your data is stored securely using Firebase, a Google Cloud service. We use authentication to ensure only you can access your data.

3. Use of Information
We use your information to calculate your daily water goal, track your progress, and send reminders. We do not sell your personal information to third parties.

4. Third-Party Services
We use Google AdMob to display advertisements. AdMob may collect certain information to provide relevant ads.

5. Your Rights
You can update or delete your profile information and intake logs at any time within the app settings.

6. Changes to This Policy
We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.`;

  const termsAndConditions = `Terms and Conditions for Water Reminder

Last updated: March 31, 2026

Please read these Terms and Conditions carefully before using the Water Reminder mobile application.

1. Acceptance of Terms
By accessing or using the app, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the app.

2. Health Disclaimer
Water Reminder is intended for informational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition or hydration needs.

3. User Accounts
You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.

4. Intellectual Property
The app and its original content, features, and functionality are and will remain the exclusive property of the app developer.

5. Limitation of Liability
In no event shall the app developer be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, or other intangible losses.

6. Governing Law
These Terms shall be governed and construed in accordance with the laws of your jurisdiction, without regard to its conflict of law provisions.`;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden">
              {user.firebase_uid === 'guest' ? (
                <div className="w-full h-full bg-blue-50 flex items-center justify-center">
                  <User className="w-8 h-8 text-blue-400" />
                </div>
              ) : user.gender === 'male' ? (
                <img src="https://picsum.photos/seed/male/200" alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : user.gender === 'female' ? (
                <img src="https://picsum.photos/seed/female/200" alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User className="w-8 h-8 text-slate-400" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900">{user.name}</h3>
              <p className="text-sm text-slate-400">{user.email}</p>
            </div>
          </div>
        </div>
        
        <div className="p-2">
          <div className="space-y-1">
            <div className="p-4 flex items-center justify-between hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                </div>
                <span className="font-semibold text-slate-700">Daily Goal</span>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  value={user.daily_goal} 
                  onChange={(e) => onUpdate({ daily_goal: parseInt(e.target.value) })}
                  className="w-20 text-right bg-transparent font-bold text-blue-600 focus:outline-none"
                />
                <span className="text-slate-400 text-sm">ml</span>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </div>
            </div>

            <div className="p-4 flex items-center justify-between hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Bell className="w-4 h-4 text-purple-600" />
                </div>
                <span className="font-semibold text-slate-700">Reminders</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-sm">Every 2 hours</span>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {user.firebase_uid === 'guest' && (
        <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-lg shadow-blue-100 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <h4 className="text-lg font-bold mb-1">Want to save your activity?</h4>
            <p className="text-blue-100 text-sm mb-4 opacity-90">Sign in to sync your data across devices and never lose your progress.</p>
            <button 
              onClick={handleSignIn}
              disabled={isLoggingIn}
              className="w-full bg-white text-blue-600 font-bold py-3 rounded-xl shadow-sm hover:bg-blue-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoggingIn ? (
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" />
                  Sign in with Google
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-50">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Legal</h4>
        </div>
        <div className="p-2">
          <div className="space-y-1">
            <div 
              onClick={() => setLegalModal({ isOpen: true, title: 'Privacy Policy', content: privacyPolicy })}
              className="p-4 flex items-center justify-between hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="font-semibold text-slate-700">Privacy Policy</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </div>

            <div 
              onClick={() => setLegalModal({ isOpen: true, title: 'Terms & Conditions', content: termsAndConditions })}
              className="p-4 flex items-center justify-between hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-amber-600" />
                </div>
                <span className="font-semibold text-slate-700">Terms & Conditions</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center pt-8 pb-4 space-y-4">
        <img 
          src="/logo.png" 
          alt="Water Reminder Logo" 
          className="w-12 h-12 object-contain opacity-20 grayscale"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className="text-center">
          <p className="text-xs font-bold text-slate-300 uppercase tracking-[0.2em]">Water Reminder</p>
          <p className="text-[10px] text-slate-300 mt-0.5 font-medium">Made by Aditya</p>
          <p className="text-[10px] text-slate-200 mt-1">Version 1.0.0 (Build 20260331)</p>
        </div>
      </div>

      {user.firebase_uid !== 'guest' && (
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </button>
      )}

      {/* Inline Ad */}
      <div className="pt-8">
        <BannerAd unitId="ca-app-pub-9364231981895017/8732039399" />
      </div>

      <LegalModal 
        isOpen={legalModal.isOpen} 
        onClose={() => setLegalModal({ ...legalModal, isOpen: false })}
        title={legalModal.title}
        content={legalModal.content}
      />
    </div>
  );
};

// --- Main App ---

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const { user: firebaseUser, loading: authLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);
  const [logs, setLogs] = useState<IntakeLog[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'settings'>('home');
  const [loading, setLoading] = useState(true);

  // Initialize AdMob
  useEffect(() => {
    const initAdMob = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          await AdMob.initialize({
            testingDevices: [],
            initializeForTesting: true,
          });
          console.log('AdMob Initialized');
        } catch (e) {
          console.error('AdMob Initialization Failed', e);
        }
      }
    };
    initAdMob();
  }, []);

  // Initialize FCM
  useEffect(() => {
    const initFCM = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const granted = await requestNotificationPermissions();
          if (granted) {
            const token = await getFCMToken();
            console.log('FCM Token:', token);
            if (firebaseUser && token) {
              const userRef = doc(db, 'users', firebaseUser.uid);
              await updateDoc(userRef, { fcmToken: token });
            }
          }

          await addNotificationListener((notification) => {
            console.log('Notification Received:', notification);
            // You can show a custom toast or alert here if needed
          });
        } catch (e) {
          console.error('FCM Initialization Failed', e);
        }
      }
    };
    initFCM();
  }, [firebaseUser]);

  // Firestore Listeners
  useEffect(() => {
    if (authLoading) return;

    if (!firebaseUser) {
      // Load guest data from localStorage
      const savedUser = localStorage.getItem('guest_user');
      const savedLogs = localStorage.getItem('guest_logs');
      
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      } else {
        setUser(GUEST_USER);
      }
      
      if (savedLogs) {
        setLogs(JSON.parse(savedLogs));
      } else {
        setLogs([]);
      }
      
      setLoading(false);
      return;
    }

    const userRef = doc(db, 'users', firebaseUser.uid);
    const logsRef = collection(db, 'users', firebaseUser.uid, 'logs');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    
    const logsQuery = query(
      logsRef, 
      where('timestamp', '>=', Timestamp.fromDate(thirtyDaysAgo)),
      orderBy('timestamp', 'desc')
    );

    const unsubUser = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUser({
          id: 0, // Legacy ID
          google_id: '',
          firebase_uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: data.name || firebaseUser.displayName || '',
          daily_goal: data.daily_goal || 2000,
          weight: data.weight || null,
          gender: data.gender || null,
          wake_up_time: data.wake_up_time || '07:00',
          sleep_time: data.sleep_time || '22:00',
          streak: data.streak || 0
        });
      } else {
        // Initialize user in Firestore if they don't exist
        const newUser = {
          firebase_uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || '',
          daily_goal: 2000,
          streak: 0,
          createdAt: Timestamp.now()
        };
        setDoc(userRef, newUser).catch(e => handleFirestoreError(e, OperationType.WRITE, `users/${firebaseUser.uid}`));
      }
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`));

    const unsubLogs = onSnapshot(logsQuery, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({
        id: doc.id as any,
        amount: doc.data().amount,
        timestamp: doc.data().timestamp.toDate().toISOString()
      }));
      setLogs(logsData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${firebaseUser.uid}/logs`));

    return () => {
      unsubUser();
      unsubLogs();
    };
  }, [firebaseUser, authLoading]);

  // Streak Calculation Effect
  useEffect(() => {
    if (!firebaseUser || !user || logs.length === 0) return;

    const calculateStreak = async () => {
      const getDateKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      
      const logsByDay: { [key: string]: number } = {};
      logs.forEach(log => {
        const date = new Date(log.timestamp);
        const dateKey = getDateKey(date);
        logsByDay[dateKey] = (logsByDay[dateKey] || 0) + log.amount;
      });

      const today = new Date();
      
      // Check backwards from yesterday
      let dayOffset = 1;
      let pastStreak = 0;

      while (true) {
        const checkDate = new Date();
        checkDate.setDate(today.getDate() - dayOffset);
        const checkKey = getDateKey(checkDate);
        
        if ((logsByDay[checkKey] || 0) >= user.daily_goal) {
          pastStreak++;
          dayOffset++;
        } else {
          break;
        }
        
        if (dayOffset > 30) break;
      }

      // Check today
      const todayAmount = logsByDay[getDateKey(today)] || 0;
      const todayMet = todayAmount >= user.daily_goal;

      const streakCount = todayMet ? pastStreak + 1 : pastStreak;

      if (streakCount !== user.streak) {
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          await updateDoc(userRef, { streak: streakCount });
        } catch (error) {
          console.error("Error updating streak:", error);
        }
      }
    };

    calculateStreak();
  }, [logs, user?.daily_goal, firebaseUser]);

  const handleAddLog = async (amount: number) => {
    if (!user) return;

    const newLog: IntakeLog = {
      id: Math.random().toString(36).substr(2, 9),
      amount,
      timestamp: new Date().toISOString()
    };

    if (user.firebase_uid === 'guest') {
      const updatedLogs = [newLog, ...logs];
      setLogs(updatedLogs);
      localStorage.setItem('guest_logs', JSON.stringify(updatedLogs));
      return;
    }

    if (!firebaseUser) return;
    try {
      const logsRef = collection(db, 'users', firebaseUser.uid, 'logs');
      await setDoc(doc(logsRef), {
        user_id: firebaseUser.uid,
        amount,
        timestamp: Timestamp.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${firebaseUser.uid}/logs`);
    }
  };

  const handleDeleteLog = async (id: string | number) => {
    if (!user) return;

    if (user.firebase_uid === 'guest') {
      const updatedLogs = logs.filter(log => log.id !== id);
      setLogs(updatedLogs);
      localStorage.setItem('guest_logs', JSON.stringify(updatedLogs));
      return;
    }

    if (!firebaseUser) return;
    try {
      const logRef = doc(db, 'users', firebaseUser.uid, 'logs', id.toString());
      await deleteDoc(logRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${firebaseUser.uid}/logs/${id}`);
    }
  };

  const handleUpdateUser = async (data: Partial<UserData>) => {
    if (!user) return;

    if (user.firebase_uid === 'guest') {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem('guest_user', JSON.stringify(updatedUser));
      return;
    }

    if (!firebaseUser) return;
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      await updateDoc(userRef, data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${firebaseUser.uid}`);
    }
  };

  const handleLogout = async () => {
    try {
      await firebaseLogout();
      setUser(null);
      setLogs([]);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user && !authLoading) {
    // This should ideally not happen with the guest logic, but as a fallback
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-48">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-30">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {activeTab === 'home' && 'Hydration'}
              {activeTab === 'history' && 'History'}
              {activeTab === 'settings' && 'Settings'}
            </h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>
          <div className="bg-blue-50 p-1.5 rounded-xl">
            <AppLogo className="w-7 h-7" color="#2563eb" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-6 pt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'home' && (
              <Dashboard user={user} logs={logs} onAddLog={handleAddLog} />
            )}
            {activeTab === 'history' && (
              <HistoryView logs={logs} onDelete={handleDeleteLog} dailyGoal={user.daily_goal} />
            )}
            {activeTab === 'settings' && (
              <SettingsView user={user} onUpdate={handleUpdateUser} onLogout={handleLogout} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-40">
        <div className="max-w-lg mx-auto flex items-center justify-around px-6 py-3">
          <button 
            onClick={() => setActiveTab('home')}
            className={cn(
              "flex flex-col items-center gap-1 p-2 transition-all",
              activeTab === 'home' ? "text-blue-600" : "text-slate-300"
            )}
          >
            <div className={cn(
              "p-2 rounded-xl transition-all",
              activeTab === 'home' && "bg-blue-50"
            )}>
              <Droplets className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
          </button>

          <button 
            onClick={() => setActiveTab('history')}
            className={cn(
              "flex flex-col items-center gap-1 p-2 transition-all",
              activeTab === 'history' ? "text-blue-600" : "text-slate-300"
            )}
          >
            <div className={cn(
              "p-2 rounded-xl transition-all",
              activeTab === 'history' && "bg-blue-50"
            )}>
              <History className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">History</span>
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className={cn(
              "flex flex-col items-center gap-1 p-2 transition-all",
              activeTab === 'settings' ? "text-blue-600" : "text-slate-300"
            )}
          >
            <div className={cn(
              "p-2 rounded-xl transition-all",
              activeTab === 'settings' && "bg-blue-50"
            )}>
              <SettingsIcon className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
