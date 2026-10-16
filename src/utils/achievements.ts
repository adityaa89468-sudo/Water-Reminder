import { UserProfile, WaterLog } from '../types';

export type AchievementCategory = 'streak' | 'volume' | 'habit';
export type MedalTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface AchievementDefinition {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  motivationalQuote: string;
  category: AchievementCategory;
  tier: MedalTier;
  targetValue: number;
  unit: string;
  iconName: 'droplet' | 'zap' | 'waves' | 'award' | 'flame' | 'sparkles' | 'crown' | 'shield' | 'trophy' | 'sun' | 'cup' | 'star';
}

export interface UserAchievement extends AchievementDefinition {
  unlocked: boolean;
  currentValue: number;
  progressPercent: number; // 0 to 100
  unlockedDate?: string | null;
  remainingToUnlock: number;
}

export const ACHIEVEMENTS_REGISTRY: AchievementDefinition[] = [
  // STREAK MILESTONES
  {
    id: 'streak_1',
    title: 'First Splash',
    subtitle: '1-Day Milestone',
    description: 'Hit your daily hydration goal for the first time.',
    motivationalQuote: 'Every great wellness transformation starts with a single mindful glass of water.',
    category: 'streak',
    tier: 'bronze',
    targetValue: 1,
    unit: 'day',
    iconName: 'droplet'
  },
  {
    id: 'streak_3',
    title: 'Hydration Spark',
    subtitle: '3-Day Streak',
    description: 'Reach your target 3 consecutive days in a row.',
    motivationalQuote: '3 days of consistency! Your body is already adapting to balanced fluid intake.',
    category: 'streak',
    tier: 'bronze',
    targetValue: 3,
    unit: 'days',
    iconName: 'zap'
  },
  {
    id: 'streak_5',
    title: 'Flow State',
    subtitle: '5-Day Streak',
    description: 'Maintain healthy hydration for 5 consecutive days.',
    motivationalQuote: 'You have entered the flow state. Regular hydration boosts focus and reduces afternoon fatigue.',
    category: 'streak',
    tier: 'silver',
    targetValue: 5,
    unit: 'days',
    iconName: 'waves'
  },
  {
    id: 'streak_7',
    title: 'Weekly Warrior',
    subtitle: '7-Day Streak',
    description: 'Hit your hydration target every day for an entire week.',
    motivationalQuote: 'One full week! Behavioral science shows 7 days of repetition locks in the habit loop.',
    category: 'streak',
    tier: 'silver',
    targetValue: 7,
    unit: 'days',
    iconName: 'shield'
  },
  {
    id: 'streak_14',
    title: 'Fortnight Flow',
    subtitle: '14-Day Streak',
    description: 'Two full weeks of uninterrupted daily hydration consistency.',
    motivationalQuote: '14 days uninterrupted! Your energy, digestion, and skin are thanking you.',
    category: 'streak',
    tier: 'gold',
    targetValue: 14,
    unit: 'days',
    iconName: 'flame'
  },
  {
    id: 'streak_21',
    title: 'Habit Master',
    subtitle: '21-Day Streak',
    description: '21 consecutive days! The clinical benchmark for permanent habit formation.',
    motivationalQuote: '21 days! Neuroscience proves new neural pathways are established. Hydration is now second nature.',
    category: 'streak',
    tier: 'gold',
    targetValue: 21,
    unit: 'days',
    iconName: 'sparkles'
  },
  {
    id: 'streak_30',
    title: 'Monthly Legend',
    subtitle: '30-Day Streak',
    description: '30 consecutive days of meeting your daily fluid goals.',
    motivationalQuote: 'A whole calendar month of peak wellness dedication. You are an inspiration!',
    category: 'streak',
    tier: 'platinum',
    targetValue: 30,
    unit: 'days',
    iconName: 'crown'
  },
  {
    id: 'streak_60',
    title: 'Titan of Hydration',
    subtitle: '60-Day Streak',
    description: '60 consecutive days of balanced daily hydration.',
    motivationalQuote: 'Two months of unwavering commitment. Your cellular vitality is operating at its maximum potential.',
    category: 'streak',
    tier: 'platinum',
    targetValue: 60,
    unit: 'days',
    iconName: 'award'
  },
  {
    id: 'streak_100',
    title: 'Century Club',
    subtitle: '100-Day Streak',
    description: '100 consecutive days of flawless hydration adherence.',
    motivationalQuote: 'Triple-digit milestone! You belong to an elite tier of lifelong wellness champions.',
    category: 'streak',
    tier: 'diamond',
    targetValue: 100,
    unit: 'days',
    iconName: 'trophy'
  },

  // VOLUME & HABIT MILESTONES
  {
    id: 'vol_10k',
    title: 'Aquifer Initiate',
    subtitle: '10,000 mL Total',
    description: 'Accumulated 10 liters of total healthy hydration.',
    motivationalQuote: '10 liters logged! You are consistently nourishing every system in your body.',
    category: 'volume',
    tier: 'bronze',
    targetValue: 10000,
    unit: 'mL',
    iconName: 'droplet'
  },
  {
    id: 'vol_50k',
    title: 'Mighty River',
    subtitle: '50,000 mL Total',
    description: 'Accumulated 50 liters of total healthy fluids.',
    motivationalQuote: '50 liters consumed! That is enough water to supply an athletic team for days.',
    category: 'volume',
    tier: 'silver',
    targetValue: 50000,
    unit: 'mL',
    iconName: 'waves'
  },
  {
    id: 'vol_100k',
    title: 'Ocean Vitality',
    subtitle: '100,000 mL Total',
    description: 'Accumulated 100 liters of total healthy fluids.',
    motivationalQuote: '100 liters of pure nourishment! A monumental milestone for your wellness.',
    category: 'volume',
    tier: 'gold',
    targetValue: 100000,
    unit: 'mL',
    iconName: 'trophy'
  },
  {
    id: 'habit_early',
    title: 'Early Riser',
    subtitle: 'Morning Hydration',
    description: 'Logged a mindful sip before 8:00 AM.',
    motivationalQuote: 'Drinking water right after waking reactivates your metabolism and rehydrates your brain.',
    category: 'habit',
    tier: 'bronze',
    targetValue: 1,
    unit: 'time',
    iconName: 'sun'
  },
  {
    id: 'habit_variety',
    title: 'Hydration Explorer',
    subtitle: 'Beverage Variety',
    description: 'Logged 3 or more beverage varieties (water, tea, infused, mineral).',
    motivationalQuote: 'Variety makes hydration enjoyable and sustainable across all seasons.',
    category: 'habit',
    tier: 'silver',
    targetValue: 3,
    unit: 'types',
    iconName: 'cup'
  },
  {
    id: 'habit_overachiever',
    title: 'Target Crusher',
    subtitle: '120% Daily Goal',
    description: 'Reached 120% or more of your target in a single day.',
    motivationalQuote: 'Giving that extra effort on hot or active days keeps your stamina at 100%.',
    category: 'habit',
    tier: 'silver',
    targetValue: 1,
    unit: 'time',
    iconName: 'star'
  }
];

/**
 * Computes the full achievements list with unlock state, progress percentage, and timestamps.
 */
export function calculateAchievements(
  profile: UserProfile,
  logs: WaterLog[]
): {
  achievements: UserAchievement[];
  unlockedCount: number;
  totalCount: number;
  streakMilestones: UserAchievement[];
  nextStreakMilestone: UserAchievement | null;
  newlyUnlockedIds: string[];
} {
  const effectiveStreak = Math.max(profile.streak || 0, profile.bestStreak || 0);
  const totalVolume = profile.totalDrankMl || logs.reduce((sum, l) => sum + l.amount, 0);
  const storedUnlockedMap = profile.unlockedBadges || {};

  // Check early morning drink
  const hasEarlyDrink = logs.some(l => {
    const d = new Date(l.timestamp);
    return d.getHours() < 8;
  });

  // Check drink varieties
  const uniqueTypes = new Set(logs.map(l => l.drinkType || 'water')).size;

  // Check 120% target reached on any day
  const dayTotals: Record<string, number> = {};
  logs.forEach(l => {
    const key = l.timestamp.split('T')[0];
    dayTotals[key] = (dayTotals[key] || 0) + l.amount;
  });
  const hasOverachieved = Object.entries(dayTotals).some(([dateKey, total]) => {
    const target = profile.dayTargetOverrides?.[dateKey] || profile.dailyTargetMl || 2000;
    return total >= target * 1.2;
  });

  const newlyUnlockedIds: string[] = [];

  const achievements: UserAchievement[] = ACHIEVEMENTS_REGISTRY.map(def => {
    let unlocked = false;
    let currentValue = 0;
    let progressPercent = 0;

    if (def.category === 'streak') {
      currentValue = effectiveStreak;
      unlocked = effectiveStreak >= def.targetValue;
      progressPercent = Math.min(100, Math.round((effectiveStreak / def.targetValue) * 100));
    } else if (def.category === 'volume') {
      currentValue = totalVolume;
      unlocked = totalVolume >= def.targetValue;
      progressPercent = Math.min(100, Math.round((totalVolume / def.targetValue) * 100));
    } else if (def.id === 'habit_early') {
      currentValue = hasEarlyDrink ? 1 : 0;
      unlocked = hasEarlyDrink;
      progressPercent = hasEarlyDrink ? 100 : 0;
    } else if (def.id === 'habit_variety') {
      currentValue = uniqueTypes;
      unlocked = uniqueTypes >= def.targetValue;
      progressPercent = Math.min(100, Math.round((uniqueTypes / def.targetValue) * 100));
    } else if (def.id === 'habit_overachiever') {
      currentValue = hasOverachieved ? 1 : 0;
      unlocked = hasOverachieved;
      progressPercent = hasOverachieved ? 100 : 0;
    }

    // Check if newly unlocked (not in storedUnlockedMap yet)
    if (unlocked && !storedUnlockedMap[def.id]) {
      newlyUnlockedIds.push(def.id);
    }

    const remainingToUnlock = Math.max(0, def.targetValue - currentValue);
    const unlockedDate = unlocked ? (storedUnlockedMap[def.id] || new Date().toISOString()) : null;

    return {
      ...def,
      unlocked,
      currentValue,
      progressPercent,
      unlockedDate,
      remainingToUnlock
    };
  });

  const streakMilestones = achievements.filter(a => a.category === 'streak');
  const nextStreakMilestone = streakMilestones.find(a => !a.unlocked) || null;
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return {
    achievements,
    unlockedCount,
    totalCount: achievements.length,
    streakMilestones,
    nextStreakMilestone,
    newlyUnlockedIds
  };
}

/**
 * Tier design specs for realistic medal rendering.
 */
export const TIER_CONFIG: Record<
  MedalTier,
  {
    name: string;
    labelColor: string;
    badgeBg: string;
    borderGlow: string;
    ribbonColor: string;
    gradient: string;
    ringColor: string;
    shadow: string;
  }
> = {
  bronze: {
    name: 'Bronze Medal',
    labelColor: 'text-amber-700 dark:text-amber-400',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/60',
    borderGlow: 'border-amber-300 dark:border-amber-800',
    ribbonColor: 'from-amber-600 to-amber-800',
    gradient: 'from-amber-600 via-amber-500 to-amber-700',
    ringColor: 'border-amber-400/80',
    shadow: 'shadow-amber-500/25'
  },
  silver: {
    name: 'Silver Medal',
    labelColor: 'text-slate-700 dark:text-slate-300',
    badgeBg: 'bg-slate-100 dark:bg-slate-800/80',
    borderGlow: 'border-slate-300 dark:border-slate-700',
    ribbonColor: 'from-slate-400 to-slate-600',
    gradient: 'from-slate-300 via-slate-100 to-slate-400',
    ringColor: 'border-slate-300/80',
    shadow: 'shadow-slate-400/25'
  },
  gold: {
    name: 'Gold Medal',
    labelColor: 'text-amber-600 dark:text-yellow-400',
    badgeBg: 'bg-yellow-100 dark:bg-yellow-950/60',
    borderGlow: 'border-yellow-300 dark:border-yellow-700',
    ribbonColor: 'from-yellow-500 to-amber-600',
    gradient: 'from-amber-400 via-yellow-300 to-amber-500',
    ringColor: 'border-yellow-300/90',
    shadow: 'shadow-yellow-500/35'
  },
  platinum: {
    name: 'Platinum Medal',
    labelColor: 'text-cyan-700 dark:text-cyan-300',
    badgeBg: 'bg-cyan-100 dark:bg-cyan-950/60',
    borderGlow: 'border-cyan-300 dark:border-cyan-800',
    ribbonColor: 'from-cyan-500 to-sky-700',
    gradient: 'from-sky-300 via-cyan-100 to-teal-300',
    ringColor: 'border-cyan-200',
    shadow: 'shadow-cyan-500/30'
  },
  diamond: {
    name: 'Diamond Medal',
    labelColor: 'text-indigo-700 dark:text-indigo-300',
    badgeBg: 'bg-indigo-100 dark:bg-indigo-950/60',
    borderGlow: 'border-indigo-300 dark:border-indigo-800',
    ribbonColor: 'from-indigo-600 to-violet-800',
    gradient: 'from-indigo-400 via-violet-300 to-sky-400',
    ringColor: 'border-indigo-300',
    shadow: 'shadow-indigo-500/40'
  }
};
