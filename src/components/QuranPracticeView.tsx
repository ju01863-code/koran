import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  Volume2,
  CheckCircle2,
  Play,
  Square,
  Eye,
  EyeOff,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Sparkles,
  Award,
  ExternalLink,
  Bookmark,
  Download,
  Loader2,
  RefreshCw,
  SlidersHorizontal,
  Flame,
  Check,
  HeartHandshake,
  PenTool,
} from 'lucide-react';
import { PRACTICE_SURAHS, SurahData, SurahAyah } from '../data/surahData';
import { ALL_114_SURAHS, SurahMetadata, OFFLINE_CURATED_NUMBERS } from '../data/allSurahsMetadata';
import { HIGH_FREQUENCY_WORDS, QuranWord } from '../data/wordsData';
import { speakArabic, stopSpeaking, toBnNum } from '../utils/speech';
import { loadSurah, getSurahSync, isSurahCached, getSurahMetadata } from '../services/quranService';

interface QuranPracticeViewProps {
  practicedAyahKeys: string[];
  onToggleAyahPracticed: (key: string) => void;
  slowAudio: boolean;
  speakingText: string | null;
  largeFont: boolean;
  favoriteAyahKeys?: string[];
  onToggleFavoriteAyah?: (key: string) => void;
  favoriteWordIds?: number[];
  onToggleFavoriteWord?: (wordId: number) => void;
  onNavigateTab?: (tab: string) => void;
  initialSurahNumber?: number | null;
}

type SurahFilterCategory = 'all' | 'curated' | 'juz_amma' | 'popular' | 'makki' | 'madani';

// Popular and high-virtue Surahs commonly recited
const POPULAR_SURAH_NUMBERS = [1, 2, 18, 36, 55, 56, 67, 78, 112, 113, 114, 108, 103];

// Amma Para / Juz 30 Surahs (78 to 114)
const JUZ_AMMA_NUMBERS = Array.from({ length: 37 }, (_, i) => 78 + i);

export const QuranPracticeView: React.FC<QuranPracticeViewProps> = ({
  practicedAyahKeys,
  onToggleAyahPracticed,
  slowAudio,
  speakingText,
  largeFont,
  favoriteAyahKeys = [],
  onToggleFavoriteAyah,
  favoriteWordIds = [],
  onToggleFavoriteWord,
  onNavigateTab,
  initialSurahNumber,
}) => {
  // Currently selected Surah number (1 to 114)
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(() => {
    if (initialSurahNumber && initialSurahNumber >= 1 && initialSurahNumber <= 114) {
      return initialSurahNumber;
    }
    return 1; // Default: Surah Al-Fatihah
  });

  // Surah full content data (loaded sync or async)
  const [currentSurahData, setCurrentSurahData] = useState<SurahData>(() => {
    const syncData = getSurahSync(selectedSurahNumber);
    if (syncData) return syncData;
    return PRACTICE_SURAHS[0];
  });

  const [isLoadingSurah, setIsLoadingSurah] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [offlineSavedNotice, setOfflineSavedNotice] = useState<boolean>(false);

  // Pagination for long Surahs (e.g. Al-Baqarah has 286 ayahs)
  const [visibleAyahsCount, setVisibleAyahsCount] = useState<number>(30);
  const [jumpAyahInput, setJumpAyahInput] = useState<string>('');

  // Display toggles
  const [showPronunciation, setShowPronunciation] = useState<boolean>(true);
  const [showGrammarNotes, setShowGrammarNotes] = useState<boolean>(true);
  const [autoPlayingAyahKey, setAutoPlayingAyahKey] = useState<string | null>(null);
  const [activeWordHighlight, setActiveWordHighlight] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<SurahFilterCategory>('all');

  // Suggested Short Surahs carousel
  const [expandedSuggestedSurahId, setExpandedSuggestedSurahId] = useState<number | null>(null);
  const suggestedScrollRef = useRef<HTMLDivElement>(null);
  const autoPlayCancelledRef = useRef<boolean>(false);
  const ayahListTopRef = useRef<HTMLDivElement>(null);

  // Synchronize when initialSurahNumber changes externally
  useEffect(() => {
    if (initialSurahNumber && initialSurahNumber >= 1 && initialSurahNumber <= 114) {
      setSelectedSurahNumber(initialSurahNumber);
    }
  }, [initialSurahNumber]);

  // Load surah whenever selectedSurahNumber changes
  const fetchAndSetSurah = useCallback(async (surahNum: number) => {
    stopAutoPlay();
    setLoadError(null);
    setVisibleAyahsCount(30);

    // Try synchronous cache first
    const syncData = getSurahSync(surahNum);
    if (syncData) {
      setCurrentSurahData(syncData);
      setIsLoadingSurah(false);
      return;
    }

    // Otherwise fetch asynchronously
    setIsLoadingSurah(true);
    try {
      const data = await loadSurah(surahNum);
      setCurrentSurahData(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'অনাকাঙ্ক্ষিত ত্রুটি ঘটেছে';
      setLoadError(msg);
    } finally {
      setIsLoadingSurah(false);
    }
  }, []);

  useEffect(() => {
    fetchAndSetSurah(selectedSurahNumber);
  }, [selectedSurahNumber, fetchAndSetSurah]);

  // Fast normalized Arabic map for matching vocabulary words
  const arabicToWordMap = useMemo(() => {
    const map = new Map<string, QuranWord>();
    const normalize = (txt: string) =>
      txt.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0610-\u061A]/g, '').trim();
    HIGH_FREQUENCY_WORDS.forEach((w) => {
      map.set(w.arabic, w);
      const norm = normalize(w.arabic);
      if (!map.has(norm)) {
        map.set(norm, w);
      }
    });
    return map;
  }, []);

  const findMatchingQuranWord = (ar: string): QuranWord | undefined => {
    if (arabicToWordMap.has(ar)) return arabicToWordMap.get(ar);
    const norm = ar.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0610-\u061A]/g, '').trim();
    return arabicToWordMap.get(norm);
  };

  const stopAutoPlay = () => {
    autoPlayCancelledRef.current = true;
    stopSpeaking();
    setAutoPlayingAyahKey(null);
    setActiveWordHighlight(null);
  };

  const startWordByWordAutoPlay = (surahNum: number, ayah: SurahAyah) => {
    const key = `${surahNum}:${ayah.ayahNumber}`;
    if (autoPlayingAyahKey === key) {
      stopAutoPlay();
      return;
    }

    autoPlayCancelledRef.current = false;
    setAutoPlayingAyahKey(key);

    const playNextWord = (idx: number) => {
      if (autoPlayCancelledRef.current || idx >= ayah.words.length) {
        setAutoPlayingAyahKey(null);
        setActiveWordHighlight(null);
        return;
      }
      const word = ayah.words[idx];
      const highlightKey = `${key}:${idx}`;
      setActiveWordHighlight(highlightKey);

      speakArabic(word.ar, slowAudio, () => {
        if (!autoPlayCancelledRef.current) {
          setTimeout(() => playNextWord(idx + 1), 320);
        }
      });
    };

    playNextWord(0);
  };

  // Filtered 114 Surahs for selector and search
  const filteredSurahs = useMemo(() => {
    return ALL_114_SURAHS.filter((meta) => {
      // Category filter
      if (activeCategory === 'curated' && !OFFLINE_CURATED_NUMBERS.includes(meta.surahNumber)) {
        return false;
      }
      if (activeCategory === 'juz_amma' && !JUZ_AMMA_NUMBERS.includes(meta.surahNumber)) {
        return false;
      }
      if (activeCategory === 'popular' && !POPULAR_SURAH_NUMBERS.includes(meta.surahNumber)) {
        return false;
      }
      if (activeCategory === 'makki' && meta.revelationTypeBn !== 'মাক্কী') {
        return false;
      }
      if (activeCategory === 'madani' && meta.revelationTypeBn !== 'মাদানী') {
        return false;
      }

      // Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const numStr = String(meta.surahNumber);
      const bnNumStr = toBnNum(meta.surahNumber);

      const numMatch = numStr.includes(q) || bnNumStr.includes(q);
      const nameBnMatch = meta.nameBn.toLowerCase().includes(q);
      const nameArMatch = meta.nameAr.includes(q);
      const enMatch = meta.englishName.toLowerCase().includes(q);
      const meaningMatch = meta.meaningBn.toLowerCase().includes(q);

      return numMatch || nameBnMatch || nameArMatch || enMatch || meaningMatch;
    });
  }, [searchQuery, activeCategory]);

  // Suggested short surahs carousel
  const suggestedSurahNumbers = [105, 106, 107, 108, 103, 112, 113, 114];
  const suggestedSurahs = useMemo(() => {
    return suggestedSurahNumbers
      .map((num) => PRACTICE_SURAHS.find((s) => s.surahNumber === num))
      .filter((s): s is SurahData => Boolean(s));
  }, []);

  const scrollSuggested = (direction: 'left' | 'right') => {
    if (suggestedScrollRef.current) {
      const offset = direction === 'left' ? -320 : 320;
      suggestedScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Navigation handlers
  const handleSelectSurah = (surahNumber: number) => {
    setSelectedSurahNumber(surahNumber);
    setOfflineSavedNotice(false);
  };

  const handlePrevSurah = () => {
    if (selectedSurahNumber > 1) {
      handleSelectSurah(selectedSurahNumber - 1);
    }
  };

  const handleNextSurah = () => {
    if (selectedSurahNumber < 114) {
      handleSelectSurah(selectedSurahNumber + 1);
    }
  };

  // Jump to specific Ayah
  const handleJumpToAyah = (e: React.FormEvent) => {
    e.preventDefault();
    const ayahNum = parseInt(jumpAyahInput.replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d))), 10);
    if (!isNaN(ayahNum) && ayahNum >= 1 && ayahNum <= currentSurahData.ayahCount) {
      if (ayahNum > visibleAyahsCount) {
        setVisibleAyahsCount(Math.min(currentSurahData.ayahCount, ayahNum + 15));
      }
      setTimeout(() => {
        const el = document.getElementById(`ayah-${selectedSurahNumber}-${ayahNum}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      setJumpAyahInput('');
    }
  };

  // Save Surah explicitly to offline storage
  const handleSaveForOffline = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`quran_surah_v2_${selectedSurahNumber}`, JSON.stringify(currentSurahData));
        setOfflineSavedNotice(true);
        setTimeout(() => setOfflineSavedNotice(false), 3000);
      } catch {
        // storage quota fallback
      }
    }
  };

  // Current metadata
  const currentMeta = useMemo(() => {
    return getSurahMetadata(selectedSurahNumber);
  }, [selectedSurahNumber]);

  const isCurrentOfflineReady = useMemo(() => {
    return isSurahCached(selectedSurahNumber);
  }, [selectedSurahNumber]);

  // Completed ayahs in current surah
  const completedAyahsInCurrentSurah = useMemo(() => {
    return currentSurahData.ayahs.filter((a) =>
      practicedAyahKeys.includes(`${selectedSurahNumber}:${a.ayahNumber}`)
    ).length;
  }, [currentSurahData, selectedSurahNumber, practicedAyahKeys]);

  const isCurrentSurahFullyCompleted =
    currentSurahData.ayahCount > 0 &&
    completedAyahsInCurrentSurah === currentSurahData.ayahCount;

  // Fully practiced surahs count across all 114
  const fullyPracticedSurahsCount = useMemo(() => {
    return ALL_114_SURAHS.filter((meta) => {
      // Quick check if all ayahs are in practicedAyahKeys
      const surahCached = getSurahSync(meta.surahNumber);
      if (!surahCached) return false;
      return (
        surahCached.ayahs.length > 0 &&
        surahCached.ayahs.every((a) => practicedAyahKeys.includes(`${meta.surahNumber}:${a.ayahNumber}`))
      );
    }).length;
  }, [practicedAyahKeys]);

  const visibleAyahs = useMemo(() => {
    return currentSurahData.ayahs.slice(0, visibleAyahsCount);
  }, [currentSurahData.ayahs, visibleAyahsCount]);

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
          <button
            type="button"
            onClick={() => onNavigateTab('words')}
            className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium shrink-0 cursor-pointer"
          >
            ৩০০ শব্দ
          </button>
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
          <span className="px-3 py-1.5 rounded-full bg-emerald-800 text-white font-bold shrink-0">
            কুরআন চর্চা
          </span>
          <button
            type="button"
            onClick={() => onNavigateTab('plan')}
            className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium shrink-0 cursor-pointer"
          >
            ২০ মিনিট প্ল্যান
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-emerald-800">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-xs">
              ০৬. পবিত্র কুরআন চর্চা ও তিলাওয়াত
            </span>
            <span>·</span>
            <span className="font-bold text-emerald-950">সম্পূর্ণ ১১৪টি সূরা সমৃদ্ধ</span>
            <span>·</span>
            <span>অনুশীলন হয়েছে {toBnNum(practicedAyahKeys.length)}টি আয়াত</span>
            {fullyPracticedSurahsCount > 0 && (
              <>
                <span>·</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 inline" /> {toBnNum(fullyPracticedSurahsCount)}টি সূরা সম্পূর্ণ
                </span>
              </>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1 text-balance">
            পবিত্র কুরআনের ১১৪টি সূরার অর্থ, আরবি পাঠ ও বিশুদ্ধ উচ্চারণ
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            সূরা আল-ফাতিহা থেকে সূরা আন-নাস পর্যন্ত যেকোনো সূরা নির্বাচন করুন, শব্দে শব্দে পাঠ শুনুন এবং অনুবাদসহ অনুশীলন করুন।
          </p>
        </div>

        {/* Display Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPronunciation((p) => !p)}
            className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors whitespace-nowrap cursor-pointer ${
              showPronunciation
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-xs'
                : 'bg-white border-slate-200 text-slate-600'
            }`}
          >
            {showPronunciation ? <Eye className="w-4 h-4 text-emerald-700" /> : <EyeOff className="w-4 h-4" />}
            <span>উচ্চারণ {showPronunciation ? 'চালু' : 'বন্ধ'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowGrammarNotes((g) => !g)}
            className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors whitespace-nowrap cursor-pointer ${
              showGrammarNotes
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-xs'
                : 'bg-white border-slate-200 text-slate-600'
            }`}
          >
            {showGrammarNotes ? <Eye className="w-4 h-4 text-emerald-700" /> : <EyeOff className="w-4 h-4" />}
            <span>শব্দার্থ ও নোট {showGrammarNotes ? 'চালু' : 'বন্ধ'}</span>
          </button>

          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('favorites')}
              className="min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-amber-300 bg-amber-50/90 hover:bg-amber-100 text-amber-950 transition-colors whitespace-nowrap shadow-xs cursor-pointer"
            >
              <Bookmark className="w-4 h-4 text-amber-600 fill-amber-600" />
              <span>আমার প্রিয় ({toBnNum(favoriteAyahKeys.length)})</span>
            </button>
          )}
        </div>
      </div>

      {/* Suggested Short Surahs Shelf (Quick Access for Prayer Surahs) */}
      <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-3xl p-6 md:p-8 shadow-sm border border-emerald-800/60 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>নামাজে নিয়মিত পঠিত ছোট সূরাসমূহ (Quick Shelf)</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold mt-1 text-white">
              বহুল পঠিত ছোট সূরাগুলোর দ্রুত অনুশীলন
            </h2>
            <p className="text-xs md:text-sm text-emerald-100/80 mt-1 max-w-2xl">
              সূরা আল-ফীল, কুরাইশ, আল-মাউন, আল-কাওসার, আল-ইখলাসসহ নামাজের সূরাগুলো এক নজরে খুলুন অথবা নিচে ১১৪টি সূরার যেকোনোটি নির্বাচন করুন।
            </p>
          </div>

          {/* Carousel Scroll Navigation */}
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            <button
              type="button"
              onClick={() => scrollSuggested('left')}
              aria-label="পূর্ববর্তী সূরা দেখুন"
              className="w-9 h-9 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors border border-emerald-700/50 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollSuggested('right')}
              aria-label="পরবর্তী সূরা দেখুন"
              className="w-9 h-9 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors border border-emerald-700/50 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable List of Suggested Surahs */}
        <div
          ref={suggestedScrollRef}
          className="flex gap-4 overflow-x-auto pb-2 pt-1 scroll-smooth snap-x snap-mandatory focus:outline-hidden"
          style={{ scrollbarWidth: 'thin' }}
        >
          {suggestedSurahs.map((surah) => {
            const isExpanded = expandedSuggestedSurahId === surah.id;
            const completedInSurah = surah.ayahs.filter((a) =>
              practicedAyahKeys.includes(`${surah.surahNumber}:${a.ayahNumber}`)
            ).length;
            const isFullyCompleted = completedInSurah === surah.ayahCount;

            return (
              <div
                key={surah.id}
                className={`snap-start shrink-0 w-[280px] sm:w-[310px] rounded-2xl border transition-all flex flex-col justify-between ${
                  isExpanded
                    ? 'bg-emerald-800/90 border-emerald-400 ring-2 ring-emerald-400/50 shadow-lg'
                    : 'bg-emerald-950/70 hover:bg-emerald-800/50 border-emerald-800/70 shadow-xs'
                }`}
              >
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-emerald-300">
                    <span className="font-semibold tabular-nums">সূরা {toBnNum(surah.surahNumber)}</span>
                    <div className="flex items-center gap-1.5">
                      {isFullyCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      <span className="font-bold tabular-nums">
                        {toBnNum(completedInSurah)}/{toBnNum(surah.ayahCount)} আয়াত
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-base text-white">{surah.nameBn}</h3>
                      <p className="text-xs text-emerald-200/80">{surah.meaningBn}</p>
                    </div>
                    <span className="font-arabic text-2xl text-emerald-200 drop-shadow-xs">
                      {surah.nameAr}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-emerald-800/60 flex items-center justify-between text-[11px] text-emerald-200/90">
                    <span>{surah.revelationTypeBn}</span>
                    <span className="text-emerald-300 font-medium">অফলাইন প্রস্তুত ✓</span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-950/90 rounded-b-2xl border-t border-emerald-800/70 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (isExpanded) {
                        setExpandedSuggestedSurahId(null);
                      } else {
                        setExpandedSuggestedSurahId(surah.id);
                      }
                    }}
                    className={`flex-1 min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      isExpanded
                        ? 'bg-amber-400 hover:bg-amber-300 text-emerald-950 shadow-xs'
                        : 'bg-emerald-700/80 hover:bg-emerald-600 text-white'
                    }`}
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" />
                        <span>সংক্ষেপ করুন</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" />
                        <span>ট্যাপ করে খুলুন</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectSurah(surah.surahNumber)}
                    title="পূর্ণ স্ক্রিন অনুশীলনে খুলুন"
                    className="min-h-[40px] px-3 py-1.5 rounded-xl bg-emerald-800/90 hover:bg-emerald-700 text-emerald-100 text-xs font-semibold flex items-center gap-1 transition-colors border border-emerald-700/60 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>চর্চা</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Expanded View for Suggested Surah */}
        {expandedSuggestedSurahId && (() => {
          const expandedSurah = PRACTICE_SURAHS.find((s) => s.id === expandedSuggestedSurahId);
          if (!expandedSurah) return null;

          return (
            <div className="bg-white text-slate-900 rounded-2xl p-5 md:p-7 shadow-xl border-2 border-emerald-500/80 space-y-6 mt-4 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-emerald-800 text-white font-bold text-sm flex items-center justify-center tabular-nums shadow-xs">
                    {toBnNum(expandedSurah.surahNumber)}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-slate-900">{expandedSurah.nameBn}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                        {expandedSurah.revelationTypeBn} · {toBnNum(expandedSurah.ayahCount)} আয়াত
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      অর্থ: “{expandedSurah.meaningBn}” — প্রতিটি শব্দে ট্যাপ করে উচ্চারণ শুনুন
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectSurah(expandedSurah.surahNumber)}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  >
                    <span>পূর্ণ অনুশীলনে যান</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpandedSuggestedSurahId(null)}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    বন্ধ করুন ✕
                  </button>
                </div>
              </div>

              {/* Ayahs Breakdown */}
              <div className="space-y-6">
                {expandedSurah.ayahs.map((ayah) => {
                  const ayahKey = `${expandedSurah.surahNumber}:${ayah.ayahNumber}`;
                  const isPracticed = practicedAyahKeys.includes(ayahKey);
                  const isAutoPlaying = autoPlayingAyahKey === ayahKey;
                  const isBookmarked = favoriteAyahKeys.includes(ayahKey);

                  return (
                    <div
                      key={ayahKey}
                      className="bg-slate-50/70 rounded-2xl border border-slate-200 p-4 md:p-6 space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200/80">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-emerald-900 text-white font-bold text-xs flex items-center justify-center tabular-nums">
                            {toBnNum(ayah.ayahNumber)}
                          </span>
                          <span className="text-xs font-bold text-slate-700">
                            আয়াত {toBnNum(ayah.ayahNumber)} ({toBnNum(ayah.words.length)}টি শব্দ)
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              stopAutoPlay();
                              speakArabic(ayah.fullAr, slowAudio);
                            }}
                            className="min-h-[36px] px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>আয়াত শুনুন</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => startWordByWordAutoPlay(expandedSurah.surahNumber, ayah)}
                            className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                              isAutoPlaying
                                ? 'bg-amber-600 text-white border-amber-600'
                                : 'bg-white hover:bg-emerald-50 text-emerald-950 border-slate-300'
                            }`}
                          >
                            {isAutoPlaying ? (
                              <>
                                <Square className="w-3.5 h-3.5" />
                                <span>থামান</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5 text-emerald-800" />
                                <span>শব্দে শব্দে</span>
                              </>
                            )}
                          </button>

                          {onToggleFavoriteAyah && (
                            <button
                              type="button"
                              onClick={() => onToggleFavoriteAyah(ayahKey)}
                              className={`min-h-[36px] px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-colors cursor-pointer ${
                                isBookmarked
                                  ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-2xs'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              <Bookmark
                                className={`w-3.5 h-3.5 ${
                                  isBookmarked ? 'text-amber-500 fill-amber-500' : 'text-slate-400'
                                }`}
                              />
                              <span>{isBookmarked ? 'বুকমার্ক' : 'বুকমার্ক'}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onToggleAyahPracticed(ayahKey)}
                            className={`min-h-[36px] px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-colors cursor-pointer ${
                              isPracticed
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <CheckCircle2
                              className={`w-3.5 h-3.5 ${
                                isPracticed ? 'text-emerald-700' : 'text-slate-400'
                              }`}
                            />
                            <span>{isPracticed ? 'সম্পন্ন' : 'চিহ্নিত'}</span>
                          </button>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-white border border-emerald-900/10 space-y-2">
                        <p
                          dir="rtl"
                          className="font-arabic text-3xl md:text-4xl text-emerald-950 text-right leading-relaxed"
                        >
                          {ayah.fullAr}
                        </p>
                        {showPronunciation && (
                          <p className="text-sm md:text-base font-semibold text-emerald-900 pt-2 border-t border-slate-100">
                            উচ্চারণ: {ayah.fullBnPronunciation}
                          </p>
                        )}
                        <p className="text-sm md:text-base font-bold text-slate-800">
                          অর্থ: “{ayah.fullBnMeaning}”
                        </p>
                      </div>

                      {/* Word-by-Word Grid */}
                      <div
                        dir="rtl"
                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5"
                      >
                        {ayah.words.map((word, wIdx) => {
                          const highlightId = `${ayahKey}:${wIdx}`;
                          const isHighlighted =
                            activeWordHighlight === highlightId || speakingText === word.ar;
                          const matchedWord = findMatchingQuranWord(word.ar);
                          const isWordBookmarked = matchedWord ? favoriteWordIds.includes(matchedWord.id) : false;

                          return (
                            <button
                              key={wIdx}
                              type="button"
                              onClick={() => speakArabic(word.ar, slowAudio)}
                              className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-between min-h-[128px] cursor-pointer ${
                                isHighlighted
                                  ? 'bg-emerald-900 text-white border-emerald-900 scale-[1.02] shadow-md ring-2 ring-emerald-500'
                                  : 'bg-white hover:bg-emerald-50/70 border-slate-200 text-slate-900 shadow-2xs'
                              }`}
                            >
                              <div className="w-full flex items-center justify-between text-[10px] opacity-80">
                                <span dir="ltr">শব্দ {toBnNum(wIdx + 1)}</span>
                                <div className="flex items-center gap-1.5">
                                  <Volume2 className="w-3 h-3" />
                                  {matchedWord && onToggleFavoriteWord && (
                                    <span
                                      role="button"
                                      tabIndex={0}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleFavoriteWord(matchedWord.id);
                                      }}
                                      className="p-0.5 rounded cursor-pointer"
                                    >
                                      <Bookmark
                                        className={`w-3 h-3 ${
                                          isWordBookmarked ? 'fill-amber-500 text-amber-500' : 'text-slate-400'
                                        }`}
                                      />
                                    </span>
                                  )}
                                </div>
                              </div>

                              <span className="font-arabic my-1.5 text-2xl md:text-3xl">
                                {word.ar}
                              </span>

                              <div dir="ltr" className="w-full space-y-0.5">
                                {showPronunciation && (
                                  <p
                                    className={`text-xs font-bold ${
                                      isHighlighted ? 'text-emerald-200' : 'text-emerald-800'
                                    }`}
                                  >
                                    {word.bnPronunciation}
                                  </p>
                                )}
                                <p className="text-xs font-bold leading-tight">{word.bnMeaning}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>

      {/* 114 Surahs Directory & Search Control Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold">
              <SlidersHorizontal className="w-5 h-5 text-emerald-800" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                সম্পূর্ণ ১১৪টি সূরা ব্রাউজার (All 114 Surahs Directory)
              </h2>
              <p className="text-xs text-slate-500">
                কুরআনের যেকোনো সূরা নাম, ক্রমিক নং (১-১১৪) বা অর্থ দিয়ে খুঁজুন অথবা ড্রপডাউন থেকে এক ক্লিকে খুলুন।
              </p>
            </div>
          </div>

          {/* Quick Surah Jump Dropdown */}
          <div className="flex items-center gap-2 self-start lg:self-auto w-full lg:w-auto">
            <label htmlFor="quick-surah-select" className="text-xs font-bold text-slate-600 whitespace-nowrap">
              সূরা নির্বাচন:
            </label>
            <select
              id="quick-surah-select"
              value={selectedSurahNumber}
              onChange={(e) => handleSelectSurah(Number(e.target.value))}
              className="flex-1 lg:w-72 px-3 py-2 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-950 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 cursor-pointer"
            >
              {ALL_114_SURAHS.map((s) => (
                <option key={s.surahNumber} value={s.surahNumber}>
                  {toBnNum(s.surahNumber)}. {s.nameBn} ({s.revelationTypeBn}, {toBnNum(s.ayahCount)} আয়াত)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              সব ১১৪টি সূরা
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('curated')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeCategory === 'curated'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              ছোট ২০টি সূরা (বিশদ অর্থ)
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('juz_amma')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeCategory === 'juz_amma'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              আম্মাপারা (সূরা ৭৮-১১৪)
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('popular')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeCategory === 'popular'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5 inline text-amber-500 mr-1" />
              ফযিলতপূর্ণ ও বহুল পঠিত
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('makki')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeCategory === 'makki'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              মাক্কী সূরা (৮৬টি)
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('madani')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeCategory === 'madani'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              মাদানী সূরা (২৮টি)
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="সূরা খুঁজুন (যেমন: বাকারা, ৩৬, মুলক)..."
              className="w-full pl-9 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600"
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
        </div>

        {/* Responsive Surahs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
          {filteredSurahs.map((meta) => {
            const isSelected = selectedSurahNumber === meta.surahNumber;
            const isOfflineReady = isSurahCached(meta.surahNumber);

            return (
              <button
                key={meta.surahNumber}
                type="button"
                onClick={() => handleSelectSurah(meta.surahNumber)}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer min-h-[92px] ${
                  isSelected
                    ? 'bg-emerald-900 text-white border-emerald-900 shadow-md ring-2 ring-emerald-600/50'
                    : 'bg-slate-50 hover:bg-emerald-50/70 border-slate-200 text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between gap-1 w-full text-[11px]">
                  <span
                    className={`font-bold tabular-nums ${
                      isSelected ? 'text-emerald-200' : 'text-slate-500'
                    }`}
                  >
                    #{toBnNum(meta.surahNumber)}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                      isSelected
                        ? 'bg-emerald-800 text-emerald-200'
                        : isOfflineReady
                        ? 'bg-emerald-100 text-emerald-800 font-semibold'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isOfflineReady ? 'অফলাইন' : meta.revelationTypeBn}
                  </span>
                </div>

                <div className="my-1">
                  <p className="font-bold text-xs truncate">{meta.nameBn}</p>
                  <p
                    className={`text-[10px] truncate ${
                      isSelected ? 'text-emerald-200' : 'text-slate-500'
                    }`}
                  >
                    {meta.meaningBn}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[10px] opacity-80 pt-1 border-t border-slate-200/50">
                  <span className="font-arabic">{meta.nameAr}</span>
                  <span>{toBnNum(meta.ayahCount)} আয়াত</span>
                </div>
              </button>
            );
          })}
        </div>

        {filteredSurahs.length === 0 && (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
            <p className="text-slate-500 text-sm">কোনো সূরা খুঁজে পাওয়া যায়নি। অনুসন্ধান শব্দ পরিবর্তন করুন।</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
              className="mt-2 text-xs text-emerald-800 font-bold hover:underline cursor-pointer"
            >
              সকল ১১৪টি সূরা প্রদর্শন করুন
            </button>
          </div>
        )}
      </div>

      {/* Selected Surah Showcase Banner */}
      <div
        ref={ayahListTopRef}
        className="bg-emerald-950 text-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md border border-emerald-900"
      >
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-900 text-emerald-200 text-xs font-bold tabular-nums">
              সূরা ক্রমিক নং #{toBnNum(selectedSurahNumber)}
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-900 text-emerald-200 text-xs font-semibold">
              {currentMeta?.revelationTypeBn ?? currentSurahData.revelationTypeBn}
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-900 text-emerald-200 text-xs font-semibold tabular-nums">
              মোট আয়াত {toBnNum(currentSurahData.ayahCount)}টি
            </span>
            {currentMeta?.juzNumber && (
              <span className="px-3 py-1 rounded-full bg-emerald-900 text-emerald-200 text-xs font-semibold">
                {currentMeta.juzNumber}
              </span>
            )}
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                isCurrentOfflineReady ? 'bg-emerald-800 text-emerald-200' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {isCurrentOfflineReady ? '✓ অফলাইনে সংরক্ষিত' : 'ক্লাউড থেকে লোডকৃত'}
            </span>
          </div>

          <h2 className="text-2xl md:text-4xl font-bold text-white">
            {currentSurahData.nameBn} —{' '}
            <span className="text-emerald-300 font-medium">{currentSurahData.meaningBn}</span>
          </h2>

          <p className="text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
            প্রতিটি আরবি শব্দে ট্যাপ করলে আলাদাভাবে বিশুদ্ধ উচ্চারণ ও অর্থ দেখা যাবে। "পুরো আয়াত শুনুন" বাটনে ট্যাপ করে সম্পূর্ণ তিলাওয়াত শুনুন।
          </p>

          {/* Action Row: Prev / Next + Save for Offline */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {selectedSurahNumber > 1 && (
              <button
                type="button"
                onClick={handlePrevSurah}
                className="px-3 py-1.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-emerald-100 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>পূর্ববর্তী সূরা</span>
              </button>
            )}

            {selectedSurahNumber < 114 && (
              <button
                type="button"
                onClick={handleNextSurah}
                className="px-3 py-1.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-emerald-100 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>পরবর্তী সূরা</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveForOffline}
              className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-emerald-100 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-emerald-700/60"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{offlineSavedNotice ? 'সংরক্ষিত হয়েছে!' : 'অফলাইনে রাখুন'}</span>
            </button>
          </div>
        </div>

        <div className="text-right shrink-0 flex flex-col items-end">
          <span className="font-arabic text-4xl md:text-6xl text-emerald-200 block drop-shadow-xs">
            {currentSurahData.nameAr}
          </span>
          <div className="mt-2 text-xs text-emerald-300/90 flex items-center gap-2">
            <span>অনুশীলন:</span>
            <span className="font-bold tabular-nums">
              {toBnNum(completedAyahsInCurrentSurah)}/{toBnNum(currentSurahData.ayahCount)} আয়াত
            </span>
            {isCurrentSurahFullyCompleted && (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> সম্পূর্ণ
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Loading & Error States */}
      {isLoadingSurah && (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">
            {currentMeta?.nameBn ?? `সূরা ${selectedSurahNumber}`} লোড হচ্ছে...
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            বিশুদ্ধ আরবি উসমানী পাঠ এবং বাংলা অনুবাদ প্রক্রিয়া করা হচ্ছে। একবার লোড হলে পরবর্তীতে সম্পূর্ণ অফলাইনে কাজ করবে।
          </p>
        </div>
      )}

      {loadError && (
        <div className="p-8 text-center bg-rose-50 rounded-3xl border border-rose-200 shadow-sm space-y-3">
          <p className="text-sm font-bold text-rose-700">{loadError}</p>
          <p className="text-xs text-rose-600">
            ইন্টারনেট সংযোগ পরীক্ষা করুন অথবা অন্য একটি পূর্বনির্ধারিত ছোট সূরা চর্চা করুন।
          </p>
          <button
            type="button"
            onClick={() => fetchAndSetSurah(selectedSurahNumber)}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>পুনরায় চেষ্টা করুন</span>
          </button>
        </div>
      )}

      {/* Bismillah Calligraphy Banner for all Surahs except Surah At-Tawbah (#9) */}
      {!isLoadingSurah && !loadError && selectedSurahNumber !== 9 && (
        <div className="bg-[#FAFDFB] rounded-2xl border border-emerald-900/10 p-5 md:p-6 text-center space-y-2 shadow-2xs">
          <p className="font-arabic text-2xl md:text-3xl text-emerald-950 font-bold">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
          <p className="text-xs md:text-sm font-semibold text-emerald-800">
            পরম করুণাময় অসীম দয়ালু আল্লাহর নামে শুরু করছি
          </p>
        </div>
      )}

      {/* Jump to Ayah Form for Surahs with more than 15 ayahs */}
      {!isLoadingSurah && !loadError && currentSurahData.ayahCount > 15 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
          <div className="text-slate-600">
            মোট <span className="font-bold text-slate-900">{toBnNum(currentSurahData.ayahCount)}</span>টি আয়াতের মধ্যে প্রদর্শিত হচ্ছে{' '}
            <span className="font-bold text-emerald-800">
              {toBnNum(Math.min(visibleAyahsCount, currentSurahData.ayahCount))}
            </span>টি আয়াত।
          </div>

          <form onSubmit={handleJumpToAyah} className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 whitespace-nowrap">আয়াতে যান:</span>
            <input
              type="text"
              value={jumpAyahInput}
              onChange={(e) => setJumpAyahInput(e.target.value)}
              placeholder={`১ - ${currentSurahData.ayahCount}`}
              className="w-20 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-center font-bold text-slate-800 focus:outline-hidden focus:border-emerald-600"
            >
            </input>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-bold transition-colors cursor-pointer"
            >
              যান
            </button>
          </form>
        </div>
      )}

      {/* Ayahs List */}
      {!isLoadingSurah && !loadError && (
        <div className="space-y-6">
          {visibleAyahs.map((ayah) => {
            const ayahKey = `${selectedSurahNumber}:${ayah.ayahNumber}`;
            const isPracticed = practicedAyahKeys.includes(ayahKey);
            const isAutoPlaying = autoPlayingAyahKey === ayahKey;
            const isBookmarked = favoriteAyahKeys.includes(ayahKey);

            return (
              <div
                key={ayahKey}
                id={`ayah-${selectedSurahNumber}-${ayah.ayahNumber}`}
                className={`bg-white rounded-2xl border p-6 md:p-8 space-y-6 transition-all ${
                  isPracticed
                    ? 'border-emerald-200 bg-white shadow-xs'
                    : 'border-slate-200 shadow-2xs'
                }`}
              >
                {/* Ayah Top Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-9 h-9 rounded-xl font-bold text-sm flex items-center justify-center tabular-nums transition-colors ${
                        isPracticed ? 'bg-emerald-700 text-white' : 'bg-emerald-900 text-white'
                      }`}
                    >
                      {toBnNum(ayah.ayahNumber)}
                    </span>
                    <div>
                      <span className="text-sm font-bold text-slate-900">
                        {currentSurahData.nameBn} · আয়াত {toBnNum(ayah.ayahNumber)}
                      </span>
                      <span className="text-xs text-slate-500 block">
                        মোট {toBnNum(ayah.words.length)}টি শব্দ
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        stopAutoPlay();
                        speakArabic(ayah.fullAr, slowAudio);
                      }}
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shadow-xs cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4 shrink-0" />
                      <span>পুরো আয়াত শুনুন</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => startWordByWordAutoPlay(selectedSurahNumber, ayah)}
                      className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 border transition-colors whitespace-nowrap cursor-pointer ${
                        isAutoPlaying
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-[#F8FAF9] hover:bg-emerald-50 text-emerald-950 border-slate-200'
                      }`}
                    >
                      {isAutoPlaying ? (
                        <>
                          <Square className="w-4 h-4 shrink-0" />
                          <span>থামান</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 shrink-0 text-emerald-800" />
                          <span>শব্দে শব্দে শুনুন</span>
                        </>
                      )}
                    </button>

                    {onToggleFavoriteAyah && (
                      <button
                        type="button"
                        onClick={() => onToggleFavoriteAyah(ayahKey)}
                        title={isBookmarked ? 'বুকমার্ক থেকে সরান' : 'প্রিয় তালিকায় বুকমার্ক করুন'}
                        className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors whitespace-nowrap cursor-pointer ${
                          isBookmarked
                            ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Bookmark
                          className={`w-4 h-4 shrink-0 ${
                            isBookmarked ? 'text-amber-500 fill-amber-500' : 'text-slate-400'
                          }`}
                        />
                        <span>{isBookmarked ? 'বুকমার্ক করা' : 'বুকমার্ক'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onToggleAyahPracticed(ayahKey)}
                      className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors whitespace-nowrap cursor-pointer ${
                        isPracticed
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 ${
                          isPracticed ? 'text-emerald-700' : 'text-slate-400'
                        }`}
                      />
                      <span>{isPracticed ? 'অনুশীলন সম্পন্ন' : 'সম্পন্ন চিহ্নিত করুন'}</span>
                    </button>
                  </div>
                </div>

                {/* Full Ayah Arabic & Meaning Display */}
                <div className="p-5 md:p-6 rounded-2xl bg-[#F4F8F6] border border-emerald-900/10 space-y-3">
                  <p
                    dir="rtl"
                    className={`font-arabic text-emerald-950 text-right leading-relaxed ${
                      largeFont ? 'text-4xl md:text-5xl' : 'text-3xl md:text-4xl'
                    }`}
                  >
                    {ayah.fullAr}
                  </p>

                  {showPronunciation && ayah.fullBnPronunciation && !ayah.fullBnPronunciation.startsWith('আয়াত') && (
                    <p className="text-base md:text-lg font-semibold text-emerald-900 pt-2 border-t border-emerald-900/10">
                      উচ্চারণ: {ayah.fullBnPronunciation}
                    </p>
                  )}

                  <p className="text-base md:text-lg font-bold text-slate-900">
                    পূর্ণ অর্থ: “{ayah.fullBnMeaning}”
                  </p>
                </div>

                {/* Word-by-Word Interactive Grid (RTL) */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-3 text-right">
                    শব্দে শব্দে বিশ্লেষণ (ডান দিক থেকে বামে পড়ুন ও ট্যাপ করে শুনুন):
                  </p>
                  <div
                    dir="rtl"
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
                  >
                    {ayah.words.map((word, wIdx) => {
                      const highlightId = `${ayahKey}:${wIdx}`;
                      const isHighlighted =
                        activeWordHighlight === highlightId || speakingText === word.ar;
                      const matchedWord = findMatchingQuranWord(word.ar);
                      const isWordBookmarked = matchedWord ? favoriteWordIds.includes(matchedWord.id) : false;

                      return (
                        <button
                          key={wIdx}
                          type="button"
                          onClick={() => speakArabic(word.ar, slowAudio)}
                          className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-between min-h-[144px] cursor-pointer ${
                            isHighlighted
                              ? 'bg-emerald-900 text-white border-emerald-900 scale-[1.02] shadow-md ring-2 ring-emerald-500'
                              : 'bg-[#F8FAF9] hover:bg-emerald-50/70 border-slate-200 text-slate-900'
                          }`}
                        >
                          <div className="w-full flex items-center justify-between text-[11px] opacity-80">
                            <span dir="ltr">শব্দ {toBnNum(wIdx + 1)}</span>
                            <div className="flex items-center gap-1.5">
                              <Volume2 className="w-3.5 h-3.5" />
                              {matchedWord && onToggleFavoriteWord && (
                                <span
                                  role="button"
                                  tabIndex={0}
                                  title={
                                    isWordBookmarked
                                      ? 'শব্দটি প্রিয় তালিকা থেকে সরান'
                                      : 'শব্দটি প্রিয় তালিকায় যোগ করুন'
                                  }
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleFavoriteWord(matchedWord.id);
                                  }}
                                  className="p-0.5 rounded cursor-pointer"
                                >
                                  <Bookmark
                                    className={`w-3.5 h-3.5 ${
                                      isWordBookmarked ? 'fill-amber-500 text-amber-500' : 'text-slate-400'
                                    }`}
                                  />
                                </span>
                              )}
                            </div>
                          </div>

                          <span
                            className={`font-arabic my-2 ${
                              largeFont ? 'text-4xl md:text-5xl' : 'text-3xl md:text-4xl'
                            }`}
                          >
                            {word.ar}
                          </span>

                          <div dir="ltr" className="w-full space-y-1">
                            {showPronunciation && (
                              <p
                                className={`text-sm font-bold ${
                                  isHighlighted ? 'text-emerald-200' : 'text-emerald-800'
                                }`}
                              >
                                {word.bnPronunciation}
                              </p>
                            )}
                            <p className="text-sm font-bold leading-tight">{word.bnMeaning}</p>
                            {showGrammarNotes && word.grammarNote && (
                              <p
                                className={`text-[11px] pt-1 border-t ${
                                  isHighlighted
                                    ? 'border-emerald-700 text-emerald-100'
                                    : 'border-slate-200 text-slate-500'
                                }`}
                              >
                                {word.grammarNote}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load More Ayahs Button for long Surahs */}
      {!isLoadingSurah && !loadError && visibleAyahsCount < currentSurahData.ayahCount && (
        <div className="p-6 bg-white rounded-3xl border border-slate-200 text-center space-y-3 shadow-xs">
          <p className="text-sm font-semibold text-slate-700">
            দেখাচ্ছে {toBnNum(visibleAyahsCount)}টি / মোট {toBnNum(currentSurahData.ayahCount)}টি আয়াত
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setVisibleAyahsCount((prev) => Math.min(currentSurahData.ayahCount, prev + 30))}
              className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              পরবর্তী ৩০টি আয়াত লোড করুন
            </button>
            <button
              type="button"
              onClick={() => setVisibleAyahsCount(currentSurahData.ayahCount)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              সব আয়াত একসাথে দেখুন
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation Switcher */}
      <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200">
        {selectedSurahNumber > 1 ? (
          <button
            type="button"
            onClick={handlePrevSurah}
            className="px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>পূর্ববর্তী সূরা (#{toBnNum(selectedSurahNumber - 1)})</span>
          </button>
        ) : (
          <div />
        )}

        <div className="text-center text-xs font-bold text-slate-700">
          সূরা {toBnNum(selectedSurahNumber)} / {toBnNum(114)}টি সূরা
        </div>

        {selectedSurahNumber < 114 ? (
          <button
            type="button"
            onClick={handleNextSurah}
            className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <span>পরবর্তী সূরা (#{toBnNum(selectedSurahNumber + 1)})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
};
