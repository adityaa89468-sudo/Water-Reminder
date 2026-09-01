import React, { useState } from 'react';
import { AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { translations } from '../i18n/translations';

interface MedicalDisclaimerBannerProps {
  language?: 'en' | 'hi';
  compact?: boolean;
}

export const MedicalDisclaimerBanner: React.FC<MedicalDisclaimerBannerProps> = ({
  language = 'en',
  compact = false
}) => {
  const [expanded, setExpanded] = useState(false);
  const t = translations[language];

  if (compact) {
    return (
      <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 rounded-xl p-3 text-xs text-sky-900 dark:text-sky-200 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold">{t.medicalDisclaimerTitle}</p>
          <p className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
            {t.medicalDisclaimerShort}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4 text-sky-700 dark:text-sky-300" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
              {t.medicalDisclaimerTitle}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              {t.medicalDisclaimerShort}
            </p>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 shrink-0"
          aria-label="Toggle full disclaimer"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed space-y-2">
          <p>{t.medicalDisclaimerFull}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
            Reference guidelines: European Food Safety Authority (EFSA), World Health Organization (WHO), and standard clinical physiology guidelines.
          </p>
        </div>
      )}
    </div>
  );
};
