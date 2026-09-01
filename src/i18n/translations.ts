export interface TranslationStrings {
  appName: string;
  tagline: string;
  home: string;
  history: string;
  insights: string;
  tips: string;
  settings: string;
  
  // Home
  todayProgress: string;
  drank: string;
  goal: string;
  remaining: string;
  nextReminder: string;
  remindersPaused: string;
  pauseForToday: string;
  resumeReminders: string;
  quickAdd: string;
  customAmount: string;
  undoLast: string;
  logWater: string;
  streakDays: string;
  targetReached: string;
  congratsMessage: string;
  whyTarget: string;
  
  // Motivational messages
  motivationMorning: string;
  motivationAfternoon: string;
  motivationEvening: string;
  motivationAhead: string;
  motivationBehind: string;
  motivationGoalMet: string;
  
  // Quick Presets
  smallCup: string;
  regularGlass: string;
  mug: string;
  sportsBottle: string;
  largeFlask: string;
  
  // Units
  ml: string;
  flOz: string;
  kg: string;
  lb: string;
  cm: string;
  ftIn: string;
  
  // Onboarding
  welcomeTitle: string;
  welcomeSub: string;
  getStarted: string;
  skipToApp: string;
  step: string;
  of: string;
  next: string;
  back: string;
  saveAndStart: string;
  
  // Health disclaimer
  medicalDisclaimerTitle: string;
  medicalDisclaimerShort: string;
  medicalDisclaimerFull: string;
}

export const translations: Record<'en' | 'hi', TranslationStrings> = {
  en: {
    appName: 'SipLumo',
    tagline: 'Mindful, balanced hydration reminder',
    home: 'Home',
    history: 'History',
    insights: 'Insights',
    tips: 'Guidance',
    settings: 'Settings',
    
    todayProgress: "Today's Intake",
    drank: 'Drank',
    goal: 'Target',
    remaining: 'Remaining',
    nextReminder: 'Next reminder',
    remindersPaused: 'Reminders paused for today',
    pauseForToday: 'Pause for today',
    resumeReminders: 'Resume reminders',
    quickAdd: 'Quick Add',
    customAmount: 'Custom Entry',
    undoLast: 'Undo Last',
    logWater: 'Log Water',
    streakDays: 'day streak',
    targetReached: 'Daily Target Achieved!',
    congratsMessage: 'Great job maintaining healthy hydration today.',
    whyTarget: 'Why this target?',
    
    motivationMorning: 'Start your morning with a refreshing glass of water.',
    motivationAfternoon: 'Keep up your natural rhythm through the afternoon.',
    motivationEvening: 'Stay pleasantly hydrated as you wind down.',
    motivationAhead: 'You are on track with your hydration schedule!',
    motivationBehind: 'A gentle reminder to take a mindful sip.',
    motivationGoalMet: 'You have met your daily target. Listen to your body.',
    
    smallCup: 'Small Cup',
    regularGlass: 'Glass',
    mug: 'Mug',
    sportsBottle: 'Bottle',
    largeFlask: 'Flask',
    
    ml: 'mL',
    flOz: 'fl oz',
    kg: 'kg',
    lb: 'lb',
    cm: 'cm',
    ftIn: 'ft/in',
    
    welcomeTitle: 'Welcome to SipLumo',
    welcomeSub: 'A transparent, privacy-first hydration tracker designed for your daily wellness.',
    getStarted: 'Personalize My Target',
    skipToApp: 'Continue with Default (2,000 mL)',
    step: 'Step',
    of: 'of',
    next: 'Next',
    back: 'Back',
    saveAndStart: 'Start Hydrating',
    
    medicalDisclaimerTitle: 'General Wellness Notice',
    medicalDisclaimerShort: 'This app provides general wellness estimates and is not a medical device.',
    medicalDisclaimerFull: 'This app is intended for general wellness and informational purposes only. It is not a medical device and does not diagnose, treat, cure, or prevent any medical condition. Hydration needs vary. Consult a qualified healthcare professional if you have a medical condition, take medication affecting fluid balance, are pregnant or breastfeeding, or have been advised to restrict fluids.'
  },
  hi: {
    appName: 'SipLumo',
    tagline: 'शांत और सचेत जल-पान अनुस्मारक',
    home: 'होम',
    history: 'इतिहास',
    insights: 'विश्लेषण',
    tips: 'सुझाव',
    settings: 'सेटिंग्स',
    
    todayProgress: 'आज का जल सेवन',
    drank: 'पिया',
    goal: 'लक्ष्य',
    remaining: 'शेष',
    nextReminder: 'अगला रिमाइंडर',
    remindersPaused: 'आज के लिए रिमाइंडर रोके गए',
    pauseForToday: 'आज के लिए रोकें',
    resumeReminders: 'रिमाइंडर फिर चालू करें',
    quickAdd: 'त्वरित जोड़ें',
    customAmount: 'कस्टम मात्रा',
    undoLast: 'पिछला पूर्ववत करें',
    logWater: 'पानी दर्ज करें',
    streakDays: 'दिनों का क्रम',
    targetReached: 'दैनिक लक्ष्य पूरा हुआ!',
    congratsMessage: 'आज स्वस्थ जलयोजन बनाए रखने के लिए बधाई।',
    whyTarget: 'यह लक्ष्य क्यों?',
    
    motivationMorning: 'सुबह की शुरुआत एक गिलास ताज़े पानी से करें।',
    motivationAfternoon: 'दोपहर में अपनी नियमित लय बनाए रखें।',
    motivationEvening: 'शाम को आराम करते समय हल्का पानी पिएं।',
    motivationAhead: 'आप अपने जलयोजन कार्यक्रम के अनुसार सही चल रहे हैं!',
    motivationBehind: 'एक सौम्य अनुस्मारक: एक घूंट पानी पिएं।',
    motivationGoalMet: 'आपने अपना दैनिक लक्ष्य प्राप्त कर लिया है।',
    
    smallCup: 'छोटा कप',
    regularGlass: 'गिलास',
    mug: 'मग',
    sportsBottle: 'बोतल',
    largeFlask: 'फ्लास्क',
    
    ml: 'मिली',
    flOz: 'औंस',
    kg: 'किग्रा',
    lb: 'पाउंड',
    cm: 'सेमी',
    ftIn: 'फीट/इंच',
    
    welcomeTitle: 'SipLumo में आपका स्वागत है',
    welcomeSub: 'आपके दैनिक स्वास्थ्य के लिए एक पारदर्शी, सुरक्षित जल ट्रैकर।',
    getStarted: 'मेरा लक्ष्य अनुकूलित करें',
    skipToApp: 'डिफ़ॉल्ट (2,000 मिली) के साथ जारी रखें',
    step: 'चरण',
    of: 'का',
    next: 'आगे बढ़ें',
    back: 'पीछे जाएं',
    saveAndStart: 'आरंभ करें',
    
    medicalDisclaimerTitle: 'सामान्य स्वास्थ्य सूचना',
    medicalDisclaimerShort: 'यह ऐप केवल सामान्य स्वास्थ्य अनुमान प्रदान करता है और कोई मेडिकल उपकरण नहीं है।',
    medicalDisclaimerFull: 'यह ऐप केवल सामान्य स्वास्थ्य और सूचनात्मक उद्देश्यों के लिए है। यह कोई मेडिकल उपकरण नहीं है और किसी भी चिकित्सीय स्थिति का निदान, उपचार, इलाज या रोकथाम नहीं करता है।'
  }
};
