import React, { useState } from 'react';
import {
  Lightbulb,
  Droplets,
  Sun,
  Activity,
  HeartPulse,
  ChevronDown,
  ChevronUp,
  BookOpen
} from 'lucide-react';

export const HydrationTipsView: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const tips = [
    {
      icon: Droplets,
      title: 'Sip Steadily All Day',
      desc: 'Your body absorbs water best when you drink small glasses throughout the day rather than chugging a lot all at once.'
    },
    {
      icon: Sun,
      title: 'Start Your Morning Right',
      desc: 'Drinking a glass of water right after waking up helps wake up your body and replaces water lost overnight.'
    },
    {
      icon: Activity,
      title: 'Drink More When Active',
      desc: 'When you exercise or spend time in warm weather, have an extra glass of water before and after to stay energized.'
    },
    {
      icon: HeartPulse,
      title: 'Listen to Your Body',
      desc: 'Drink whenever you feel thirsty, and avoid forcing uncomfortable amounts of water in a short time.'
    }
  ];

  const faqs = [
    {
      q: 'Do tea, coffee, and juice count toward my daily goal?',
      a: 'Yes! Tea, coffee, milk, and juice all help keep you hydrated. Plain water is still the best everyday choice because it has no sugar or extra calories.'
    },
    {
      q: 'Does food help keep me hydrated too?',
      a: 'Yes, fruits and vegetables like watermelon, oranges, cucumbers, and soups provide about a quarter of the water your body needs each day.'
    },
    {
      q: 'Should I drink water right before bed?',
      a: 'It is best to finish most of your water 1 to 2 hours before sleeping so you can enjoy a full, uninterrupted night of rest.'
    }
  ];

  return (
    <div className="space-y-5 pb-8 animate-in fade-in">
      
      {/* Header card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-sky-50 dark:bg-sky-950 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
          <Lightbulb className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Everyday Hydration Tips
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Simple habits to help you feel your best every day
          </p>
        </div>
      </div>

      {/* Core Tips Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {tips.map((tip, idx) => {
          const Icon = tip.icon;
          return (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 space-y-2.5"
            >
              <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950 flex items-center justify-center text-sky-600 dark:text-sky-400">
                <Icon className="w-4 h-4" />
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

      {/* Common Questions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Common Questions
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
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between bg-slate-50/70 hover:bg-slate-100/70 dark:bg-slate-800/60 transition-colors"
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
                  <div className="p-4 bg-white dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
