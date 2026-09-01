import {
  calculateHydrationTarget,
  mlToFlOz,
  flOzToMl,
  kgToLb,
  lbToKg,
  cmToFtIn,
  ftInToCm,
  getTargetSafetyWarning
} from './calculations';
import {
  isInsideQuietHours,
  getNextReminderTime
} from './notifications';
import {
  calculateStreak,
  DEFAULT_PROFILE
} from './storage';
import { WaterLog, UserProfile } from '../types';

export interface TestResult {
  name: string;
  category: 'calculation' | 'units' | 'reminders' | 'logs' | 'safety';
  passed: boolean;
  expected: string;
  received: string;
  error?: string;
}

export function runAllAppletTests(): { results: TestResult[]; summary: { total: number; passed: number; failed: number } } {
  const results: TestResult[] = [];

  const assert = (
    name: string,
    category: TestResult['category'],
    condition: boolean,
    expected: string,
    received: string
  ) => {
    results.push({
      name,
      category,
      passed: condition,
      expected,
      received
    });
  };

  // Test 1: Weight * 30 mL calculation rounded to 50
  try {
    const calc70 = calculateHydrationTarget({
      weightKg: 70,
      sex: 'male',
      ageRange: '18_30',
      activityLevel: 'low',
      climate: 'normal'
    });
    // 70 * 30 = 2100 mL
    assert(
      'Target Calculation: 70 kg Adult => 2,100 mL',
      'calculation',
      calc70.baseEstimateMl === 2100,
      '2100 mL',
      `${calc70.baseEstimateMl} mL`
    );
  } catch (e: any) {
    assert('Target Calculation: 70 kg', 'calculation', false, '2100 mL', e.message);
  }

  // Test 2: Recommended range 25-35 mL/kg
  try {
    const calc60 = calculateHydrationTarget({
      weightKg: 60,
      sex: 'female',
      ageRange: '18_30',
      activityLevel: 'low',
      climate: 'cool'
    });
    // min = 60 * 25 = 1500; max = 60 * 35 = 2100
    assert(
      'Recommended Range: 60 kg => 1,500 - 2,100 mL',
      'calculation',
      calc60.recommendedRangeMinMl === 1500 && calc60.recommendedRangeMaxMl === 2100,
      '1500 - 2100 mL',
      `${calc60.recommendedRangeMinMl} - ${calc60.recommendedRangeMaxMl} mL`
    );
  } catch (e: any) {
    assert('Recommended Range: 60 kg', 'calculation', false, '1500 - 2100 mL', e.message);
  }

  // Test 3: Activity & Climate optional adjustments
  try {
    const calcAdj = calculateHydrationTarget({
      weightKg: 80, // 80 * 30 = 2400
      sex: 'male',
      ageRange: '31_50',
      activityLevel: 'high', // +500
      climate: 'hot', // +350
      applyActivitySuggestion: true,
      applyClimateSuggestion: true
    });
    // 2400 + 500 + 350 = 3250 mL
    assert(
      'Target Adjustments: 80kg + High Activity + Hot Climate => 3,250 mL',
      'calculation',
      calcAdj.totalSuggestedMl === 3250,
      '3250 mL',
      `${calcAdj.totalSuggestedMl} mL`
    );
  } catch (e: any) {
    assert('Target Adjustments', 'calculation', false, '3250 mL', e.message);
  }

  // Test 4: Unit Conversion (mL <-> fl oz)
  try {
    const flOz = mlToFlOz(500); // 500 / 29.5735 = 16.9
    const ml = flOzToMl(16.9);
    assert(
      'Unit Conversion: 500 mL -> ~16.9 fl oz -> ~500 mL',
      'units',
      flOz === 16.9 && Math.abs(ml - 500) <= 2,
      '16.9 fl oz & ~500 mL',
      `${flOz} fl oz & ${ml} mL`
    );
  } catch (e: any) {
    assert('Unit Conversion: Volume', 'units', false, '16.9 fl oz', e.message);
  }

  // Test 5: Weight Unit Conversion (kg <-> lb)
  try {
    const lb = kgToLb(70); // ~154.3 lb
    const kg = lbToKg(154.32);
    assert(
      'Unit Conversion: 70 kg -> 154.3 lb -> ~70 kg',
      'units',
      lb === 154.3 && Math.abs(kg - 70) <= 0.2,
      '154.3 lb & ~70 kg',
      `${lb} lb & ${kg.toFixed(1)} kg`
    );
  } catch (e: any) {
    assert('Unit Conversion: Weight', 'units', false, '154.3 lb', e.message);
  }

  // Test 6: Height Unit Conversion (cm <-> ft/in)
  try {
    const { feet, inches } = cmToFtIn(178); // ~5 ft 10 in
    const cm = ftInToCm(feet, inches);
    assert(
      'Unit Conversion: 178 cm -> 5 ft 10 in -> 178 cm',
      'units',
      feet === 5 && inches === 10 && cm === 178,
      '5 ft 10 in & 178 cm',
      `${feet} ft ${inches} in & ${cm} cm`
    );
  } catch (e: any) {
    assert('Unit Conversion: Height', 'units', false, '5 ft 10 in', e.message);
  }

  // Test 7: Medical and health safety notice trigger
  try {
    const calcNotice = calculateHydrationTarget({
      weightKg: 65,
      sex: 'female',
      ageRange: '18_30',
      activityLevel: 'moderate',
      climate: 'normal',
      hasFluidRestriction: true,
      pregnancyStatus: 'pregnant'
    });
    assert(
      'Health Flag: Fluid Restriction & Pregnancy triggers Doctor Guidance Notice',
      'safety',
      calcNotice.hasSpecialMedicalNotice && calcNotice.medicalNoticeReason.length >= 2,
      'true with 2 reasons',
      `${calcNotice.hasSpecialMedicalNotice} with ${calcNotice.medicalNoticeReason.length} reasons`
    );
  } catch (e: any) {
    assert('Health Safety Flag', 'safety', false, 'true', e.message);
  }

  // Test 8: Target safety threshold warnings (<1000 mL and >4500 mL)
  try {
    const lowWarning = getTargetSafetyWarning(800);
    const highWarning = getTargetSafetyWarning(5000);
    const normalWarning = getTargetSafetyWarning(2200);

    assert(
      'Target Safety: Warning on <1,000 mL and >4,500 mL',
      'safety',
      lowWarning.isWarning && highWarning.isWarning && !normalWarning.isWarning,
      'low=true, high=true, normal=false',
      `low=${lowWarning.isWarning}, high=${highWarning.isWarning}, normal=${normalWarning.isWarning}`
    );
  } catch (e: any) {
    assert('Target Safety Warnings', 'safety', false, 'warnings active', e.message);
  }

  // Test 9: Quiet hours detection
  try {
    const testDateDuringQuiet = new Date();
    testDateDuringQuiet.setHours(23, 15, 0, 0); // 23:15 is inside 22:30 -> 07:00

    const testDateOutsideQuiet = new Date();
    testDateOutsideQuiet.setHours(14, 0, 0, 0); // 14:00 is outside

    const isQuiet1 = isInsideQuietHours(testDateDuringQuiet, '22:30', '07:00');
    const isQuiet2 = isInsideQuietHours(testDateOutsideQuiet, '22:30', '07:00');

    assert(
      'Quiet Hours: Detects overnight interval (22:30 to 07:00)',
      'reminders',
      isQuiet1 === true && isQuiet2 === false,
      '23:15=true, 14:00=false',
      `23:15=${isQuiet1}, 14:00=${isQuiet2}`
    );
  } catch (e: any) {
    assert('Quiet Hours Interval', 'reminders', false, 'proper detection', e.message);
  }

  // Test 10: Streak Calculation Logic
  try {
    const mockProfile: UserProfile = {
      ...DEFAULT_PROFILE,
      dailyTargetMl: 2000
    };

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const mockLogs: WaterLog[] = [
      { id: '1', amount: 1200, timestamp: `${todayStr}T10:00:00Z`, drinkType: 'water' },
      { id: '2', amount: 1000, timestamp: `${todayStr}T14:00:00Z`, drinkType: 'water' }, // Total today: 2200 mL (>= 2000)
      { id: '3', amount: 2050, timestamp: `${yesterdayStr}T12:00:00Z`, drinkType: 'water' } // Total yesterday: 2050 mL (>= 2000)
    ];

    const streakRes = calculateStreak(mockLogs, mockProfile);
    assert(
      'Streak Engine: 2 consecutive days meeting target => 2-day streak',
      'logs',
      streakRes.currentStreak === 2,
      '2 days',
      `${streakRes.currentStreak} days`
    );
  } catch (e: any) {
    assert('Streak Engine', 'logs', false, '2 days', e.message);
  }

  const passedCount = results.filter(r => r.passed).length;

  return {
    results,
    summary: {
      total: results.length,
      passed: passedCount,
      failed: results.length - passedCount
    }
  };
}

export function runAllTests(): Array<TestResult & { message?: string }> {
  const { results } = runAllAppletTests();
  return results.map(r => ({
    ...r,
    message: `${r.name}: Expected ${r.expected}, got ${r.received}`
  }));
}
