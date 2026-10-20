import React, { useState, useMemo } from 'react';
import {
  Volume2,
  Search,
  BookOpen,
  RotateCcw,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Layers,
  Bookmark,
  HeartHandshake,
} from 'lucide-react';
import { HIGH_FREQUENCY_WORDS, WORD_CATEGORIES, QuranWord } from '../data/wordsData';
import { WordSRSState, getTodayStr } from '../utils/storage';
import { speakArabic, toBnNum } from '../utils/speech';

interface WordsViewProps {
  wordSRS: Record<number, WordSRSState>;
  dailyWordGoal: 5 | 8 | 10;
  onChangeDailyGoal: (goal: 5 | 8 | 10) => void;
  onRateWord: (wordId: number, rating: 'again' | 'good' | 'easy') => void;
  slowAudio: boolean;
  speakingText: string | null;
  largeFont: boolean;
  favoriteWordIds?: number[];
  onToggleFavoriteWord?: (wordId: number) => void;
  onNavigateTab?: (tab: 'alphabet' | 'words' | 'roots' | 'grammar' | 'messages' | 'plan' | 'quran' | 'favorites') => void;
}

export const WordsView: React.FC<WordsViewProps> = ({
  wordSRS,
  dailyWordGoal,
  onChangeDailyGoal,
  onRateWord,
  slowAudio,
  speakingText,
  largeFont,
  favoriteWordIds = [],
  onToggleFavoriteWord,
  onNavigateTab,
}) => {
  const [activeSubMode, setActiveSubMode] = useState<'daily_srs' | 'browse_300'>('daily_srs');
  const [selectedCategory, setSelectedCategory] = useState<string>('সব বিভাগ');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'review' | 'mastered'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 24;

  const today = getTodayStr();

  // Build daily study queue: due reviews + new words up to dailyWordGoal
  const dailyQueue = useMemo(() => {
    const dueReviews: QuranWord[] = [];
    const newWords: QuranWord[] = [];

    for (const w of HIGH_FREQUENCY_WORDS) {
      const srs = wordSRS[w.id];
      if (!srs) {
        newWords.push(w);
      } else if (srs.nextReviewDate <= today || srs.status === 'learning') {
        dueReviews.push(w);
      }
    }

    const combined = [...dueReviews, ...newWords.slice(0, dailyWordGoal)];
    return combined.length > 0 ? combined : HIGH_FREQUENCY_WORDS.slice(0, dailyWordGoal);
  }, [wordSRS, dailyWordGoal, today]);

  const [cardIndex, setCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(true);

  const activeCard = dailyQueue[Math.min(cardIndex, dailyQueue.length - 1)] || HIGH_FREQUENCY_WORDS[0];
  const activeCardSRS = wordSRS[activeCard.id];

  // Stats across all 300 words
  const stats = useMemo(() => {
    let mastered = 0;
    let review = 0;
    let dueToday = 0;
    Object.values(wordSRS).forEach((s) => {
      if (s.status === 'mastered') mastered += 1;
      else review += 1;
      if (s.nextReviewDate <= today) dueToday += 1;
    });
    return {
      total: HIGH_FREQUENCY_WORDS.length,
      mastered,
      review,
      dueToday,
      learnedTotal: mastered + review,
    };
  }, [wordSRS, today]);

  // Filtered words for 300-word browser
  const filteredWords = useMemo(() => {
    return HIGH_FREQUENCY_WORDS.filter((w) => {
      if (selectedCategory !== 'সব বিভাগ' && w.category !== selectedCategory) {
        return false;
      }
      const srs = wordSRS[w.id];
      if (statusFilter === 'new' && srs) return false;
      if (statusFilter === 'review' && (!srs || srs.status === 'mastered')) return false;
      if (statusFilter === 'mastered' && srs?.status !== 'mastered') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        return (
          w.arabic.includes(q) ||
          w.pronunciation.toLowerCase().includes(q) ||
          w.meaning.toLowerCase().includes(q) ||
          (w.root && w.root.includes(q))
        );
      }
      return true;
    });
  }, [selectedCategory, statusFilter, searchQuery, wordSRS]);

  const totalPages = Math.max(1, Math.ceil(filteredWords.length / ITEMS_PER_PAGE));
  const paginatedWords = filteredWords.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleRateAndAdvance = (rating: 'again' | 'good' | 'easy') => {
    onRateWord(activeCard.id, rating);
    if (cardIndex + 1 < dailyQueue.length) {
      setCardIndex((prev) => prev + 1);
    } else {
      setCardIndex(0);
    }
  };

  return (
    <div className="space-y-8">
      {/* Quick Navigation / Subject Switcher Strip */}
      {onNavigateTab && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 px-1 text-xs border-b border-slate-200">
          <span className="font-bold text-slate-500 shrink-0">শিক্ষা ও দিকনির্দেশনা:</span>
          <button
            type="button"
            onClick={() => onNavigateTab('alphabet')}
            className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium shrink-0 cursor-pointer"
          >
            বর্ণমালা
          </button>
          <span className="px-3 py-1.5 rounded-full bg-emerald-800 text-white font-bold shrink-0">
            ৩০০ শব্দ
          </span>
          <button
            type="button"
            onClick={() => onNavigateTab('roots')}
            className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium shrink-0 cursor-pointer"
          >
            শব্দমূল
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('grammar')}
            className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium shrink-0 cursor-pointer"
          >
            সহজ ব্যাকরণ
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('messages')}
            className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium shrink-0 cursor-pointer"
          >
            লেখকের বাণী
          </button>
        </div>
      )}

      {/* Header & Stats Summary */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-sm font-medium text-emerald-800 tabular-nums">
            ০২. উচ্চ-ফ্রিকোয়েন্সি শব্দভাণ্ডার · মোট {toBnNum(stats.total)}টি শব্দ · শেখা হয়েছে{' '}
            {toBnNum(stats.learnedTotal)}টি · আজ রিভিউ বাকি {toBnNum(stats.dueToday)}টি
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1 text-balance">
            কুরআনে সবচেয়ে বেশি ব্যবহৃত ৩০০টি শব্দ ও স্পেসড রিপিটিশন অনুশীলন
          </h1>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveSubMode('daily_srs')}
            className={`min-h-[44px] px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeSubMode === 'daily_srs'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>প্রতিদিনের শব্দ চর্চা (SRS)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubMode('browse_300')}
            className={`min-h-[44px] px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeSubMode === 'browse_300'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>সম্পূর্ণ ৩০০ শব্দের তালিকা</span>
          </button>
        </div>
      </div>

      {/* Sub-mode 1: Daily 5-10 Words + Spaced Repetition Flashcard Deck */}
      {activeSubMode === 'daily_srs' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left 8 cols: Interactive Flashcard Stage */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="text-xs text-slate-600 tabular-nums">
                <span>আজকের সেশন কার্ড {toBnNum(cardIndex + 1)} / {toBnNum(dailyQueue.length)}</span>
                <span aria-hidden="true" className="mx-2">·</span>
                <span>কুরআনে এসেছে {toBnNum(activeCard.frequency)} বার</span>
                {activeCard.root && (
                  <>
                    <span aria-hidden="true" className="mx-2">·</span>
                    <span>মূল: {activeCard.root}</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600">দৈনিক লক্ষ্য:</span>
                {([5, 8, 10] as const).map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => {
                      onChangeDailyGoal(goal);
                      setCardIndex(0);
                    }}
                    className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      dailyWordGoal === goal
                        ? 'bg-emerald-800 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {toBnNum(goal)}টি শব্দ
                  </button>
                ))}
              </div>
            </div>

            {/* Primary Word Display */}
            <div className="my-6 p-6 md:p-8 rounded-2xl bg-[#F4F8F6] border border-emerald-900/10 text-center relative">
              <div className="flex items-center justify-between text-xs font-medium text-emerald-800 mb-2">
                <span>
                  বিভাগ: {activeCard.category} · শব্দ নং {toBnNum(activeCard.id)}
                </span>
                {onToggleFavoriteWord && (
                  <button
                    type="button"
                    onClick={() => onToggleFavoriteWord(activeCard.id)}
                    title={
                      favoriteWordIds.includes(activeCard.id)
                        ? 'প্রিয় তালিকা থেকে সরান'
                        : 'প্রিয় তালিকায় যোগ করুন'
                    }
                    className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                      favoriteWordIds.includes(activeCard.id)
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-white/80 text-slate-600 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    <Bookmark
                      className={`w-3.5 h-3.5 ${
                        favoriteWordIds.includes(activeCard.id)
                          ? 'fill-amber-500 text-amber-500'
                          : 'text-slate-400'
                      }`}
                    />
                    <span>
                      {favoriteWordIds.includes(activeCard.id) ? 'বুকমার্ক করা' : 'বুকমার্ক'}
                    </span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => speakArabic(activeCard.arabic, slowAudio)}
                className="mx-auto group inline-flex flex-col items-center justify-center py-3 px-8 rounded-2xl hover:bg-white/80 transition-colors cursor-pointer"
              >
                <span
                  dir="rtl"
                  className={`font-arabic text-emerald-950 ${
                    largeFont ? 'text-7xl md:text-8xl' : 'text-6xl md:text-7xl'
                  }`}
                >
                  {activeCard.arabic}
                </span>
                <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800">
                  <Volume2 className="w-4 h-4" />
                  <span>
                    {speakingText === activeCard.arabic ? 'উচ্চারণ বাজছে...' : 'শব্দটির উচ্চারণ শুনুন'}
                  </span>
                </span>
              </button>

              <div className="mt-4 pt-4 border-t border-emerald-900/10">
                <p className="text-xl md:text-2xl font-bold text-slate-900">
                  উচ্চারণ: <span className="text-emerald-900">{activeCard.pronunciation}</span>
                </p>

                {showAnswer ? (
                  <div className="mt-3 space-y-4">
                    <p className="text-2xl md:text-3xl font-bold text-emerald-800">
                      অর্থ: {activeCard.meaning}
                    </p>

                    {/* Example Ayah Box */}
                    <div className="mt-5 p-5 rounded-xl bg-white border border-slate-200/90 text-right">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <button
                          type="button"
                          onClick={() => speakArabic(activeCard.ayahAr, slowAudio)}
                          className="min-h-[40px] px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
                        >
                          <Volume2 className="w-4 h-4" />
                          <span>আয়াতটি শুনুন</span>
                        </button>
                        <span className="text-xs font-medium text-slate-500">
                          উদাহরণ আয়াত · {activeCard.ayahRef}
                        </span>
                      </div>

                      <p
                        dir="rtl"
                        className={`font-arabic text-slate-900 mt-1 ${
                          largeFont ? 'text-4xl' : 'text-3xl md:text-4xl'
                        }`}
                      >
                        {activeCard.ayahAr}
                      </p>
                      <p className="text-left text-base font-semibold text-emerald-900 mt-3">
                        উচ্চারণ: {activeCard.ayahBnPronunciation}
                      </p>
                      <p className="text-left text-base text-slate-700 mt-1">
                        অর্থ: “{activeCard.ayahBnMeaning}”
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => setShowAnswer(true)}
                      className="min-h-[48px] px-6 py-2.5 bg-emerald-700 text-white font-semibold rounded-xl hover:bg-emerald-800 transition-colors"
                    >
                      অর্থ ও উদাহরণ আয়াত দেখুন
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Spaced Repetition SM-2 Rating Controls */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>স্পেসড রিপিটিশন মূল্যায়ন (শব্দটি আপনার কেমন মনে আছে?)</span>
                <button
                  type="button"
                  onClick={() => setShowAnswer((prev) => !prev)}
                  className="text-emerald-800 font-semibold hover:underline"
                >
                  {showAnswer ? 'অর্থ লুকিয়ে অনুশীলন করুন' : 'অর্থ সর্বদা দেখান'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleRateAndAdvance('again')}
                  className="min-h-[54px] p-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 font-semibold flex flex-col items-center justify-center transition-colors"
                >
                  <span className="text-base font-bold">কঠিন (আবার দেখব)</span>
                  <span className="text-xs text-amber-800">আজই পুনরায় আসবে</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRateAndAdvance('good')}
                  className="min-h-[54px] p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-950 font-semibold flex flex-col items-center justify-center transition-colors"
                >
                  <span className="text-base font-bold">ভালো (মনে আছে)</span>
                  <span className="text-xs text-emerald-800">
                    {activeCardSRS
                      ? `${toBnNum(Math.max(2, activeCardSRS.interval * 2))} দিন পর রিভিউ`
                      : '১ দিন পর রিভিউ'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRateAndAdvance('easy')}
                  className="min-h-[54px] p-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold flex flex-col items-center justify-center transition-colors"
                >
                  <span className="text-base font-bold">সহজ (আয়ত্ত হয়েছে)</span>
                  <span className="text-xs text-emerald-100">
                    {activeCardSRS
                      ? `${toBnNum(Math.max(4, Math.round(activeCardSRS.interval * 2.5)))} দিন পর রিভিউ`
                      : '৩ দিন পর রিভিউ'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Right 4 cols: Today's Word Deck Queue */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">
                আজকের নির্বাচিত শব্দমালা ({toBnNum(dailyQueue.length)}টি)
              </h2>
              <button
                type="button"
                onClick={() => setCardIndex(0)}
                className="text-xs font-semibold text-emerald-800 hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>শুরু থেকে</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto pr-1">
              {dailyQueue.map((word, idx) => {
                const srs = wordSRS[word.id];
                const isCurrent = idx === cardIndex;
                return (
                  <button
                    key={word.id}
                    type="button"
                    onClick={() => {
                      setCardIndex(idx);
                      speakArabic(word.arabic, slowAudio);
                    }}
                    className={`w-full min-h-[60px] py-3 px-3 text-left flex items-center justify-between gap-3 rounded-xl transition-colors ${
                      isCurrent ? 'bg-emerald-50/90' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-bold text-slate-400 tabular-nums w-5">
                        {toBnNum(idx + 1)}.
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {word.pronunciation} — {word.meaning}
                        </p>
                        <p className="text-xs text-slate-500">
                          {srs?.status === 'mastered'
                            ? '✓ আয়ত্ত হয়েছে'
                            : srs
                            ? `রিভিউ ব্যবধান: ${toBnNum(srs.interval)} দিন`
                            : 'নতুন শব্দ'}
                        </p>
                      </div>
                    </div>
                    <span className="font-arabic text-2xl text-emerald-950 shrink-0">
                      {word.arabic}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Sub-mode 2: Full 300 Words Browser & Filter */}
      {activeSubMode === 'browse_300' && (
        <div className="space-y-6">
          {/* Search & Category Controls */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="বাংলা উচ্চারণ, অর্থ বা আরবি শব্দ দিয়ে খুঁজুন (যেমন: রহমত, কিতাব, আল্লাহ)..."
                  className="w-full min-h-[48px] pl-11 pr-4 py-2.5 bg-[#F8FAF9] border border-slate-200 rounded-xl text-base text-slate-900 focus:outline-none focus:border-emerald-700"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start">
                {(
                  [
                    { id: 'all', label: `সব (${toBnNum(300)})` },
                    { id: 'new', label: 'নতুন' },
                    { id: 'review', label: 'চর্চায় আছে' },
                    { id: 'mastered', label: 'শেখা সম্পন্ন' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setStatusFilter(tab.id);
                      setCurrentPage(1);
                    }}
                    className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      statusFilter === tab.id
                        ? 'bg-white text-emerald-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Horizontal Selector */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {WORD_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat);
                    setCurrentPage(1);
                  }}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-emerald-800 text-white'
                      : 'bg-[#F8FAF9] text-slate-700 border border-slate-200 hover:border-emerald-400'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Words Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedWords.map((word) => {
              const srs = wordSRS[word.id];
              const isMastered = srs?.status === 'mastered';

              return (
                <div
                  key={word.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between hover:border-emerald-600 transition-colors"
                >
                  <div>
                    {/* Top Unboxed Metadata */}
                    <div className="flex items-center justify-between text-xs text-slate-500 tabular-nums mb-3">
                      <span>
                        #{toBnNum(word.id)} · {word.category} · {toBnNum(word.frequency)} বার
                      </span>
                      <div className="flex items-center gap-1.5">
                        {onToggleFavoriteWord && (
                          <button
                            type="button"
                            onClick={() => onToggleFavoriteWord(word.id)}
                            title={
                              favoriteWordIds.includes(word.id)
                                ? 'প্রিয় তালিকা থেকে সরান'
                                : 'প্রিয় তালিকায় যোগ করুন'
                            }
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              favoriteWordIds.includes(word.id)
                                ? 'bg-amber-50 border-amber-300 text-amber-700'
                                : 'border-slate-200 text-slate-400 hover:text-amber-600 hover:border-amber-300'
                            }`}
                          >
                            <Bookmark
                              className={`w-3.5 h-3.5 ${
                                favoriteWordIds.includes(word.id)
                                  ? 'fill-amber-500 text-amber-500'
                                  : ''
                              }`}
                            />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onRateWord(word.id, isMastered ? 'good' : 'easy')}
                          className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                            isMastered
                              ? 'bg-emerald-50 text-emerald-800'
                              : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isMastered ? 'আয়ত্ত হয়েছে' : 'চিহ্নিত করুন'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Word & Audio Button */}
                    <div className="flex items-center justify-between gap-4 my-2">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{word.meaning}</h3>
                        <p className="text-base font-medium text-emerald-800 mt-0.5">
                          উচ্চারণ: {word.pronunciation}
                        </p>
                        {word.root && (
                          <p className="text-xs text-slate-500 mt-0.5">শব্দের মূল: {word.root}</p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => speakArabic(word.arabic, slowAudio)}
                        className="min-w-[88px] min-h-[76px] px-4 py-2 rounded-2xl bg-[#F4F8F6] hover:bg-emerald-100/70 text-emerald-950 flex flex-col items-center justify-center transition-colors shrink-0"
                        title="উচ্চারণ শুনুন"
                      >
                        <span
                          dir="rtl"
                          className={`font-arabic ${largeFont ? 'text-4xl' : 'text-3xl'}`}
                        >
                          {word.arabic}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 mt-1">
                          <Volume2 className="w-3 h-3" />
                          <span>শুনুন</span>
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Example Ayah Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-500">{word.ayahRef}</span>
                      <button
                        type="button"
                        onClick={() => speakArabic(word.ayahAr, slowAudio)}
                        className="text-xs font-semibold text-emerald-800 hover:underline inline-flex items-center gap-1"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>আয়াত শুনুন</span>
                      </button>
                    </div>
                    <p
                      dir="rtl"
                      className="font-arabic text-2xl text-slate-900 text-right mt-1"
                    >
                      {word.ayahAr}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      <span className="font-semibold text-slate-800">
                        {word.ayahBnPronunciation}:
                      </span>{' '}
                      {word.ayahBnMeaning}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200 px-5 py-4">
              <span className="text-sm text-slate-600 tabular-nums">
                পৃষ্ঠা {toBnNum(currentPage)} / {toBnNum(totalPages)} (মোট{' '}
                {toBnNum(filteredWords.length)}টি শব্দ)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>আগের পৃষ্ঠা</span>
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-800 text-white text-sm font-semibold hover:bg-emerald-900 disabled:opacity-40 flex items-center gap-1"
                >
                  <span>পরের পৃষ্ঠা</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
