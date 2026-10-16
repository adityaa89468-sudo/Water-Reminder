import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Sparkles, X, Share2, Award, Check } from 'lucide-react';
import { UserAchievement, TIER_CONFIG } from '../utils/achievements';

interface MilestoneCelebrationModalProps {
  achievement: UserAchievement;
  onDismiss: () => void;
  onViewAllBadges: () => void;
}

export const MilestoneCelebrationModal: React.FC<MilestoneCelebrationModalProps> = ({
  achievement,
  onDismiss,
  onViewAllBadges
}) => {
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    try {
      // Big multi-stage confetti burst
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0284c7', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6']
      });

      const timer = setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#38bdf8', '#fbbf24', '#34d399']
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#38bdf8', '#fbbf24', '#34d399']
        });
      }, 350);

      return () => clearTimeout(timer);
    } catch (e) {
      // Ignored
    }
  }, []);

  const tierInfo = TIER_CONFIG[achievement.tier];

  const handleShare = async () => {
    const text = `🎉 I just unlocked the "${achievement.title}" (${achievement.subtitle}) medal on SipLumo Water Reminder! 💧`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Milestone Reached: ${achievement.title}`,
          text,
          url: window.location.origin
        });
        return;
      } catch (err) {
        // Fallback
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      // Ignored
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in zoom-in-95 duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center space-y-4 relative">
        <button
          onClick={onDismiss}
          className="absolute right-4 top-4 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Shimmering Badge presentation */}
        <div className="pt-2">
          <div
            className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center relative bg-gradient-to-tr ${tierInfo.gradient} ${tierInfo.shadow} shadow-2xl border-4 ${tierInfo.ringColor} animate-bounce duration-1000`}
          >
            <Trophy className="w-9 h-9 text-white stroke-[2.2px]" />
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center shadow-md">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        <div>
          <span className={`text-[11px] uppercase font-extrabold tracking-wider ${tierInfo.labelColor}`}>
            Milestone Unlocked &bull; {tierInfo.name}
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            {achievement.title}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
            {achievement.description}
          </p>
        </div>

        {/* Motivational Quote */}
        <div className="p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900 rounded-2xl text-left">
          <p className="text-[11px] text-slate-700 dark:text-slate-300 italic">
            "{achievement.motivationalQuote}"
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={onViewAllBadges}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-teal-500 hover:from-sky-700 hover:to-teal-600 text-white font-bold text-xs shadow-md transition-all tap-active flex items-center justify-center gap-1.5"
          >
            <Award className="w-4 h-4" />
            <span>View All Achievements</span>
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Medal</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium text-xs hover:bg-slate-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
