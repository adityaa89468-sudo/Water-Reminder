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
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 min-w-[58px] min-h-[48px] tap-active ${
                isActive
                  ? 'text-sky-600 dark:text-sky-400 font-semibold'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
              aria-label={item.label}
              aria-selected={isActive}
              role="tab"
            >
              <div
                className={`flex items-center justify-center w-12 h-7 rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 shadow-xs'
                    : 'bg-transparent text-slate-500 dark:text-slate-400'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              </div>
              <span className="text-[11px] tracking-tight mt-1 truncate max-w-[64px]">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
