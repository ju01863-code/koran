import React, { useState, useMemo } from 'react';
import {
  Bookmark,
  Volume2,
  Trash2,
  BookOpen,
  Search,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Layers,
  BookMarked,
  HelpCircle,
} from 'lucide-react';
import { PRACTICE_SURAHS, SurahData, SurahAyah } from '../data/surahData';
import { HIGH_FREQUENCY_WORDS, QuranWord } from '../data/wordsData';
import { speakArabic, toBnNum } from '../utils/speech';
import { getSurahSync } from '../services/quranService';

interface FavoritesViewProps {
  favoriteAyahKeys: string[];
  favoriteWordIds: number[];
  onToggleFavoriteAyah: (ayahKey: string) => void;
  onToggleFavoriteWord: (wordId: number) => void;
  slowAudio: boolean;
  speakingText: string | null;
  largeFont: boolean;
  onNavigateTab: (tab: 'alphabet' | 'words' | 'roots' | 'grammar' | 'plan' | 'quran') => void;
  onSelectSurahForPractice?: (surahNumber: number) => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  favoriteAyahKeys,
  favoriteWordIds,
  onToggleFavoriteAyah,
  onToggleFavoriteWord,
  slowAudio,
  speakingText,
  largeFont,
  onNavigateTab,
  onSelectSurahForPractice,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'ayahs' | 'words' | 'review'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedAyahKey, setExpandedAyahKey] = useState<string | null>(null);

  // Review / Flashcard mode state
  const [reviewIndex, setReviewIndex] = useState(0);
  const [isMeaningRevealed, setIsMeaningRevealed] = useState(false);

  // Resolve Ayahs
  const resolvedAyahs = useMemo(() => {
    return favoriteAyahKeys
      .map((key) => {
        const [sNumStr, aNumStr] = key.split(':');
        const sNum = Number(sNumStr);
        const aNum = Number(aNumStr);
        const surah = PRACTICE_SURAHS.find((s) => s.surahNumber === sNum) || getSurahSync(sNum);
        const ayah = surah?.ayahs.find((a) => a.ayahNumber === aNum);
        if (surah && ayah) {
          return { key, surah, ayah };
        }
        return null;
      })
      .filter((item): item is { key: string; surah: SurahData; ayah: SurahAyah } => Boolean(item));
  }, [favoriteAyahKeys]);

  // Resolve Words
  const resolvedWords = useMemo(() => {
    return favoriteWordIds
      .map((id) => HIGH_FREQUENCY_WORDS.find((w) => w.id === id))
      .filter((w): w is QuranWord => Boolean(w));
  }, [favoriteWordIds]);

  // Filtered Ayahs by search
  const filteredAyahs = useMemo(() => {
    if (!searchQuery.trim()) return resolvedAyahs;
    const q = searchQuery.toLowerCase().trim();
    return resolvedAyahs.filter(({ surah, ayah }) => {
      return (
        surah.nameBn.toLowerCase().includes(q) ||
        surah.meaningBn.toLowerCase().includes(q) ||
        ayah.fullAr.includes(q) ||
        ayah.fullBnPronunciation.toLowerCase().includes(q) ||
        ayah.fullBnMeaning.toLowerCase().includes(q)
      );
    });
  }, [resolvedAyahs, searchQuery]);

  // Filtered Words by search
  const filteredWords = useMemo(() => {
    if (!searchQuery.trim()) return resolvedWords;
    const q = searchQuery.toLowerCase().trim();
    return resolvedWords.filter((w) => {
      return (
        w.arabic.includes(q) ||
        w.pronunciation.toLowerCase().includes(q) ||
        w.meaning.toLowerCase().includes(q) ||
        w.category.toLowerCase().includes(q)
      );
    });
  }, [resolvedWords, searchQuery]);

  // Unified items list for Review / Quiz mode
  const reviewItems = useMemo(() => {
    const list: Array<
      | { type: 'ayah'; data: { key: string; surah: SurahData; ayah: SurahAyah } }
      | { type: 'word'; data: QuranWord }
    > = [];
    resolvedAyahs.forEach((item) => list.push({ type: 'ayah', data: item }));
    resolvedWords.forEach((word) => list.push({ type: 'word', data: word }));
    return list;
  }, [resolvedAyahs, resolvedWords]);

  const currentReviewItem = reviewItems[reviewIndex % Math.max(1, reviewItems.length)];

  const totalFavoritesCount = favoriteAyahKeys.length + favoriteWordIds.length;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-950 to-teal-950 text-white rounded-3xl p-6 md:p-8 shadow-sm border border-emerald-800/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <Bookmark className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>বুকমার্ক ও সংরক্ষিত সংগ্রহ (My Favorites)</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">আমার প্রিয় আয়াত ও শব্দমালা</h1>
            <p className="text-sm text-emerald-100/90 leading-relaxed">
              আপনার সংরক্ষিত আয়াত ও গুরুত্বপূর্ণ শব্দসমূহ এখানে সুরক্ষিত রাখা হয়েছে। যখন ইচ্ছা ট্যাপ করে উচ্চারণ শুনুন, শব্দে শব্দে অর্থ পর্যালোচনা করুন বা রিভিশন মোডে যাচাই করুন।
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="px-3 py-1 rounded-xl bg-emerald-800/80 text-emerald-200 text-xs font-semibold tabular-nums border border-emerald-700/60">
                মোট সংরক্ষিত: {toBnNum(totalFavoritesCount)}টি
              </span>
              <span className="px-3 py-1 rounded-xl bg-emerald-800/80 text-emerald-200 text-xs font-semibold tabular-nums border border-emerald-700/60">
                আয়াত: {toBnNum(favoriteAyahKeys.length)}টি
              </span>
              <span className="px-3 py-1 rounded-xl bg-emerald-800/80 text-emerald-200 text-xs font-semibold tabular-nums border border-emerald-700/60">
                শব্দ: {toBnNum(favoriteWordIds.length)}টি
              </span>
            </div>
          </div>

          {/* Quick Review Mode Trigger */}
          {totalFavoritesCount > 0 && (
            <div className="shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('review');
                  setIsMeaningRevealed(false);
                }}
                className="w-full sm:w-auto min-h-[48px] px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-950" />
                <span>দ্রুত রিভিশন শুরু করুন</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-emerald-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            সকল প্রিয় ({toBnNum(totalFavoritesCount)})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ayahs')}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ayahs'
                ? 'bg-emerald-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            সংরক্ষিত আয়াত ({toBnNum(favoriteAyahKeys.length)})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('words')}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'words'
                ? 'bg-emerald-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            সংরক্ষিত শব্দ ({toBnNum(favoriteWordIds.length)})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('review');
              setIsMeaningRevealed(false);
            }}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'review'
                ? 'bg-amber-500 text-emerald-950 shadow-xs'
                : 'bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>ফ্ল্যাশকার্ড রিভিশন</span>
          </button>
        </div>

        {/* Search Bar */}
        {activeTab !== 'review' && (
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="প্রিয় সংগ্রহ খুঁজুন..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        )}
      </div>

      {/* Empty State */}
      {totalFavoritesCount === 0 && (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Bookmark className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900">এখনও কোনো প্রিয় আইটেম যোগ করা হয়নি</h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              কুরআন পড়ার সময় যেকোনো আয়াতের পাশের বুকমার্ক আইকন অথবা ৩০০ শব্দের কার্ডের বুকমার্কে ট্যাপ করে এখানে সংরক্ষণ করতে পারেন।
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigateTab('quran')}
              className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              কুরআন চর্চায় যান
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('words')}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
            >
              ৩০০ শব্দভাণ্ডার দেখুন
            </button>
          </div>
        </div>
      )}

      {/* Review / Flashcard Mode */}
      {activeTab === 'review' && totalFavoritesCount > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-10 max-w-3xl mx-auto space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                কুইক রিভিশন মোড
              </span>
              <span className="text-xs text-slate-500 font-semibold tabular-nums">
                কার্ড {toBnNum(reviewIndex + 1)} / {toBnNum(reviewItems.length)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              রিভিশন শেষ করুন ✕
            </button>
          </div>

          {currentReviewItem && currentReviewItem.type === 'ayah' && (
            <div className="space-y-6 text-center py-4">
              <div className="space-y-1">
                <span className="text-xs text-emerald-800 font-bold px-3 py-1 rounded-full bg-emerald-50 inline-block">
                  {currentReviewItem.data.surah.nameBn} · আয়াত {toBnNum(currentReviewItem.data.ayah.ayahNumber)}
                </span>
                <p className="text-xs text-slate-500">
                  আরবি তিলাওয়াত শুনুন এবং মনে মনে বাংলা অর্থ স্মরণ করার চেষ্টা করুন।
                </p>
              </div>

              {/* Arabic Text */}
              <div className="p-6 rounded-2xl bg-[#F4F8F6] border border-emerald-900/10 space-y-4">
                <p
                  dir="rtl"
                  className={`font-arabic text-emerald-950 leading-relaxed ${
                    largeFont ? 'text-4xl md:text-5xl' : 'text-3xl md:text-4xl'
                  }`}
                >
                  {currentReviewItem.data.ayah.fullAr}
                </p>

                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => speakArabic(currentReviewItem.data.ayah.fullAr, slowAudio)}
                    className="min-h-[42px] px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>তিলাওয়াত শুনুন</span>
                  </button>
                </div>
              </div>

              {/* Meaning Reveal Container */}
              {isMeaningRevealed ? (
                <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-left space-y-2 animate-in fade-in duration-200">
                  <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                    উচ্চারণ ও পূর্ণ অর্থ:
                  </p>
                  <p className="text-sm font-semibold text-emerald-950">
                    উচ্চারণ: {currentReviewItem.data.ayah.fullBnPronunciation}
                  </p>
                  <p className="text-base font-bold text-slate-900">
                    অর্থ: “{currentReviewItem.data.ayah.fullBnMeaning}”
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsMeaningRevealed(true)}
                  className="min-h-[48px] px-6 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 mx-auto transition-colors cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>বাংলা অর্থ প্রকাশ করুন</span>
                </button>
              )}
            </div>
          )}

          {currentReviewItem && currentReviewItem.type === 'word' && (
            <div className="space-y-6 text-center py-4">
              <div className="space-y-1">
                <span className="text-xs text-emerald-800 font-bold px-3 py-1 rounded-full bg-emerald-50 inline-block">
                  কুরআনের শব্দ · {currentReviewItem.data.category}
                </span>
                <p className="text-xs text-slate-500">
                  কুরআনে এই শব্দটি {toBnNum(currentReviewItem.data.frequency)} বার এসেছে
                </p>
              </div>

              {/* Arabic Word */}
              <div className="p-8 rounded-2xl bg-[#F4F8F6] border border-emerald-900/10 space-y-4">
                <span
                  className={`font-arabic text-emerald-950 block ${
                    largeFont ? 'text-5xl md:text-6xl' : 'text-4xl md:text-5xl'
                  }`}
                >
                  {currentReviewItem.data.arabic}
                </span>

                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => speakArabic(currentReviewItem.data.arabic, slowAudio)}
                    className="min-h-[42px] px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>উচ্চারণ শুনুন</span>
                  </button>
                </div>
              </div>

              {/* Meaning Reveal Container */}
              {isMeaningRevealed ? (
                <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-left space-y-2 animate-in fade-in duration-200">
                  <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                    উচ্চারণ ও অর্থ:
                  </p>
                  <p className="text-sm font-semibold text-emerald-950">
                    উচ্চারণ: {currentReviewItem.data.pronunciation}
                  </p>
                  <p className="text-lg font-bold text-slate-900">
                    অর্থ: {currentReviewItem.data.meaning}
                  </p>
                  <div className="pt-2 border-t border-emerald-200/80 text-xs text-slate-700">
                    <span className="font-bold">উদাহরণ আয়াত:</span>{' '}
                    <span dir="rtl" className="font-arabic font-bold text-sm mx-1">
                      {currentReviewItem.data.ayahAr}
                    </span>{' '}
                    — “{currentReviewItem.data.ayahBnMeaning}”
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsMeaningRevealed(true)}
                  className="min-h-[48px] px-6 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 mx-auto transition-colors cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>অর্থ ও উদাহরণ দেখুন</span>
                </button>
              )}
            </div>
          )}

          {/* Flashcard Next/Previous Controls */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <button
              type="button"
              disabled={reviewIndex === 0}
              onClick={() => {
                setReviewIndex((prev) => Math.max(0, prev - 1));
                setIsMeaningRevealed(false);
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              ← আগেরটি
            </button>

            <button
              type="button"
              onClick={() => setIsMeaningRevealed((p) => !p)}
              className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer"
            >
              {isMeaningRevealed ? 'অর্থ লুকান' : 'অর্থ দেখান'}
            </button>

            <button
              type="button"
              onClick={() => {
                setReviewIndex((prev) => (prev + 1) % reviewItems.length);
                setIsMeaningRevealed(false);
              }}
              className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              পরবর্তী কার্ড →
            </button>
          </div>
        </div>
      )}

      {/* Bookmarked Ayahs List */}
      {(activeTab === 'all' || activeTab === 'ayahs') && filteredAyahs.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-emerald-800" />
              <span>সংরক্ষিত আয়াতসমূহ ({toBnNum(filteredAyahs.length)}টি)</span>
            </h2>
          </div>

          <div className="space-y-4">
            {filteredAyahs.map(({ key, surah, ayah }) => {
              const isExpanded = expandedAyahKey === key;

              return (
                <div
                  key={key}
                  className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 space-y-4 shadow-2xs hover:border-emerald-300 transition-all"
                >
                  {/* Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-xl bg-emerald-800 text-white font-bold text-xs flex items-center justify-center tabular-nums">
                        {toBnNum(ayah.ayahNumber)}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">
                            {surah.nameBn} ({surah.nameAr})
                          </span>
                          <span className="text-xs text-slate-500">
                            · আয়াত {toBnNum(ayah.ayahNumber)}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">{surah.meaningBn}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => speakArabic(ayah.fullAr, slowAudio)}
                        className="min-h-[36px] px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-emerald-800" />
                        <span>শুনুন</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectSurahForPractice) {
                            onSelectSurahForPractice(surah.surahNumber);
                          }
                          onNavigateTab('quran');
                        }}
                        className="min-h-[36px] px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>কুরআন পেজে খুলুন</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleFavoriteAyah(key)}
                        title="প্রিয় তালিকা থেকে মুছুন"
                        className="w-9 h-9 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Full Ayah Text */}
                  <div className="p-4 rounded-xl bg-[#F4F8F6] border border-emerald-900/10 space-y-2">
                    <p
                      dir="rtl"
                      className={`font-arabic text-emerald-950 text-right leading-relaxed ${
                        largeFont ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl'
                      }`}
                    >
                      {ayah.fullAr}
                    </p>

                    <p className="text-sm font-semibold text-emerald-900 pt-2 border-t border-slate-200/60">
                      উচ্চারণ: {ayah.fullBnPronunciation}
                    </p>

                    <p className="text-sm md:text-base font-bold text-slate-900">
                      অর্থ: “{ayah.fullBnMeaning}”
                    </p>
                  </div>

                  {/* Word by word breakdown accordion */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setExpandedAyahKey(isExpanded ? null : key)}
                      className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" />
                          <span>শব্দে শব্দে অর্থ লুকান</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" />
                          <span>শব্দে শব্দে অর্থ ও উচ্চারণ দেখুন ({toBnNum(ayah.words.length)}টি শব্দ)</span>
                        </>
                      )}
                    </button>

                    {isExpanded && (
                      <div
                        dir="rtl"
                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 mt-3 pt-3 border-t border-slate-100"
                      >
                        {ayah.words.map((word, wIdx) => (
                          <button
                            key={wIdx}
                            type="button"
                            onClick={() => speakArabic(word.ar, slowAudio)}
                            className="p-3 rounded-xl border border-slate-200 bg-[#F8FAF9] hover:bg-emerald-50 text-center flex flex-col items-center justify-between min-h-[120px] transition-all cursor-pointer"
                          >
                            <span className="text-[10px] text-slate-400 w-full text-right" dir="ltr">
                              শব্দ {toBnNum(wIdx + 1)}
                            </span>
                            <span className="font-arabic text-2xl text-emerald-950 my-1">{word.ar}</span>
                            <div dir="ltr" className="w-full space-y-0.5">
                              <p className="text-xs font-bold text-emerald-800">{word.bnPronunciation}</p>
                              <p className="text-xs font-bold text-slate-800">{word.bnMeaning}</p>
                              {word.grammarNote && (
                                <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                                  {word.grammarNote}
                                </p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bookmarked Words List */}
      {(activeTab === 'all' || activeTab === 'words') && filteredWords.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-800" />
              <span>সংরক্ষিত শব্দমালা ({toBnNum(filteredWords.length)}টি)</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWords.map((word) => (
              <div
                key={word.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-2xs hover:border-emerald-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
                    <span className="font-semibold text-emerald-800 px-2.5 py-0.5 rounded-full bg-emerald-50">
                      {word.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => onToggleFavoriteWord(word.id)}
                      title="প্রিয় তালিকা থেকে সরান"
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Word Content */}
                  <div className="text-center py-3 space-y-1">
                    <button
                      type="button"
                      onClick={() => speakArabic(word.arabic, slowAudio)}
                      className="inline-flex items-center gap-2 group cursor-pointer"
                    >
                      <span className="font-arabic text-4xl text-emerald-950 group-hover:text-emerald-800 transition-colors">
                        {word.arabic}
                      </span>
                      <Volume2 className="w-4 h-4 text-emerald-700 opacity-70 group-hover:opacity-100" />
                    </button>
                    <p className="text-sm font-bold text-emerald-800">{word.pronunciation}</p>
                    <p className="text-base font-bold text-slate-900">{word.meaning}</p>
                  </div>

                  {/* Ayah Example */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700">কুরআনে উদাহরণ:</span>
                      <button
                        type="button"
                        onClick={() => speakArabic(word.ayahAr, slowAudio)}
                        className="text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>শুনুন</span>
                      </button>
                    </div>
                    <p dir="rtl" className="font-arabic text-emerald-950 font-bold text-sm text-right">
                      {word.ayahAr}
                    </p>
                    <p className="text-slate-600 italic">“{word.ayahBnMeaning}”</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>কুরআনে ব্যবহার: {toBnNum(word.frequency)} বার</span>
                  <span className="text-emerald-800 font-semibold">শব্দ ক্রমিক #{toBnNum(word.id)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Search Results */}
      {searchQuery && filteredAyahs.length === 0 && filteredWords.length === 0 && (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
          <p className="text-sm text-slate-500">
            "{searchQuery}" দিয়ে কোনো প্রিয় আয়াত বা শব্দ পাওয়া যায়নি।
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="mt-2 text-xs font-bold text-emerald-800 hover:underline cursor-pointer"
          >
            সার্চ রিসেট করুন
          </button>
        </div>
      )}
    </div>
  );
};
