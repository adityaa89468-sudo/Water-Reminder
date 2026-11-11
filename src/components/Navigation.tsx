import React from 'react';
import { Droplet, Calendar, BarChart3, Lightbulb, Settings } from 'lucide-react';
import { ActiveTab } from '../types';
import { translations } from '../i18n/translations';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  language?: 'en' | 'hi';
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  language = 'en'
}) => {
  const t = translations[language];

  const navItems = [
    { id: 'home' as ActiveTab, label: t.home, icon: Droplet },
    { id: 'history' as ActiveTab, label: t.history, icon: Calendar },
    { id: 'insights' as ActiveTab, label: t.insights, icon: BarChart3 },
    { id: 'tips' as ActiveTab, label: t.tips, icon: Lightbulb },
    { id: 'settings' as ActiveTab, label: t.settings, icon: Settings }
  ];

  return (
    <nav
      id="bottom-navigation-bar"
      aria-label="Main Navigation"
      className="fixed bottom-0 left-0 right-0 sm:bottom-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-[calc(100%-2rem)] sm:max-w-xl z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t sm:border border-slate-200/90 dark:border-slate-800/90 sm:rounded-2xl sm:shadow-lg pb-[env(safe-area-inset-bottom,0px)] transition-all"
    >
      <div className="w-full mx-auto grid grid-cols-5 items-center gap-0.5 px-1.5 sm:px-3 py-1.5 sm:py-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-1 sm:px-2 rounded-xl sm:rounded-2xl transition-all duration-200 min-w-0 min-h-[46px] tap-active ${
                isActive
                  ? 'text-sky-600 dark:text-sky-400 font-semibold'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
              aria-label={item.label}
              aria-selected={isActive}
              role="tab"
            >
              <div
                className={`flex items-center justify-center w-10 sm:w-12 h-7 rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-sky-100 dark:bg-sky-950/90 text-sky-600 dark:text-sky-400 border border-sky-200/70 dark:border-sky-800/70 shadow-2xs'
                    : 'bg-transparent text-slate-500 dark:text-slate-400'
                }`}
              >
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              </div>
              <span className="text-[10px] sm:text-[11px] tracking-tight mt-0.5 truncate w-full text-center">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
