export type UnitSystem = 'metric' | 'imperial';

export type BiologicalSex = 'male' | 'female' | 'prefer_not_to_say';

export type AgeRange = 'under_18' | '18_30' | '31_50' | '51_65' | 'above_65';

export type ActivityLevel = 'low' | 'moderate' | 'high' | 'custom';

export type Climate = 'cool' | 'normal' | 'hot' | 'custom';

export type PregnancyStatus = 'none' | 'pregnant' | 'breastfeeding';

export type ReminderMode = 'smart' | 'fixed';

export type DrinkType = 'water' | 'infused' | 'tea' | 'electrolyte' | 'mineral';

export interface GlassPreset {
  id: string;
  name: string;
  amount: number; // always in mL internally
  icon: 'cup' | 'glass' | 'bottle' | 'flask' | 'mug';
}

export interface ReminderSettings {
  enabled: boolean;
  mode: ReminderMode;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  intervalMinutes: number; // e.g. 60, 90, 120
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:mm
  quietHoursEnd: string; // HH:mm
  activeDays: number[]; // 0 for Sunday ... 6 for Saturday
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  stopAfterGoalReached: boolean;
  snoozeMinutes: number;
  pausedUntilDate?: string | null; // YYYY-MM-DD when paused for the day
}

export interface UserProfile {
  id?: string;
  firebase_uid?: string | null;
  email?: string | null;
  displayName: string;
  ageRange: AgeRange;
  sex: BiologicalSex;
  weightKg: number;
  heightCm: number;
  activityLevel: ActivityLevel;
  climate: Climate;
  wakeUpTime: string;
  bedTime: string;
  pregnancyStatus: PregnancyStatus;
  hasFluidRestriction: boolean;
  hasHealthCondition: boolean; // diuretics, kidney/heart/liver
  unitSystem: UnitSystem;
  dailyTargetMl: number;
  recommendedBaseMl: number;
  customTargetSet: boolean;
  dayTargetOverrides: Record<string, number>; // YYYY-MM-DD -> target in mL
  presets: GlassPreset[];
  reminders: ReminderSettings;
  darkMode: boolean;
  celebrationEnabled: boolean;
  cloudSyncEnabled: boolean;
  lastSyncedAt?: string | null;
  language: 'en' | 'hi';
  onboardingCompleted: boolean;
  streak: number;
  bestStreak: number;
  totalDrankMl: number;
}

export interface WaterLog {
  id: string;
  amount: number; // in mL
  timestamp: string; // ISO string
  drinkType: DrinkType;
  note?: string;
  synced?: boolean;
}

export interface TargetCalculationBreakdown {
  weightKg: number;
  baseRatePerKg: number; // 30 mL
  baseEstimateMl: number;
  recommendedRangeMinMl: number; // 25 mL/kg
  recommendedRangeMaxMl: number; // 35 mL/kg
  activityAdjustmentMl: number;
  climateAdjustmentMl: number;
  totalSuggestedMl: number;
  sexReferenceText: string;
  sexReferenceValLiters: number;
  hasSpecialMedicalNotice: boolean;
  medicalNoticeReason: string[];
  lastReviewedDate: string;
}

export type ActiveTab = 'home' | 'history' | 'insights' | 'tips' | 'settings';
