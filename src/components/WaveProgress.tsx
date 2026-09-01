import React from 'react';
import { UnitSystem } from '../types';
import { formatVolume, formatVolumeExact } from '../utils/calculations';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface WaveProgressProps {
  currentMl: number;
  targetMl: number;
  unitSystem: UnitSystem;
  onOpenWhyTarget?: () => void;
}

export const WaveProgress: React.FC<WaveProgressProps> = ({
  currentMl,
  targetMl,
  unitSystem,
  onOpenWhyTarget
}) => {
  const percentage = targetMl > 0 ? Math.min(100, Math.round((currentMl / targetMl) * 100)) : 0;
  const remainingMl = Math.max(0, targetMl - currentMl);
  const isCompleted = currentMl >= targetMl;

  // Wave height calculation: 0% is at bottom (translateY ~100%), 100% is at top (translateY ~0%)
  const waveTopPercent = 100 - percentage;

  return (
    <div className="flex flex-col items-center justify-center relative my-2">
      {/* Outer Circular Container */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full p-2 bg-gradient-to-b from-sky-100/80 to-teal-50 dark:from-slate-800 dark:to-slate-900 shadow-lg shadow-sky-500/10 border-4 border-sky-200/60 dark:border-slate-700/80 transition-all">
        {/* Overflow hidden circular container for the liquid waves */}
        <div className="relative w-full h-full rounded-full overflow-hidden bg-slate-100/90 dark:bg-slate-950 flex items-center justify-center shadow-inner">
          
          {/* Animated Liquid Waves */}
          <div
            className="absolute inset-x-0 bottom-0 transition-all duration-700 ease-out pointer-events-none"
            style={{
              top: `${Math.max(0, Math.min(100, waveTopPercent))}%`,
              height: '140%'
            }}
          >
            {/* Background Wave Layer */}
            <div
              className="absolute left-1/2 -top-16 w-[450px] h-[450px] -ml-[225px] rounded-[40%] bg-gradient-to-tr from-cyan-400/40 via-teal-400/30 to-sky-300/40 dark:from-cyan-700/40 dark:via-teal-800/40 dark:to-sky-600/30 animate-wave-float-slow opacity-80"
            />
            {/* Foreground Wave Layer */}
            <div
              className="absolute left-1/2 -top-16 w-[440px] h-[440px] -ml-[220px] rounded-[43%] bg-gradient-to-t from-sky-500/80 via-cyan-500/75 to-teal-400/70 dark:from-sky-600/80 dark:via-cyan-600/75 dark:to-teal-500/70 animate-wave-float opacity-90 shadow-lg"
            />
          </div>

          {/* Centered Content */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
            {isCompleted ? (
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/90 text-white text-xs font-semibold shadow-xs mb-1 animate-bounce">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Target Met
              </div>
            ) : (
              <span className="text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-300 drop-shadow-xs">
                Hydration Level
              </span>
            )}

            {/* Big Percentage Display */}
            <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white drop-shadow-sm flex items-baseline justify-center">
              <span>{percentage}</span>
              <span className="text-2xl font-semibold text-slate-600 dark:text-slate-300 ml-0.5">%</span>
            </div>

            {/* Current vs Target Amount */}
            <div className="mt-1 flex items-center justify-center gap-1.5 text-sm font-bold text-slate-800 dark:text-slate-100 drop-shadow-xs">
              <span className="text-sky-700 dark:text-sky-300">
                {formatVolumeExact(currentMl, unitSystem)}
              </span>
              <span className="text-slate-400 dark:text-slate-500 font-normal">/</span>
              <span className="text-slate-600 dark:text-slate-300">
                {formatVolumeExact(targetMl, unitSystem)}
              </span>
            </div>

            {/* Remaining Subtext */}
            <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              {remainingMl > 0 ? (
                <span>{formatVolumeExact(remainingMl, unitSystem)} to go</span>
              ) : (
                <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                  {currentMl > targetMl ? `+${formatVolumeExact(currentMl - targetMl, unitSystem)} surplus` : 'Goal reached!'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Why this target quick button */}
      {onOpenWhyTarget && (
        <button
          onClick={onOpenWhyTarget}
          className="mt-3 text-xs font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 inline-flex items-center gap-1 px-3 py-1.5 rounded-full hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors tap-active"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Why this target?</span>
        </button>
      )}
    </div>
  );
};
