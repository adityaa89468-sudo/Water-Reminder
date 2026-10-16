import React, { useId } from 'react';
import { UnitSystem } from '../types';
import { formatVolumeExact } from '../utils/calculations';
import { CheckCircle2, Sparkles, Droplet, Info, Award, Zap } from 'lucide-react';

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
  onOpenWhyTarget,
  size = 280,
  strokeWidth = 18,
  showTicks = true,
  className = ''
}) => {
  const gradientId = useId();
  const glowFilterId = useId();

  // Percentage calculations
  const rawPercentage = targetMl > 0 ? (currentMl / targetMl) * 100 : 0;
  const displayPercentage = Math.round(rawPercentage);
  const clampedPercentage = Math.min(rawPercentage, 100);
  const remainingMl = Math.max(0, targetMl - currentMl);
  const isCompleted = currentMl >= targetMl;
  const isSurplus = currentMl > targetMl;

  // SVG Geometry
  const center = size / 2;
  // Reserve space for stroke width and glow padding
  const radius = center - strokeWidth - 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedPercentage / 100) * circumference;

  // Indicator bead tip coordinates (angle starts at top: -90 degrees)
  const tipAngleDeg = (clampedPercentage / 100) * 360 - 90;
  const tipAngleRad = (tipAngleDeg * Math.PI) / 180;
  const beadX = center + radius * Math.cos(tipAngleRad);
  const beadY = center + radius * Math.sin(tipAngleRad);

  // Outer milestone tick marks at 0%, 25%, 50%, 75%
  const milestoneTicks = [
    { percent: 0, label: '0%' },
    { percent: 25, label: '25%' },
    { percent: 50, label: '50%' },
    { percent: 75, label: '75%' }
  ];

  // Subtle graduation notches around the ring (24 notches)
  const tickCount = 24;
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const angleDeg = (i / tickCount) * 360 - 90;
    const angleRad = (angleDeg * Math.PI) / 180;
    const tickInnerR = radius + strokeWidth / 2 + 5;
    const tickOuterR = tickInnerR + (i % 6 === 0 ? 6 : 3.5);
    const isPast = (i / tickCount) * 100 <= clampedPercentage;

    return {
      x1: center + tickInnerR * Math.cos(angleRad),
      y1: center + tickInnerR * Math.sin(angleRad),
      x2: center + tickOuterR * Math.cos(angleRad),
      y2: center + tickOuterR * Math.sin(angleRad),
      isMajor: i % 6 === 0,
      isPast
    };
  });

  return (
    <div
      role="progressbar"
      aria-valuenow={displayPercentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Daily Hydration Goal Progress"
      className={`relative flex flex-col items-center justify-center select-none ${className}`}
    >
      {/* Outer ambient glow effect */}
      <div
        className={`absolute w-60 h-60 rounded-full blur-2xl pointer-events-none transition-all duration-700 ${
          isCompleted
            ? 'bg-emerald-400/20 dark:bg-emerald-500/25'
            : 'bg-sky-400/20 dark:bg-sky-500/25'
        }`}
      />

      {/* SVG Container */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90 origin-center transition-all duration-300 overflow-visible"
        >
          <defs>
            {/* Primary active progress gradient */}
            <linearGradient id={`${gradientId}-normal`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>

            {/* Target completed goal gradient */}
            <linearGradient id={`${gradientId}-completed`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>

            {/* Glowing filter */}
            <filter id={glowFilterId} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow
                dx="0"
                dy="0"
                stdDeviation="4"
                floodColor={isCompleted ? '#10b981' : '#0284c7'}
                floodOpacity="0.4"
              />
            </filter>
          </defs>

          {/* Background Track Circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-100 dark:text-slate-800/80 transition-colors"
          />

          {/* Inner subtle concentric guideline */}
          <circle
            cx={center}
            cy={center}
            r={radius - strokeWidth / 2 - 4}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="3 3"
            className="text-slate-200/60 dark:text-slate-700/50"
          />

          {/* Outer graduation tick marks */}
          {showTicks &&
            ticks.map((t, idx) => (
              <line
                key={idx}
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke="currentColor"
                strokeWidth={t.isMajor ? '2' : '1.2'}
                strokeLinecap="round"
                className={`transition-colors duration-500 ${
                  t.isPast
                    ? isCompleted
                      ? 'text-emerald-500/80 dark:text-emerald-400'
                      : 'text-sky-500/80 dark:text-sky-400'
                    : 'text-slate-300/70 dark:text-slate-700/60'
                }`}
              />
            ))}

          {/* Animated Radial Progress Arc */}
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
              filter={`url(#${glowFilterId})`}
              style={{
                transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
          )}

          {/* Glowing Indicator Bead at tip */}
          {clampedPercentage > 2 && (
            <circle
              cx={beadX}
              cy={beadY}
              r={strokeWidth / 2 - 2}
              fill="#ffffff"
              className="drop-shadow-md transition-all duration-700"
              stroke={isCompleted ? '#10b981' : '#0284c7'}
              strokeWidth="3"
            />
          )}
        </svg>

        {/* Central Content (Overlaid over the center of the radial bar) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 pointer-events-none">
          {/* Status Header Pill */}
          {isCompleted ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 text-white text-[11px] font-bold shadow-sm mb-1.5 animate-bounce">
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Goal Reached!</span>
              <Sparkles className="w-3 h-3 text-emerald-200" />
            </div>
          ) : (
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-800 text-sky-700 dark:text-sky-300 text-[11px] font-semibold tracking-wide uppercase mb-1">
              <Droplet className="w-3 h-3 fill-sky-500 text-sky-500" />
              <span>Daily Goal</span>
            </div>
          )}

          {/* Prominent Radial Percentage */}
          <div className="flex items-baseline justify-center tracking-tight font-black">
            <span className="text-5xl sm:text-6xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tighter">
              {displayPercentage}
            </span>
            <span
              className={`text-2xl sm:text-3xl font-extrabold ml-1 ${
                isCompleted
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-sky-600 dark:text-sky-400'
              }`}
            >
              %
            </span>
          </div>

          {/* Current vs Target Exact Volume */}
          <div className="mt-1 flex items-center justify-center gap-1.5 text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
            <span className={isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-sky-600 dark:text-sky-400'}>
              {formatVolumeExact(currentMl, unitSystem)}
            </span>
            <span className="text-slate-400 dark:text-slate-500 font-normal">/</span>
            <span className="text-slate-600 dark:text-slate-400">
              {formatVolumeExact(targetMl, unitSystem)}
            </span>
          </div>

          {/* Remaining or Surplus Volume Subtext */}
          <div className="mt-1 text-xs">
            {remainingMl > 0 ? (
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                {formatVolumeExact(remainingMl, unitSystem)} to reach target
              </span>
            ) : isSurplus ? (
              <span className="text-emerald-700 dark:text-emerald-300 font-semibold inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-500" />
                +{formatVolumeExact(currentMl - targetMl, unitSystem)} surplus
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                100% completed today!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Quick Target Info Trigger */}
      {onOpenWhyTarget && (
        <button
          type="button"
          onClick={onOpenWhyTarget}
          className="mt-3.5 text-xs font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700 shadow-xs transition-all tap-active"
          title="See how your daily hydration target is calculated"
        >
          <Info className="w-3.5 h-3.5 text-sky-500" />
          <span>Why this target?</span>
        </button>
      )}
    </div>
  );
};
