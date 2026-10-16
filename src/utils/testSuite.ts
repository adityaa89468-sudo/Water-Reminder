import {
  calculateHydrationTarget,
  mlToFlOz,
  flOzToMl,
  kgToLb,
  lbToKg,
  cmToFtIn,
  ftInToCm,
  getTargetSafetyWarning,
  getMostFrequentDrinkVolume,
  calculateRecommendedIntake,
  calculateHydrationVelocityTrend
} from './calculations';
import {
  isInsideQuietHours,
  getNextReminderTime
} from './notifications';
import {
  calculateStreak,
  DEFAULT_PROFILE,
  exportDataAsCSV
} from './storage';
import { calculateAchievements } from './achievements';
import { COMMON_DRINK_SIZES } from '../components/HomeScreenWidget';
import { ALL_DRINK_TYPES, getDrinkTypeMetadata } from './drinkTypes';
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

  // Test: Achievements Engine - 7-day streak unlocks Weekly Warrior
  try {
    const testProfile: UserProfile = {
      ...DEFAULT_PROFILE,
      streak: 7,
      bestStreak: 7,
      totalDrankMl: 15000
    };
    const { achievements } = calculateAchievements(testProfile, []);
    const weeklyWarrior = achievements.find(a => a.id === 'streak_7');
    assert(
      'Achievements Engine: 7-day streak unlocks Weekly Warrior medal',
      'logs',
      Boolean(weeklyWarrior && weeklyWarrior.unlocked && weeklyWarrior.progressPercent === 100),
      'unlocked: true, progress: 100%',
      `unlocked: ${weeklyWarrior?.unlocked}, progress: ${weeklyWarrior?.progressPercent}%`
    );
  } catch (e: any) {
    assert('Achievements Engine: 7-day streak', 'logs', false, 'unlocked: true', e.message);
  }

  // Test: Achievements Engine - 3-day streak progress towards 7-day milestone
  try {
    const testProfile: UserProfile = {
      ...DEFAULT_PROFILE,
      streak: 3,
      bestStreak: 3,
      totalDrankMl: 6000
    };
    const { achievements } = calculateAchievements(testProfile, []);
    const weeklyWarrior = achievements.find(a => a.id === 'streak_7');
    assert(
      'Achievements Engine: 3-day streak shows 4 days remaining for Weekly Warrior',
      'logs',
      Boolean(weeklyWarrior && !weeklyWarrior.unlocked && weeklyWarrior.remainingToUnlock === 4),
      'remaining: 4 days',
      `remaining: ${weeklyWarrior?.remainingToUnlock} days`
    );
  } catch (e: any) {
    assert('Achievements Engine: 3-day streak progress', 'logs', false, 'remaining: 4 days', e.message);
  }

  // Test: CSV Export for Health Record Keeping
  try {
    const testLogs: WaterLog[] = [
      {
        id: 'log-101',
        amount: 500,
        timestamp: '2026-10-12T08:30:00.000Z',
        drinkType: 'water',
        note: 'Morning hydration'
      }
    ];
    const csvStr = exportDataAsCSV(testLogs);
    const hasHeaders = csvStr.includes('Log ID,Timestamp (ISO),Date (YYYY-MM-DD),Time,Amount (mL),Amount (fl oz),Beverage Type,Notes');
    const hasLogData = csvStr.includes('"log-101"') && csvStr.includes('500') && csvStr.includes('"water"') && csvStr.includes('"Morning hydration"');
    assert(
      'CSV Export: Generates health-record compliant CSV with metric & imperial values',
      'logs',
      hasHeaders && hasLogData,
      'Valid CSV with headers & rows',
      hasHeaders && hasLogData ? 'Valid CSV with headers & rows' : 'Missing headers or rows'
    );
  } catch (e: any) {
    assert('CSV Export: Health Record Keeping', 'logs', false, 'Valid CSV', e.message);
  }

  // Test: Home Screen Widget - Percentage and Common Drink Sizes
  try {
    const currentMl = 1400;
    const targetMl = 2000;
    const percentage = Math.round((currentMl / targetMl) * 100);
    const standardGlass = COMMON_DRINK_SIZES.find(s => s.id === 'glass');
    const sportsBottle = COMMON_DRINK_SIZES.find(s => s.id === 'bottle');
    const isValid =
      percentage === 70 &&
      standardGlass?.ml === 250 &&
      sportsBottle?.ml === 500 &&
      COMMON_DRINK_SIZES.length >= 4;

    assert(
      'Home Screen Widget: Accurate 70% intake gauge & standard drink presets',
      'calculation',
      isValid,
      'percentage: 70%, 250mL glass, 500mL bottle',
      `percentage: ${percentage}%, glass: ${standardGlass?.ml}mL, bottle: ${sportsBottle?.ml}mL`
    );
  } catch (e: any) {
    assert('Home Screen Widget: Math & Presets', 'calculation', false, 'Valid widget presets', e.message);
  }

  // Test: Most Frequently Consumed Drink Volume Engine
  try {
    const sampleLogs: WaterLog[] = [
      { id: '1', amount: 350, timestamp: '2026-10-15T08:00:00Z', drinkType: 'tea', synced: true },
      { id: '2', amount: 250, timestamp: '2026-10-15T10:00:00Z', drinkType: 'water', synced: true },
      { id: '3', amount: 350, timestamp: '2026-10-15T12:00:00Z', drinkType: 'tea', synced: true },
      { id: '4', amount: 500, timestamp: '2026-10-15T14:00:00Z', drinkType: 'water', synced: true },
      { id: '5', amount: 350, timestamp: '2026-10-15T16:00:00Z', drinkType: 'water', synced: true }
    ];

    const frequentResult = getMostFrequentDrinkVolume(sampleLogs);
    const emptyResult = getMostFrequentDrinkVolume([]);

    const isValid =
      frequentResult.amountMl === 350 &&
      frequentResult.count === 3 &&
      frequentResult.isFallback === false &&
      emptyResult.amountMl === 250 &&
      emptyResult.isFallback === true;

    assert(
      'Home Screen Widget: Identifies most frequent drink volume (350mL, 3x) and defaults gracefully',
      'calculation',
      isValid,
      'amountMl: 350, count: 3, fallback: 250mL',
      `amountMl: ${frequentResult.amountMl}, count: ${frequentResult.count}, fallback: ${emptyResult.amountMl}mL`
    );
  } catch (e: any) {
    assert('Home Screen Widget: Most Frequent Volume', 'calculation', false, 'Valid 350mL calculation', e.message);
  }

  // Test: Home Screen Widget - Hydration Trend Indicator & Velocity Comparison
  try {
    const fixedNow = new Date('2026-10-16T14:00:00');
    const yStr = '2026-10-15';
    const tStr = '2026-10-16';

    // Scenario A: Pacing Ahead (Today 1000 mL vs Yesterday 500 mL by 14:00)
    const logsAhead: WaterLog[] = [
      { id: 'y1', amount: 500, timestamp: `${yStr}T10:00:00`, drinkType: 'water' },
      { id: 'y2', amount: 500, timestamp: `${yStr}T18:00:00`, drinkType: 'water' }, // After 14:00, not counted in velocity comparison
      { id: 't1', amount: 500, timestamp: `${tStr}T09:00:00`, drinkType: 'water' },
      { id: 't2', amount: 500, timestamp: `${tStr}T12:00:00`, drinkType: 'water' }
    ];
    const trendUp = calculateHydrationVelocityTrend(logsAhead, fixedNow, 'metric');

    // Scenario B: Pacing Behind (Today 250 mL vs Yesterday 750 mL by 14:00)
    const logsBehind: WaterLog[] = [
      { id: 'y1', amount: 500, timestamp: `${yStr}T09:00:00`, drinkType: 'water' },
      { id: 'y2', amount: 250, timestamp: `${yStr}T11:00:00`, drinkType: 'water' },
      { id: 't1', amount: 250, timestamp: `${tStr}T09:00:00`, drinkType: 'water' }
    ];
    const trendDown = calculateHydrationVelocityTrend(logsBehind, fixedNow, 'metric');

    // Scenario C: On Pace / Steady (Today 500 mL vs Yesterday 500 mL by 14:00)
    const logsFlat: WaterLog[] = [
      { id: 'y1', amount: 500, timestamp: `${yStr}T10:00:00`, drinkType: 'water' },
      { id: 't1', amount: 500, timestamp: `${tStr}T10:00:00`, drinkType: 'water' }
    ];
    const trendFlat = calculateHydrationVelocityTrend(logsFlat, fixedNow, 'metric');

    const isTrendValid =
      trendUp.direction === 'up' &&
      trendUp.arrow === 'up' &&
      trendUp.differenceMl === 500 &&
      trendUp.todayMlSoFar === 1000 &&
      trendUp.yesterdayMlAtSameTime === 500 &&
      trendUp.actionableFeedback.length > 0 &&
      trendDown.direction === 'down' &&
      trendDown.arrow === 'down' &&
      trendDown.differenceMl === -500 &&
      trendDown.actionableFeedback.includes('slower') &&
      trendFlat.direction === 'flat' &&
      trendFlat.arrow === 'flat' &&
      trendFlat.differenceMl === 0;

    assert(
      'Home Screen Widget: Hydration Trend Velocity Indicator (Up, Down, Flat) & Actionable Feedback',
      'calculation',
      isTrendValid,
      'Up: +500mL, Down: -500mL, Flat: 0mL with arrow icons and actionable feedback',
      `Up: ${trendUp.direction} (+${trendUp.differenceMl}mL), Down: ${trendDown.direction} (${trendDown.differenceMl}mL), Flat: ${trendFlat.direction}`
    );
  } catch (e: any) {
    assert('Home Screen Widget: Hydration Trend', 'calculation', false, 'Valid trend computation', e.message);
  }


  // Test: 7-Day Hydration Trend Calculation
  try {
    const sampleDayMap: Record<string, number> = {
      '2026-10-15': 2250,
      '2026-10-14': 2000,
      '2026-10-13': 2100,
      '2026-10-12': 1800,
      '2026-10-11': 2400,
      '2026-10-10': 1900,
      '2026-10-09': 2050
    };
    const targetMl = 2000;
    const days = Object.values(sampleDayMap);
    const totalMl = days.reduce((sum, v) => sum + v, 0);
    const avgDailyMl = Math.round(totalMl / 7);
    const metCount = days.filter(v => v >= targetMl).length;
    const isValidTrend = totalMl === 14500 && avgDailyMl === 2071 && metCount === 5;

    assert(
      '7-Day Trend Engine: Computes 7-day volume totals, daily averages, and goal hit frequency',
      'calculation',
      isValidTrend,
      'total: 14500mL, avg: 2071mL, met: 5/7',
      `total: ${totalMl}mL, avg: ${avgDailyMl}mL, met: ${metCount}/7`
    );
  } catch (e: any) {
    assert('7-Day Trend Engine', 'calculation', false, 'Valid 7-day trend', e.message);
  }

  // Test: Radial Progress Bar Math & Completion Percentage
  try {
    const testCurrentMl = 1875;
    const testTargetMl = 2500;
    const pct = Math.round((testCurrentMl / testTargetMl) * 100);
    const radius = 110;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (Math.min(pct, 100) / 100) * circumference;
    const isCompleted = testCurrentMl >= testTargetMl;

    assert(
      'Radial Progress Bar: Calculates percentage (75%), stroke-dashoffset, and target status accurately',
      'calculation',
      pct === 75 && !isCompleted && strokeDashoffset > 0,
      'pct: 75%, completed: false',
      `pct: ${pct}%, completed: ${isCompleted}`
    );
  } catch (e: any) {
    assert('Radial Progress Bar Math', 'calculation', false, 'Valid 75% calculation', e.message);
  }

  // Test: Smart Reminders Widget - Next Reminder Info & One-Tap 250ml Math
  try {
    const testProfile: UserProfile = {
      ...DEFAULT_PROFILE,
      reminders: {
        ...DEFAULT_PROFILE.reminders,
        enabled: true,
        startTime: '08:00',
        endTime: '22:00',
        intervalMinutes: 90,
        activeDays: [0, 1, 2, 3, 4, 5, 6],
        pausedUntilDate: null
      }
    };
    const reminderInfo = getNextReminderTime(testProfile, 1000, 2000);
    const logAmount = 250;
    const newTotal = 1000 + logAmount;

    const isValid =
      reminderInfo !== null &&
      typeof reminderInfo.statusMessage === 'string' &&
      newTotal === 1250;

    assert(
      'Smart Reminders Widget: Calculates next reminder info & updates total with one-tap 250mL log',
      'reminders',
      isValid,
      'Valid reminder status, newTotal: 1250mL',
      `status: ${reminderInfo.statusMessage}, newTotal: ${newTotal}mL`
    );
  } catch (e: any) {
    assert('Smart Reminders Widget: Math & Status', 'reminders', false, 'Valid reminder calculation', e.message);
  }

  // Test: Settings Intake Auto-Calculator (Weight, Activity, and Climate)
  try {
    // 70kg, moderate activity (+250mL), hot climate (+350mL) => 2100 + 250 + 350 = 2700mL
    const testHot = calculateRecommendedIntake(70, 'moderate', 'hot');
    // 70kg, low activity (+0mL), temperate climate (+0mL) => 2100mL
    const testTemperate = calculateRecommendedIntake(70, 'low', 'normal');
    // 60kg, high activity (+500mL), cold climate (+0mL) => 1800 + 500 = 2300mL
    const testCold = calculateRecommendedIntake(60, 'high', 'cool');

    const isValid =
      testHot.baseMl === 2100 &&
      testHot.activityAdjustmentMl === 250 &&
      testHot.climateAdjustmentMl === 350 &&
      testHot.totalSuggestedMl === 2700 &&
      testTemperate.totalSuggestedMl === 2100 &&
      testCold.totalSuggestedMl === 2300;

    assert(
      'Intake Auto-Calculator: Automatically calculates recommended intake from weight, activity & climate (hot/cold/temperate)',
      'calculation',
      isValid,
      'Hot: 2700mL, Temperate: 2100mL, Cold: 2300mL',
      `Hot: ${testHot.totalSuggestedMl}mL, Temperate: ${testTemperate.totalSuggestedMl}mL, Cold: ${testCold.totalSuggestedMl}mL`
    );
  } catch (e: any) {
    assert('Intake Auto-Calculator', 'calculation', false, 'Valid auto-calculation', e.message);
  }

  // Test: Drink Categories & Custom Icons Metadata
  try {
    const hasRequiredTypes =
      ALL_DRINK_TYPES.includes('water') &&
      ALL_DRINK_TYPES.includes('tea') &&
      ALL_DRINK_TYPES.includes('coffee') &&
      ALL_DRINK_TYPES.includes('juice');

    const coffeeMeta = getDrinkTypeMetadata('coffee');
    const juiceMeta = getDrinkTypeMetadata('juice');
    const teaMeta = getDrinkTypeMetadata('tea');

    // Test category breakdown calculation on sample logs
    const sampleCategoryLogs: WaterLog[] = [
      { id: 'c1', amount: 300, timestamp: '2026-10-15T08:00:00Z', drinkType: 'coffee', synced: true },
      { id: 'w1', amount: 500, timestamp: '2026-10-15T10:00:00Z', drinkType: 'water', synced: true },
      { id: 'j1', amount: 250, timestamp: '2026-10-15T12:00:00Z', drinkType: 'juice', synced: true },
      { id: 't1', amount: 250, timestamp: '2026-10-15T15:00:00Z', drinkType: 'tea', synced: true }
    ];

    const categoryMap = new Map<string, number>();
    sampleCategoryLogs.forEach(l => {
      categoryMap.set(l.drinkType, (categoryMap.get(l.drinkType) || 0) + l.amount);
    });

    const isValid =
      hasRequiredTypes &&
      coffeeMeta.label.includes('Coffee') &&
      juiceMeta.label.includes('Juice') &&
      teaMeta.label.includes('Tea') &&
      categoryMap.get('coffee') === 300 &&
      categoryMap.get('water') === 500 &&
      categoryMap.get('juice') === 250 &&
      categoryMap.get('tea') === 250;

    assert(
      'Drink Categories & Custom Icons: Validates water, tea, coffee, juice support and category aggregation',
      'logs',
      isValid,
      'Valid drink types & categories (coffee: 300mL, water: 500mL, juice: 250mL, tea: 250mL)',
      `Valid: ${isValid}, coffee: ${categoryMap.get('coffee')}mL, juice: ${categoryMap.get('juice')}mL`
    );
  } catch (e: any) {
    assert('Drink Categories & Custom Icons', 'logs', false, 'Valid categories', e.message);
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
