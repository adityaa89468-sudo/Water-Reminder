import React, { useState } from 'react';
import {
  Droplet,
  Target,
  Sparkles,
  BellRing,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Check,
  CupSoda,
  RotateCcw,
  Moon,
  Clock,
  Heart,
  Sliders,
  X
} from 'lucide-react';

interface AppTutorialProps {
  onFinish: () => void;
  onSkip?: () => void;
  isModal?: boolean;
}

export const AppTutorial: React.FC<AppTutorialProps> = ({
  onFinish,
  onSkip,
  isModal = false
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 'welcome',
      badge: 'Welcome to SipLumo',
      badgeColor: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
      title: 'Mindful Hydration Made Simple',
      subtitle: 'Build healthy daily water drinking habits without guesswork, spam, or privacy invasion.',
      icon: Droplet,
      iconBg: 'bg-gradient-to-tr from-sky-500 to-cyan-400',
      highlights: [
        {
          title: 'Science-Backed Baseline',
          desc: 'Target calculated from medical body weight reference guidelines (~30 mL/kg).'
        },
        {
          title: 'One-Tap Quick Logging',
          desc: 'Log in under a second with customizable glass and bottle presets.'
        },
        {
          title: '100% Offline & Private',
          desc: 'All health and log records stay completely on your device.'
        }
      ]
    },
    {
      id: 'target',
      badge: 'Transparent Science',
      badgeColor: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
      title: 'No Magic Numbers, Just Math',
      subtitle: 'See exactly how your target is calculated and adjust it anytime.',
      icon: Target,
      iconBg: 'bg-gradient-to-tr from-teal-500 to-emerald-400',
      highlights: [
        {
          title: 'Weight-Based Calculation',
          desc: 'Starting reference: 30 mL per kg of body weight (rounded to nearest 50 mL).'
        },
        {
          title: 'Activity & Climate Adjustments',
          desc: 'Add optional fluid for hot weather (+350 mL) or intense exercise (+250-500 mL).'
        },
        {
          title: 'Medical Safety First',
          desc: 'Doctor-prescribed fluid restriction limit overrides are fully supported.'
        }
      ]
    },
    {
      id: 'logging',
      badge: 'Effortless Tracking',
      badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      title: 'One-Tap Logging & Live Fluid Wave',
      subtitle: 'Track your daily intake effortlessly as your fluid wave rises.',
      icon: CupSoda,
      iconBg: 'bg-gradient-to-tr from-blue-500 to-indigo-500',
      highlights: [
        {
          title: 'Custom Presets',
          desc: 'Small Cup (150 mL), Glass (250 mL), Mug (350 mL), Bottle (500 mL), Flask (750 mL).'
        },
        {
          title: 'Multiple Beverage Types',
          desc: 'Support for Water, Infused, Herbal Tea, and Electrolytes.'
        },
        {
          title: 'Accident-Proof Undo',
          desc: 'Tapped by mistake? Undo your last entry with a single tap.'
        }
      ]
    },
    {
      id: 'reminders',
      badge: 'Smart Pacing',
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      title: 'Reminders That Respect Your Sleep',
      subtitle: 'Gentle nudges spaced throughout your active day with zero night disruptions.',
      icon: BellRing,
      iconBg: 'bg-gradient-to-tr from-amber-500 to-orange-400',
      highlights: [
        {
          title: 'Waking Hours Pacing',
          desc: 'Reminders activate only between your wake-up time and bedtime.'
        },
        {
          title: 'Quiet Overnight Hours',
          desc: 'Notifications automatically sleep so your rest is never disturbed.'
        },
        {
          title: 'Flexible Snooze & Daily Pause',
          desc: 'Snooze for 15 minutes or pause reminders for the day with one tap.'
        }
      ]
    },
    {
      id: 'privacy',
      badge: 'Privacy & Ownership',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      title: 'Your Health Data Stays Yours',
      subtitle: 'No account required, no tracking, and total control over your information.',
      icon: ShieldCheck,
      iconBg: 'bg-gradient-to-tr from-emerald-500 to-teal-500',
      highlights: [
        {
          title: 'Zero Forced Sign-Up',
          desc: 'Start immediately. Cloud backup is optional only if you want cross-device sync.'
        },
        {
          title: 'Export & Backup Anytime',
          desc: 'Export complete hydration history in standard JSON or CSV files.'
        },
        {
          title: 'One-Tap Local Wipe',
          desc: 'Erase all data stored locally on your device whenever you choose.'
        }
      ]
    }
  ];

  const current = slides[currentSlide];
  const IconComponent = current.icon;
  const isLast = currentSlide === slides.length - 1;

  return (
    <div className={`w-full max-w-md mx-auto ${isModal ? 'p-0' : 'p-4'}`}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Top Header with Skip Button & Dots */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentSlide
                    ? 'w-6 bg-sky-500'
                    : 'w-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>

          {onSkip ? (
            <button
              type="button"
              onClick={onSkip}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 py-1 rounded-lg transition-colors"
            >
              Skip
            </button>
          ) : isModal ? (
            <button
              type="button"
              onClick={onFinish}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>

        {/* Centerpiece Icon Graphic */}
        <div className="flex flex-col items-center text-center space-y-3 pt-2">
          <div className={`w-16 h-16 rounded-2xl ${current.iconBg} text-white flex items-center justify-center shadow-lg shadow-sky-500/20 transform transition-transform duration-300 hover:scale-105`}>
            <IconComponent className="w-8 h-8" />
          </div>

          {/* Badge */}
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold border ${current.badgeColor}`}>
            <Sparkles className="w-3 h-3" />
            <span>{current.badge}</span>
          </span>

          {/* Title & Subtitle */}
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
            {current.title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
            {current.subtitle}
          </p>
        </div>

        {/* Highlight Points Card */}
        <div className="bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-3">
          {current.highlights.map((point, idx) => (
            <div key={idx} className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                {idx + 1}
              </div>
              <div className="space-y-0.5 text-left">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {point.title}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  {point.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          {currentSlide > 0 && (
            <button
              type="button"
              onClick={() => setCurrentSlide(currentSlide - 1)}
              className="px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl flex items-center gap-1.5 transition-colors tap-active"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}

          {!isLast ? (
            <button
              type="button"
              onClick={() => setCurrentSlide(currentSlide + 1)}
              className="flex-1 py-3 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-2xl flex items-center justify-center gap-1.5 shadow-md shadow-sky-600/20 transition-all tap-active"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onFinish}
              className="flex-1 py-3 text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-sky-600/25 transition-all tap-active"
            >
              <Check className="w-4 h-4" />
              <span>{isModal ? 'Got It' : 'Personalize My Target'}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
