import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Award,
  CheckCircle2,
  ChevronRight,
  Target,
} from 'lucide-react';
import { UserProgressState } from '../utils/storage';
import { PRACTICE_SURAHS } from '../data/surahData';
import { toBnNum } from '../utils/speech';

interface ProgressDashboardProps {
  progress: UserProgressState;
  onNavigateTab: (tab: 'alphabet' | 'words' | 'roots' | 'grammar' | 'plan' | 'quran') => void;
  largeFont?: boolean;
}

interface MilestoneItem {
  id: string;
  titleBn: string;
  targetCountText: string;
  currentCountText: string;
  percent: number;
  isUnlocked: boolean;
  isNext: boolean;
  descriptionBn: string;
  unlockBenefitBn: string;
  targetTab: 'alphabet' | 'words' | 'roots' | 'grammar' | 'plan' | 'quran';
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  progress,
  onNavigateTab,
  largeFont,
}) => {
  const [activeChartTab, setActiveChartTab] = useState<'circular' | 'activity'>('circular');

  // Compute Finished Surahs count (all ayahs in surah practiced)
  const finishedSurahsCount = useMemo(() => {
    return PRACTICE_SURAHS.filter((surah) => {
      const allAyahsInSurah = surah.ayahs.map(
        (a) => `${surah.surahNumber}:${a.ayahNumber}`
      );
      return allAyahsInSurah.every((k) => progress.practicedAyahKeys.includes(k));
    }).length;
  }, [progress.practicedAyahKeys]);

  const totalWordsLearned = useMemo(() => {
    return Object.keys(progress.wordSRS).length;
  }, [progress.wordSRS]);

  const masteredLettersCount = progress.masteredLetters.length;
  const exploredRootsCount = progress.exploredRoots.length;
  const grammarCount = progress.completedGrammarIds.length;

  // Percentage Calculations
  const alphabetPct = Math.min(100, Math.round((masteredLettersCount / 28) * 100));
  const wordsPct = Math.min(100, Math.round((totalWordsLearned / 300) * 100));
  const surahsPct = Math.min(100, Math.round((finishedSurahsCount / PRACTICE_SURAHS.length) * 100));
  const rootsAndGrammarPct = Math.min(
    100,
    Math.round(((exploredRootsCount + grammarCount) / (12 + 6)) * 100)
  );

  const overallMasteryPct = Math.round(
    alphabetPct * 0.25 + wordsPct * 0.35 + surahsPct * 0.25 + rootsAndGrammarPct * 0.15
  );

  // Data for Recharts circular donut rings
  const circularRingData = [
    {
      name: 'আরবি বর্ণমালা',
      value: alphabetPct,
      current: `${toBnNum(masteredLettersCount)}/২৮টি`,
      fill: '#059669', // Emerald 600
    },
    {
      name: '৩০০ শব্দভাণ্ডার',
      value: wordsPct,
      current: `${toBnNum(totalWordsLearned)}/৩০০টি`,
      fill: '#0d9488', // Teal 600
    },
    {
      name: 'কুরআনের সূরা সমাপ্তি',
      value: surahsPct,
      current: `${toBnNum(finishedSurahsCount)}/${toBnNum(PRACTICE_SURAHS.length)}টি সূরা`,
      fill: '#0284c7', // Sky 600
    },
    {
      name: 'শব্দের মূল ও ব্যাকরণ',
      value: rootsAndGrammarPct,
      current: `${toBnNum(exploredRootsCount + grammarCount)}/১৮টি পাঠ`,
      fill: '#d97706', // Amber 600
    },
  ];

  // Data for weekly study minutes
  const weeklyActivityData = useMemo(() => {
    const dates = Object.keys(progress.dailyLogs).sort();
    const lastDates = dates.slice(-7);
    if (lastDates.length === 0) {
      return [{ day: 'আজ', minutes: 0, words: 0 }];
    }
    return lastDates.map((d) => {
      const log = progress.dailyLogs[d];
      const parts = d.split('-');
      const dayLabel = parts.length === 3 ? `${toBnNum(Number(parts[2]))} তারিখ` : d;
      return {
        day: dayLabel,
        minutes: log ? log.minutesStudied : 0,
        words: log ? log.wordsLearned + log.wordsReviewed : 0,
      };
    });
  }, [progress.dailyLogs]);

  // User's Milestone Journey Steps
  const milestones: MilestoneItem[] = useMemo(() => {
    const list: Omit<MilestoneItem, 'isNext'>[] = [
      {
        id: 'm1_alphabet',
        titleBn: 'বর্ণমালা আয়ত্ত (Alphabet Mastered)',
        targetCountText: '২৮টি হরফ',
        currentCountText: `${toBnNum(masteredLettersCount)}টি আয়ত্ত`,
        percent: alphabetPct,
        isUnlocked: masteredLettersCount >= 28,
        descriptionBn: 'আলিফ থেকে ইয়া পর্যন্ত ২৮টি আরবি বর্ণের শুরুতে, মাঝে ও শেষের রূপ চেনা।',
        unlockBenefitBn: 'কুরআনের যেকোনো আরবি শব্দ উচ্চারণ করে পড়ার যোগ্যতা তৈরি হয়।',
        targetTab: 'alphabet',
      },
      {
        id: 'm2_first_50_words',
        titleBn: '৫০টি উচ্চ-ফ্রিকোয়েন্সি শব্দ (First 50 Words)',
        targetCountText: '৫০টি শব্দ',
        currentCountText: `${toBnNum(Math.min(50, totalWordsLearned))}টি শেখা`,
        percent: Math.min(100, Math.round((totalWordsLearned / 50) * 100)),
        isUnlocked: totalWordsLearned >= 50,
        descriptionBn: 'কুরআনে সবচেয়ে বেশি ব্যবহৃত ৫০টি শব্দ অর্থসহ শেখা।',
        unlockBenefitBn: 'কুরআনের সাধারণ আয়াতের প্রায় ২৫% শব্দের অর্থ উপলব্ধি করতে পারবেন।',
        targetTab: 'words',
      },
      {
        id: 'm3_100_words',
        titleBn: '১০০টি শব্দ আয়ত্ত (100 Words Learned)',
        targetCountText: '১০০টি শব্দ',
        currentCountText: `${toBnNum(Math.min(100, totalWordsLearned))}টি শেখা`,
        percent: Math.min(100, Math.round((totalWordsLearned / 100) * 100)),
        isUnlocked: totalWordsLearned >= 100,
        descriptionBn: 'কুরআনের শীর্ষ ১০০টি অব্যয়, সর্বনাম ও সাধারণ বিশেষ্য আয়ত্ত করা।',
        unlockBenefitBn: 'কুরআনের বহুল পঠিত আয়াতসমূহের প্রায় ৪০% শব্দের অর্থ স্পষ্টভাবে বোধগম্য হয়।',
        targetTab: 'words',
      },
      {
        id: 'm4_roots_grammar',
        titleBn: 'শব্দের মূল ও ব্যাকরণ ভিত (Roots & Patterns)',
        targetCountText: '১০টি মূল + ৪টি বাক্য',
        currentCountText: `${toBnNum(exploredRootsCount)}টি মূল, ${toBnNum(grammarCount)}টি বাক্য`,
        percent: Math.min(100, Math.round(((exploredRootsCount + grammarCount) / 14) * 100)),
        isUnlocked: exploredRootsCount >= 10 && grammarCount >= 4,
        descriptionBn: 'তিন অক্ষরের মূল থেকে উদ্ভূত শব্দমালা এবং কর্তা-ক্রিয়া-কর্ম প্যাটার্ন বোঝা।',
        unlockBenefitBn: 'নতুন যেকোনো শব্দের মূল অক্ষর দেখে তার মূল অর্থ অনুমান করার দক্ষতা অর্জিত হয়।',
        targetTab: 'roots',
      },
      {
        id: 'm5_first_5_surahs',
        titleBn: 'প্রথম ৫টি সূরা সমাপ্ত (First 5 Surahs Finished)',
        targetCountText: '৫টি সূরা',
        currentCountText: `${toBnNum(finishedSurahsCount)}টি সম্পন্ন`,
        percent: Math.min(100, Math.round((finishedSurahsCount / 5) * 100)),
        isUnlocked: finishedSurahsCount >= 5,
        descriptionBn: 'আল-ফাতিহা, আল-ইখলাস, আল-ফালাক, আন-নাস ও আল-আসরের প্রতিটি আয়াতের শব্দে শব্দে অর্থ মুখস্থ ও পাঠ সম্পন্ন।',
        unlockBenefitBn: 'প্রতিদিনের সালাতে পঠিত সূরার পূর্ণ অর্থ অনুধাবন করে খুশু-খুজু বৃদ্ধি পায়।',
        targetTab: 'quran',
      },
      {
        id: 'm6_full_300_words',
        titleBn: 'পূর্ণ ৩০০ শব্দ ও কুরআন হিফজ প্রস্তুতি (Full 300 Mastery)',
        targetCountText: `৩০০টি শব্দ ও ${toBnNum(PRACTICE_SURAHS.length)}টি সূরা`,
        currentCountText: `${toBnNum(totalWordsLearned)}টি শব্দ, ${toBnNum(finishedSurahsCount)}টি সূরা`,
        percent: Math.min(
          100,
          Math.round(
            ((totalWordsLearned / 300) * 0.7 +
              (finishedSurahsCount / PRACTICE_SURAHS.length) * 0.3) *
              100
          )
        ),
        isUnlocked: totalWordsLearned >= 300 && finishedSurahsCount >= PRACTICE_SURAHS.length,
        descriptionBn: 'কুরআনের সমগ্র ৩০০ উচ্চ-ফ্রিকোয়েন্সি শব্দ এবং সবগুলো নির্বাচিত ছোট সূরা শব্দে শব্দে আয়ত্তকরণ।',
        unlockBenefitBn: 'কুরআনুল কারীমের প্রায় ৭০% শব্দাবলি সরাসরি পাঠকালেই অনুধাবন করার যোগ্যতা অর্জন।',
        targetTab: 'words',
      },
    ];

    let foundNext = false;
    return list.map((item) => {
      const isNext = !item.isUnlocked && !foundNext;
      if (isNext) foundNext = true;
      return {
        ...item,
        isNext,
      };
    });
  }, [
    masteredLettersCount,
    alphabetPct,
    totalWordsLearned,
    exploredRootsCount,
    grammarCount,
    finishedSurahsCount,
  ]);

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-8">
      {/* Dashboard Top Heading */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 tabular-nums">
            <Target className="w-4 h-4 text-emerald-700" />
            <span>শিখন অগ্রগতি ড্যাশবোর্ড · সামগ্রিক অর্জন {toBnNum(overallMasteryPct)}%</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">
            আপনার কুরআন শিক্ষা যাত্রা ও মাইলফলক ট্র্যাকার
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            আরবি হরফ থেকে শুরু করে ৩০০ শব্দ ও ছোট সূরা সমাপ্তির পূর্ণাঙ্গ অগ্রগতি চিত্র
          </p>
        </div>

        {/* View Switcher between Circular Chart & Weekly Study Bar Chart */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start">
          <button
            type="button"
            onClick={() => setActiveChartTab('circular')}
            className={`min-h-[38px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeChartTab === 'circular'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            সার্কুলার চার্ট (দক্ষতা রিং)
          </button>
          <button
            type="button"
            onClick={() => setActiveChartTab('activity')}
            className={`min-h-[38px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeChartTab === 'activity'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            সাপ্তাহিক চর্চা সময়
          </button>
        </div>
      </div>

      {/* Visual Chart Area: Recharts Circular Progress or Activity Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Chart Viewport */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-[#F8FAF9] border border-slate-200/80">
          {activeChartTab === 'circular' ? (
            <div className="relative w-full flex flex-col items-center justify-center">
              <div className="w-64 h-64 md:w-72 md:h-72 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      formatter={(val: unknown) => {
                        const numVal = typeof val === 'number' ? val : Number(val);
                        return [`${toBnNum(numVal)}%`, 'অগ্রগতি'];
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
                    {/* Outer Ring: Alphabet Mastery */}
                    <Pie
                      data={[
                        { name: 'বর্ণমালা সম্পন্ন', value: alphabetPct },
                        { name: 'বাকি', value: 100 - alphabetPct },
                      ]}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius="78%"
                      outerRadius="90%"
                      startAngle={90}
                      endAngle={-270}
                      paddingAngle={0}
                    >
                      <Cell fill="#059669" />
                      <Cell fill="#E2E8F0" />
                    </Pie>
                    {/* Ring 2: 300 High-Frequency Words */}
                    <Pie
                      data={[
                        { name: 'শব্দ সম্পন্ন', value: wordsPct },
                        { name: 'বাকি', value: 100 - wordsPct },
                      ]}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius="64%"
                      outerRadius="74%"
                      startAngle={90}
                      endAngle={-270}
                      paddingAngle={0}
                    >
                      <Cell fill="#0d9488" />
                      <Cell fill="#E2E8F0" />
                    </Pie>
                    {/* Ring 3: Finished Surahs */}
                    <Pie
                      data={[
                        { name: 'সূরা সমাপ্তি', value: surahsPct },
                        { name: 'বাকি', value: 100 - surahsPct },
                      ]}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius="50%"
                      outerRadius="60%"
                      startAngle={90}
                      endAngle={-270}
                      paddingAngle={0}
                    >
                      <Cell fill="#0284c7" />
                      <Cell fill="#E2E8F0" />
                    </Pie>
                    {/* Inner Ring: Roots & Grammar */}
                    <Pie
                      data={[
                        { name: 'মূল ও ব্যাকরণ', value: rootsAndGrammarPct },
                        { name: 'বাকি', value: 100 - rootsAndGrammarPct },
                      ]}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius="36%"
                      outerRadius="46%"
                      startAngle={90}
                      endAngle={-270}
                      paddingAngle={0}
                    >
                      <Cell fill="#d97706" />
                      <Cell fill="#E2E8F0" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Central Overall Percentage Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-[11px] text-slate-500 font-medium">সামগ্রিক অর্জন</span>
                  <span className="text-3xl font-extrabold text-slate-900 tabular-nums">
                    {toBnNum(overallMasteryPct)}%
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                    {overallMasteryPct >= 80
                      ? 'অসাধারণ অগ্রগতি'
                      : overallMasteryPct >= 50
                      ? 'মাঝামাঝি পর্যায়'
                      : 'প্রারম্ভিক পর্যায়'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500 mt-2 text-center">
                বাইরে থেকে ভেতরে: বর্ণমালা → ৩০০ শব্দ → ৭টি সূরা → মূল ও ব্যাকরণ
              </p>
            </div>
          ) : (
            <div className="w-full h-64 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span className="font-semibold text-slate-800">দৈনিক পড়ালেখার সময় (মিনিট)</span>
                <span>গত ৭ দিনের ট্র্যাকার</span>
              </div>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={weeklyActivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    formatter={(val: unknown) => [`${toBnNum(Number(val))} মিনিট`, 'চর্চার সময়']}
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="minutes" fill="#059669" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Right 7 Cols: Skill Dimensions Breakdown Cards */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {circularRingData.map((item, idx) => {
            const tabTarget: 'alphabet' | 'words' | 'quran' | 'roots' =
              idx === 0 ? 'alphabet' : idx === 1 ? 'words' : idx === 2 ? 'quran' : 'roots';

            return (
              <button
                key={item.name}
                type="button"
                onClick={() => onNavigateTab(tabTarget)}
                className="p-4 rounded-xl border border-slate-200/90 bg-white hover:border-emerald-500 text-left transition-all flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: item.fill }}
                      />
                      {item.name}
                    </span>
                    <span className="tabular-nums font-bold text-slate-900">
                      {toBnNum(item.value)}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-2 mb-3 overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ width: `${item.value}%`, backgroundColor: item.fill }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 text-slate-600">
                  <span className="tabular-nums">{item.current}</span>
                  <span className="text-emerald-800 font-semibold group-hover:underline inline-flex items-center gap-0.5">
                    অনুশীলন করুন
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* User's Journey Timeline & Milestones Section */}
      <div className="pt-6 border-t border-slate-100 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-700" />
              <span>ব্যবহারকারীর শিখন যাত্রা ও অর্জনের মাইলফলক (Journey Milestones)</span>
            </h3>
            <p className="text-sm text-slate-600 mt-0.5">
              প্রতিটি মাইলফলক অর্জনের সাথে সাথে কুরআনের ভাষা বোঝার বিশেষ যোগ্যতা উন্মোচিত হবে
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full self-start">
            {toBnNum(milestones.filter((m) => m.isUnlocked).length)} / {toBnNum(milestones.length)}টি
            মাইলফলক অর্জিত
          </span>
        </div>

        {/* Step-by-Step Interactive Timeline */}
        <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 space-y-8 my-4">
          {milestones.map((m, mIdx) => {
            return (
              <div key={m.id} className="relative group">
                {/* Timeline Node Marker */}
                <span
                  className={`absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    m.isUnlocked
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : m.isNext
                      ? 'bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse'
                      : 'bg-slate-200 text-slate-500 border border-slate-300'
                  }`}
                >
                  {m.isUnlocked ? (
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <span>{toBnNum(mIdx + 1)}</span>
                  )}
                </span>

                {/* Milestone Card */}
                <div
                  className={`p-5 rounded-2xl border transition-all ${
                    m.isUnlocked
                      ? 'bg-[#F4F8F6] border-emerald-700/30'
                      : m.isNext
                      ? 'bg-white border-amber-300 shadow-xs ring-1 ring-amber-400/30'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold tracking-wide uppercase ${
                            m.isUnlocked
                              ? 'text-emerald-800'
                              : m.isNext
                              ? 'text-amber-800 font-semibold'
                              : 'text-slate-500'
                          }`}
                        >
                          {m.isUnlocked ? '✓ মাইলফলক অর্জিত' : m.isNext ? 'চলমান লক্ষ্য (Next Goal)' : 'আসন্ন মাইলফলক'}
                        </span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="text-xs text-slate-600 tabular-nums">
                          লক্ষ্য: {m.targetCountText} ({m.currentCountText})
                        </span>
                      </div>

                      <h4
                        className={`text-lg font-bold mt-1 ${
                          largeFont ? 'text-xl' : 'text-lg'
                        } text-slate-900`}
                      >
                        {m.titleBn}
                      </h4>
                    </div>

                    {/* Action Button & Percentage */}
                    <div className="flex items-center gap-3 self-start sm:self-auto">
                      <div className="text-right tabular-nums">
                        <span className="text-sm font-bold text-slate-900">
                          {toBnNum(m.percent)}%
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onNavigateTab(m.targetTab)}
                        className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                          m.isUnlocked
                            ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300'
                            : m.isNext
                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        <span>{m.isUnlocked ? 'পুনরায় দেখুন' : 'চর্চা করুন'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Line */}
                  <div className="w-full bg-slate-200/80 rounded-full h-2 my-3 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        m.isUnlocked ? 'bg-emerald-700' : m.isNext ? 'bg-amber-500' : 'bg-slate-400'
                      }`}
                      style={{ width: `${m.percent}%` }}
                    />
                  </div>

                  {/* Description & Unlock Benefit */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-1">
                    <p className="text-slate-600">
                      <strong className="text-slate-800">বিবরণ: </strong>
                      {m.descriptionBn}
                    </p>
                    <p className="text-emerald-900 bg-emerald-50/70 p-2 rounded-lg border border-emerald-200/60">
                      <strong className="text-emerald-950">অর্জন সুবিধা: </strong>
                      {m.unlockBenefitBn}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
