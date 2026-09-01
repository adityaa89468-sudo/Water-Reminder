import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Award, Check, Sparkles, X } from 'lucide-react';
import { formatVolumeExact } from '../utils/calculations';
import { UnitSystem } from '../types';

interface TargetReachedCelebrationProps {
  dailyTargetMl: number;
  unitSystem: UnitSystem;
  onDismiss: () => void;
}

export const TargetReachedCelebration: React.FC<TargetReachedCelebrationProps> = ({
  dailyTargetMl,
  unitSystem,
  onDismiss
}) => {
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 65,
        origin: { y: 0.6 },
        colors: ['#0284c7', '#06b6d4', '#14b8a6', '#38bdf8', '#fbbf24']
      });
    } catch (e) {
      console.log('Confetti error:', e);
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in zoom-in-95 duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center space-y-4 relative">
        <button
          onClick={onDismiss}
          className="absolute right-4 top-4 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-sky-500 to-teal-400 text-white flex items-center justify-center mx-auto shadow-lg shadow-sky-500/20">
          <Award className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-sky-600 dark:text-sky-400">
            Goal Accomplished
          </span>
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            Target Reached!
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
            You completed your daily target of{' '}
            <strong className="text-slate-900 dark:text-white">
              {formatVolumeExact(dailyTargetMl, unitSystem)}
            </strong>
            . Maintaining consistent hydration supports daily vitality and focus.
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={onDismiss}
            className="w-full py-3 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white rounded-2xl font-bold text-xs shadow-md transition-all tap-active"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};
