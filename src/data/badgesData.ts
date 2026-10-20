import { UserProgressState, DailyLog } from '../utils/storage';
import { PRACTICE_SURAHS } from './surahData';

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'diamond';
export type BadgeCategory = 'all' | 'streak' | 'words' | 'quran' | 'habits';

export interface BadgeDefinition {
  id: string;
  titleBn: string;
  titleEn: string;
  category: 'streak' | 'words' | 'quran' | 'habits';
  tier: BadgeTier;
  iconName:
    | 'Sunrise'
    | 'Flame'
    | 'Crown'
    | 'Sparkles'
    | 'BookOpen'
    | 'Compass'
    | 'Trophy'
    | 'Clock'
    | 'Target'
    | 'Award'
    | 'Moon'
    | 'Layers';
  colorTheme: {
    bgLight: string;
    borderLight: string;
    textDark: string;
    badgeGlow: string;
    ribbonColor: string;
    tierLabelBn: string;
  };
  shortDescriptionBn: string;
  loreBn: string;
  hadithOrQuoteBn: string;
  hadithSourceBn: string;
  requirementBn: string;
  targetTab: 'alphabet' | 'words' | 'roots' | 'grammar' | 'plan' | 'quran';
  checkProgress: (
    progress: UserProgressState,
    todayLog?: DailyLog
  ) => {
    isUnlocked: boolean;
    current: number;
    target: number;
    percent: number;
    progressText: string;
    tipBn: string;
  };
}

export const BADGE_TIER_STYLES: Record<
  BadgeTier,
  { labelBn: string; borderClass: string; badgeClass: string; chipClass: string }
> = {
  bronze: {
    labelBn: 'ব্রোঞ্জ ব্যাজ',
    borderClass: 'border-amber-600/40',
    badgeClass: 'from-amber-700 via-amber-800 to-amber-950 text-amber-100',
    chipClass: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  silver: {
    labelBn: 'সিলভার ব্যাজ',
    borderClass: 'border-slate-400',
    badgeClass: 'from-slate-600 via-slate-700 to-slate-900 text-slate-100',
    chipClass: 'bg-slate-100 text-slate-800 border-slate-300',
  },
  gold: {
    labelBn: 'গোল্ড ব্যাজ',
    borderClass: 'border-yellow-500',
    badgeClass: 'from-amber-500 via-yellow-600 to-amber-800 text-yellow-50',
    chipClass: 'bg-amber-100 text-amber-950 border-amber-400',
  },
  diamond: {
    labelBn: 'ডায়মন্ড ব্যাজ',
    borderClass: 'border-cyan-400',
    badgeClass: 'from-cyan-600 via-emerald-700 to-teal-900 text-cyan-50',
    chipClass: 'bg-cyan-100 text-cyan-950 border-cyan-300',
  },
};

export const BADGES_LIST: BadgeDefinition[] = [
  // 1. Early Bird
  {
    id: 'early-bird',
    titleBn: 'ভোরের পাখি (Early Bird)',
    titleEn: 'Early Bird',
    category: 'habits',
    tier: 'silver',
    iconName: 'Sunrise',
    colorTheme: {
      bgLight: 'bg-amber-50',
      borderLight: 'border-amber-200',
      textDark: 'text-amber-950',
      badgeGlow: 'shadow-amber-500/20',
      ribbonColor: 'bg-amber-600',
      tierLabelBn: 'সিলভার',
    },
    shortDescriptionBn: 'সকালের বরকতময় সময়ে আরবি শিক্ষা ও কুরআন অধ্যয়ন সম্পন্নকারী।',
    loreBn: 'রাসূলুল্লাহ ﷺ সকালের কাজে বরকতের জন্য বিশেষ দুআ করেছেন। ভোরে শান্ত মনে শব্দ শেখা স্মৃতিতে দ্রুত স্থায়ী হয়।',
    hadithOrQuoteBn: 'اللَّهُمَّ بَارِكْ لِأُمَّتِي فِي بُكُورِهَا — হে আল্লাহ! আমার উম্মতের সকালের কাজে বরকত দান করুন।',
    hadithSourceBn: 'সুনানে আবু দাউদ ও তিরমিযী',
    requirementBn: 'সকাল ১০:০০ টার পূর্বে যেকোনো শব্দ শিক্ষা বা রুটিন ধাপ সম্পন্ন করুন।',
    targetTab: 'plan',
    checkProgress: (progress, todayLog) => {
      // Check if unlocked in user state, or today has morningSession, or past logs have morningSession
      const hasStoredUnlock = progress.unlockedBadgeIds?.includes('early-bird');
      const hasTodayMorning = todayLog?.morningSession === true;
      const hasAnyMorningLog = Object.values(progress.dailyLogs || {}).some(
        (l) => l.morningSession === true
      );

      // Check current hour if currently before 10am and user has studied today
      const currentHour = new Date().getHours();
      const studiedTodayEarly =
        currentHour < 10 &&
        ((todayLog?.wordsLearned || 0) > 0 ||
          (todayLog?.minutesStudied || 0) > 0 ||
          todayLog?.planStepsCompleted.step1NewWords);

      const isUnlocked = Boolean(
        hasStoredUnlock || hasTodayMorning || hasAnyMorningLog || studiedTodayEarly
      );

      return {
        isUnlocked,
        current: isUnlocked ? 1 : 0,
        target: 1,
        percent: isUnlocked ? 100 : 0,
        progressText: isUnlocked ? 'সকালবেলার আমল অর্জিত' : 'সকাল ১০টার আগে চর্চা করুন',
        tipBn: isUnlocked
          ? 'অভিনন্দন! আপনি ভোরের বরকতময় সময়ে অধ্যয়নের সম্মাননা অর্জন করেছেন।'
          : 'আগামীকাল সকালে ফজরের পর ২০ মিনিটের সেশন শেষ করে এই ব্যাজটি আনলক করুন।',
      };
    },
  },

  // 2. 7-Day Streak
  {
    id: 'streak-7',
    titleBn: '৭ দিনের অটল সাধক (7-Day Streak)',
    titleEn: '7-Day Streak',
    category: 'streak',
    tier: 'gold',
    iconName: 'Flame',
    colorTheme: {
      bgLight: 'bg-orange-50',
      borderLight: 'border-orange-200',
      textDark: 'text-orange-950',
      badgeGlow: 'shadow-orange-500/25',
      ribbonColor: 'bg-orange-600',
      tierLabelBn: 'গোল্ড',
    },
    shortDescriptionBn: 'টানা ৭ দিন নিয়মিত কুরআনিক আরবি অধ্যয়নের অটল ধারাবাহিকতা।',
    loreBn: 'ধারাবাহিকতা হলো সাফল্যের মূল চাবিকাঠি। একটানা ৭ দিন চর্চা আপনার দৈনন্দিন কুরআনিক অভ্যাসের মজবুত ভিত্তি গড়ে তোলে।',
    hadithOrQuoteBn: 'أَحَبُّ الْأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ — আল্লাহর কাছে সবচেয়ে প্রিয় আমল তা, যা নিয়মিত করা হয়, যদিও তা পরিমাণে কম হয়।',
    hadithSourceBn: 'সহীহ বুখারী: ৬৪৬৪',
    requirementBn: 'টানা ৭ দিন অ্যাপে প্রবেশ করে অন্তত একটি শব্দ বা ধাপ চর্চা করুন।',
    targetTab: 'plan',
    checkProgress: (progress) => {
      const current = progress.streakDays || 0;
      const target = 7;
      const isUnlocked = current >= target || (progress.unlockedBadgeIds?.includes('streak-7') ?? false);
      const percent = Math.min(100, Math.round((current / target) * 100));

      return {
        isUnlocked,
        current,
        target,
        percent,
        progressText: `${current}/${target} দিন`,
        tipBn: isUnlocked
          ? 'মাশাআল্লাহ! আপনি পূর্ণ এক সপ্তাহের অবিচল অধ্যবসায় প্রমাণ করেছেন।'
          : `আর মাত্র ${Math.max(1, target - current)} দিন নিয়মিত অনুশীলন করলেই এই গোল্ড সম্মাননা আপনার হবে!`,
      };
    },
  },

  // 3. Word Master
  {
    id: 'word-master',
    titleBn: 'কুরআনিক শব্দ সম্রাট (Word Master)',
    titleEn: 'Word Master',
    category: 'words',
    tier: 'gold',
    iconName: 'Crown',
    colorTheme: {
      bgLight: 'bg-emerald-50',
      borderLight: 'border-emerald-200',
      textDark: 'text-emerald-950',
      badgeGlow: 'shadow-emerald-500/25',
      ribbonColor: 'bg-emerald-600',
      tierLabelBn: 'গোল্ড',
    },
    shortDescriptionBn: 'কুরআনের সর্বাধিক ব্যবহৃত ২৫টি মৌলিক শব্দভাণ্ডার সফলভাবে আয়ত্তকারী।',
    loreBn: 'কুরআনের মাত্র ৩০০টি শব্দ কুরআনের প্রায় ৭০% পুনরাবৃত্ত অংশ গঠন করে। ২৫টি শব্দ আয়ত্ত করা কুরআনিক ভাষা অনুধাবনের বড় এক মাইলফলক।',
    hadithOrQuoteBn: 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ — তোমাদের মধ্যে সর্বোত্তম ব্যক্তি সে, যে কুরআন শিখে এবং অপরকে শিক্ষা দেয়।',
    hadithSourceBn: 'সহীহ বুখারী: ৫০২৭',
    requirementBn: 'শব্দভাণ্ডার থেকে ২৫টি শব্দের অর্থ ও উচ্চারণ Spaced Repetition-এ শিখুন।',
    targetTab: 'words',
    checkProgress: (progress) => {
      const current = Object.keys(progress.wordSRS || {}).length;
      const target = 25;
      const isUnlocked = current >= target || (progress.unlockedBadgeIds?.includes('word-master') ?? false);
      const percent = Math.min(100, Math.round((current / target) * 100));

      return {
        isUnlocked,
        current,
        target,
        percent,
        progressText: `${current}/${target}টি শব্দ`,
        tipBn: isUnlocked
          ? 'আলহামদুলিল্লাহ! কুরআনের সর্বাধিক ব্যবহৃত ২৫টি মূল শব্দ আপনার আয়ত্তে এসেছে।'
          : `এখন পর্যন্ত ${current}টি শব্দ শিখেছেন। আর ${Math.max(1, target - current)}টি শব্দ শিখলেই এই ব্যাজ আনলক হবে।`,
      };
    },
  },

  // 4. First Step Pioneer
  {
    id: 'first-step',
    titleBn: 'প্রথম কদম (First Step)',
    titleEn: 'First Step',
    category: 'habits',
    tier: 'bronze',
    iconName: 'Sparkles',
    colorTheme: {
      bgLight: 'bg-teal-50',
      borderLight: 'border-teal-200',
      textDark: 'text-teal-950',
      badgeGlow: 'shadow-teal-500/20',
      ribbonColor: 'bg-teal-600',
      tierLabelBn: 'ব্রোঞ্জ',
    },
    shortDescriptionBn: 'কুরআনের ভাষা শিক্ষার পবিত্র সফরে প্রথম শুভ পদক্ষেপ গ্রহণকারী।',
    loreBn: 'হাজার মাইলের মহাযাত্রা শুরু হয় একটিমাত্র দৃঢ় কদম দিয়ে। কুরআনিক শব্দ শেখার নিয়ত করে আপনি বরকতময় পথে পা বাড়িয়েছেন।',
    hadithOrQuoteBn: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ — প্রত্যেক কাজের ফলাফল নিয়তের ওপর নির্ভরশীল।',
    hadithSourceBn: 'সহীহ বুখারী: ১',
    requirementBn: 'যেকোনো একটি আরবি হরফ বা প্রথম শব্দ সফলভাবে অনুশীলন করুন।',
    targetTab: 'alphabet',
    checkProgress: (progress) => {
      const letterCount = progress.masteredLetters?.length || 0;
      const wordCount = Object.keys(progress.wordSRS || {}).length;
      const totalInitial = letterCount + wordCount;
      const isUnlocked = totalInitial >= 1 || (progress.unlockedBadgeIds?.includes('first-step') ?? true);

      return {
        isUnlocked,
        current: isUnlocked ? 1 : 0,
        target: 1,
        percent: 100,
        progressText: 'যাত্রার সূচনা সম্পন্ন',
        tipBn: 'কুরআনিক আরবি শিক্ষার আলোকময় সফরে আপনাকে স্বাগতম!',
      };
    },
  },

  // 5. 3-Day Consistency
  {
    id: 'streak-3',
    titleBn: 'ধারাবাহিকতার সূচনা (3-Day Streak)',
    titleEn: '3-Day Streak',
    category: 'streak',
    tier: 'bronze',
    iconName: 'Clock',
    colorTheme: {
      bgLight: 'bg-sky-50',
      borderLight: 'border-sky-200',
      textDark: 'text-sky-950',
      badgeGlow: 'shadow-sky-500/20',
      ribbonColor: 'bg-sky-600',
      tierLabelBn: 'ব্রোঞ্জ',
    },
    shortDescriptionBn: 'টানা ৩ দিন নিয়মিত পড়াশোনার মাধ্যমে সুঅভ্যাসের উদ্বোধন।',
    loreBn: 'একটানা ৩ দিন কোনো ভালো কাজ করলে তা মন ও মস্তিষ্কে এক শক্তিশালী ইতিবাচক রুটিন তৈরি করে।',
    hadithOrQuoteBn: 'মৃদু কিন্তু নিয়মিত অনুশীলন দীর্ঘমেয়াদে বিস্ময়কর পরিবর্তন বয়ে আনে।',
    hadithSourceBn: 'জ্ঞানীদের হিতোপদেশ',
    requirementBn: 'টানা ৩ দিন অ্যাপে অন্তত ১টি অনুশীলন সম্পন্ন করুন।',
    targetTab: 'plan',
    checkProgress: (progress) => {
      const current = progress.streakDays || 0;
      const target = 3;
      const isUnlocked = current >= target || (progress.unlockedBadgeIds?.includes('streak-3') ?? false);
      const percent = Math.min(100, Math.round((current / target) * 100));

      return {
        isUnlocked,
        current,
        target,
        percent,
        progressText: `${current}/${target} দিন`,
        tipBn: isUnlocked
          ? 'অভিনন্দন! আপনার ধারাবাহিক ৩ দিনের যাত্রা সফলভাবে সম্পন্ন হয়েছে।'
          : `ধারাবাহিক চর্চায় আর মাত্র ${Math.max(1, target - current)} দিন প্রয়োজন।`,
      };
    },
  },

  // 6. Alphabet Virtuoso
  {
    id: 'alphabet-virtuoso',
    titleBn: 'হরফ বিশারদ (Alphabet Virtuoso)',
    titleEn: 'Alphabet Virtuoso',
    category: 'words',
    tier: 'silver',
    iconName: 'Award',
    colorTheme: {
      bgLight: 'bg-indigo-50',
      borderLight: 'border-indigo-200',
      textDark: 'text-indigo-950',
      badgeGlow: 'shadow-indigo-500/20',
      ribbonColor: 'bg-indigo-600',
      tierLabelBn: 'সিলভার',
    },
    shortDescriptionBn: 'আরবি ২৮টি হরফের মধ্যে কমপক্ষে ১৪টি হরফের মাখরাজ ও রূপ আয়ত্তকারী।',
    loreBn: 'সঠিক উচ্চারণে হরফ চেনা কুরআন বিশুদ্ধভাবে পড়ার প্রধান ভিত্তি। প্রতিটি হরফ তিলাওয়াতে দশটি করে নেকি অর্জিত হয়।',
    hadithOrQuoteBn: 'مَنْ قَرَأَ حَرْفًا مِنْ كِتَابِ اللَّهِ فَلَهُ بِهِ حَسَنَةٌ — যে ব্যক্তি আল্লাহর কিতাব থেকে একটি হরফ পড়বে, সে একটি নেকি পাবে, যা দশ গুণ বৃদ্ধি করা হবে।',
    hadithSourceBn: 'সুনানে তিরমিযী: ২৯১০',
    requirementBn: 'আরবি বর্ণমালা থেকে কমপক্ষে ১৪টি হরফ আয়ত্ত করুন (Mastered)।',
    targetTab: 'alphabet',
    checkProgress: (progress) => {
      const current = progress.masteredLetters?.length || 0;
      const target = 14;
      const isUnlocked = current >= target || (progress.unlockedBadgeIds?.includes('alphabet-virtuoso') ?? false);
      const percent = Math.min(100, Math.round((current / target) * 100));

      return {
        isUnlocked,
        current,
        target,
        percent,
        progressText: `${current}/${target}টি হরফ`,
        tipBn: isUnlocked
          ? 'মাশাআল্লাহ! আপনি ১৪টি হরফের বিশুদ্ধ উচ্চারণ আয়ত্ত করেছেন।'
          : `আরও ${Math.max(1, target - current)}টি হরফ আয়ত্ত করে বর্ণমালার এই সম্মাননা অর্জন করুন।`,
      };
    },
  },

  // 7. Ayah Explorer
  {
    id: 'ayah-explorer',
    titleBn: 'কুরআন তিলাওয়াতকারী (Ayah Explorer)',
    titleEn: 'Ayah Explorer',
    category: 'quran',
    tier: 'silver',
    iconName: 'BookOpen',
    colorTheme: {
      bgLight: 'bg-emerald-50',
      borderLight: 'border-emerald-200',
      textDark: 'text-emerald-950',
      badgeGlow: 'shadow-emerald-500/20',
      ribbonColor: 'bg-emerald-600',
      tierLabelBn: 'সিলভার',
    },
    shortDescriptionBn: 'কুরআন চর্চায় কমপক্ষে ৫টি আয়াতের শব্দে শব্দে অর্থ ও উচ্চারণ অনুশীলক।',
    loreBn: 'কুরআনের আয়াত বুঝে পড়া অন্তরে প্রশান্তি ও হেদায়েত বয়ে আনে। শব্দার্থ জানা থাকলে নামাজের মনোযোগ বহুগুণ বেড়ে যায়।',
    hadithOrQuoteBn: 'أَفَلَا يَتَدَبَّرُونَ الْقُرْآنَ — তবে কি তারা কুরআন নিয়ে গভীর চিন্তা-ভাবনা করে না?',
    hadithSourceBn: 'সূরা আন-নিসা: ৮২',
    requirementBn: 'কুরআন চর্চা অংশে অন্তত ৫টি আয়াতের শব্দার্থ ও তিলাওয়াত অনুশীলন করুন।',
    targetTab: 'quran',
    checkProgress: (progress) => {
      const current = progress.practicedAyahKeys?.length || 0;
      const target = 5;
      const isUnlocked = current >= target || (progress.unlockedBadgeIds?.includes('ayah-explorer') ?? false);
      const percent = Math.min(100, Math.round((current / target) * 100));

      return {
        isUnlocked,
        current,
        target,
        percent,
        progressText: `${current}/${target}টি আয়াত`,
        tipBn: isUnlocked
          ? 'আলহামদুলিল্লাহ! আপনি ৫টি কুরআনিক আয়াতের গভীর অর্থ চর্চা করেছেন।'
          : `কুরআন চর্চায় আরও ${Math.max(1, target - current)}টি আয়াত অনুশীলন করলেই এই সম্মাননা আনলক হবে।`,
      };
    },
  },

  // 8. Root Detective
  {
    id: 'root-detective',
    titleBn: 'রুট অন্বেষক (Root Detective)',
    titleEn: 'Root Detective',
    category: 'words',
    tier: 'bronze',
    iconName: 'Compass',
    colorTheme: {
      bgLight: 'bg-violet-50',
      borderLight: 'border-violet-200',
      textDark: 'text-violet-950',
      badgeGlow: 'shadow-violet-500/20',
      ribbonColor: 'bg-violet-600',
      tierLabelBn: 'ব্রোঞ্জ',
    },
    shortDescriptionBn: 'আরবি ভাষার ৩ অক্ষরের মূল ধাতু (Root) অন্বেষণ করে শব্দের ডালপালা চেনার কারিগর।',
    loreBn: 'একটি ৩ অক্ষরের মূল থেকে ডজন ডজন অর্থপূর্ণ আরবি শব্দ জন্ম নেয়। রুট জানলে কুরআনের অপরিচিত শব্দের অর্থও অনুমান করা সহজ হয়।',
    hadithOrQuoteBn: 'ভাষার শিকড় জানলেই তার শাখা-প্রশাখার আসল সৌন্দর্য উন্মোচিত হয়।',
    hadithSourceBn: 'কুরআনিক ব্যাকরণ পাঠ',
    requirementBn: '৩ অক্ষরের মূল অংশে অন্তত ৩টি রুট অন্বেষণ করুন (Explored Roots)।',
    targetTab: 'roots',
    checkProgress: (progress) => {
      const current = progress.exploredRoots?.length || 0;
      const target = 3;
      const isUnlocked = current >= target || (progress.unlockedBadgeIds?.includes('root-detective') ?? false);
      const percent = Math.min(100, Math.round((current / target) * 100));

      return {
        isUnlocked,
        current,
        target,
        percent,
        progressText: `${current}/${target}টি রুট`,
        tipBn: isUnlocked
          ? 'অভিনন্দন! আপনি ৩ অক্ষরের মূল ধাতু অন্বেষণে পারদর্শী হয়ে উঠেছেন।'
          : `আর ${Math.max(1, target - current)}টি রুট অন্বেষণ করে এই ব্যাজ অর্জন করুন।`,
      };
    },
  },

  // 9. Daily Goal Crusher
  {
    id: 'goal-crusher',
    titleBn: 'দৈনিক লক্ষ্য বিজয়ী (Goal Crusher)',
    titleEn: 'Goal Crusher',
    category: 'habits',
    tier: 'bronze',
    iconName: 'Target',
    colorTheme: {
      bgLight: 'bg-rose-50',
      borderLight: 'border-rose-200',
      textDark: 'text-rose-950',
      badgeGlow: 'shadow-rose-500/20',
      ribbonColor: 'bg-rose-600',
      tierLabelBn: 'ব্রোঞ্জ',
    },
    shortDescriptionBn: 'আজকের নির্ধারিত শব্দ লক্ষ্য (৫, ৮ বা ১০টি শব্দ) শতভাগ পূরণকারী।',
    loreBn: 'দৈনিক নির্দিষ্ট লক্ষ্য অর্জন করার আনন্দ মনকে অনুপ্রাণিত করে এবং কুরআনিক আরবি শেখার গতিকে বহুগুণ ত্বরান্বিত করে।',
    hadithOrQuoteBn: 'প্রতিদিনের ছোট লক্ষ্য পূরণই বড় সাফল্যের প্রশস্ত সোপান।',
    hadithSourceBn: 'আত্মউন্নয়ন মূলনীতি',
    requirementBn: 'আজকের নির্ধারিত দৈনিক শব্দ লক্ষ্য পূরণ করুন।',
    targetTab: 'plan',
    checkProgress: (progress, todayLog) => {
      const current = todayLog?.wordsLearned || 0;
      const target = progress.dailyWordGoal || 5;
      const isUnlocked =
        current >= target || (progress.unlockedBadgeIds?.includes('goal-crusher') ?? false);
      const percent = Math.min(100, Math.round((current / target) * 100));

      return {
        isUnlocked,
        current,
        target,
        percent,
        progressText: `${current}/${target}টি শব্দ`,
        tipBn: isUnlocked
          ? 'মাশাআল্লাহ! আপনি আজকের দৈনিক শব্দ লক্ষ্য সফলভাবে জয় করেছেন।'
          : `আজকের লক্ষ্য পূরণে আর মাত্র ${Math.max(1, target - current)}টি নতুন শব্দ শিখুন!`,
      };
    },
  },

  // 10. Centurion Achiever (100 Minutes Studied)
  {
    id: 'centurion',
    titleBn: 'শত মিনিট সাধক (100-Minute Achiever)',
    titleEn: '100-Minute Achiever',
    category: 'habits',
    tier: 'gold',
    iconName: 'Trophy',
    colorTheme: {
      bgLight: 'bg-yellow-50',
      borderLight: 'border-yellow-200',
      textDark: 'text-yellow-950',
      badgeGlow: 'shadow-yellow-500/25',
      ribbonColor: 'bg-yellow-600',
      tierLabelBn: 'গোল্ড',
    },
    shortDescriptionBn: 'কুরআনিক আরবি শিক্ষায় সর্বমোট ১০০ মিনিটের অধিক নিবেদিত অধ্যবসায়।',
    loreBn: 'ইলম অন্বেষণে ব্যয়িত প্রতিটি সেকেন্ড আল্লাহর নৈকট্য অর্জনের মাধ্যম। ১০০ মিনিটের আত্মনিয়োগ আপনার গভীর নিষ্ঠার প্রমাণ।',
    hadithOrQuoteBn: 'مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ — যে ব্যক্তি জ্ঞান অর্জনের উদ্দেশ্যে কোনো পথ অবলম্বন করে, আল্লাহ তার জন্য জান্নাতের পথ সহজ করে দেন।',
    hadithSourceBn: 'সহীহ মুসলিম: ২৬৯৯',
    requirementBn: 'দৈনিক সেশন ও অনুশীলন মিলিয়ে মোট ১০০ মিনিট অধ্যয়ন সম্পন্ন করুন।',
    targetTab: 'plan',
    checkProgress: (progress) => {
      const totalMinutes = Object.values(progress.dailyLogs || {}).reduce(
        (sum, log) => sum + (log.minutesStudied || 0),
        0
      );
      const target = 100;
      const isUnlocked =
        totalMinutes >= target || (progress.unlockedBadgeIds?.includes('centurion') ?? false);
      const percent = Math.min(100, Math.round((totalMinutes / target) * 100));

      return {
        isUnlocked,
        current: totalMinutes,
        target,
        percent,
        progressText: `${totalMinutes}/${target} মিনিট`,
        tipBn: isUnlocked
          ? 'অভিনন্দন! আপনি আল্লাহর বাণী শেখার পথে ১০০টিরও বেশি বরকতময় মিনিট উৎসর্গ করেছেন।'
          : `আর মাত্র ${Math.max(1, target - totalMinutes)} মিনিট অধ্যয়ন করলেই শত মিনিটের গোল্ড সম্মাননা আপনার হবে!`,
      };
    },
  },

  // 11. Surah Finisher
  {
    id: 'surah-finisher',
    titleBn: 'সূরা সমাপ্তকারী (Surah Finisher)',
    titleEn: 'Surah Finisher',
    category: 'quran',
    tier: 'diamond',
    iconName: 'Layers',
    colorTheme: {
      bgLight: 'bg-cyan-50',
      borderLight: 'border-cyan-200',
      textDark: 'text-cyan-950',
      badgeGlow: 'shadow-cyan-500/30',
      ribbonColor: 'bg-cyan-600',
      tierLabelBn: 'ডায়মন্ড',
    },
    shortDescriptionBn: 'কুরআনের অন্তত একটি পূর্ণাঙ্গ সূরার প্রতিটি আয়াতের শব্দে শব্দে তিলাওয়াত ও অর্থ সম্পন্নকারী।',
    loreBn: 'একটি সম্পূর্ণ সূরা প্রতিটি আয়াতের অর্থ ও উচ্চারণসহ বুঝে পড়ার অনুভূতি অতুলনীয়। এটি কুরআনিক আরবি শিক্ষার এক উজ্জ্বল রত্ন।',
    hadithOrQuoteBn: 'يُقَالُ لِصَاحِبِ الْقُرْآنِ: اقْرَأْ وَارْتَقِ وَرَتِّلْ — কুরআনের পাঠকারীকে বলা হবে: তুমি পড়তে থাকো এবং মর্যাদার শিখরে আরোহণ করতে থাকো।',
    hadithSourceBn: 'সুনানে আবু দাউদ ও তিরমিযী',
    requirementBn: 'কুরআন অংশে সূরা আল-ইখলাস বা যেকোনো একটি সূরার সকল আয়াত অনুশীলন করুন।',
    targetTab: 'quran',
    checkProgress: (progress) => {
      // Check if all ayahs of any practice surah are practiced
      const finishedCount = PRACTICE_SURAHS.filter((surah) => {
        const allKeys = surah.ayahs.map((a) => `${surah.surahNumber}:${a.ayahNumber}`);
        return allKeys.every((k) => progress.practicedAyahKeys?.includes(k));
      }).length;

      const isUnlocked = finishedCount >= 1 || (progress.unlockedBadgeIds?.includes('surah-finisher') ?? false);

      return {
        isUnlocked,
        current: finishedCount,
        target: 1,
        percent: isUnlocked ? 100 : 0,
        progressText: isUnlocked ? '১টি পূর্ণ সূরা সম্পন্ন' : 'যেকোনো ১টি সূরা সমাপ্ত করুন',
        tipBn: isUnlocked
          ? 'আলহামদুলিল্লাহ! আপনি একটি পূর্ণাঙ্গ সূরার আদ্যোপান্ত অর্থসহ আয়ত্ত করেছেন।'
          : 'সূরা আল-ইখলাস (৪টি আয়াত) অনুশীলন করলেই এই ডায়মন্ড ব্যাজটি আনলক হবে।',
      };
    },
  },

  // 12. Night Owl / Tahajjud Student
  {
    id: 'night-owl',
    titleBn: 'নিশাচর পাঠক (Night Owl)',
    titleEn: 'Night Owl',
    category: 'habits',
    tier: 'bronze',
    iconName: 'Moon',
    colorTheme: {
      bgLight: 'bg-slate-50',
      borderLight: 'border-slate-300',
      textDark: 'text-slate-950',
      badgeGlow: 'shadow-slate-500/20',
      ribbonColor: 'bg-slate-700',
      tierLabelBn: 'ব্রোঞ্জ',
    },
    shortDescriptionBn: 'রাতের নিস্তব্ধতায় প্রশান্ত মনে কুরআনিক আরবি অধ্যয়নকারী।',
    loreBn: 'রাতের নিরব পরিবেশ কুরআন তিলাওয়াত ও একাগ্রচিত্তে জ্ঞানার্জনের জন্য এক বিশেষ নিয়ামত।',
    hadithOrQuoteBn: 'إِنَّ نَاشِئَةَ اللَّيْلِ هِيَ أَشَدُّ وَطْئًا وَأَقْوَمُ قِيلًا — নিশ্চয় রাতে জেগে ওঠা মনকে একাগ্র করার জন্য অধিক কার্যকরী এবং কথা স্পষ্টতর করার জন্য অনুকুল।',
    hadithSourceBn: 'সূরা আল-মুযযাম্মিল: ৬',
    requirementBn: 'রাত ৮:০০ টার পর যেকোনো সময় শান্ত পরিবেশে অধ্যয়ন সম্পন্ন করুন।',
    targetTab: 'plan',
    checkProgress: (progress, todayLog) => {
      const hasStored = progress.unlockedBadgeIds?.includes('night-owl');
      const hasEveningLog = Object.values(progress.dailyLogs || {}).some(
        (l) => l.eveningSession === true
      );
      const isEveningNow = new Date().getHours() >= 20 && ((todayLog?.wordsLearned || 0) > 0 || (todayLog?.minutesStudied || 0) > 0);
      const isUnlocked = Boolean(hasStored || hasEveningLog || isEveningNow);

      return {
        isUnlocked,
        current: isUnlocked ? 1 : 0,
        target: 1,
        percent: isUnlocked ? 100 : 0,
        progressText: isUnlocked ? 'রাত্রিকালীন অধ্যয়ন অর্জিত' : 'রাত ৮টার পর চর্চা করুন',
        tipBn: isUnlocked
          ? 'মাশাআল্লাহ! আপনি রাতের নিস্তব্ধ সময়ে একাগ্রতার সাথে অধ্যয়নের সম্মাননা অর্জন করেছেন।'
          : 'রাত ৮টার পর ২০ মিনিটের সেশন সম্পন্ন করে এই সম্মাননা আনলক করুন।',
      };
    },
  },
];
