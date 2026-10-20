import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
} from 'recharts';
import {
  Flame,
  Trophy,
  Calendar,
  Zap,
  TrendingUp,
  Award,
  Sparkles,
  Clock,
  Target,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { UserProgressState, addDaysToDateStr, getTodayStr } from '../utils/storage';
import { toBnNum } from '../utils/speech';

interface ThirtyDayStreakChartProps {
  progress: UserProgressState;
  onNavigateTab?: (tab: 'alphabet' | 'words' | 'roots' | 'grammar' | 'plan' | 'quran') => void;
  largeFont?: boolean;
}

type StreakMetricMode = 'streak' | 'studyMinutes' | 'words';

interface DayStreakStat {
  dateStr: string;
  dayShort: string;
  dayNumber: number;
  monthNameBn: string;
  dayNameBn: string;
  isToday: boolean;
  minutesStudied: number;
  wordsLearned: number;
  wordsReviewed: number;
  totalWords: number;
  ayahsPracticed: number;
  stepsCount: number;
  isActive: boolean;
  runningStreak: number;
  goalMet: boolean;
}

const BN_DAY_SHORT = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];
const BN_MONTHS = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

export const ThirtyDayStreakChart: React.FC<ThirtyDayStreakChartProps> = ({
  progress,
  onNavigateTab,
  largeFont = false,
}) => {
  const [metricMode, setMetricMode] = useState<StreakMetricMode>('streak');
  const today = getTodayStr();

  // Compute 30 days dataset (from today - 29 days up to today)
  const streakData: DayStreakStat[] = useMemo(() => {
    const list: DayStreakStat[] = [];
    let currentRun = 0;

    for (let i = 29; i >= 0; i--) {
      const dStr = addDaysToDateStr(today, -i);
      const [y, m, d] = dStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      const dayIdx = dt.getDay();
      const monthIdx = dt.getMonth();

      const log = progress.dailyLogs[dStr];
      const minutes = log?.minutesStudied || 0;
      const learned = log?.wordsLearned || 0;
      const reviewed = log?.wordsReviewed || 0;
      const ayahs = log?.ayahsPracticed || 0;
      const steps = log?.planStepsCompleted;
      const stepsCount =
        (steps?.step1NewWords ? 1 : 0) +
        (steps?.step2Review ? 1 : 0) +
        (steps?.step3AyahPractice ? 1 : 0);

      const isActive = minutes > 0 || learned > 0 || reviewed > 0 || ayahs > 0 || stepsCount > 0;

      if (isActive) {
        currentRun += 1;
      } else {
        currentRun = 0;
      }

      list.push({
        dateStr: dStr,
        dayShort: BN_DAY_SHORT[dayIdx],
        dayNumber: d,
        monthNameBn: BN_MONTHS[monthIdx],
        dayNameBn: BN_DAY_SHORT[dayIdx],
        isToday: i === 0,
        minutesStudied: minutes,
        wordsLearned: learned,
        wordsReviewed: reviewed,
        totalWords: learned + reviewed,
        ayahsPracticed: ayahs,
        stepsCount,
        isActive,
        runningStreak: currentRun,
        goalMet: minutes >= 20 || stepsCount === 3,
      });
    }

    return list;
  }, [progress.dailyLogs, today]);

  // Overall 30-Day Analytics
  const analytics = useMemo(() => {
    let longest = 0;
    let tempStreak = 0;
    let activeCount = 0;
    let totalMinutes = 0;
    let totalWordsCount = 0;

    streakData.forEach((item) => {
      if (item.isActive) {
        activeCount += 1;
        tempStreak += 1;
        if (tempStreak > longest) longest = tempStreak;
      } else {
        tempStreak = 0;
      }
      totalMinutes += item.minutesStudied;
      totalWordsCount += item.totalWords;
    });

    // Current running streak ending today
    const currentStreakDays = streakData[streakData.length - 1]?.runningStreak || progress.streakDays || 0;
    const consistencyPct = Math.round((activeCount / 30) * 100);

    return {
      currentStreakDays,
      longestStreakDays: Math.max(longest, progress.streakDays || 0, 7),
      activeCount,
      totalMinutes,
      totalWordsCount,
      consistencyPct,
    };
  }, [streakData, progress.streakDays]);

  // Determine bar value based on selected metric mode
  const getBarValue = (item: DayStreakStat) => {
    if (metricMode === 'streak') return item.runningStreak;
    if (metricMode === 'studyMinutes') return item.minutesStudied;
    return item.totalWords;
  };

  return (
    <section className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
      {/* Header & Motivational Trophy Badge */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wide">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>৩০ দিনের ধারাবাহিক স্ট্রিক ট্র্যাকার (30-Day Study Streak)</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 mt-1">
            গত ৩০ দিনে আপনার নিয়মানুবর্তিতা ও স্ট্রিক গ্রাফ
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            ধারাবাহিক অল্প সময়ের অধ্যয়ন দীর্ঘমেয়াদী সফলতার চাবিকাঠি। প্রতিদিন অন্তত ৫-১০ মিনিট চর্চা করে স্ট্রিক বজায় রাখুন।
          </p>
        </div>

        {/* Metric Mode Switcher Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl self-start lg:self-center">
          <button
            type="button"
            onClick={() => setMetricMode('streak')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              metricMode === 'streak'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            স্ট্রিক গ্রোথ (দিন)
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('studyMinutes')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              metricMode === 'studyMinutes'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            পড়ার সময় (মিনিট)
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('words')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              metricMode === 'words'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            চর্চাকৃত শব্দ
          </button>
        </div>
      </div>

      {/* 4 Motivation Booster Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/70 border border-amber-200/80 space-y-1">
          <div className="flex items-center justify-between text-amber-700 text-xs font-semibold">
            <span>বর্তমান স্ট্রিক</span>
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-amber-950 tabular-nums">
            {toBnNum(analytics.currentStreakDays)} <span className="text-sm font-semibold text-amber-800">দিন</span>
          </div>
          <p className="text-[11px] text-amber-700/90 font-medium">অবিচল ধারায় চর্চা চলছে 🔥</p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/70 border border-emerald-200/80 space-y-1">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold">
            <span>৩০ দিনে সর্বোচ্চ</span>
            <Trophy className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-emerald-950 tabular-nums">
            {toBnNum(analytics.longestStreakDays)} <span className="text-sm font-semibold text-emerald-800">দিন</span>
          </div>
          <p className="text-[11px] text-emerald-700 font-medium">ব্যক্তিগত সেরা রেকর্ড 🏆</p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 to-cyan-50/70 border border-sky-200/80 space-y-1">
          <div className="flex items-center justify-between text-sky-800 text-xs font-semibold">
            <span>সক্রিয় দিন</span>
            <Calendar className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-sky-950 tabular-nums">
            {toBnNum(analytics.activeCount)} <span className="text-sm font-semibold text-sky-700">/ ৩০ দিন</span>
          </div>
          <p className="text-[11px] text-sky-700 font-medium">{toBnNum(analytics.consistencyPct)}% নিয়মিত উপস্থিতি</p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50/70 border border-violet-200/80 space-y-1">
          <div className="flex items-center justify-between text-violet-800 text-xs font-semibold">
            <span>মোট অধ্যয়ন সময়</span>
            <Clock className="w-4 h-4 text-violet-600" />
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-violet-950 tabular-nums">
            {toBnNum(analytics.totalMinutes)} <span className="text-sm font-semibold text-violet-700">মিনিট</span>
          </div>
          <p className="text-[11px] text-violet-700 font-medium">
            প্রায় {toBnNum(Math.round((analytics.totalMinutes / 60) * 10) / 10)} ঘণ্টা চর্চা
          </p>
        </div>
      </div>

      {/* Main Recharts Bar Chart Container */}
      <div className="bg-[#FAFDFB] rounded-2xl border border-slate-200/80 p-4 md:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-700">
              {metricMode === 'streak' && 'ধারাবাহিক স্ট্রিক দিনের গ্রাফ (১-৩০ দিন)'}
              {metricMode === 'studyMinutes' && 'প্রতিদিনের অধ্যয়ন সময় (মিনিট)'}
              {metricMode === 'words' && 'প্রতিদিন চর্চাকৃত শব্দের সংখ্যা'}
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-500">প্রতিটি স্তম্ভে (Bar) হোভার করে বিস্তারিত দেখুন</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-[11px]">
              <span className="w-3 h-3 rounded-sm bg-emerald-600 inline-block" />
              <span>সক্রিয় দিন</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-700 font-semibold text-[11px]">
              <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block ring-1 ring-amber-400" />
              <span>আজকের দিন</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 font-medium text-[11px]">
              <span className="w-3 h-3 rounded-sm bg-slate-200 inline-block" />
              <span>বিরতি</span>
            </div>
          </div>
        </div>

        {/* Responsive Recharts Bar Chart */}
        <div className="w-full h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={streakData}
              margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
              barGap={2}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.7} />

              <XAxis
                dataKey="dayNumber"
                tickFormatter={(val: number, idx: number) => {
                  // Show label every few days or on today to keep mobile tidy
                  if (idx === streakData.length - 1) return 'আজ';
                  if (idx % 3 === 0) return toBnNum(val);
                  return '';
                }}
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
              />

              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val: number) => toBnNum(val)}
                allowDecimals={false}
              />

              {metricMode === 'studyMinutes' && (
                <ReferenceLine
                  y={20}
                  stroke="#059669"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: 'লক্ষ্য: ২০ মিনিট',
                    fill: '#047857',
                    fontSize: 10,
                    position: 'insideTopRight',
                  }}
                />
              )}

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as DayStreakStat;
                    return (
                      <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-4 shadow-xl border border-slate-700/80 text-xs space-y-2 min-w-[210px] animate-in fade-in duration-150">
                        <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                          <span className="font-bold text-emerald-300">
                            {toBnNum(data.dayNumber)} {data.monthNameBn} ({data.dayNameBn})
                          </span>
                          {data.isToday && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-extrabold text-[10px]">
                              আজ
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5 pt-0.5">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-300 flex items-center gap-1.5">
                              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> ধারাবাহিক স্ট্রিক:
                            </span>
                            <span className="font-bold text-white tabular-nums">
                              {data.runningStreak > 0 ? `${toBnNum(data.runningStreak)} দিন` : '—'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-300 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-emerald-400" /> পড়ার সময়:
                            </span>
                            <span className="font-bold text-white tabular-nums">
                              {toBnNum(data.minutesStudied)} মিনিট
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-300 flex items-center gap-1.5">
                              <Target className="w-3.5 h-3.5 text-sky-400" /> শব্দ চর্চা:
                            </span>
                            <span className="font-bold text-white tabular-nums">
                              {toBnNum(data.totalWords)}টি শব্দ
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-300 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> সম্পন্ন ধাপ:
                            </span>
                            <span className="font-bold text-emerald-300 tabular-nums">
                              {toBnNum(data.stepsCount)} / ৩টি
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-700 text-[10px] text-slate-300">
                          {data.goalMet ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-amber-400" /> দৈনিক লক্ষ্য সম্পূর্ণ অর্জিত!
                            </span>
                          ) : data.isActive ? (
                            <span className="text-amber-300">অংশত সম্পন্ন — প্রগ্রেস যোগ হয়েছে</span>
                          ) : (
                            <span className="text-slate-400">এই দিনে বিরতি ছিল</span>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Bar
                dataKey={(item) => getBarValue(item)}
                radius={[6, 6, 0, 0]}
                animationDuration={900}
              >
                {streakData.map((entry, index) => {
                  let fillColor = '#e2e8f0'; // Default inactive gray
                  if (entry.isToday) {
                    fillColor = '#f59e0b'; // Today: bright amber/gold
                  } else if (entry.goalMet) {
                    fillColor = '#059669'; // Target hit: vibrant emerald
                  } else if (entry.isActive) {
                    fillColor = '#10b981'; // Active day: fresh emerald
                  }

                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={fillColor}
                      className="transition-all hover:opacity-85"
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom Chart Timeline Legend & Today Notice */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200/60 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>৩০ দিনের টাইমলাইনে সর্বশেষ বারটি আজকের দিনের বর্তমান অবস্থা নির্দেশ করে।</span>
          </div>

          <div className="text-slate-600 font-semibold">
            গত ৩০ দিনে অধ্যয়ন হার:{' '}
            <span className="text-emerald-800 font-bold">{toBnNum(analytics.consistencyPct)}%</span>
          </div>
        </div>
      </div>

      {/* Motivational Milestone Badges & Steadfastness Callout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Milestone 1: 3-Day Warmup */}
        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 font-bold">
            <Award className="w-5 h-5 text-amber-800" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-amber-950">৩ দিনের সূচনা স্ট্রিক</h4>
            <p className="text-[11px] text-amber-800 mt-0.5">
              শুরুর জড়তা কাটিয়ে নিয়মিত চর্চায় অভ্যস্থ হতে ৩ দিনের অবিচল যাত্রা।
            </p>
            <span className="text-[10px] font-bold text-emerald-800 mt-1 block">
              {analytics.currentStreakDays >= 3 ? '✓ অর্জিত' : 'অগ্রগতি চলছে'}
            </span>
          </div>
        </div>

        {/* Milestone 2: 7-Day Steadfast */}
        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-200 text-emerald-900 flex items-center justify-center shrink-0 font-bold">
            <ShieldCheck className="w-5 h-5 text-emerald-800" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-emerald-950">৭ দিনের অবিচল স্ট্রিক</h4>
            <p className="text-[11px] text-emerald-800 mt-0.5">
              এক সপ্তাহের পূর্ণ চক্র সম্পন্ন করে আরবি চর্চাকে দৈনন্দিন অভ্যাসে পরিণত করা।
            </p>
            <span className="text-[10px] font-bold text-emerald-800 mt-1 block">
              {analytics.currentStreakDays >= 7 ? '✓ অর্জিত' : 'চলতি লক্ষ্য'}
            </span>
          </div>
        </div>

        {/* Milestone 3: 30-Day Master */}
        <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/80 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-200 text-purple-900 flex items-center justify-center shrink-0 font-bold">
            <Star className="w-5 h-5 text-purple-800 fill-purple-700" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-purple-950">৩০ দিনের গোল্ডেন স্ট্রিক</h4>
            <p className="text-[11px] text-purple-800 mt-0.5">
              এক মাসের অবিরাম সাধনায় কুরআনের অর্থ বোঝা সহজতর হবে ইনশাআল্লাহ।
            </p>
            <span className="text-[10px] font-bold text-purple-800 mt-1 block">
              {toBnNum(analytics.currentStreakDays)}/৩০ দিন সমাপ্ত
            </span>
          </div>
        </div>
      </div>

      {/* Steadfastness Hadith Callout & Action to Protect Today's Streak */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-950 text-white rounded-2xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>প্রেরণামূলক হাদিস (Daily Spiritual Inspiration)</span>
          </div>
          <p className="text-sm md:text-base font-semibold text-emerald-50 italic">
            “আল্লাহর কাছে সর্বাধিক প্রিয় আমল তা-ই, যা সর্বদা নিয়মিত করা হয় — যদিও তা পরিমাণে কম হোক।”
          </p>
          <p className="text-xs text-emerald-200/80">— সহীহ বুখারী: ৬৪৬৪ ও সহীহ মুসলিম: ৭৮২</p>
        </div>

        {onNavigateTab && (
          <button
            type="button"
            onClick={() => onNavigateTab('plan')}
            className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 text-xs font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap shadow-xs cursor-pointer self-start md:self-center"
          >
            <Flame className="w-4 h-4 text-amber-900 fill-amber-900" />
            <span>আজকের স্ট্রিক রক্ষা করুন</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </section>
  );
};
