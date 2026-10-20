export interface WordSRSState {
  wordId: number;
  interval: number; // in days
  repetition: number;
  easeFactor: number;
  nextReviewDate: string; // YYYY-MM-DD
  lastReviewedDate: string; // YYYY-MM-DD
  status: 'new' | 'learning' | 'review' | 'mastered';
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  wordsLearned: number;
  wordsReviewed: number;
  ayahsPracticed: number;
  minutesStudied: number;
  planStepsCompleted: {
    step1NewWords: boolean;
    step2Review: boolean;
    step3AyahPractice: boolean;
  };
  morningSession?: boolean; // Completed or practiced in morning (before 10 AM)
  eveningSession?: boolean; // Practiced in evening/night
}

export interface DailyReminderSettings {
  enabled: boolean;
  reminderTime: string; // "HH:mm", e.g. "17:00"
  browserNotificationsEnabled: boolean;
  soundEnabled: boolean;
  lastDismissedDate?: string;
  snoozedUntil?: number; // timestamp ms
}

export interface UserProgressState {
  masteredLetters: number[]; // letter IDs 1..28
  wordSRS: Record<number, WordSRSState>; // wordId -> SRS state
  exploredRoots: number[]; // root IDs
  completedGrammarIds: number[]; // sentence example IDs
  practicedAyahKeys: string[]; // e.g., "112:1"
  favoriteAyahKeys: string[]; // e.g., ["1:1", "112:1"]
  favoriteWordIds: number[]; // e.g., [1, 2, 15]
  dailyWordGoal: 5 | 8 | 10;
  slowAudioDefault: boolean;
  largeFontMode: boolean; // Extra large font toggle for elders
  streakDays: number;
  lastActiveDate: string;
  dailyLogs: Record<string, DailyLog>;
  dailyReminder?: DailyReminderSettings;
  unlockedBadgeIds?: string[]; // IDs of unlocked virtual badges
}

const STORAGE_KEY = 'arabi_sohoj_progress_v1';

export function getTodayStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDaysToDateStr(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const year = dt.getFullYear();
  const month = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function createEmptyDailyLog(date: string): DailyLog {
  return {
    date,
    wordsLearned: 0,
    wordsReviewed: 0,
    ayahsPracticed: 0,
    minutesStudied: 0,
    planStepsCompleted: {
      step1NewWords: false,
      step2Review: false,
      step3AyahPractice: false,
    },
  };
}

function generateInitialWeeklyLogs(today: string): Record<string, DailyLog> {
  // Generate realistic 30-day study engagement dataset (days 29 ago to today)
  const pattern30Days: { daysAgo: number; min: number; learned: number; reviewed: number; ayahs: number }[] = [
    { daysAgo: 29, min: 12, learned: 4, reviewed: 3, ayahs: 1 },
    { daysAgo: 28, min: 15, learned: 5, reviewed: 4, ayahs: 2 },
    { daysAgo: 27, min: 18, learned: 6, reviewed: 5, ayahs: 2 },
    { daysAgo: 26, min: 20, learned: 7, reviewed: 6, ayahs: 3 },
    { daysAgo: 25, min: 16, learned: 5, reviewed: 4, ayahs: 2 },
    { daysAgo: 24, min: 0, learned: 0, reviewed: 0, ayahs: 0 }, // Rest day
    { daysAgo: 23, min: 15, learned: 5, reviewed: 4, ayahs: 2 },
    { daysAgo: 22, min: 22, learned: 8, reviewed: 6, ayahs: 3 },
    { daysAgo: 21, min: 25, learned: 10, reviewed: 8, ayahs: 4 },
    { daysAgo: 20, min: 18, learned: 6, reviewed: 5, ayahs: 2 },
    { daysAgo: 19, min: 20, learned: 7, reviewed: 6, ayahs: 3 },
    { daysAgo: 18, min: 24, learned: 9, reviewed: 7, ayahs: 3 },
    { daysAgo: 17, min: 21, learned: 8, reviewed: 6, ayahs: 3 },
    { daysAgo: 16, min: 0, learned: 0, reviewed: 0, ayahs: 0 }, // Rest day
    { daysAgo: 15, min: 16, learned: 5, reviewed: 4, ayahs: 2 },
    { daysAgo: 14, min: 19, learned: 7, reviewed: 5, ayahs: 3 },
    { daysAgo: 13, min: 25, learned: 10, reviewed: 8, ayahs: 4 },
    { daysAgo: 12, min: 22, learned: 8, reviewed: 7, ayahs: 3 },
    { daysAgo: 11, min: 20, learned: 7, reviewed: 6, ayahs: 3 },
    { daysAgo: 10, min: 26, learned: 10, reviewed: 9, ayahs: 4 },
    { daysAgo: 9, min: 18, learned: 6, reviewed: 5, ayahs: 2 },
    { daysAgo: 8, min: 23, learned: 9, reviewed: 7, ayahs: 3 },
    { daysAgo: 7, min: 0, learned: 0, reviewed: 0, ayahs: 0 }, // Rest day
    { daysAgo: 6, min: 15, learned: 5, reviewed: 4, ayahs: 2 },
    { daysAgo: 5, min: 20, learned: 8, reviewed: 6, ayahs: 3 },
    { daysAgo: 4, min: 14, learned: 5, reviewed: 3, ayahs: 2 },
    { daysAgo: 3, min: 25, learned: 10, reviewed: 8, ayahs: 4 },
    { daysAgo: 2, min: 18, learned: 7, reviewed: 5, ayahs: 3 },
    { daysAgo: 1, min: 22, learned: 9, reviewed: 7, ayahs: 3 },
  ];

  const logs: Record<string, DailyLog> = {};
  pattern30Days.forEach(({ daysAgo, min, learned, reviewed, ayahs }) => {
    const dStr = addDaysToDateStr(today, -daysAgo);
    logs[dStr] = {
      date: dStr,
      wordsLearned: learned,
      wordsReviewed: reviewed,
      ayahsPracticed: ayahs,
      minutesStudied: min,
      planStepsCompleted: {
        step1NewWords: min > 0,
        step2Review: min >= 15,
        step3AyahPractice: min >= 20,
      },
    };
  });

  logs[today] = {
    date: today,
    wordsLearned: 2,
    wordsReviewed: 2,
    ayahsPracticed: 1,
    minutesStudied: 6,
    planStepsCompleted: {
      step1NewWords: true,
      step2Review: false,
      step3AyahPractice: false,
    },
  };

  return logs;
}

export function getInitialProgressState(): UserProgressState {
  const today = getTodayStr();
  const yesterday = addDaysToDateStr(today, -1);
  const initialWeeklyLogs = generateInitialWeeklyLogs(today);

  const defaultState: UserProgressState = {
    masteredLetters: [1, 2, 3],
    wordSRS: {
      1: {
        wordId: 1,
        interval: 1,
        repetition: 1,
        easeFactor: 2.5,
        nextReviewDate: today,
        lastReviewedDate: yesterday,
        status: 'review',
      },
      2: {
        wordId: 2,
        interval: 1,
        repetition: 1,
        easeFactor: 2.5,
        nextReviewDate: today,
        lastReviewedDate: yesterday,
        status: 'review',
      },
      61: {
        wordId: 61,
        interval: 6,
        repetition: 2,
        easeFactor: 2.6,
        nextReviewDate: addDaysToDateStr(today, 3),
        lastReviewedDate: yesterday,
        status: 'mastered',
      },
      62: {
        wordId: 62,
        interval: 1,
        repetition: 1,
        easeFactor: 2.5,
        nextReviewDate: today,
        lastReviewedDate: yesterday,
        status: 'review',
      },
    },
    exploredRoots: [1, 2],
    completedGrammarIds: [1],
    practicedAyahKeys: ['1:1', '112:1'],
    favoriteAyahKeys: ['1:1', '112:1'],
    favoriteWordIds: [1, 2],
    dailyWordGoal: 5,
    slowAudioDefault: false,
    largeFontMode: false,
    streakDays: 4,
    lastActiveDate: today,
    dailyLogs: initialWeeklyLogs,
    dailyReminder: {
      enabled: true,
      reminderTime: '17:00', // 5:00 PM default reminder time
      browserNotificationsEnabled: false,
      soundEnabled: true,
    },
    unlockedBadgeIds: ['first-step', 'streak-3'],
  };

  if (typeof window === 'undefined') return defaultState;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState));
      return defaultState;
    }
    const parsed = JSON.parse(raw) as UserProgressState;
    if (!Array.isArray(parsed.favoriteAyahKeys)) {
      parsed.favoriteAyahKeys = ['1:1', '112:1'];
    }
    if (!Array.isArray(parsed.favoriteWordIds)) {
      parsed.favoriteWordIds = [1, 2];
    }
    if (!Array.isArray(parsed.unlockedBadgeIds)) {
      parsed.unlockedBadgeIds = ['first-step', 'streak-3'];
    }
    if (!parsed.dailyReminder) {
      parsed.dailyReminder = {
        enabled: true,
        reminderTime: '17:00',
        browserNotificationsEnabled: false,
        soundEnabled: true,
      };
    }
    if (!parsed.dailyLogs) parsed.dailyLogs = {};
    // If dailyLogs has fewer than 20 days, merge initial 30-day logs for past days
    if (Object.keys(parsed.dailyLogs).length < 20) {
      parsed.dailyLogs = {
        ...initialWeeklyLogs,
        ...parsed.dailyLogs,
      };
    }
    if (!parsed.dailyLogs[today]) {
      parsed.dailyLogs[today] = createEmptyDailyLog(today);
    }
    return parsed;
  } catch {
    return defaultState;
  }
}

export function saveProgressState(state: UserProgressState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * SuperMemo SM-2 Spaced Repetition Algorithm
 * quality:
 *  - 'again' (কঠিন - আবার দেখব): quality = 2 -> reset interval to 1 day
 *  - 'good' (ভালো - মনে আছে): quality = 4 -> progress interval
 *  - 'easy' (সহজ - খুব ভালো): quality = 5 -> accelerate interval & mark mastered faster
 */
export function computeNextSRS(
  existing: WordSRSState | undefined,
  wordId: number,
  rating: 'again' | 'good' | 'easy'
): WordSRSState {
  const today = getTodayStr();
  const prev = existing ?? {
    wordId,
    interval: 0,
    repetition: 0,
    easeFactor: 2.5,
    nextReviewDate: today,
    lastReviewedDate: today,
    status: 'new' as const,
  };

  const quality = rating === 'again' ? 2 : rating === 'good' ? 4 : 5;
  let repetition = prev.repetition;
  let interval = prev.interval;
  let easeFactor = prev.easeFactor;

  if (quality < 3) {
    repetition = 0;
    interval = 1;
  } else {
    if (repetition === 0) {
      interval = rating === 'easy' ? 3 : 1;
    } else if (repetition === 1) {
      interval = rating === 'easy' ? 7 : 4;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetition += 1;
  }

  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  const status: WordSRSState['status'] =
    rating === 'again'
      ? 'learning'
      : interval >= 6 || rating === 'easy'
      ? 'mastered'
      : 'review';

  const nextReviewDate =
    rating === 'again' ? today : addDaysToDateStr(today, interval);

  return {
    wordId,
    interval,
    repetition,
    easeFactor: Number(easeFactor.toFixed(2)),
    nextReviewDate,
    lastReviewedDate: today,
    status,
  };
}
