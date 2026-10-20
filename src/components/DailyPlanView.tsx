import React, { useState, useEffect, useMemo } from 'react';
import {
  Volume2,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Flame,
  Clock,
  BookOpen,
  Sparkles,
  ArrowRight,
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  Award,
  BookMarked,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { HIGH_FREQUENCY_WORDS } from '../data/wordsData';
import { PRACTICE_SURAHS } from '../data/surahData';
import { UserProgressState, DailyReminderSettings, getTodayStr, addDaysToDateStr } from '../utils/storage';
import { speakArabic, toBnNum } from '../utils/speech';
import { ProgressDashboard } from './ProgressDashboard';
import { WeeklyInsightsSection } from './WeeklyInsightsSection';
import { DailyGoalReminderPrompt } from './DailyGoalReminderPrompt';
import { BadgesSection } from './BadgesSection';
import { ThirtyDayStreakChart } from './ThirtyDayStreakChart';
import { CommunityLeaderboard } from './CommunityLeaderboard';

interface DailyPlanViewProps {
  progress: UserProgressState;
  onRateWord: (wordId: number, rating: 'again' | 'good' | 'easy') => void;
  onMarkPlanStep: (step: 'step1NewWords' | 'step2Review' | 'step3AyahPractice') => void;
  onAddStudyMinute: () => void;
  onNavigateTab: (tab: 'alphabet' | 'words' | 'roots' | 'grammar' | 'plan' | 'quran') => void;
  slowAudio: boolean;
  largeFont: boolean;
  onUpdateReminderSettings?: (settings: Partial<DailyReminderSettings>) => void;
  onToggleBadge?: (badgeId: string) => void;
}

export const DailyPlanView: React.FC<DailyPlanViewProps> = ({
  progress,
  onRateWord,
  onMarkPlanStep,
  onAddStudyMinute,
  onNavigateTab,
  slowAudio,
  largeFont,
  onUpdateReminderSettings,
  onToggleBadge,
}) => {
  const today = getTodayStr();
  const todayLog = progress.dailyLogs[today] || {
    date: today,
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

  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [timerRunning, setTimerRunning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(20 * 60); // 20 minutes = 1200s

  // Increment study minute every 60 seconds when timer is active
  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          return 0;
        }
        const next = prev - 1;
        if ((1200 - next) % 60 === 0) {
          onAddStudyMinute();
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, onAddStudyMinute]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${toBnNum(String(m).padStart(2, '0'))}:${toBnNum(String(s).padStart(2, '0'))}`;
  };

  // Step 1: 5-10 New Words
  const newWordsForToday = useMemo(() => {
    const unlearned = HIGH_FREQUENCY_WORDS.filter((w) => !progress.wordSRS[w.id]);
    return unlearned.slice(0, progress.dailyWordGoal);
  }, [progress.wordSRS, progress.dailyWordGoal]);

  // Step 2: Review Words (SRS Due or previously studied)
  const reviewWordsForToday = useMemo(() => {
    const existingIds = Object.keys(progress.wordSRS).map(Number);
    const due = HIGH_FREQUENCY_WORDS.filter((w) => {
      const s = progress.wordSRS[w.id];
      return s && s.nextReviewDate <= today;
    });
    if (due.length >= 4) return due.slice(0, progress.dailyWordGoal);
    const fallback = HIGH_FREQUENCY_WORDS.filter((w) => existingIds.includes(w.id));
    return (fallback.length > 0 ? fallback : HIGH_FREQUENCY_WORDS.slice(0, 5)).slice(
      0,
      progress.dailyWordGoal
    );
  }, [progress.wordSRS, progress.dailyWordGoal, today]);

  // Step 3: Daily Short Ayah Practice (Surah Al-Fatihah / Al-Ikhlas / Al-Asr)
  const [selectedAyahIndex, setSelectedAyahIndex] = useState(0);
  const dailyAyahList = useMemo(() => {
    const list: { surahName: string; ayahNumber: number; ayah: (typeof PRACTICE_SURAHS)[0]['ayahs'][0] }[] = [];
    PRACTICE_SURAHS.forEach((s) => {
      s.ayahs.forEach((a) => {
        list.push({ surahName: s.nameBn, ayahNumber: a.ayahNumber, ayah: a });
      });
    });
    return list;
  }, []);

  const currentPracticeAyah = dailyAyahList[selectedAyahIndex % dailyAyahList.length];

  // Last 7 days activity strip
  const last7Days = useMemo(() => {
    const days = [];
    const dayNamesBn = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];
    for (let i = 6; i >= 0; i--) {
      const dStr = addDaysToDateStr(today, -i);
      const [y, m, d] = dStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      const log = progress.dailyLogs[dStr];
      const completedCount = log
        ? Number(log.planStepsCompleted.step1NewWords) +
          Number(log.planStepsCompleted.step2Review) +
          Number(log.planStepsCompleted.step3AyahPractice)
        : 0;
      days.push({
        dateStr: dStr,
        dayName: dayNamesBn[dt.getDay()],
        dayNum: d,
        isToday: i === 0,
        completedCount,
      });
    }
    return days;
  }, [progress.dailyLogs, today]);

  const completedStepsCount =
    Number(todayLog.planStepsCompleted.step1NewWords) +
    Number(todayLog.planStepsCompleted.step2Review) +
    Number(todayLog.planStepsCompleted.step3AyahPractice);

  const totalWordsLearned = Object.keys(progress.wordSRS).length;

  // Key metrics for the Progress Overview requested
  const masteredAlphabetCount = progress.masteredLetters.length;
  const alphabetTotal = 28;
  const alphabetPct = Math.min(100, Math.round((masteredAlphabetCount / alphabetTotal) * 100));

  const wordsLearnedCount = totalWordsLearned;
  const wordsTotal = 300;
  const wordsPct = Math.min(100, Math.round((wordsLearnedCount / wordsTotal) * 100));

  // Count practiced Surahs (surahs with at least one ayah practiced)
  const surahsPracticedCount = useMemo(() => {
    const practicedSurahNumbers = new Set<number>();
    progress.practicedAyahKeys.forEach((key) => {
      const [surahNumStr] = key.split(':');
      const surahNum = Number(surahNumStr);
      if (!isNaN(surahNum)) {
        practicedSurahNumbers.add(surahNum);
      }
    });
    return practicedSurahNumbers.size;
  }, [progress.practicedAyahKeys]);
  const surahsTotal = PRACTICE_SURAHS.length; // 7 Surahs
  const surahsPct = Math.min(100, Math.round((surahsPracticedCount / surahsTotal) * 100));

  const [overviewChartType, setOverviewChartType] = useState<'pie' | 'bar'>('pie');

  // Islamic Emerald palette for Recharts
  const EMERALD_DARK = '#064e3b';    // Deep Islamic Emerald (Alphabet)
  const EMERALD_FOREST = '#047857';  // Forest Emerald (Words)
  const EMERALD_VIBRANT = '#10b981'; // Vibrant Emerald (Surahs)

  const progressOverviewPieData = useMemo(
    () => [
      {
        name: 'বর্ণমালা আয়ত্ত (Alphabet Mastered)',
        shortName: 'বর্ণমালা',
        value: masteredAlphabetCount,
        target: alphabetTotal,
        pct: alphabetPct,
        fill: EMERALD_DARK,
      },
      {
        name: 'শব্দ শেখা (Words Learned)',
        shortName: 'শব্দভাণ্ডার',
        value: wordsLearnedCount,
        target: wordsTotal,
        pct: wordsPct,
        fill: EMERALD_FOREST,
      },
      {
        name: 'সূরা চর্চা (Surahs Practiced)',
        shortName: 'সূরা চর্চা',
        value: surahsPracticedCount,
        target: surahsTotal,
        pct: surahsPct,
        fill: EMERALD_VIBRANT,
      },
    ],
    [masteredAlphabetCount, wordsLearnedCount, surahsPracticedCount, alphabetPct, wordsPct, surahsPct]
  );

  const progressOverviewBarData = useMemo(
    () => [
      {
        name: 'বর্ণমালা (Alphabet)',
        current: masteredAlphabetCount,
        target: alphabetTotal,
        pct: alphabetPct,
        displayCurrent: `${toBnNum(masteredAlphabetCount)}/২৮`,
        fill: EMERALD_DARK,
      },
      {
        name: 'শব্দ (Words)',
        current: wordsLearnedCount,
        target: wordsTotal,
        pct: wordsPct,
        displayCurrent: `${toBnNum(wordsLearnedCount)}/৩০০`,
        fill: EMERALD_FOREST,
      },
      {
        name: 'সূরা (Surahs)',
        current: surahsPracticedCount,
        target: surahsTotal,
        pct: surahsPct,
        displayCurrent: `${toBnNum(surahsPracticedCount)}/৭`,
        fill: EMERALD_VIBRANT,
      },
    ],
    [masteredAlphabetCount, wordsLearnedCount, surahsPracticedCount, alphabetPct, wordsPct, surahsPct]
  );

  return (
    <div className="space-y-8">
      {/* Daily Word Goal Motivational Notification / Reminder Prompt */}
      <DailyGoalReminderPrompt
        progress={progress}
        todayWordsLearned={todayLog.wordsLearned}
        dailyWordGoal={progress.dailyWordGoal}
        onStartStep1={() => {
          setActiveStep(1);
          const el = document.getElementById('daily-step-workspace');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }}
        onUpdateReminderSettings={onUpdateReminderSettings || (() => {})}
        largeFont={largeFont}
      />

      {/* 1. Progress Overview Section at the Top */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 tabular-nums">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
              <span>অগ্রগতি ড্যাশবোর্ড · সার্বিক অর্জন চিত্র</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">
              প্রগ্রেস ওভারভিউ (Progress Overview)
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              বর্ণমালা আয়ত্ত (Alphabet Mastered), শব্দভাণ্ডার (Words Learned) ও সূরা চর্চা (Surahs Practiced)-এর চার্ট
            </p>
          </div>

          {/* Chart Type Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setOverviewChartType('pie')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                overviewChartType === 'pie'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PieIcon className="w-4 h-4" />
              <span>পাই চার্ট (PieChart)</span>
            </button>
            <button
              type="button"
              onClick={() => setOverviewChartType('bar')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                overviewChartType === 'bar'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>বার চার্ট (BarChart)</span>
            </button>
          </div>
        </div>

        {/* Visual Chart and Metric Breakdown in Islamic Palette */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Recharts Container (Left 6 Cols) */}
          <div className="lg:col-span-6 p-4 md:p-6 rounded-2xl bg-[#F8FAF9] border border-emerald-900/10 flex flex-col items-center justify-center">
            {overviewChartType === 'pie' ? (
              <div className="w-full flex flex-col items-center">
                <div className="w-full h-64 sm:h-72 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip
                        formatter={(val: unknown, name: unknown) => {
                          const num = typeof val === 'number' ? val : Number(val);
                          return [`${toBnNum(num)} সম্পন্ন`, String(name)];
                        }}
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          borderRadius: '12px',
                          color: '#FFFFFF',
                          border: 'none',
                          fontSize: '13px',
                        }}
                        itemStyle={{ color: '#A7F3D0' }}
                      />
                      <Pie
                        data={progressOverviewPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius="50%"
                        outerRadius="82%"
                        paddingAngle={3}
                        label={(entry: any) =>
                          `${entry.payload?.shortName || entry.name}: ${toBnNum(entry.payload?.pct ?? Math.round((entry.percent || 0) * 100))}%`
                        }
                      >
                        {progressOverviewPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Legend
                        verticalAlign="bottom"
                        wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-slate-500 mt-2 text-center">
                  সবুজ রঙের ইসলামিক প্যালেট অনুযায়ী সম্পন্ন অগ্রগতির অনুপাত
                </p>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center">
                <div className="w-full h-64 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={progressOverviewBarData}
                      margin={{ top: 20, right: 20, left: -10, bottom: 5 }}
                    >
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#334155' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#334155' }} />
                      <Tooltip
                        formatter={(val: unknown, _: unknown, item: { payload?: { target: number; pct: number } }) => {
                          const num = typeof val === 'number' ? val : Number(val);
                          const target = item?.payload?.target ?? '';
                          const pct = item?.payload?.pct ?? '';
                          return [
                            `${toBnNum(num)} / ${toBnNum(target)} (${toBnNum(pct)}%)`,
                            'অগ্রগতি',
                          ];
                        }}
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          borderRadius: '10px',
                          color: '#FFFFFF',
                          border: 'none',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="current" radius={[8, 8, 0, 0]}>
                        {progressOverviewBarData.map((entry, index) => (
                          <Cell key={`bar-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-slate-500 mt-2 text-center">
                  প্রতিটি ক্যাটাগরির অর্জিত পরিমাণ (বার-এর ওপর মাউস বা ট্যাপ করে বিস্তারিত দেখুন)
                </p>
              </div>
            )}
          </div>

          {/* 3 Metric Cards (Right 6 Cols) in Emerald Theme */}
          <div className="lg:col-span-6 space-y-3.5">
            {/* Card 1: Alphabet Mastered (out of 28) */}
            <button
              type="button"
              onClick={() => onNavigateTab('alphabet')}
              className="w-full p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-600 transition-all text-left flex flex-col justify-between group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#064e3b] inline-block" />
                  <span className="text-sm font-bold text-slate-900">
                    বর্ণমালা আয়ত্ত (Alphabet Mastered)
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-800 tabular-nums">
                  {toBnNum(alphabetPct)}% সম্পন্ন
                </span>
              </div>
              <div className="my-2.5">
                <span className="text-2xl font-bold text-slate-900 tabular-nums">
                  {toBnNum(masteredAlphabetCount)}{' '}
                  <span className="text-sm font-medium text-slate-500">/ {toBnNum(alphabetTotal)}টি বর্ণ</span>
                </span>
                <div className="w-full bg-slate-100 rounded-full h-2 mt-1.5 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-[#064e3b] transition-all duration-500"
                    style={{ width: `${alphabetPct}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>২৮টি আরবি বর্ণের হরকত ও রূপ শিক্ষা</span>
                <span className="text-emerald-800 font-semibold group-hover:underline inline-flex items-center gap-0.5">
                  অনুশীলন করুন →
                </span>
              </div>
            </button>

            {/* Card 2: Words Learned (out of 300) */}
            <button
              type="button"
              onClick={() => onNavigateTab('words')}
              className="w-full p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-600 transition-all text-left flex flex-col justify-between group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#047857] inline-block" />
                  <span className="text-sm font-bold text-slate-900">
                    শব্দভাণ্ডার আয়ত্ত (Words Learned)
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-800 tabular-nums">
                  {toBnNum(wordsPct)}% সম্পন্ন
                </span>
              </div>
              <div className="my-2.5">
                <span className="text-2xl font-bold text-slate-900 tabular-nums">
                  {toBnNum(wordsLearnedCount)}{' '}
                  <span className="text-sm font-medium text-slate-500">/ {toBnNum(wordsTotal)}টি শব্দ</span>
                </span>
                <div className="w-full bg-slate-100 rounded-full h-2 mt-1.5 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-[#047857] transition-all duration-500"
                    style={{ width: `${wordsPct}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>কুরআনের উচ্চ-ফ্রিকোয়েন্সি শব্দমালা (SRS)</span>
                <span className="text-emerald-800 font-semibold group-hover:underline inline-flex items-center gap-0.5">
                  অনুশীলন করুন →
                </span>
              </div>
            </button>

            {/* Card 3: Surahs Practiced (count) */}
            <button
              type="button"
              onClick={() => onNavigateTab('quran')}
              className="w-full p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-600 transition-all text-left flex flex-col justify-between group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#10b981] inline-block" />
                  <span className="text-sm font-bold text-slate-900">
                    কুরআনের সূরা চর্চা (Surahs Practiced)
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-800 tabular-nums">
                  {toBnNum(surahsPct)}% সম্পন্ন
                </span>
              </div>
              <div className="my-2.5">
                <span className="text-2xl font-bold text-slate-900 tabular-nums">
                  {toBnNum(surahsPracticedCount)}{' '}
                  <span className="text-sm font-medium text-slate-500">/ {toBnNum(surahsTotal)}টি সূরা</span>
                </span>
                <div className="w-full bg-slate-100 rounded-full h-2 mt-1.5 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-[#10b981] transition-all duration-500"
                    style={{ width: `${surahsPct}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>ছোট সূরার শব্দে শব্দে তিলাওয়াত ও অর্থ</span>
                <span className="text-emerald-800 font-semibold group-hover:underline inline-flex items-center gap-0.5">
                  অনুশীলন করুন →
                </span>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* 2. 20-Minute Session Controller */}
      <div className="bg-emerald-950 text-white rounded-2xl p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-2">
            <div className="flex items-center gap-3 text-xs text-emerald-300 font-medium tabular-nums">
              <span className="inline-flex items-center gap-1">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>ধারাবাহিক চর্চা: {toBnNum(progress.streakDays)} দিন</span>
              </span>
              <span aria-hidden="true">·</span>
              <span>আজকের অগ্রগতি: {toBnNum(completedStepsCount)}/৩ ধাপ সম্পন্ন</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-balance">
              প্রতিদিন ২০ মিনিটের কুরআনিক আরবি রুটিন
            </h1>
            <p className="text-sm md:text-base text-emerald-100/90 max-w-2xl">
              প্রতিদিন মাত্র ২০ মিনিট সময় দিন: ৭ মিনিট নতুন শব্দ, ৭ মিনিট আগের দিনের পুনরাবৃত্তি এবং ৬ মিনিট ছোট আয়াত চর্চা।
            </p>
          </div>

          {/* 20-Minute Timer Control Box */}
          <div className="lg:col-span-5 bg-emerald-900/80 border border-emerald-700/60 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-800 flex items-center justify-center">
                <Clock className="w-6 h-6 text-emerald-200" />
              </div>
              <div>
                <span className="text-xs text-emerald-200 block">২০ মিনিটের সেশন টাইমার</span>
                <span className="text-3xl font-bold tabular-nums tracking-tight">
                  {formatTimer(secondsRemaining)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setTimerRunning((r) => !r)}
                className="flex-1 sm:flex-initial min-h-[46px] px-4 py-2 rounded-xl bg-white text-emerald-950 font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-50 transition-colors whitespace-nowrap"
              >
                {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{timerRunning ? 'বিরতি' : 'শুরু করুন'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimerRunning(false);
                  setSecondsRemaining(20 * 60);
                }}
                className="min-h-[46px] min-w-[46px] p-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-emerald-100 flex items-center justify-center transition-colors"
                title="রিসেট করুন"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Overall Progress Stat Cards + 7-Day Activity Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-emerald-800/80">
          <button
            type="button"
            onClick={() => onNavigateTab('alphabet')}
            className="p-4 rounded-xl bg-emerald-900/50 hover:bg-emerald-900/80 text-left transition-colors"
          >
            <span className="text-xs text-emerald-300 block">বর্ণমালা আয়ত্ত</span>
            <span className="text-2xl font-bold tabular-nums mt-0.5 block">
              {toBnNum(progress.masteredLetters.length)} / {toBnNum(28)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('words')}
            className="p-4 rounded-xl bg-emerald-900/50 hover:bg-emerald-900/80 text-left transition-colors"
          >
            <span className="text-xs text-emerald-300 block">উচ্চ-ফ্রিকোয়েন্সি শব্দ</span>
            <span className="text-2xl font-bold tabular-nums mt-0.5 block">
              {toBnNum(totalWordsLearned)} / {toBnNum(300)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('roots')}
            className="p-4 rounded-xl bg-emerald-900/50 hover:bg-emerald-900/80 text-left transition-colors"
          >
            <span className="text-xs text-emerald-300 block">শব্দের মূল চর্চা</span>
            <span className="text-2xl font-bold tabular-nums mt-0.5 block">
              {toBnNum(progress.exploredRoots.length)} / {toBnNum(12)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('quran')}
            className="p-4 rounded-xl bg-emerald-900/50 hover:bg-emerald-900/80 text-left transition-colors"
          >
            <span className="text-xs text-emerald-300 block">অনুশীলিত আয়াত</span>
            <span className="text-2xl font-bold tabular-nums mt-0.5 block">
              {toBnNum(progress.practicedAyahKeys.length)}টি আয়াত
            </span>
          </button>
        </div>
      </div>

      {/* 7-Day Consistency Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">সাপ্তাহিক ধারাবাহিকতা ট্র্যাকার</h2>
          <p className="text-xs text-slate-500">
            আপনার প্রগ্রেস স্বয়ংক্রিয়ভাবে ব্রাউজারে (LocalStorage) সংরক্ষিত থাকে
          </p>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {last7Days.map((d) => (
            <div
              key={d.dateStr}
              className={`px-3 py-2 rounded-xl text-center border ${
                d.isToday
                  ? 'border-emerald-700 bg-emerald-50/70'
                  : 'border-slate-200 bg-[#F8FAF9]'
              }`}
            >
              <span className="text-[11px] font-semibold text-slate-500 block">{d.dayName}</span>
              <span className="text-sm font-bold text-slate-900 tabular-nums block">
                {toBnNum(d.dayNum)}
              </span>
              <span className="text-[11px] text-emerald-800 font-bold block mt-0.5">
                {d.completedCount > 0 ? `${toBnNum(d.completedCount)}/৩` : '—'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Insights: 7-Day Study Time & Words Learned Recharts Visualization */}
      <WeeklyInsightsSection
        progress={progress}
        onNavigateTab={onNavigateTab}
        largeFont={largeFont}
      />

      {/* 30-Day Study Streak Recharts Bar Chart to Boost Motivation */}
      <ThirtyDayStreakChart
        progress={progress}
        onNavigateTab={onNavigateTab}
        largeFont={largeFont}
      />

      {/* Community Leaderboard: Top Active Users by Study Minutes & Words Learned */}
      <CommunityLeaderboard
        progress={progress}
        onNavigateTab={onNavigateTab}
        largeFont={largeFont}
      />

      {/* Visual Progress Dashboard & Milestone Timeline Section */}
      <ProgressDashboard
        progress={progress}
        onNavigateTab={onNavigateTab}
        largeFont={largeFont}
      />

      {/* Virtual Badges & Honors Gallery Section */}
      <BadgesSection
        progress={progress}
        onNavigateTab={onNavigateTab}
        onToggleBadge={onToggleBadge}
        largeFont={largeFont}
      />

      {/* 3-Step Guided 20-Minute Routine Selector */}
      <div id="daily-step-workspace" className="grid grid-cols-1 md:grid-cols-3 gap-4 scroll-mt-6">
        <button
          type="button"
          onClick={() => setActiveStep(1)}
          className={`p-5 rounded-2xl border text-left transition-all flex items-start justify-between gap-3 ${
            activeStep === 1
              ? 'bg-white border-emerald-700 ring-2 ring-emerald-700/15'
              : 'bg-white border-slate-200 hover:border-emerald-400'
          }`}
        >
          <div>
            <span className="text-xs font-bold text-emerald-800">ধাপ ১ · সময়: ৭ মিনিট</span>
            <h3 className="text-lg font-bold text-slate-900 mt-1">
              নতুন {toBnNum(progress.dailyWordGoal)}টি শব্দ শেখা
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              উচ্চারণ ও উদাহরণ আয়াতসহ নতুন শব্দ আয়ত্ত করুন
            </p>
          </div>
          <CheckCircle2
            className={`w-6 h-6 shrink-0 ${
              todayLog.planStepsCompleted.step1NewWords ? 'text-emerald-600' : 'text-slate-300'
            }`}
          />
        </button>

        <button
          type="button"
          onClick={() => setActiveStep(2)}
          className={`p-5 rounded-2xl border text-left transition-all flex items-start justify-between gap-3 ${
            activeStep === 2
              ? 'bg-white border-emerald-700 ring-2 ring-emerald-700/15'
              : 'bg-white border-slate-200 hover:border-emerald-400'
          }`}
        >
          <div>
            <span className="text-xs font-bold text-emerald-800">ধাপ ২ · সময়: ৭ মিনিট</span>
            <h3 className="text-lg font-bold text-slate-900 mt-1">
              আগের দিনের পুনরাবৃত্তি (SRS)
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              শেখা শব্দগুলো দীর্ঘমেয়াদী স্মৃতিতে স্থায়ী করুন
            </p>
          </div>
          <CheckCircle2
            className={`w-6 h-6 shrink-0 ${
              todayLog.planStepsCompleted.step2Review ? 'text-emerald-600' : 'text-slate-300'
            }`}
          />
        </button>

        <button
          type="button"
          onClick={() => setActiveStep(3)}
          className={`p-5 rounded-2xl border text-left transition-all flex items-start justify-between gap-3 ${
            activeStep === 3
              ? 'bg-white border-emerald-700 ring-2 ring-emerald-700/15'
              : 'bg-white border-slate-200 hover:border-emerald-400'
          }`}
        >
          <div>
            <span className="text-xs font-bold text-emerald-800">ধাপ ৩ · সময়: ৬ মিনিট</span>
            <h3 className="text-lg font-bold text-slate-900 mt-1">ছোট আয়াত শব্দে শব্দে চর্চা</h3>
            <p className="text-xs text-slate-600 mt-1">
              সূরার আয়াত ভেঙে উচ্চারণ ও অর্থ মিলিয়ে পড়ুন
            </p>
          </div>
          <CheckCircle2
            className={`w-6 h-6 shrink-0 ${
              todayLog.planStepsCompleted.step3AyahPractice ? 'text-emerald-600' : 'text-slate-300'
            }`}
          />
        </button>
      </div>

      {/* Active Step Workspace */}
      {activeStep === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                ধাপ ১: আজকের নতুন শব্দ ({toBnNum(newWordsForToday.length)}টি)
              </h2>
              <p className="text-sm text-slate-600">
                প্রতিটি শব্দের আরবি উচ্চারণ শুনুন এবং "শেখা সম্পন্ন" বাটনে ট্যাপ করুন
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onMarkPlanStep('step1NewWords');
                setActiveStep(2);
              }}
              className="min-h-[48px] px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-xl flex items-center gap-2 transition-colors whitespace-nowrap self-start"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>ধাপ ১ সম্পন্ন ও পরের ধাপে যান</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {newWordsForToday.map((word) => (
              <div
                key={word.id}
                className="p-5 rounded-2xl bg-[#F8FAF9] border border-slate-200 flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs text-slate-500">
                      শব্দ #{toBnNum(word.id)} · কুরআনে {toBnNum(word.frequency)} বার
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 mt-1">{word.meaning}</h3>
                    <p className="text-base font-semibold text-emerald-800">
                      উচ্চারণ: {word.pronunciation}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => speakArabic(word.arabic, slowAudio)}
                    className="min-w-[84px] min-h-[72px] px-4 py-2 rounded-xl bg-white border border-slate-200 hover:border-emerald-600 flex flex-col items-center justify-center transition-colors"
                  >
                    <span className="font-arabic text-3xl text-emerald-950">{word.arabic}</span>
                    <span className="text-[11px] font-semibold text-emerald-700 inline-flex items-center gap-1 mt-1">
                      <Volume2 className="w-3 h-3" /> শুনুন
                    </span>
                  </button>
                </div>

                <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-arabic text-xl text-slate-900 truncate" dir="rtl">
                      {word.ayahAr}
                    </p>
                    <p className="text-xs text-slate-600 truncate">{word.ayahBnMeaning}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRateWord(word.id, 'good')}
                    className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold whitespace-nowrap shrink-0"
                  >
                    শেখা হলো ✓
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeStep === 2 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                ধাপ ২: আগের দিনের শব্দ পুনরাবৃত্তি ({toBnNum(reviewWordsForToday.length)}টি)
              </h2>
              <p className="text-sm text-slate-600">
                শব্দগুলো মনে করতে পারছেন কি না যাচাই করুন এবং রিভিউ বাটনে ট্যাপ করুন
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onMarkPlanStep('step2Review');
                setActiveStep(3);
              }}
              className="min-h-[48px] px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-xl flex items-center gap-2 transition-colors whitespace-nowrap self-start"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>ধাপ ২ সম্পন্ন ও ধাপ ৩-এ যান</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviewWordsForToday.map((word) => {
              const srs = progress.wordSRS[word.id];
              return (
                <div
                  key={word.id}
                  className="p-5 rounded-2xl bg-[#F8FAF9] border border-slate-200 flex flex-col justify-between gap-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs text-emerald-800 font-semibold">
                        {srs
                          ? `বর্তমান বিরতি: ${toBnNum(srs.interval)} দিন`
                          : 'পুনরাবৃত্তি তালিকা'}
                      </span>
                      <h3 className="text-xl font-bold text-slate-900 mt-1">
                        {word.pronunciation} — {word.meaning}
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">{word.ayahBnMeaning}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => speakArabic(word.arabic, slowAudio)}
                      className="min-w-[84px] min-h-[72px] px-4 py-2 rounded-xl bg-white border border-slate-200 hover:border-emerald-600 flex flex-col items-center justify-center"
                    >
                      <span className="font-arabic text-3xl text-emerald-950">{word.arabic}</span>
                      <Volume2 className="w-4 h-4 text-emerald-700 mt-1" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/70">
                    <button
                      type="button"
                      onClick={() => onRateWord(word.id, 'again')}
                      className="min-h-[40px] px-2 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-semibold"
                    >
                      কঠিন (আবার)
                    </button>
                    <button
                      type="button"
                      onClick={() => onRateWord(word.id, 'good')}
                      className="min-h-[40px] px-2 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-semibold"
                    >
                      ভালো (মনে আছে)
                    </button>
                    <button
                      type="button"
                      onClick={() => onRateWord(word.id, 'easy')}
                      className="min-h-[40px] px-2 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold"
                    >
                      সহজ (স্থায়ী)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeStep === 3 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                ধাপ ৩: ছোট আয়াত শব্দে শব্দে চর্চা ({currentPracticeAyah.surahName} · আয়াত{' '}
                {toBnNum(currentPracticeAyah.ayahNumber)})
              </h2>
              <p className="text-sm text-slate-600">
                আয়াতটির পূর্ণ উচ্চারণ শুনুন এবং প্রতিটি শব্দের অর্থে ট্যাপ করে মিলিয়ে পড়ুন
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedAyahIndex((i) => i + 1)}
                className="min-h-[46px] px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-semibold text-slate-800 flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>অন্য আয়াত</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onMarkPlanStep('step3AyahPractice')}
                className="min-h-[46px] px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-xl flex items-center gap-2 transition-colors whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4" />
                <span>আজকের প্ল্যান সম্পন্ন করুন</span>
              </button>
            </div>
          </div>

          {/* Full Ayah Banner */}
          <div className="p-6 rounded-2xl bg-[#F4F8F6] border border-emerald-900/10 text-right space-y-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => speakArabic(currentPracticeAyah.ayah.fullAr, slowAudio)}
                className="min-h-[44px] px-4 py-2 bg-emerald-800 text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-emerald-900 transition-colors"
              >
                <Volume2 className="w-4 h-4" />
                <span>পুরো আয়াতটি শুনুন</span>
              </button>
              <span className="text-xs font-semibold text-emerald-900">
                {currentPracticeAyah.surahName} · আয়াত {toBnNum(currentPracticeAyah.ayahNumber)}
              </span>
            </div>

            <p
              dir="rtl"
              className={`font-arabic text-emerald-950 ${
                largeFont ? 'text-5xl' : 'text-4xl md:text-5xl'
              }`}
            >
              {currentPracticeAyah.ayah.fullAr}
            </p>
            <p className="text-left text-lg font-bold text-slate-900">
              উচ্চারণ: {currentPracticeAyah.ayah.fullBnPronunciation}
            </p>
            <p className="text-left text-base text-slate-700">
              অনুবাদ: “{currentPracticeAyah.ayah.fullBnMeaning}”
            </p>
          </div>

          {/* Word-by-word cards */}
          <div dir="rtl" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {currentPracticeAyah.ayah.words.map((w, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => speakArabic(w.ar, slowAudio)}
                className="p-4 rounded-xl bg-[#F8FAF9] border border-slate-200 hover:border-emerald-600 text-center transition-colors flex flex-col items-center justify-between min-h-[120px]"
              >
                <span className="font-arabic text-3xl md:text-4xl text-emerald-950">{w.ar}</span>
                <div dir="ltr" className="mt-2">
                  <p className="text-sm font-bold text-slate-900">{w.bnPronunciation}</p>
                  <p className="text-xs font-semibold text-emerald-800 mt-0.5">{w.bnMeaning}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
