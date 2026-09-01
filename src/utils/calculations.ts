import {
  UserProfile,
  TargetCalculationBreakdown,
  UnitSystem,
  AgeRange,
  BiologicalSex,
  ActivityLevel,
  Climate,
  PregnancyStatus
} from '../types';

export const REVIEW_DATE = 'August 2026';

/**
 * Unit Conversion Utilities
 */
export const ML_PER_FL_OZ = 29.5735;
export const KG_PER_LB = 0.45359237;
export const CM_PER_INCH = 2.54;

export function mlToFlOz(ml: number): number {
  return Number((ml / ML_PER_FL_OZ).toFixed(1));
}

export function flOzToMl(flOz: number): number {
  return Math.round(flOz * ML_PER_FL_OZ);
}

export function kgToLb(kg: number): number {
  return Number((kg / KG_PER_LB).toFixed(1));
}

export function lbToKg(lb: number): number {
  return Number((lb * KG_PER_LB).toFixed(1));
}

export function cmToFtIn(cm: number): { feet: number; inches: number } {
  const totalInches = cm / CM_PER_INCH;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
}

export function ftInToCm(feet: number, inches: number): number {
  return Math.round((feet * 12 + inches) * CM_PER_INCH);
}

export function roundToNearest50(val: number): number {
  return Math.round(val / 50) * 50;
}

export function formatVolume(ml: number, unit: UnitSystem, includeUnit = true): string {
  if (unit === 'imperial') {
    const oz = mlToFlOz(ml);
    return includeUnit ? `${oz} fl oz` : `${oz}`;
  }
  if (ml >= 1000) {
    const liters = (ml / 1000).toFixed(1).replace(/\.0$/, '');
    return includeUnit ? `${liters} L` : `${liters}`;
  }
  return includeUnit ? `${Math.round(ml)} mL` : `${Math.round(ml)}`;
}

export function formatVolumeExact(ml: number, unit: UnitSystem): string {
  if (unit === 'imperial') {
    return `${mlToFlOz(ml)} fl oz`;
  }
  return `${Math.round(ml)} mL`;
}

/**
 * Calculate Activity Suggestion (Optional, user confirmed)
 */
export function getActivitySuggestion(activity: ActivityLevel): number {
  switch (activity) {
    case 'low':
      return 0;
    case 'moderate':
      return 250;
    case 'high':
      return 500;
    case 'custom':
      return 250;
    default:
      return 0;
  }
}

/**
 * Calculate Climate Suggestion (Optional, user confirmed)
 */
export function getClimateSuggestion(climate: Climate): number {
  switch (climate) {
    case 'cool':
      return 0;
    case 'normal':
      return 0;
    case 'hot':
      return 350;
    case 'custom':
      return 200;
    default:
      return 0;
  }
}

/**
 * Calculate Transparent Hydration Estimate
 */
export function calculateHydrationTarget(params: {
  weightKg: number;
  heightCm?: number;
  sex: BiologicalSex;
  ageRange: AgeRange;
  activityLevel: ActivityLevel;
  climate: Climate;
  pregnancyStatus?: PregnancyStatus;
  hasFluidRestriction?: boolean;
  hasHealthCondition?: boolean;
  applyActivitySuggestion?: boolean;
  applyClimateSuggestion?: boolean;
}): TargetCalculationBreakdown {
  const {
    weightKg,
    sex,
    ageRange,
    activityLevel,
    climate,
    pregnancyStatus = 'none',
    hasFluidRestriction = false,
    hasHealthCondition = false,
    applyActivitySuggestion = false,
    applyClimateSuggestion = false
  } = params;

  // Base rule: 30 mL per kg body weight
  const baseRatePerKg = 30;
  const rawBaseEstimate = weightKg * baseRatePerKg;
  const baseEstimateMl = roundToNearest50(rawBaseEstimate);

  // Recommended range: 25 mL/kg - 35 mL/kg
  const recommendedRangeMinMl = roundToNearest50(weightKg * 25);
  const recommendedRangeMaxMl = roundToNearest50(weightKg * 35);

  const activityAdjustmentMl = applyActivitySuggestion ? getActivitySuggestion(activityLevel) : 0;
  const climateAdjustmentMl = applyClimateSuggestion ? getClimateSuggestion(climate) : 0;

  const totalSuggestedMl = Math.max(1000, baseEstimateMl + activityAdjustmentMl + climateAdjustmentMl);

  // Reference Context (EFSA Dietary Reference Values for total water from foods + drinks)
  let sexReferenceText = 'European reference values for total water intake (including food & beverages) are 2.0 L/day for women and 2.5 L/day for men.';
  let sexReferenceValLiters = 2.25;

  if (sex === 'female') {
    sexReferenceText = 'European Food Safety Authority (EFSA) reference total water intake for adult women is ~2.0 L/day (from food ~20-30% and beverages ~70-80%).';
    sexReferenceValLiters = 2.0;
  } else if (sex === 'male') {
    sexReferenceText = 'European Food Safety Authority (EFSA) reference total water intake for adult men is ~2.5 L/day (from food ~20-30% and beverages ~70-80%).';
    sexReferenceValLiters = 2.5;
  }

  // Medical and special caution flags
  const medicalNoticeReason: string[] = [];
  let hasSpecialMedicalNotice = false;

  if (ageRange === 'under_18') {
    hasSpecialMedicalNotice = true;
    medicalNoticeReason.push('Under 18: Hydration formulas for minors require pediatric growth assessment.');
  }
  if (ageRange === 'above_65') {
    hasSpecialMedicalNotice = true;
    medicalNoticeReason.push('Elderly: Thirst sensitivity and renal fluid handling change with age.');
  }
  if (pregnancyStatus === 'pregnant') {
    hasSpecialMedicalNotice = true;
    medicalNoticeReason.push('Pregnancy: Additional fluid requirements should be guided by your obstetrician.');
  }
  if (pregnancyStatus === 'breastfeeding') {
    hasSpecialMedicalNotice = true;
    medicalNoticeReason.push('Lactation: Increased fluid demands vary by feeding frequency; consult your doctor.');
  }
  if (hasFluidRestriction) {
    hasSpecialMedicalNotice = true;
    medicalNoticeReason.push('Prescribed Fluid Restriction: You must strictly adhere to the limit set by your physician.');
  }
  if (hasHealthCondition) {
    hasSpecialMedicalNotice = true;
    medicalNoticeReason.push('Cardiovascular, Renal, or Hepatic conditions: Fluid balance must be medically managed.');
  }

  return {
    weightKg,
    baseRatePerKg,
    baseEstimateMl,
    recommendedRangeMinMl,
    recommendedRangeMaxMl,
    activityAdjustmentMl,
    climateAdjustmentMl,
    totalSuggestedMl,
    sexReferenceText,
    sexReferenceValLiters,
    hasSpecialMedicalNotice,
    medicalNoticeReason,
    lastReviewedDate: REVIEW_DATE
  };
}

/**
 * Validate Target Thresholds
 */
export function getTargetSafetyWarning(targetMl: number): { isWarning: boolean; message: string } {
  if (targetMl < 1000) {
    return {
      isWarning: true,
      message: 'This target is below 1,000 mL/day, which is unusually low for healthy adults. Please confirm if prescribed by your healthcare provider.'
    };
  }
  if (targetMl > 4500) {
    return {
      isWarning: true,
      message: 'This target is above 4,500 mL/day, which is unusually high. Excessive water intake can lead to water intoxication (hyponatremia). Please verify your doctor or sports dietitian recommends this amount.'
    };
  }
  return { isWarning: false, message: '' };
}
