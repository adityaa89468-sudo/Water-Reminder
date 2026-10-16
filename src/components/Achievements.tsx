import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Award,
  Trophy,
  Flame,
  Zap,
  Waves,
  Shield,
  Crown,
  Droplet,
  Sun,
  CupSoda,
  Star,
  Sparkles,
  Lock,
  CheckCircle2,
  Share2,
  X,
  ChevronLeft,
  Calendar,
  Check,
  TrendingUp
} from 'lucide-react';
import { UserProfile, WaterLog } from '../types';
import {
  calculateAchievements,
  UserAchievement,
  TIER_CONFIG,
  MedalTier
} from '../utils/achievements';
import { BannerAd } from './BannerAd';

interface AchievementsProps {
  profile: UserProfile;
  logs: WaterLog[];
  onBack?: () => void;
  isModal?: boolean;
}

export const Achievements: React.FC<AchievementsProps> = ({
  profile,
  logs,
  onBack,
  isModal = false
}) => {
  const [filter, setFilter] = useState<'all' | 'streak' | 'other' | 'unlocked'>('all');
  const [selectedAchievement, setSelectedAchievement] = useState<UserAchievement | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);

  const {
    achievements,
    unlockedCount,
    totalCount,
    nextStreakMilestone
  } = calculateAchievements(profile, logs);

  const filteredAchievements = achievements.filter(a => {
    if (filter === 'streak') return a.category === 'streak';
    if (filter === 'other') return a.category !== 'streak';
    if (filter === 'unlocked') return a.unlocked;
    return true;
  });

  const percentComplete = Math.round((unlockedCount / totalCount) * 100);

  // Render Medal Icon based on definition
  const renderMedalIcon = (iconName: string, tier: MedalTier, unlocked: boolean) => {
    const iconClass = `w-6 h-6 ${
      unlocked ? 'text-white' : 'text-slate-400 dark:text-slate-500'
    }`;

    switch (iconName) {
      case 'flame':
        return <Flame className={iconClass} />;
      case 'zap':
        return <Zap className={iconClass} />;
      case 'waves':
        return <Waves className={iconClass} />;
      case 'shield':
        return <Shield className={iconClass} />;
      case 'crown':
        return <Crown className={iconClass} />;
      case 'trophy':
        return <Trophy className={iconClass} />;
      case 'sun':
        return <Sun className={iconClass} />;
      case 'cup':
        return <CupSoda className={iconClass} />;
      case 'star':
        return <Star className={iconClass} />;
      case 'sparkles':
        return <Sparkles className={iconClass} />;
      case 'droplet':
      default:
        return <Droplet className={iconClass} />;
    }
  };

  // Trigger celebration confetti when inspecting an unlocked medal
  const handleSelectMedal = (achievement: UserAchievement) => {
    setSelectedAchievement(achievement);
    setCopiedShare(false);
    if (achievement.unlocked) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.5 },
          colors: ['#0284c7', '#38bdf8', '#f59e0b', '#10b981', '#a855f7']
        });
      } catch (e) {
        // Safe fallback
      }
    }
  };

  const handleShareAchievement = async (achievement: UserAchievement) => {
    const shareText = `🏆 I unlocked the "${achievement.title}" (${achievement.subtitle}) badge in SipLumo Water Reminder! Tracking healthy hydration every single day. 💧`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `SipLumo Achievement: ${achievement.title}`,
          text: shareText,
          url: window.location.origin
        });
        return;
      } catch (err) {
        // Fall back to copy
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 3000);
    } catch (e) {
      // Ignored
    }
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-200">
      
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors tap-active"
              aria-label="Back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Achievements</span>
              <Trophy className="w-5 h-5 text-amber-500 fill-amber-500/20" />
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Virtual medals & streak milestones
            </p>
          </div>
        </div>

        {/* Total unlocked badge counter */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl text-amber-700 dark:text-amber-400 font-bold text-xs shadow-xs">
          <Award className="w-4 h-4 text-amber-500" />
          <span>{unlockedCount} / {totalCount}</span>
        </div>
      </div>

      {/* Hero Showcase Card: Progress & Next Streak Target */}
      <div className="bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 text-white rounded-3xl p-5 border border-sky-800/50 shadow-lg relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-sky-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Hydration Mastery</span>
            </span>
            <span className="text-xs font-semibold text-sky-200">
              {percentComplete}% Completed
            </span>
          </div>

          {/* Overall Progress Bar */}
          <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden border border-slate-700/60">
            <div
              className="bg-gradient-to-r from-sky-400 via-teal-300 to-amber-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${percentComplete}%` }}
            />
          </div>

          {/* Next Streak Milestone Banner */}
          {nextStreakMilestone ? (
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center shrink-0 shadow-md">
                  <Flame className="w-5 h-5 text-white fill-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                    <span>Next Milestone</span>
                    <span>&bull;</span>
                    <span>{nextStreakMilestone.targetValue}-Day Streak</span>
                  </p>
                  <p className="text-xs font-extrabold text-white truncate">
                    {nextStreakMilestone.title}
                  </p>
                  <p className="text-[11px] text-slate-300">
                    {nextStreakMilestone.remainingToUnlock} more {nextStreakMilestone.remainingToUnlock === 1 ? 'day' : 'days'} needed
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-sm font-extrabold text-amber-300">
                  {nextStreakMilestone.progressPercent}%
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-400/30 flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <p className="text-xs font-semibold text-emerald-200">
                Incredible! You have conquered all major streak milestones!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Filter Segmented Buttons */}
      <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold overflow-x-auto no-scrollbar">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 min-w-[70px] py-2 px-2.5 rounded-xl transition-all text-center tap-active ${
            filter === 'all'
              ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          All ({totalCount})
        </button>
        <button
          onClick={() => setFilter('streak')}
          className={`flex-1 min-w-[90px] py-2 px-2.5 rounded-xl transition-all text-center tap-active ${
            filter === 'streak'
              ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Streaks
        </button>
        <button
          onClick={() => setFilter('other')}
          className={`flex-1 min-w-[80px] py-2 px-2.5 rounded-xl transition-all text-center tap-active ${
            filter === 'other'
              ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Habits
        </button>
        <button
          onClick={() => setFilter('unlocked')}
          className={`flex-1 min-w-[80px] py-2 px-2.5 rounded-xl transition-all text-center tap-active ${
            filter === 'unlocked'
              ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Earned ({unlockedCount})
        </button>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredAchievements.map(ach => {
          const tierInfo = TIER_CONFIG[ach.tier];

          return (
            <button
              key={ach.id}
              onClick={() => handleSelectMedal(ach)}
              className={`p-4 rounded-3xl border transition-all text-left flex items-start gap-3.5 relative overflow-hidden tap-active ${
                ach.unlocked
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700 shadow-sm hover:shadow-md'
                  : 'bg-slate-50/70 dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-800/60 opacity-80'
              }`}
            >
              {/* Virtual Medal Medallion */}
              <div className="relative shrink-0">
                {/* Medal ribbon top tag if unlocked */}
                {ach.unlocked && (
                  <div
                    className={`absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-2 bg-gradient-to-r ${tierInfo.ribbonColor} rounded-t-sm z-0`}
                  />
                )}

                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center relative z-10 transition-transform ${
                    ach.unlocked
                      ? `bg-gradient-to-tr ${tierInfo.gradient} ${tierInfo.shadow} shadow-lg border-2 ${tierInfo.ringColor}`
                      : 'bg-slate-200 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {/* Subtle inner metallic bevel rim */}
                  <div className="w-11 h-11 rounded-full border border-white/30 flex items-center justify-center">
                    {renderMedalIcon(ach.iconName, ach.tier, ach.unlocked)}
                  </div>

                  {/* Locked padlock badge overlay */}
                  {!ach.unlocked && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center border-2 border-white dark:border-slate-900">
                      <Lock className="w-2.5 h-2.5" />
                    </div>
                  )}

                  {/* Unlocked checkmark badge overlay */}
                  {ach.unlocked && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-xs">
                      <Check className="w-3 h-3 stroke-[3px]" />
                    </div>
                  )}
                </div>
              </div>

              {/* Text & Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      ach.unlocked
                        ? tierInfo.labelColor
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {ach.subtitle}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 capitalize">
                    {ach.tier}
                  </span>
                </div>

                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                  {ach.title}
                </h2>

                <p className="text-[11.5px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                  {ach.description}
                </p>

                {/* Progress bar or unlock indicator */}
                <div className="mt-2.5">
                  {ach.unlocked ? (
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Unlocked</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10.5px] text-slate-500">
                        <span>Progress</span>
                        <span>
                          {ach.currentValue} / {ach.targetValue} {ach.unit} ({ach.progressPercent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-sky-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${ach.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Auto-Resizing Banner Ad */}
      <BannerAd />

      {/* MEDAL INSPECT / DETAIL MODAL */}
      {selectedAchievement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative space-y-4 text-center">
            
            {/* Close Button */}
            <button
              onClick={() => setSelectedAchievement(null)}
              className="absolute right-4 top-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Large Medallion Presentation */}
            <div className="pt-2">
              <div
                className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center relative ${
                  selectedAchievement.unlocked
                    ? `bg-gradient-to-tr ${TIER_CONFIG[selectedAchievement.tier].gradient} shadow-2xl ${TIER_CONFIG[selectedAchievement.tier].shadow} border-4 ${TIER_CONFIG[selectedAchievement.tier].ringColor}`
                    : 'bg-slate-200 dark:bg-slate-800 border-4 border-slate-300 dark:border-slate-700'
                }`}
              >
                <div className="w-18 h-18 rounded-full border-2 border-white/40 flex items-center justify-center">
                  <div className="scale-150">
                    {renderMedalIcon(
                      selectedAchievement.iconName,
                      selectedAchievement.tier,
                      selectedAchievement.unlocked
                    )}
                  </div>
                </div>

                {selectedAchievement.unlocked && (
                  <div className="absolute -bottom-2 px-2.5 py-0.5 bg-emerald-500 text-white text-[10px] font-extrabold uppercase rounded-full shadow-md">
                    Unlocked
                  </div>
                )}
              </div>
            </div>

            {/* Title & Tier */}
            <div>
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  TIER_CONFIG[selectedAchievement.tier].labelColor
                }`}
              >
                {TIER_CONFIG[selectedAchievement.tier].name} &bull; {selectedAchievement.subtitle}
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                {selectedAchievement.title}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                {selectedAchievement.description}
              </p>
            </div>

            {/* Motivational Science Quote */}
            <div className="p-3.5 bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/60 rounded-2xl text-left">
              <p className="text-[11px] font-bold text-sky-700 dark:text-sky-300 flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Hydration Science</span>
              </p>
              <p className="text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed">
                "{selectedAchievement.motivationalQuote}"
              </p>
            </div>

            {/* Status / Requirement */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500">Requirement</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {selectedAchievement.targetValue} {selectedAchievement.unit}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-1">
              {selectedAchievement.unlocked ? (
                <button
                  type="button"
                  onClick={() => handleShareAchievement(selectedAchievement)}
                  className="flex-1 py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md tap-active"
                >
                  {copiedShare ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      <span>Share Medal</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectedAchievement(null)}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs transition-all tap-active"
                >
                  Got It, Keep Going!
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
