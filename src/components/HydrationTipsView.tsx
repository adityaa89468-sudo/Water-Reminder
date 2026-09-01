import React, { useState } from 'react';
import {
  Lightbulb,
  Droplets,
  Sun,
  Activity,
  HeartPulse,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Check
} from 'lucide-react';
import { MedicalDisclaimerBanner } from './MedicalDisclaimerBanner';
import { BannerAd } from './BannerAd';

export const HydrationTipsView: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const tips = [
    {
      icon: Droplets,
      title: 'Pacing vs Chugging',
      desc: 'The human body absorbs water most efficiently when consumed in moderate portions (150-250 mL) spaced throughout waking hours, rather than drinking massive amounts at once.',
      tag: 'Absorption'
    },
    {
      icon: Sun,
      title: 'Urine Color Indicator',
      desc: 'A pale straw or light yellow color is a simple indicator of healthy hydration. Clear urine often indicates excess fluid, while dark honey or amber indicates you should drink more.',
      tag: 'Self-Check'
    },
    {
      icon: Activity,
      title: 'Electrolytes & Workout',
      desc: 'During intense workouts lasting over 60 minutes or heavy sweating, pure water should be supplemented with electrolytes (sodium, potassium) to maintain proper osmotic balance.',
      tag: 'Exercise'
    },
    {
      icon: AlertTriangle,
      title: 'Overhydration Awareness',
      desc: 'Drinking extreme amounts of fluid in a short timeframe can dilute blood sodium (hyponatremia). Listen to natural thirst cues and avoid forcing water beyond comfortable limits.',
      tag: 'Safety'
    }
  ];

  const faqs = [
    {
      q: 'Does tea, coffee, or infused water count toward my intake?',
      a: 'Yes, moderate tea, infused fruit water, and even coffee contribute to your fluid intake. However, plain water remains the ideal foundation without added sugars or excess caffeine.'
    },
    {
      q: 'How does food contribute to hydration?',
      a: 'Most adults receive 20% to 30% of their total daily fluid from dietary water in fruits (watermelon, oranges), vegetables (cucumbers, celery), soups, and cooked grains.'
    },
    {
      q: 'Why should I avoid drinking large volumes right before sleep?',
      a: 'Consuming large glasses of water within 1-2 hours of bedtime can lead to nocturia (waking up to urinate), disrupting restorative deep sleep cycles.'
    },
    {
      q: 'When should I consult a doctor regarding fluid intake?',
      a: 'Always consult your physician if you have chronic kidney disease, congestive heart failure, liver cirrhosis, or are taking prescribed loop diuretics that mandate precise fluid restrictions.'
    }
  ];

  return (
    <div className="space-y-4 pb-12 animate-in fade-in">
      
      {/* Header card */}
      <div className="bg-gradient-to-r from-sky-600 to-teal-600 text-white rounded-3xl p-5 shadow-sm space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-base font-extrabold">
            Hydration Knowledge & Tips
          </h2>
        </div>
        <p className="text-xs text-sky-100 leading-relaxed">
          Evidence-based guidance on fluid pacing, electrolyte balance, and healthy daily hydration habits.
        </p>
      </div>

      <MedicalDisclaimerBanner />

      {/* Core Tips Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tips.map((tip, idx) => {
          const Icon = tip.icon;
          return (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-600 dark:text-sky-400">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {tip.tag}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {tip.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {tip.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* FAQs Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Frequently Asked Questions
          </h3>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="border border-slate-200/70 dark:border-slate-800 rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-3.5 text-left flex items-center justify-between bg-slate-50/70 hover:bg-slate-100/70 dark:bg-slate-800/60 transition-colors"
                >
                  <span className="text-xs font-bold text-slate-900 dark:text-white pr-2">
                    {faq.q}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="p-3.5 bg-white dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Auto-Resizing Banner Ad */}
      <BannerAd />

    </div>
  );
};
