import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  Calendar,
  Clock,
  BookOpen,
  TrendingUp,
  Award,
  Zap,
  Target,
  Sparkles,
  Layers,
  CheckCircle2,
  BarChart2,
} from 'lucide-react';
import { UserProgressState, addDaysToDateStr, getTodayStr } from '../utils/storage';
import { toBnNum } from '../utils/speech';

interface WeeklyInsightsSectionProps {
  progress: UserProgressState;
  onNavigateTab?: (tab: 'alphabet' | 'words' | 'roots' | 'grammar' | 'plan' | 'quran') => void;
  largeFont?: boolean;
}

type ChartViewMode = 'combined' | 'studyTime' | 'wordsLearned';

interface DayWeeklyStat {
  dateStr: string;
  dayShort: string;
  dayNameBn: string;
  dayNumber: number;
  monthNameBn: string;
  isToday: boolean;
  minutesStudied: number;
  wordsLearned: number;
  wordsReviewed: number;
  totalWords: number;
  ayahsPracticed: number;
  goalMet: boolean;
}

const BN_DAY_NAMES = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];
const BN_FULL_DAY_NAMES = [
  'রবিবার',
  'সোমবার',
  'মঙ্গলবার',
  'বুধবার',
  'বৃহস্পতিবার',
  'শুক্রবার',
  'শনিবার',
];
const BN_MONTH_NAMES = [
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

export const WeeklyInsightsSection: React.FC<WeeklyInsightsSectionProps> = ({
  progress,
  onNavigateTab,
  largeFont,
}) => {
  const [chartMode, setChartMode] = useState<ChartViewMode>('combined');
  const today = getTodayStr();

  // Compute 7 days dataset (from today - 6 days up to today)
  const weeklyData: DayWeeklyStat[] = useMemo(() => {
    const list: DayWeeklyStat[] = [];

    for (let i = 6; i >= 0; i--) {
      const dStr = addDaysToDateStr(today, -i);
      const [y, m, d] = dStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      const dayIdx = dt.getDay();
      const monthIdx = dt.getMonth();

      const log = progress.dailyLogs[dStr];
      const minutes = log?.minutesStudied ?? 0;
      const learned = log?.wordsLearned ?? 0;
      const reviewed = log?.wordsReviewed ?? 0;
      const ayahs = log?.ayahsPracticed ?? 0;

      list.push({
        dateStr: dStr,
        dayShort: i === 0 ? `আজ (${BN_DAY_NAMES[dayIdx]})` : `${BN_DAY_NAMES[dayIdx]} ${toBnNum(d)}`,
        dayNameBn: BN_FULL_DAY_NAMES[dayIdx],
        dayNumber: d,
        monthNameBn: BN_MONTH_NAMES[monthIdx],
        isToday: i === 0,
        minutesStudied: minutes,
        wordsLearned: learned,
        wordsReviewed: reviewed,
        totalWords: learned + reviewed,
        ayahsPracticed: ayahs,
        goalMet: minutes >= 20 || (learned + reviewed >= progress.dailyWordGoal && ayahs >= 1),
      });
    }

    return list;
  }, [progress.dailyLogs, progress.dailyWordGoal, today]);

  // Aggregate 7-Day Metrics
  const totalStudyMinutes = useMemo(
    () => weeklyData.reduce((acc, curr) => acc + curr.minutesStudied, 0),
    [weeklyData]
  );

  const totalWordsLearned = useMemo(
    () => weeklyData.reduce((acc, curr) => acc + curr.wordsLearned, 0),
    [weeklyData]
  );

  const totalWordsReviewed = useMemo(
    () => weeklyData.reduce((acc, curr) => acc + curr.wordsReviewed, 0),
    [weeklyData]
  );

  const totalWordsCombined = totalWordsLearned + totalWordsReviewed;

  const totalAyahsPracticed = useMemo(
    () => weeklyData.reduce((acc, curr) => acc + curr.ayahsPracticed, 0),
    [weeklyData]
  );

  const dailyAvgMinutes = Math.round(totalStudyMinutes / 7);
  const dailyAvgWords = Math.round(totalWordsCombined / 7);

  const daysGoalMetCount = weeklyData.filter((d) => d.goalMet).length;

  const peakDay = useMemo(() => {
    return weeklyData.reduce((prev, current) =>
      current.minutesStudied > prev.minutesStudied ? current : prev
    );
  }, [weeklyData]);

  // Format hours and minutes for total study time
  const formatHoursMinutes = (totalMin: number) => {
    if (totalMin < 60) return `${toBnNum(totalMin)} মিনিট`;
    const hrs = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    return `${toBnNum(hrs)} ঘণ্টা ${mins > 0 ? `${toBnNum(mins)} মিনিট` : ''}`;
  };

  // Custom Recharts Tooltip
  const CustomWeeklyTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data: DayWeeklyStat = payload[0].payload;

    return (
      <div className="bg-slate-900 text-white rounded-xl shadow-xl p-3.5 border border-slate-700 text-xs min-w-[210px] space-y-2 pointer-events-none">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div>
            <span className="font-bold text-slate-100 text-sm">{data.dayNameBn}</span>
            <span className="text-[11px] text-slate-400 block">
              {toBnNum(data.dayNumber)} {data.monthNameBn} {data.isToday ? '· (আজ)' : ''}
            </span>
          </div>
          {data.goalMet ? (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              লক্ষ্য অর্জিত
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-medium">
              চলমান
            </span>
          )}
        </div>

        <div className="space-y-1.5 pt-0.5">
          <div className="flex items-center justify-between text-emerald-300">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>পড়ার সময় (স্টাডি টাইম):</span>
            </span>
            <span className="font-bold tabular-nums text-sm text-white">
              {toBnNum(data.minutesStudied)} মিনিট
            </span>
          </div>

          <div className="flex items-center justify-between text-teal-300">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-teal-400" />
              <span>মোট অনুশীলন শব্দ:</span>
            </span>
            <span className="font-bold tabular-nums text-white">
              {toBnNum(data.totalWords)}টি
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-400 text-[11px] pl-5">
            <span>• নতুন শব্দ: {toBnNum(data.wordsLearned)}টি</span>
            <span>• পুনরাবৃত্তি: {toBnNum(data.wordsReviewed)}টি</span>
          </div>

          {data.ayahsPracticed > 0 && (
            <div className="flex items-center justify-between text-amber-300 pt-0.5 border-t border-slate-800">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>তিলাওয়াতকৃত আয়াত:</span>
              </span>
              <span className="font-bold tabular-nums text-white">
                {toBnNum(data.ayahsPracticed)}টি
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <section id="progress-chart" className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 space-y-6 shadow-sm scroll-mt-6">
      {/* 1. Header with Badge & View Mode Toggle */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
            <BarChart2 className="w-4 h-4 text-emerald-700" />
            <span>প্রগ্রেস চার্ট · Progress Chart (বিগত ৭ দিন)</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">
            প্রগ্রেস চার্ট: গত ৭ দিনের পড়ার সময় ও শব্দ শিক্ষা
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Recharts ভিজ্যুয়ালাইজেশন — প্রতিদিনের পড়ার সময় (মিনিট), নতুন শেখা শব্দ ও রিভিশনের পরিসংখ্যান
          </p>
        </div>

        {/* Chart View Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setChartMode('combined')}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              chartMode === 'combined'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>সম্মিলিত ভিউ (Combined)</span>
          </button>
          <button
            type="button"
            onClick={() => setChartMode('studyTime')}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              chartMode === 'studyTime'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>স্টাডি টাইম (মিনিট)</span>
          </button>
          <button
            type="button"
            onClick={() => setChartMode('wordsLearned')}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              chartMode === 'wordsLearned'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>শব্দ সংখ্যা (Words)</span>
          </button>
        </div>
      </div>

      {/* 2. 4 Top Metric KPI Cards for 7 Days */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Study Time */}
        <div className="p-4 md:p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900">মোট পড়ার সময় (৭ দিন)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl md:text-3xl font-extrabold text-emerald-950 tabular-nums">
              {formatHoursMinutes(totalStudyMinutes)}
            </span>
            <span className="text-xs text-emerald-800 block mt-1 font-medium">
              দৈনিক গড়: {toBnNum(dailyAvgMinutes)} মিনিট / দিন
            </span>
          </div>
        </div>

        {/* Card 2: Total Words Learned */}
        <div className="p-4 md:p-5 rounded-2xl bg-gradient-to-br from-teal-50 to-teal-100/50 border border-teal-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-900">মোট অনুশীলিত শব্দ</span>
            <div className="w-8 h-8 rounded-lg bg-teal-800 text-white flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl md:text-3xl font-extrabold text-teal-950 tabular-nums">
              {toBnNum(totalWordsCombined)}টি
            </span>
            <span className="text-xs text-teal-800 block mt-1 font-medium">
              নতুন: {toBnNum(totalWordsLearned)}টি · রিভিশন: {toBnNum(totalWordsReviewed)}টি
            </span>
          </div>
        </div>

        {/* Card 3: Consistency & Goal Completion */}
        <div className="p-4 md:p-5 rounded-2xl bg-gradient-to-br from-sky-50 to-sky-100/50 border border-sky-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-900">ধারাবাহিকতা ও লক্ষ্য</span>
            <div className="w-8 h-8 rounded-lg bg-sky-800 text-white flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl md:text-3xl font-extrabold text-sky-950 tabular-nums">
              {toBnNum(daysGoalMetCount)} <span className="text-sm font-semibold text-sky-700">/ ৭ দিন</span>
            </span>
            <span className="text-xs text-sky-800 block mt-1 font-medium">
              সাপ্তাহিক রুটিন লক্ষ্য অর্জন হার
            </span>
          </div>
        </div>

        {/* Card 4: Peak Day */}
        <div className="p-4 md:p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900">সেরা পড়াশোনার দিন</span>
            <div className="w-8 h-8 rounded-lg bg-amber-700 text-white flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl md:text-2xl font-extrabold text-amber-950">
              {peakDay.dayNameBn}
            </span>
            <span className="text-xs text-amber-800 block mt-1 font-medium tabular-nums">
              {toBnNum(peakDay.minutesStudied)} মিনিট · {toBnNum(peakDay.totalWords)}টি শব্দ
            </span>
          </div>
        </div>
      </div>

      {/* 3. Main Recharts Visualization Canvas */}
      <div className="p-5 md:p-6 rounded-2xl bg-[#F8FAF9] border border-emerald-900/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
              <span>
                {chartMode === 'combined' && 'পড়ার সময় (মিনিট) ও শব্দ সংখ্যার কম্বাইন্ড ট্রেন্ড চার্ট'}
                {chartMode === 'studyTime' && 'দৈনিক স্টাডি টাইম (২০ মিনিটের গোল রেফারেন্সসহ)'}
                {chartMode === 'wordsLearned' && 'নতুন শব্দ ও রিভিশনের দৈনিক বণ্টন'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              গ্রাফের স্তম্ভ বা পয়েন্টের ওপর মাউস নিন অথবা ট্যাপ করে বিস্তারিত দেখুন
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-600 font-medium">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#047857]" />
              <span>পড়ার সময় (মিনিট)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#0d9488]" />
              <span>শব্দ সংখ্যা</span>
            </span>
          </div>
        </div>

        {/* Recharts Render Container */}
        <div className="w-full h-72 sm:h-80 md:h-96 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {chartMode === 'combined' ? (
              <ComposedChart
                data={weeklyData}
                margin={{ top: 15, right: 20, left: -5, bottom: 10 }}
              >
                <defs>
                  <linearGradient id="studyTimeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#047857" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#047857" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="dayShort"
                  tick={{ fontSize: 11, fill: '#334155', fontWeight: 500 }}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: '#047857', fontWeight: 600 }}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                  label={{
                    value: 'মিনিট',
                    angle: -90,
                    position: 'insideLeft',
                    fontSize: 10,
                    fill: '#047857',
                    offset: 15,
                  }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: '#0d9488', fontWeight: 600 }}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                  label={{
                    value: 'শব্দ',
                    angle: 90,
                    position: 'insideRight',
                    fontSize: 10,
                    fill: '#0d9488',
                    offset: 15,
                  }}
                />
                <Tooltip content={<CustomWeeklyTooltip />} />
                <ReferenceLine
                  yAxisId="left"
                  y={20}
                  stroke="#d97706"
                  strokeDasharray="4 4"
                  label={{
                    value: '২০ মিনিট লক্ষ্য',
                    position: 'top',
                    fill: '#b45309',
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                />
                <Bar
                  yAxisId="right"
                  dataKey="totalWords"
                  name="অনুশীলিত শব্দ"
                  fill="#0d9488"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={36}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="minutesStudied"
                  name="পড়ার সময় (মিনিট)"
                  stroke="#047857"
                  strokeWidth={3}
                  fill="url(#studyTimeGrad)"
                  dot={{ r: 4, fill: '#047857', stroke: '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#064e3b', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </ComposedChart>
            ) : chartMode === 'studyTime' ? (
              <AreaChart
                data={weeklyData}
                margin={{ top: 15, right: 20, left: -5, bottom: 10 }}
              >
                <defs>
                  <linearGradient id="areaStudyMinutes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#047857" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="dayShort"
                  tick={{ fontSize: 11, fill: '#334155', fontWeight: 500 }}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#047857', fontWeight: 600 }}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                  label={{
                    value: 'মিনিট',
                    angle: -90,
                    position: 'insideLeft',
                    fontSize: 10,
                    fill: '#047857',
                    offset: 15,
                  }}
                />
                <Tooltip content={<CustomWeeklyTooltip />} />
                <ReferenceLine
                  y={20}
                  stroke="#d97706"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  label={{
                    value: 'দৈনিক ২০ মিনিটের রুটিন লক্ষ্য',
                    position: 'top',
                    fill: '#b45309',
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="minutesStudied"
                  name="পড়ার সময় (মিনিট)"
                  stroke="#047857"
                  strokeWidth={3}
                  fill="url(#areaStudyMinutes)"
                  dot={{ r: 5, fill: '#047857', stroke: '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#064e3b', stroke: '#a7f3d0', strokeWidth: 2 }}
                />
              </AreaChart>
            ) : (
              <BarChart
                data={weeklyData}
                margin={{ top: 15, right: 20, left: -5, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="dayShort"
                  tick={{ fontSize: 11, fill: '#334155', fontWeight: 500 }}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#0d9488', fontWeight: 600 }}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                  label={{
                    value: 'শব্দ সংখ্যা',
                    angle: -90,
                    position: 'insideLeft',
                    fontSize: 10,
                    fill: '#0d9488',
                    offset: 15,
                  }}
                />
                <Tooltip content={<CustomWeeklyTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  wrapperStyle={{ fontSize: '12px' }}
                />
                <ReferenceLine
                  y={progress.dailyWordGoal}
                  stroke="#d97706"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `দৈনিক লক্ষ্য (${toBnNum(progress.dailyWordGoal)}টি শব্দ)`,
                    position: 'top',
                    fill: '#b45309',
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                />
                <Bar
                  dataKey="wordsLearned"
                  name="নতুন শব্দ (New)"
                  fill="#047857"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={30}
                />
                <Bar
                  dataKey="wordsReviewed"
                  name="রিভিশন (SRS Review)"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={30}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Day-by-day 7-Day Performance Strip */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            দিনভিত্তিক সারসংক্ষেপ (Day-by-Day Activity)
          </h3>
          <span className="text-xs text-slate-500">
            ৭ দিনে মোট আয়াত তিলাওয়াত: {toBnNum(totalAyahsPracticed)}টি
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {weeklyData.map((day) => {
            const minPct = Math.min(100, Math.round((day.minutesStudied / 20) * 100));
            return (
              <div
                key={day.dateStr}
                className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                  day.isToday
                    ? 'border-emerald-600 bg-emerald-50/80 shadow-xs'
                    : 'border-slate-200 bg-[#F8FAF9] hover:bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600">
                      {day.dayNameBn.slice(0, 4)}
                    </span>
                    {day.isToday && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-700 text-white">
                        আজ
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-bold text-slate-900 tabular-nums block mt-0.5">
                    {toBnNum(day.dayNumber)} {day.monthNameBn.slice(0, 3)}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[10px]">পড়ার সময়:</span>
                    <span className="font-bold text-emerald-950 tabular-nums text-[11px]">
                      {toBnNum(day.minutesStudied)} মি.
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        minPct >= 100 ? 'bg-emerald-600' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${minPct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500 text-[10px]">শব্দ:</span>
                    <span className="font-semibold text-teal-800 tabular-nums text-[11px]">
                      {toBnNum(day.totalWords)}টি
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Islamic Motivational Advice for Consistency */}
      <div className="p-4 md:p-5 rounded-2xl bg-gradient-to-r from-emerald-900 to-teal-950 text-white flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-emerald-300 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>ধারাবাহিকতার গুরুত্ব সম্পর্কে হাদিস শরীফ</span>
          </div>
          <p className="font-arabic text-emerald-100 text-lg md:text-xl" dir="rtl">
            «أَحَبُّ الأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ»
          </p>
          <p className="text-xs text-emerald-200/90 max-w-xl">
            "আল্লাহ তায়ালার নিকট সর্বাধিক প্রিয় আমল তা-ই, যা নিয়মিত করা হয়—যদিও তা পরিমাণে অল্প হয়।" (সহীহ বুখারী: ৬৪৬৪)
          </p>
        </div>

        {onNavigateTab && (
          <button
            type="button"
            onClick={() => onNavigateTab('words')}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-xs flex items-center gap-1.5 whitespace-nowrap shadow-sm transition-colors cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>আজকের শব্দ চর্চা শুরু করুন</span>
          </button>
        )}
      </div>
    </section>
  );
};

export { WeeklyInsightsSection as ProgressChart };

