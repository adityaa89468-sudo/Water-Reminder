import React, { useId } from 'react';
import { UnitSystem } from '../types';
import { formatVolumeExact } from '../utils/calculations';
import { CheckCircle2, Droplet } from 'lucide-react';

export interface RadialProgressBarProps {
  currentMl: number;
  targetMl: number;
  unitSystem: UnitSystem;
  onOpenWhyTarget?: () => void;
  size?: number;
  strokeWidth?: number;
  showTicks?: boolean;
  className?: string;
}

export const RadialProgressBar: React.FC<RadialProgressBarProps> = ({
  currentMl,
  targetMl,
  unitSystem,
  size = 240,
  strokeWidth = 16,
  className = ''
}) => {
  const gradientId = useId();

  const rawPercentage = targetMl > 0 ? (currentMl / targetMl) * 100 : 0;
  const displayPercentage = Math.round(rawPercentage);
  const clampedPercentage = Math.min(rawPercentage, 100);
  const remainingMl = Math.max(0, targetMl - currentMl);
  const isCompleted = currentMl >= targetMl;

  const center = size / 2;
  const radius = center - strokeWidth - 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedPercentage / 100) * circumference;

  return (
    <div
      role="progressbar"
      aria-valuenow={displayPercentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Daily Hydration Goal Progress"
      className={`relative w-full flex flex-col items-center justify-center select-none ${className}`}
    >
      <div
        className="relative w-full max-w-[200px] min-[380px]:max-w-[224px] sm:max-w-[240px] aspect-square mx-auto"
      >
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-full transform -rotate-90 origin-center transition-all duration-300"
        >
          <defs>
            <linearGradient id={`${gradientId}-normal`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>

            <linearGradient id={`${gradientId}-completed`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>

          {/* Background Track Circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-100 dark:text-slate-800"
          />

          {/* Progress Arc */}
          {clampedPercentage > 0 && (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={`url(#${isCompleted ? `${gradientId}-completed` : `${gradientId}-normal`})`}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{
                transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            />
          )}
        </svg>

        {/* Central Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 sm:p-6 pointer-events-none">
          {isCompleted ? (
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[11px] sm:text-xs font-semibold mb-0.5 sm:mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>Goal Reached</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-sky-600 dark:text-sky-400 text-[11px] sm:text-xs font-medium mb-0.5 sm:mb-1">
              <Droplet className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-sky-500 text-sky-500 shrink-0" />
              <span>Today</span>
            </div>
          )}

          {/* Percentage */}
          <div className="flex items-baseline justify-center">
            <span className="text-4xl min-[380px]:text-5xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
              {displayPercentage}
            </span>
            <span className="text-xl min-[380px]:text-2xl font-bold text-slate-400 dark:text-slate-500 ml-0.5">
              %
            </span>
          </div>

          {/* Current vs Target */}
          <div className="mt-1 sm:mt-1.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
            <span>{formatVolumeExact(currentMl, unitSystem)}</span>
            <span className="text-slate-400 font-normal mx-1">of</span>
            <span className="text-slate-500 dark:text-slate-400">{formatVolumeExact(targetMl, unitSystem)}</span>
          </div>

          {/* Friendly Remaining Subtext */}
          <div className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
            {remainingMl > 0 ? (
              <span>{formatVolumeExact(remainingMl, unitSystem)} left today</span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                You hit your goal!
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
