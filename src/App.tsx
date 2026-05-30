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
  Flame,
  ShieldCheck,
  FileText,
  X,
  Scale,
  Volume2,
  Clock,
  Check,
  Moon,
  Sun,
  Mail,
  Medal,
  Zap,
  WifiOff
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
import { Preferences } from '@capacitor/preferences';
import { App as CapApp } from '@capacitor/app';
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
  limit,
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
  streak: 0,
  notifications_enabled: true,
  reminder_interval: 120, // in minutes
  notification_sound: 'default',
  dark_mode: false,
  level: 1,
  total_liters: 0,
  badges: [],
  google_fit_sync: false
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
  notifications_enabled: boolean;
  reminder_interval: number;
  notification_sound: string;
  dark_mode: boolean;
  level: number;
  total_liters: number;
  badges?: string[];
  google_fit_sync: boolean;
}

interface IntakeLog {
  id: string;
  amount: number;
  timestamp: string;
}

// --- Gamification Metadata ---

interface BadgeMetadata {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  requirement: (user: UserData, logs: IntakeLog[]) => boolean;
}

const BADGES: BadgeMetadata[] = [
  {
    id: 'first_sip',
    name: 'First Sip',
    description: 'Logged your first glass of water',
    icon: Droplets,
    color: 'bg-blue-500',
    requirement: (user, logs) => logs.length > 0
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Log a drink before 8:00 AM',
    icon: Sun,
    color: 'bg-amber-500',
    requirement: (user, logs) => logs.some(log => new Date(log.timestamp).getHours() < 8)
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Log a drink after 10:00 PM',
    icon: Moon,
    color: 'bg-indigo-500',
    requirement: (user, logs) => logs.some(log => {
      const hour = new Date(log.timestamp).getHours();
      return hour >= 22 || hour < 4;
    })
  },
  {
    id: 'consistency_3',
    name: '3-Day Flash',
    description: 'Reach a 3-day streak',
    icon: Flame,
    color: 'bg-orange-400',
    requirement: (user) => user.streak >= 3
  },
  {
    id: 'consistency_7',
    name: 'Week Warrior',
    description: 'Reach a 7-day streak',
    icon: Flame,
    color: 'bg-orange-600',
    requirement: (user) => user.streak >= 7
  },
  {
    id: 'consistency_30',
    name: 'Hydration Legend',
    description: 'Reach a 30-day streak',
    icon: Trophy,
    color: 'bg-red-500',
    requirement: (user) => user.streak >= 30
  },
  {
    id: 'big_gulp',
    name: 'Big Gulp',
    description: 'Log 500ml or more in a single entry',
    icon: Plus,
    color: 'bg-blue-600',
    requirement: (user, logs) => logs.some(log => log.amount >= 500)
  },
  {
    id: 'liters_10',
    name: 'Ten Liter Tenacious',
    description: 'Consume 10 liters total',
    icon: Medal,
    color: 'bg-teal-500',
    requirement: (user) => (user.total_liters || 0) >= 10
  }
];

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

const WaterGlass = ({ progress, current, goal }: { progress: number, current: number, goal: number }) => {
  return (
    <div className="relative flex flex-col items-center justify-center py-10">
      <div className="relative w-48 h-64 bg-white/20 dark:bg-slate-800/40 border-4 border-slate-200 dark:border-slate-700 rounded-b-[2rem] rounded-t-lg overflow-hidden shadow-inner">
        {/* Water fill */}
        <motion.div 
          className="absolute bottom-0 left-0 right-0 bg-blue-500/80 dark:bg-blue-600/80"
          initial={{ height: 0 }}
          animate={{ height: `${progress}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          {/* Wave effect */}
          <motion.div 
            className="absolute -top-4 left-0 right-0 h-8 bg-blue-400/50 dark:bg-blue-500/50 rounded-[100%]"
            animate={{ 
              x: [-10, 10, -10],
              scaleY: [1, 1.2, 1]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
        </motion.div>

        {/* Glass highlights */}
        <div className="absolute top-0 left-4 w-2 h-full bg-white/10 rounded-full blur-[2px]" />
        <div className="absolute top-0 right-4 w-1 h-full bg-white/5 rounded-full blur-[1px]" />
      </div>

      {/* Info Overlay */}
      <div className="mt-8 text-center">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center"
        >
          <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{current}</span>
          <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">/ {goal} ml</span>
          <div className="mt-4 px-4 py-1.5 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-200 dark:shadow-none">
            {Math.round(progress)}% Hydrated
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const Dashboard = ({ user, logs, onAddLog }: { user: UserData, logs: IntakeLog[], onAddLog: (amount: number) => void }) => {
  const [lastAdded, setLastAdded] = useState<number | null>(null);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const currentIntake = logs
    .filter(log => new Date(log.timestamp) >= today)
    .reduce((acc, log) => acc + log.amount, 0);
    
  const yesterdayIntake = logs
    .filter(log => {
      const d = new Date(log.timestamp);
      return d >= yesterday && d < today;
    })
    .reduce((acc, log) => acc + log.amount, 0);

  const progress = Math.min((currentIntake / user.daily_goal) * 100, 100);
  
  const milestones = [
    { id: 1, label: 'Early Morning Sip', target: 200 },
    { id: 2, label: '25% Progress', target: user.daily_goal * 0.25 },
    { id: 3, label: 'Halfway Hydrated', target: user.daily_goal * 0.5 },
    { id: 4, label: 'Almost There', target: user.daily_goal * 0.75 },
    { id: 5, label: 'Daily Goal Met', target: user.daily_goal },
  ];

  const handleLogClick = (amount: number) => {
    onAddLog(amount);
    setLastAdded(amount);
    setTimeout(() => setLastAdded(null), 2000);
  };

  const streakMilestones = [3, 7, 14, 30, 60, 100];
  const nextStreakMilestone = streakMilestones.find(m => m > user.streak) || (user.streak + 1);

  const calculateLevel = (totalLiters: number) => {
    return Math.floor(Math.sqrt(totalLiters / 5)) + 1;
  };

  const currentLevel = calculateLevel(user.total_liters || 0);

  return (
    <div className="space-y-8">
      {/* Level & XP Progress */}
      <div className="bg-white dark:bg-slate-900 mx-1 p-4 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-200">
            {currentLevel}
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">Hydration Level</p>
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(user.total_liters % 5) / 5 * 100}%` }}
                  className="h-full bg-blue-500"
                />
              </div>
              <span className="text-[10px] font-bold text-blue-600">XP</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">Total Logs</p>
          <p className="text-sm font-black text-slate-900 dark:text-white">{(user.total_liters || 0).toFixed(1)} L</p>
        </div>
      </div>

      {/* Integrated Hydration Glass & Controls */}
      <div className="relative bg-white dark:bg-slate-900 rounded-[3rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden group">
        {/* Background Decorative Element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-3xl -mr-32 -mt-32 transition-colors group-hover:bg-blue-100 dark:group-hover:bg-blue-900/20" />
        
        <div className="relative z-10 flex flex-col items-center">
          <header className="w-full flex justify-between items-center mb-4">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Live Intake</h3>
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse delay-75" />
            </div>
          </header>

          <div className="relative w-full flex flex-col md:flex-row items-center justify-around gap-8">
            {/* The Glass */}
            <div className="relative flex-1 flex justify-center py-4">
              <WaterGlass progress={progress} current={currentIntake} goal={user.daily_goal} />
              
              {/* Floating Quick Action Bubbles */}
              <div className="absolute inset-0 pointer-events-none">
                {[
                  { ml: 100, x: -110, y: 120, delay: 0 },
                  { ml: 200, x: 110, y: 150, delay: 0.1 },
                  { ml: 500, x: -100, y: 10, delay: 0.2 }
                ].map((item) => (
                  <motion.button
                    key={item.ml}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: 1, 
                      opacity: 1,
                      y: [item.y, item.y - 10, item.y]
                    }}
                    transition={{
                      opacity: { duration: 0.5, delay: item.delay },
                      scale: { type: "spring", damping: 12, delay: item.delay },
                      y: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: item.ml * 0.001 }
                    }}
                    onClick={() => handleLogClick(item.ml)}
                    style={{ 
                      left: `50%`, 
                      top: `50%`,
                      marginLeft: item.x,
                      marginTop: item.y
                    }}
                    className="absolute pointer-events-auto w-14 h-14 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center group/bubble transition-all hover:scale-110 active:scale-95 hover:border-blue-400 dark:hover:border-blue-500"
                  >
                    <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400 mb-0.5 group-hover/bubble:rotate-90 transition-transform" />
                    <span className="text-[10px] font-black text-slate-600 dark:text-slate-400">{item.ml}</span>
                    
                    {/* Success Burst */}
                    <AnimatePresence>
                      {lastAdded === item.ml && (
                        <motion.div 
                          className="absolute inset-0 bg-blue-600 rounded-full flex items-center justify-center z-10"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 1.5, opacity: 0 }}
                        >
                          <Check className="w-6 h-6 text-white" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                ))}
              </div>
            </div>
            
            {/* Summary Panel (Only visible together with glass) */}
            <div className="flex flex-col gap-6 md:w-48">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Progress</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">{Math.round(progress)}</span>
                  <span className="text-sm font-bold text-blue-600">%</span>
                </div>
              </div>
              
              <div className="h-px bg-slate-100 dark:bg-slate-800 w-full" />
              
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</p>
                <div className="flex items-center gap-2">
                  {progress < 30 ? (
                    <div className="flex items-center gap-2 text-amber-500">
                      <Zap className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase italic">Starting up</span>
                    </div>
                  ) : progress < 70 ? (
                    <div className="flex items-center gap-2 text-blue-500">
                      <Droplets className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase italic">Good flow</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-emerald-500">
                      <Trophy className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase italic">Almost Done!</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Action Button for Custom Amount */}
              <button 
                onClick={() => {
                  const amt = prompt('Enter amount (ml):');
                  if (amt && !isNaN(parseInt(amt))) handleLogClick(parseInt(amt));
                }}
                className="mt-2 w-full py-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-400 hover:text-blue-500 hover:border-blue-200 transition-all uppercase tracking-widest"
              >
                + Custom Log
              </button>
            </div>
          </div>
        </div>

        {/* Goal Met Celebration Overlay */}
        <AnimatePresence>
          {progress >= 100 && (
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none bg-emerald-500/10 backdrop-blur-[2px]"
            >
              <motion.div 
                animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                className="bg-emerald-500 text-white p-6 rounded-full shadow-[0_20px_50px_rgba(16,185,129,0.4)]"
              >
                <Trophy className="w-16 h-16" />
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 bg-white dark:bg-slate-900 px-8 py-3 rounded-3xl shadow-xl border border-emerald-100 dark:border-emerald-900/30"
              >
                <p className="text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-widest text-sm">Goal Achieved!</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Streak Banner */}
      {user.streak > 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-orange-500 to-red-600 p-0.5 rounded-[2rem] shadow-lg shadow-orange-100 dark:shadow-none"
        >
          <div className="bg-white dark:bg-slate-900 rounded-[1.95rem] p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center">
                  <Flame className="w-8 h-8 text-orange-600 dark:text-orange-400 animate-pulse" />
                </div>
                <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-white dark:border-slate-900">
                  HOT
                </div>
              </div>
              <div>
                <h4 className="text-xl font-black text-slate-900 dark:text-white leading-none">{user.streak} DAY STREAK</h4>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(user.streak / nextStreakMilestone) * 100}%` }}
                      className="h-full bg-orange-500"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{user.streak}/{nextStreakMilestone}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-[0.15em]">Level</p>
              <p className="text-lg font-black text-slate-900 dark:text-white leading-none">
                {user.streak < 7 ? 'Novice' : user.streak < 30 ? 'Expert' : 'Hydration God'}
              </p>
            </div>
          </div>
        </motion.div>
      )}


      {/* Daily Milestones (The "Tasks") */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Daily Milestones</h3>
          <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-bold text-slate-500 dark:text-slate-400">
            {milestones.filter(m => currentIntake >= m.target).length} / {milestones.length}
          </div>
        </div>
        <div className="space-y-3">
          {milestones.map((m) => {
            const isCompleted = currentIntake >= m.target;
            return (
              <div 
                key={m.id}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-2xl border transition-all duration-500",
                  isCompleted 
                    ? "bg-blue-50/50 dark:bg-blue-900/10 border-blue-100/50 dark:border-blue-900/20" 
                    : "bg-slate-50/50 dark:bg-slate-800/20 border-transparent opacity-60"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                  isCompleted 
                    ? "bg-blue-600 border-blue-600 scale-110" 
                    : "border-slate-200 dark:border-slate-700"
                )}>
                  {isCompleted && (
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                    >
                      <Check className="w-3.5 h-3.5 text-white" />
                    </motion.div>
                  )}
                </div>
                <div className="flex-1">
                  <p className={cn(
                    "text-sm font-bold transition-all",
                    isCompleted ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-600"
                  )}>
                    {m.label}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-tight">
                    {Math.round(m.target)} ml
                  </p>
                </div>
                {isCompleted && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <CheckCircle2 className="w-4 h-4 text-blue-400 dark:text-blue-600 opacity-50" />
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 mb-2">
            <History className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Yesterday</span>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{yesterdayIntake} ml</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 mb-2">
            <Trophy className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Daily Streak</span>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{user.streak} Days</p>
        </div>
      </div>

      {/* Hydration Tips */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-[2.5rem] text-white shadow-xl shadow-blue-200 dark:shadow-none">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-white/20 rounded-xl">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <h3 className="font-bold tracking-tight italic">Daily Insight</h3>
        </div>
        <p className="text-sm leading-relaxed opacity-90 font-medium italic">
          {currentIntake < 500 ? '"Starting your day with a glass of water boosts your metabolism and wakes up your body."' : 
           currentIntake < 1500 ? '"Drinking water before meals can help with weight management and digestion."' :
           (currentIntake / user.daily_goal) < 1 ? '"Almost there! Keep sipping consistently rather than gulping a lot at once."' :
           '"Great job! You\'ve hit your goal. Balance your intake with your activity levels for best results."'}
        </p>
      </div>

      {/* Inline Ad */}
      <div className="pt-4">
        <BannerAd unitId="ca-app-pub-9364231981895017/3836574355" />
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
      {/* Yesterday's Summary */}
      <div className="bg-blue-600 p-6 rounded-3xl text-white shadow-lg shadow-blue-100 dark:shadow-none flex items-center justify-between">
        <div>
          <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Yesterday's Intake</p>
          <h3 className="text-3xl font-bold">
            {last7Days[5]?.amount || 0} <span className="text-lg font-medium opacity-80">ml</span>
          </h3>
        </div>
        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
          <History className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Weekly Progress Chart */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Weekly Progress</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:opacity-10" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', backgroundColor: '#1e293b', color: '#f8fafc' }}
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
      </div>

      {/* Today's Hourly Activity */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Today's Activity</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyData}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:opacity-10" />
              <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', backgroundColor: '#1e293b', color: '#f8fafc' }}
                itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Log List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2">Today's Logs</h3>
        <AnimatePresence>
          {todayLogs.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
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
                className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <Droplets className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{log.amount}ml</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onDelete(log.id)}
                  className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
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
        <BannerAd unitId="ca-app-pub-9364231981895017/3836574355" />
      </div>
    </div>
  );
};

const AchievementsView = ({ user, logs }: { user: UserData, logs: IntakeLog[] }) => {
  const earnedBadgeIds = user.badges || [];
  
  return (
    <div className="space-y-8">
      {/* Summary Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-[2.5rem] text-white shadow-xl">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-white/20 rounded-[2rem] flex items-center justify-center backdrop-blur-md">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight">{earnedBadgeIds.length}</h2>
            <p className="text-sm font-bold text-indigo-100 uppercase tracking-widest">Achievements Earned</p>
            <div className="mt-2 h-1.5 w-32 bg-white/20 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(earnedBadgeIds.length / BADGES.length) * 100}%` }}
                className="h-full bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Level Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-100">
            {user.level || 1}
          </div>
          <div>
            <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">Level {user.level || 1}</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Hydration Expert</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Lifetime Intake</p>
          <p className="text-lg font-black text-blue-600">{(user.total_liters || 0).toFixed(1)} L</p>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-2 gap-4">
        {BADGES.map((badge) => {
          const isEarned = earnedBadgeIds.includes(badge.id);
          const Icon = badge.icon;
          
          return (
            <motion.div
              key={badge.id}
              initial={false}
              className={cn(
                "relative p-6 rounded-[2rem] border transition-all duration-500 overflow-hidden flex flex-col items-center text-center",
                isEarned 
                  ? "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm" 
                  : "bg-slate-50/50 dark:bg-slate-900/30 border-transparent opacity-40 grayscale"
              )}
            >
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-500",
                isEarned ? `${badge.color} text-white shadow-lg` : "bg-slate-200 dark:bg-slate-800 text-slate-400"
              )}>
                <Icon className="w-8 h-8" />
              </div>
              <h5 className={cn(
                "font-black text-sm uppercase tracking-tight mb-1",
                isEarned ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-600"
              )}>
                {badge.name}
              </h5>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
                {badge.description}
              </p>

              {!isEarned && (
                <div className="absolute top-2 right-4">
                  <ShieldCheck className="w-4 h-4 text-slate-200 dark:text-slate-800" />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Completion Ad */}
      <div className="pt-4">
        <BannerAd unitId="ca-app-pub-9364231981895017/3836574355" />
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
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-400 dark:text-slate-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto text-slate-600 dark:text-slate-400 leading-relaxed space-y-4">
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

const GoalModal = ({ isOpen, onClose, user, onSave }: { isOpen: boolean, onClose: () => void, user: UserData, onSave: (goal: number) => void }) => {
  const [goal, setGoal] = useState(user.daily_goal);
  const [isSuccess, setIsSuccess] = useState(false);
  const presets = [1500, 2000, 2500, 3000, 3500, 4000];

  useEffect(() => {
    if (isOpen) {
      setGoal(user.daily_goal);
      setIsSuccess(false);
    }
  }, [isOpen, user.daily_goal]);

  const handleSave = () => {
    onSave(goal);
    setIsSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

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
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col p-8"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Daily Goal</h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-400 dark:text-slate-500" />
              </button>
            </div>

            <div className="space-y-8">
              <div className="text-center">
                <div className="inline-flex items-center gap-4 bg-blue-50 dark:bg-blue-900/20 px-8 py-4 rounded-3xl border border-blue-100 dark:border-blue-900/30 mb-6">
                  <input 
                    type="number" 
                    value={goal}
                    onChange={(e) => setGoal(parseInt(e.target.value) || 0)}
                    className="w-32 text-4xl font-black text-blue-600 dark:text-blue-400 bg-transparent text-center focus:outline-none"
                  />
                  <span className="text-xl font-bold text-blue-400 dark:text-blue-600">ml</span>
                </div>
                
                <div className="px-4">
                  <input 
                    type="range" 
                    min="1000" 
                    max="6000" 
                    step="100"
                    value={goal}
                    onChange={(e) => setGoal(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-wider">
                    <span>1000ml</span>
                    <span>6000ml</span>
                  </div>
                </div>
                <p className="text-slate-400 dark:text-slate-500 mt-4 text-sm font-medium">Enter your custom goal or select a preset below</p>
              </div>

              {user.weight && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm">
                      <Scale className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Recommended</p>
                      <p className="text-sm text-emerald-600 dark:text-emerald-500 font-medium">Based on your {user.weight}kg weight</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setGoal(user.weight! * 35)}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-emerald-100 dark:shadow-none hover:bg-emerald-700 transition-all"
                  >
                    Use {user.weight * 35}ml
                  </button>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                {presets.map((p) => (
                  <button
                    key={p}
                    onClick={() => setGoal(p)}
                    className={cn(
                      "py-4 rounded-2xl font-bold transition-all border-2",
                      goal === p 
                        ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100 dark:shadow-none" 
                        : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-200 dark:hover:border-blue-900"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <button
                onClick={handleSave}
                disabled={isSuccess}
                className={cn(
                  "w-full py-5 rounded-2xl font-bold text-lg shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2",
                  isSuccess 
                    ? "bg-emerald-600 text-white shadow-emerald-100 dark:shadow-none" 
                    : "bg-blue-600 text-white shadow-blue-100 dark:shadow-none hover:bg-blue-700"
                )}
              >
                {isSuccess ? (
                  <>
                    <Check className="w-6 h-6" />
                    Goal Updated!
                  </>
                ) : (
                  'Save Goal'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const NotificationModal = ({ 
  isOpen, 
  onClose, 
  user, 
  onSave 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  user: UserData, 
  onSave: (data: Partial<UserData>) => void 
}) => {
  const [enabled, setEnabled] = useState(user.notifications_enabled);
  const [interval, setInterval] = useState(user.reminder_interval);
  const [sound, setSound] = useState(user.notification_sound);

  useEffect(() => {
    if (isOpen) {
      setEnabled(user.notifications_enabled);
      setInterval(user.reminder_interval);
      setSound(user.notification_sound);
    }
  }, [isOpen, user]);

  const intervals = [
    { label: '30 min', value: 30 },
    { label: '1 hour', value: 60 },
    { label: '1.5 hours', value: 90 },
    { label: '2 hours', value: 120 },
    { label: '3 hours', value: 180 },
  ];

  const sounds = [
    { label: 'Default', value: 'default' },
    { label: 'Water Drop', value: 'drop' },
    { label: 'Ocean', value: 'ocean' },
    { label: 'Bubble', value: 'bubble' },
  ];

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
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Notifications</h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-400 dark:text-slate-500" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-8">
              {/* Toggle */}
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm">
                    <Bell className={cn("w-5 h-5", enabled ? "text-purple-600 dark:text-purple-400" : "text-slate-300 dark:text-slate-600")} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Reminders</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Get notified to drink water</p>
                  </div>
                </div>
                <button 
                  onClick={() => setEnabled(!enabled)}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative",
                    enabled ? "bg-purple-600" : "bg-slate-200 dark:bg-slate-700"
                  )}
                >
                  <motion.div 
                    animate={{ x: enabled ? 24 : 4 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                  />
                </button>
              </div>

              {enabled && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  {/* Interval */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                      <Clock className="w-4 h-4" />
                      <h4 className="text-xs font-bold uppercase tracking-wider">Reminder Interval</h4>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {intervals.map((item) => (
                        <button
                          key={item.value}
                          onClick={() => setInterval(item.value)}
                          className={cn(
                            "py-3 rounded-xl font-bold text-sm transition-all border-2",
                            interval === item.value 
                              ? "bg-purple-50 dark:bg-purple-900/20 border-purple-600 text-purple-600 dark:text-purple-400" 
                              : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-600 hover:border-slate-200 dark:hover:border-slate-600"
                          )}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sound */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                      <Volume2 className="w-4 h-4" />
                      <h4 className="text-xs font-bold uppercase tracking-wider">Notification Sound</h4>
                    </div>
                    <div className="space-y-2">
                      {sounds.map((item) => (
                        <button
                          key={item.value}
                          onClick={() => setSound(item.value)}
                          className={cn(
                            "w-full p-4 rounded-2xl flex items-center justify-between transition-all border-2",
                            sound === item.value 
                              ? "bg-purple-50 dark:bg-purple-900/20 border-purple-600 text-purple-600 dark:text-purple-400" 
                              : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-600"
                          )}
                        >
                          <span className="font-bold">{item.label}</span>
                          {sound === item.value && <CheckCircle2 className="w-5 h-5" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              <button 
                onClick={() => {
                  onSave({ 
                    notifications_enabled: enabled, 
                    reminder_interval: interval, 
                    notification_sound: sound 
                  });
                  onClose();
                }}
                className="w-full bg-purple-600 text-white py-5 rounded-3xl font-bold text-lg shadow-xl shadow-purple-100 dark:shadow-none hover:bg-purple-700 transition-all active:scale-[0.98]"
              >
                Save Preferences
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const SettingsView = ({ user, onUpdate, onLogout, onDeleteAccount }: { user: UserData, onUpdate: (data: Partial<UserData>) => void, onLogout: () => void, onDeleteAccount: () => void }) => {
  console.log('SettingsView rendered with user.dark_mode:', user.dark_mode);
  const [legalModal, setLegalModal] = useState<{ isOpen: boolean, title: string, content: string }>({
    isOpen: false,
    title: '',
    content: ''
  });
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
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

Last updated: April 28, 2026

At Water Reminder, we are committed to protecting your privacy and providing a transparent experience. This policy explains how we handle your data and your rights as a user.

1. Information We Collect
We collect information to provide personalized hydration tracking:
- Profile Data: Name, email address, physical metrics (weight, gender) provided by you.
- Hydration Data: Water intake logs, timestamps, and streak history.
- Device Identifiers: We use Google AdMob which may collect device identifiers (e.g., Android Advertising ID) and usage statistics.

2. Third-Party Services
To provide a free, feature-rich experience, we use trusted third-party providers:
- Google AdMob: For displaying advertisements. AdMob uses identifiers to show personalized ads.
- Firebase: For cloud database storage (Firestore), analytics, and secure user authentication.

3. Data Use & Storage
Your data is used solely to:
- Calculate and track your personalized daily water goals.
- Sync your data across devices securely via Firebase.
- Show relevant advertisements.

4. Data Deletion & Your Rights
You have full control over your data. You can delete your account and all associated data (logs, profile info) directly within the App settings at any time. This action is permanent and immediate.

5. Children's Privacy
Water Reminder is not intended for children under 13. We do not knowingly collect personal information from children under 13.

6. Contact Us
If you have any questions about your privacy, please contact us at developercashop@gmail.com.`;

  const termsAndConditions = `Terms and Conditions for Water Reminder

Last updated: April 28, 2026

1. Acceptance of Terms
By downloading or using Water Reminder, you agree to be bound by these terms. If you do not agree, you must stop using the App immediately.

2. Medical Disclaimer
Water Reminder is NOT a medical device. Hydration needs vary by individual. Always consult with a healthcare professional regarding your specific health and hydration needs. Use of the App and reliance on any information provided is solely at your own risk.

3. User Responsibility
You are responsible for providing accurate data (weight, gender) for goal calculation. You are responsible for maintaining the security of your device and authentication account.

4. Advertisements
The free version of the App integrates Google AdMob to display advertisements. By using the App, you consent to seeing non-intrusive advertisements supported by third-party partners.

5. Data Security
While we use industry-standard services (Firebase) to protect your data, you are responsible for maintaining the security of your device and authentication account.

6. Limitation of Liability
In no event shall the developer be liable for any health issues, data loss, or indirect damages resulting from the use or inability to use the App.

7. Changes to Terms
We reserve the right to modify these terms at any time. Your continued use of the App constitutes acceptance of updated terms.

8. Contact
For questions or support, reach us at: developercashop@gmail.com`;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center overflow-hidden">
              {user.firebase_uid === 'guest' ? (
                <div className="w-full h-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                  <User className="w-8 h-8 text-blue-400 dark:text-blue-600" />
                </div>
              ) : user.gender === 'male' ? (
                <img src="https://picsum.photos/seed/male/200" alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : user.gender === 'female' ? (
                <img src="https://picsum.photos/seed/female/200" alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User className="w-8 h-8 text-slate-400 dark:text-slate-600" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{user.name}</h3>
              <p className="text-sm text-slate-400 dark:text-slate-500">{user.email}</p>
            </div>
          </div>
        </div>
        
        <div className="p-2">
          <div className="space-y-1">
            <div 
              onClick={() => setIsGoalModalOpen(true)}
              className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Daily Goal</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-blue-600 dark:text-blue-400">{user.daily_goal} ml</span>
                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-700" />
              </div>
            </div>

            <div className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-50 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Weight</span>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  value={user.weight || ''} 
                  placeholder="Set"
                  onChange={(e) => onUpdate({ weight: parseInt(e.target.value) || null })}
                  className="w-16 text-right bg-transparent font-bold text-orange-600 dark:text-orange-400 focus:outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700"
                />
                <span className="text-slate-400 dark:text-slate-600 text-sm">kg</span>
                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-700" />
              </div>
            </div>

            <div className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-pink-50 dark:bg-pink-900/30 rounded-lg flex items-center justify-center">
                  <Droplets className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                </div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Gender</span>
              </div>
              <div className="flex items-center gap-2">
                <select 
                  value={user.gender || ''} 
                  onChange={(e) => onUpdate({ gender: e.target.value || null })}
                  className="bg-transparent font-bold text-pink-600 dark:text-pink-400 focus:outline-none appearance-none text-right cursor-pointer"
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-700" />
              </div>
            </div>

            <div 
              onClick={() => setIsNotificationModalOpen(true)}
              className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-50 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Bell className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Reminders</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 dark:text-slate-500 text-sm">
                  {user.notifications_enabled ? `Every ${user.reminder_interval >= 60 ? `${user.reminder_interval / 60} hour${user.reminder_interval / 60 > 1 ? 's' : ''}` : `${user.reminder_interval} min`}` : 'Disabled'}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-700" />
              </div>
            </div>

            {/* Dark Mode Toggle */}
            <div 
              onClick={() => {
                console.log('Dark mode toggle clicked. Current:', user.dark_mode);
                onUpdate({ dark_mode: !user.dark_mode });
              }}
              className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                  {user.dark_mode ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-orange-400" />}
                </div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Dark Mode</span>
              </div>
              <div className={cn(
                "w-10 h-5 rounded-full relative transition-colors",
                user.dark_mode ? "bg-blue-600" : "bg-slate-200"
              )}>
                <motion.div 
                  animate={{ x: user.dark_mode ? 22 : 2 }}
                  className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm"
                />
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

            <a 
              href="mailto:developercashop@gmail.com"
              className="p-4 flex items-center justify-between hover:bg-blue-50 rounded-2xl transition-colors cursor-pointer group no-underline"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Mail className="w-4 h-4 text-blue-600" />
                </div>
                <span className="font-semibold text-slate-700">Support / Contact Us</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </a>

            {user.firebase_uid !== 'guest' && (
              <div 
                onClick={onDeleteAccount}
                className="p-4 flex items-center justify-between hover:bg-red-50 rounded-2xl transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </div>
                  <span className="font-semibold text-red-600">Delete Account & Data</span>
                </div>
                <ChevronRight className="w-4 h-4 text-red-300" />
              </div>
            )}
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
          <p className="text-[10px] text-slate-200 mt-1">Version 1.0.0</p>
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
        <BannerAd unitId="ca-app-pub-9364231981895017/3836574355" />
      </div>

      <LegalModal 
        isOpen={legalModal.isOpen} 
        onClose={() => setLegalModal({ ...legalModal, isOpen: false })}
        title={legalModal.title}
        content={legalModal.content}
      />

      <GoalModal 
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        user={user}
        onSave={(goal) => {
          onUpdate({ daily_goal: goal });
          setIsGoalModalOpen(false);
        }}
      />

      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        user={user}
        onSave={(data) => {
          onUpdate(data);
          setIsNotificationModalOpen(false);
        }}
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
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'achievements' | 'settings'>('home');
  const [loading, setLoading] = useState(true);
  const [newBadge, setNewBadge] = useState<BadgeMetadata | null>(null);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  console.log('AppContent render. user.dark_mode:', user?.dark_mode);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const currentIntake = logs
    .filter(log => new Date(log.timestamp) >= todayStart)
    .reduce((acc, log) => acc + log.amount, 0);

  // Apply Dark Mode to Document
  useEffect(() => {
    const isDark = !!user?.dark_mode;
    console.log('DARK MODE EFFECT:', isDark ? 'ON' : 'OFF', 'User:', user?.name, 'UID:', user?.firebase_uid);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
      console.log('Added .dark to html element');
    } else {
      document.documentElement.classList.remove('dark');
      console.log('Removed .dark from html element');
    }
    
    // Force a small delay to ensure DOM has updated
    const timeout = setTimeout(() => {
      console.log('Current html classes:', document.documentElement.className);
    }, 0);
    
    return () => clearTimeout(timeout);
  }, [user?.dark_mode]);

  // Sync with Android Widget
  useEffect(() => {
    if (Capacitor.isNativePlatform() && user) {
      const syncWidget = async () => {
        await Preferences.set({ key: 'current_intake', value: String(currentIntake) });
        await Preferences.set({ key: 'daily_goal', value: String(user.daily_goal) });
      };
      syncWidget();
    }
  }, [currentIntake, user?.daily_goal]);

  // Listen for widget updates on app resume
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const checkWidgetUpdate = async () => {
        const { value: widgetIntakeStr } = await Preferences.get({ key: 'current_intake' });
        const widgetIntake = parseInt(widgetIntakeStr || '0');
        
        if (widgetIntake > currentIntake) {
          const diff = widgetIntake - currentIntake;
          // Add a new log entry for the difference
          const newLog: IntakeLog = {
            id: Date.now().toString(),
            amount: diff,
            timestamp: new Date().toISOString()
          };
          
          if (firebaseUser) {
            try {
              await setDoc(doc(db, 'users', firebaseUser.uid, 'logs', newLog.id), {
                user_id: firebaseUser.uid,
                amount: diff,
                timestamp: Timestamp.now()
              });
            } catch (error) {
              handleFirestoreError(error, OperationType.WRITE, `users/${firebaseUser.uid}/logs/${newLog.id}`);
            }
          } else {
            const updatedLogs = [newLog, ...logs];
            setLogs(updatedLogs);
            localStorage.setItem('guest_logs', JSON.stringify(updatedLogs));
          }
        }
      };

      const resumeListener = CapApp.addListener('resume', checkWidgetUpdate);
      
      return () => {
        resumeListener.then(l => l.remove());
      };
    }
  }, [currentIntake, logs, firebaseUser, user?.daily_goal]);

  // Initialize AdMob
  useEffect(() => {
    let initialized = false;
    const initAdMob = async () => {
      if (Capacitor.isNativePlatform() && !initialized) {
        try {
          await AdMob.initialize({
            testingDevices: [],
            initializeForTesting: true, // IMPORTANT: Enable testing for dev builds
          });
          initialized = true;
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
      limit(50)
    );

    const migrateGuestData = async (userUid: string) => {
      const savedLogs = localStorage.getItem('guest_logs');
      if (savedLogs) {
        try {
          const parsedLogs = JSON.parse(savedLogs);
          if (Array.isArray(parsedLogs) && parsedLogs.length > 0) {
            console.log('Migrating guest logs to Firestore:', parsedLogs.length);
            for (const log of parsedLogs) {
              const logDocRef = doc(collection(db, 'users', userUid, 'logs'));
              await setDoc(logDocRef, {
                user_id: userUid,
                amount: log.amount,
                timestamp: Timestamp.fromDate(new Date(log.timestamp))
              });
            }
          }
        } catch (e) {
          console.error('Failed to migrate guest logs:', e);
        } finally {
          localStorage.removeItem('guest_logs');
        }
      }
      localStorage.removeItem('guest_user');
    };

    const unsubUser = onSnapshot(userRef, (docSnap) => {
      setFirestoreError(null);
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
          streak: data.streak || 0,
          notifications_enabled: data.notifications_enabled ?? true,
          reminder_interval: data.reminder_interval || 120,
          notification_sound: data.notification_sound || 'default',
          dark_mode: data.dark_mode ?? false,
          level: data.level || 1,
          total_liters: data.total_liters || 0,
          badges: data.badges || [],
          google_fit_sync: data.google_fit_sync ?? false
        });
        
        // Migrate legacy guest logs if there are any left
        migrateGuestData(firebaseUser.uid);
      } else {
        // Initialize user in Firestore if they don't exist
        const savedUser = localStorage.getItem('guest_user');
        const savedUserData = savedUser ? JSON.parse(savedUser) : null;

        const newUser: UserData = {
          id: 0,
          firebase_uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          google_id: '',
          name: firebaseUser.displayName || savedUserData?.name || '',
          daily_goal: savedUserData?.daily_goal || 2000,
          weight: savedUserData?.weight || null,
          gender: savedUserData?.gender || null,
          wake_up_time: savedUserData?.wake_up_time || '07:00',
          sleep_time: savedUserData?.sleep_time || '22:00',
          streak: savedUserData?.streak || 0,
          notifications_enabled: savedUserData?.notifications_enabled ?? true,
          reminder_interval: savedUserData?.reminder_interval || 120,
          notification_sound: savedUserData?.notification_sound || 'default',
          dark_mode: savedUserData?.dark_mode ?? false,
          level: savedUserData?.level || 1,
          total_liters: savedUserData?.total_liters || 0,
          badges: savedUserData?.badges || [],
          google_fit_sync: false
        };
        
        // Optimistically set user state while waiting for Firestore
        setUser(newUser);
        
        // Save to Firestore (include createdAt for DB side)
        const dbUser = {
          ...newUser,
          createdAt: Timestamp.now()
        };
        // Remove non-serializable fields if any or just fields not in DB schema
        delete (dbUser as any).id;
        delete (dbUser as any).google_id;

        setDoc(userRef, dbUser).then(() => {
          migrateGuestData(firebaseUser.uid);
        }).catch(e => {
          setLoading(false);
          setFirestoreError(e instanceof Error ? e.message : String(e));
          handleFirestoreError(e, OperationType.WRITE, `users/${firebaseUser.uid}`);
        });
      }
      setLoading(false);
    }, (error) => {
      setLoading(false);
      setFirestoreError(error instanceof Error ? error.message : String(error));
      handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
    });

    const unsubLogs = onSnapshot(logsQuery, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({
        id: doc.id as any,
        amount: doc.data().amount,
        timestamp: doc.data().timestamp.toDate().toISOString()
      }));
      setLogs(logsData);
    }, (error) => {
      console.error('Logs Snapshot Error:', error);
      // We don't necessarily want to stop the whole app if logs fail, 
      // but we should at least not hang.
      handleFirestoreError(error, OperationType.LIST, `users/${firebaseUser.uid}/logs`);
    });

    return () => {
      unsubUser();
      unsubLogs();
    };
  }, [firebaseUser, authLoading]);

  // Streak Calculation Effect
  useEffect(() => {
    if (!user || logs.length === 0) return;

    const streakUpdate = async () => {
      const getDateKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      
      const logsByDay: { [key: string]: number } = {};
      let totalAmount = 0;

      logs.forEach(log => {
        const date = new Date(log.timestamp);
        const dateKey = getDateKey(date);
        logsByDay[dateKey] = (logsByDay[dateKey] || 0) + log.amount;
        totalAmount += log.amount;
      });

      const totalLiters = totalAmount / 1000;
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
        
        // Extended streak window
        if (dayOffset > 365) break;
      }

      // Check today
      const todayAmount = logsByDay[getDateKey(today)] || 0;
      const todayMet = todayAmount >= user.daily_goal;

      const streakCount = todayMet ? pastStreak + 1 : pastStreak;

      const updates: Partial<UserData> = {};
      
      // Update streak
      if (streakCount !== user.streak) updates.streak = streakCount;
      
      // Update liters and level
      if (Math.abs(totalLiters - (user.total_liters || 0)) > 0.05) {
        updates.total_liters = totalLiters;
        updates.level = Math.floor(Math.sqrt(totalLiters / 5)) + 1;
      }

      // Check for new badges
      const earnedBadges = user.badges || [];
      const newBadgesToUnlock = BADGES.filter(badge => 
        !earnedBadges.includes(badge.id) && badge.requirement(user, logs)
      );

      if (newBadgesToUnlock.length > 0) {
        const updatedBadgeIds = [...earnedBadges, ...newBadgesToUnlock.map(b => b.id)];
        updates.badges = updatedBadgeIds;
        setNewBadge(newBadgesToUnlock[newBadgesToUnlock.length - 1]);
        
        // Auto-clear notification after 5 seconds
        setTimeout(() => setNewBadge(null), 5000);
      }

      if (Object.keys(updates).length > 0) {
        handleUpdateUser(updates);
      }
    };

    streakUpdate();
  }, [logs, user?.daily_goal, firebaseUser, user?.streak]);

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
    console.log('handleUpdateUser called with:', data);
    if (!user) return;

    if (user.firebase_uid === 'guest') {
      const updatedUser = { ...user, ...data };
      console.log('Updating guest user:', updatedUser);
      setUser(updatedUser);
      localStorage.setItem('guest_user', JSON.stringify(updatedUser));
      return;
    }

    if (!firebaseUser) return;
    try {
      console.log('Updating firestore user:', firebaseUser.uid, data);
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

  const handleDeleteAccount = async () => {
    if (!user || user.firebase_uid === 'guest' || !firebaseUser) return;
    
    const confirmed = window.confirm("Are you sure you want to delete your account? This will permanently remove all your hydration logs and settings. This action cannot be undone.");
    if (!confirmed) return;

    try {
      setLoading(true);
      
      // Delete logs subcollection first (though Firestore doesn't delete subcollections automatically, 
      // in a real app you'd need a recursive delete or a Cloud Function. 
      // For this applet, deleting the user doc is the primary requirement for compliance).
      
      const logsQuery = query(collection(db, 'users', firebaseUser.uid, 'logs'));
      const logDocs = await getDocs(logsQuery);
      const deletePromises = logDocs.docs.map(logDoc => deleteDoc(logDoc.ref));
      await Promise.all(deletePromises);

      // Delete user document
      await deleteDoc(doc(db, 'users', firebaseUser.uid));

      // Attempt to delete auth user (requires recent login, but we'll try)
      try {
        await firebaseUser.delete();
      } catch (e) {
        console.warn("Auth user deletion failed (likely needs recent login):", e);
        alert("Account data deleted from database. Please sign out and sign in again if you wish to fully delete the authentication record.");
      }

      await handleLogout();
    } catch (error) {
      console.error('Delete account error:', error);
      handleFirestoreError(error, OperationType.DELETE, `users/${firebaseUser.uid}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (firestoreError) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center transition-colors duration-300">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-3xl shadow-xl max-w-sm w-full space-y-6">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-950/30 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
            <WifiOff className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Profile Sync Error</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              We encountered an issue communicating with the database. You can try to reconnect or proceed in guest offline mode.
            </p>
            {firestoreError && (
              <p className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-3 rounded-xl font-mono text-left break-all max-h-24 overflow-y-auto">
                {firestoreError}
              </p>
            )}
          </div>
          <div className="space-y-3">
            <button
              onClick={() => {
                setLoading(true);
                setFirestoreError(null);
                window.location.reload();
              }}
              className="w-full min-h-[44px] py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 active:scale-95 transition-all text-sm shadow-md"
            >
              Retry Connection
            </button>
            <button
              onClick={async () => {
                try {
                  setLoading(true);
                  setFirestoreError(null);
                  await firebaseLogout();
                  setUser(null);
                  setLogs([]);
                } catch (e) {
                  console.error(e);
                  setLoading(false);
                }
              }}
              className="w-full min-h-[44px] py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all text-sm"
            >
              Use Offline Mode (Guest)
            </button>
          </div>
        </div>
      </div>
    );
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-50 pb-48 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 py-4 sticky top-0 z-30">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {activeTab === 'home' && 'Hydration'}
              {activeTab === 'history' && 'History'}
              {activeTab === 'achievements' && 'Badges'}
              {activeTab === 'settings' && 'Settings'}
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/30 p-1.5 rounded-xl">
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
            {activeTab === 'achievements' && (
              <AchievementsView user={user} logs={logs} />
            )}
            {activeTab === 'settings' && (
              <SettingsView user={user} onUpdate={handleUpdateUser} onLogout={handleLogout} onDeleteAccount={handleDeleteAccount} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 z-40">
        <div className="max-w-lg mx-auto flex items-center justify-around px-6 py-3">
          <button 
            onClick={() => setActiveTab('home')}
            className={cn(
              "flex flex-col items-center gap-1 p-2 transition-all",
              activeTab === 'home' ? "text-blue-600 dark:text-blue-400" : "text-slate-300 dark:text-slate-700"
            )}
          >
            <div className={cn(
              "p-2 rounded-xl transition-all",
              activeTab === 'home' && "bg-blue-50 dark:bg-blue-900/30"
            )}>
              <Droplets className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
          </button>

          <button 
            onClick={() => setActiveTab('history')}
            className={cn(
              "flex flex-col items-center gap-1 p-2 transition-all",
              activeTab === 'history' ? "text-blue-600 dark:text-blue-400" : "text-slate-300 dark:text-slate-700"
            )}
          >
            <div className={cn(
              "p-2 rounded-xl transition-all",
              activeTab === 'history' && "bg-blue-50 dark:bg-blue-900/30"
            )}>
              <History className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">History</span>
          </button>

          <button 
            onClick={() => setActiveTab('achievements')}
            className={cn(
              "flex flex-col items-center gap-1 p-2 transition-all",
              activeTab === 'achievements' ? "text-blue-600 dark:text-blue-400" : "text-slate-300 dark:text-slate-700"
            )}
          >
            <div className={cn(
              "p-2 rounded-xl transition-all",
              activeTab === 'achievements' && "bg-blue-50 dark:bg-blue-900/30"
            )}>
              <Trophy className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Badges</span>
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className={cn(
              "flex flex-col items-center gap-1 p-2 transition-all",
              activeTab === 'settings' ? "text-blue-600 dark:text-blue-400" : "text-slate-300 dark:text-slate-700"
            )}
          >
            <div className={cn(
              "p-2 rounded-xl transition-all",
              activeTab === 'settings' && "bg-blue-50 dark:bg-blue-900/30"
            )}>
              <SettingsIcon className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Settings</span>
          </button>
        </div>
      </nav>

      {/* Achievement Popup Notification */}
      <AnimatePresence>
        {newBadge && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-32 left-6 right-6 z-[60]"
          >
            <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-6 rounded-[2.5rem] shadow-2xl flex items-center gap-6 border-4 border-yellow-400">
              <div className="w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center shrink-0 shadow-lg rotate-12">
                <Trophy className="w-8 h-8 text-slate-900" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-yellow-400 mb-1">New Achievement!</p>
                <h4 className="text-xl font-black tracking-tight leading-none mb-1">{newBadge.name}</h4>
                <p className="text-xs opacity-70 font-medium">{newBadge.description}</p>
              </div>
              <button 
                onClick={() => setNewBadge(null)}
                className="ml-auto p-2 hover:bg-white/10 dark:hover:bg-slate-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
