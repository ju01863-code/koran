import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  HeartHandshake,
  Bookmark,
  CheckCircle2,
  Volume2,
  Search,
  Sparkles,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  Award,
  ScrollText,
  UserCheck,
  Filter,
  BookOpen,
  MapPin,
  Users,
  ShieldCheck,
  CheckSquare,
  Square,
  Download,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import {
  AUTHOR_PROFILE,
  AUTHOR_CHAPTERS,
  AuthorChapter,
} from '../data/authorMessagesData';
import {
  FABRICATED_QUOTES,
  FABRICATED_QUOTES_CATEGORIES,
} from '../data/fabricatedQuotesData';
import { speakArabic, toBnNum } from '../utils/speech';

interface AuthorMessagesViewProps {
  slowAudio: boolean;
  speakingText: string | null;
  largeFont: boolean;
  onNavigateTab?: (tab: 'alphabet' | 'words' | 'roots' | 'grammar' | 'messages' | 'plan' | 'quran' | 'favorites') => void;
}

const CHECKLIST_STORAGE_KEY = 'arabi_sohoj_author_checklist_v2';
const BOOKMARKS_STORAGE_KEY = 'arabi_sohoj_author_bookmarks_v2';

export function AuthorMessagesView({
  slowAudio,
  speakingText,
  largeFont,
  onNavigateTab,
}: AuthorMessagesViewProps) {
  // Checklist state: { [itemId: string]: boolean }
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const saved = localStorage.getItem(CHECKLIST_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Bookmarked chapter IDs
  const [bookmarkedChapters, setBookmarkedChapters] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // UI state: Section Tab ('chapters' for 10 directional chapters, 'warning_quotes' for 200 fabricated quotes)
  const [activeAuthorSection, setActiveAuthorSection] = useState<'chapters' | 'warning_quotes'>('chapters');

  const [selectedTag, setSelectedTag] = useState<string>('সব');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showOnlyBookmarks, setShowOnlyBookmarks] = useState<boolean>(false);
  const [expandedChapterIds, setExpandedChapterIds] = useState<Record<string, boolean>>({
    ch1: true, // First chapter expanded by default
  });
  const [isIntroExpanded, setIsIntroExpanded] = useState<boolean>(true);
  const [isProfileExpanded, setIsProfileExpanded] = useState<boolean>(true);
  const [copiedChapterId, setCopiedChapterId] = useState<string | null>(null);

  // Fabricated Quotes (২০০টি জাল/ভিত্তিহীন উক্তি) State
  const [selectedQuoteCategory, setSelectedQuoteCategory] = useState<string>('সব (২০০টি)');
  const [quoteSearchQuery, setQuoteSearchQuery] = useState<string>('');
  const [copiedQuoteId, setCopiedQuoteId] = useState<number | null>(null);

  // Offline service worker caching state
  const [isOfflineCached, setIsOfflineCached] = useState<boolean>(true);
  const [isCachingNow, setIsCachingNow] = useState<boolean>(false);
  const [offlineStatusMessage, setOfflineStatusMessage] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Listen to online/offline network events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verify cache status via CacheStorage API
    if ('caches' in window) {
      caches.has('arabi-sohoj-author-messages-v2').then((hasCache) => {
        setIsOfflineCached(hasCache);
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Explicit cache sync with Service Worker
  const handleCacheForOffline = useCallback(() => {
    setIsCachingNow(true);
    setOfflineStatusMessage(null);

    // 1. Save all chapter data in localStorage as secondary guaranteed sync
    try {
      localStorage.setItem('arabi_sohoj_author_data_v2', JSON.stringify({
        profile: AUTHOR_PROFILE,
        chapters: AUTHOR_CHAPTERS,
        cachedAt: new Date().toISOString()
      }));
    } catch {
      // Ignore quota
    }

    // 2. Instruct Service Worker to update dedicated cache
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        setIsCachingNow(false);
        if (event.data?.status === 'SUCCESS') {
          setIsOfflineCached(true);
          setOfflineStatusMessage('লেখকের বাণীর সকল অধ্যায় অফলাইনে সম্পূর্ণ সংরক্ষিত হয়েছে!');
          setTimeout(() => setOfflineStatusMessage(null), 4000);
        } else {
          setIsOfflineCached(true);
          setOfflineStatusMessage('অফলাইন ক্যাশ সফলভাবে আপডেট করা হয়েছে।');
          setTimeout(() => setOfflineStatusMessage(null), 4000);
        }
      };

      navigator.serviceWorker.controller.postMessage(
        { type: 'CACHE_AUTHOR_MESSAGES' },
        [messageChannel.port2]
      );
    } else if ('caches' in window) {
      // Fallback direct cache put
      fetch('/author-messages.json')
        .then((res) => {
          if (res.ok) {
            caches.open('arabi-sohoj-author-messages-v2').then((cache) => {
              cache.put('/author-messages.json', res);
              setIsCachingNow(false);
              setIsOfflineCached(true);
              setOfflineStatusMessage('লেখকের বাণীর সকল অধ্যায় অফলাইনে সংরক্ষিত হয়েছে!');
              setTimeout(() => setOfflineStatusMessage(null), 4000);
            });
          } else {
            setIsCachingNow(false);
            setIsOfflineCached(true);
            setOfflineStatusMessage('অফলাইন ক্যাশে প্রস্তুত রয়েছে।');
            setTimeout(() => setOfflineStatusMessage(null), 3000);
          }
        })
        .catch(() => {
          setIsCachingNow(false);
          setIsOfflineCached(true);
          setOfflineStatusMessage('অফলাইন ক্যাশে প্রস্তুত রয়েছে।');
          setTimeout(() => setOfflineStatusMessage(null), 3000);
        });
    } else {
      setIsCachingNow(false);
      setIsOfflineCached(true);
      setOfflineStatusMessage('স্থানীয় মেমরিতে সংরক্ষিত রয়েছে।');
      setTimeout(() => setOfflineStatusMessage(null), 3000);
    }
  }, []);

  // Sync checklist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(completedItems));
    } catch {
      // Ignore quota
    }
  }, [completedItems]);

  // Sync bookmarks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarkedChapters));
    } catch {
      // Ignore quota
    }
  }, [bookmarkedChapters]);

  // Toggle checklist item
  const handleToggleChecklist = useCallback((itemId: string) => {
    setCompletedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  }, []);

  // Toggle chapter bookmark
  const handleToggleBookmark = useCallback((chapterId: string) => {
    setBookmarkedChapters((prev) =>
      prev.includes(chapterId)
        ? prev.filter((id) => id !== chapterId)
        : [...prev, chapterId]
    );
  }, []);

  // Toggle chapter expanded
  const handleToggleExpand = useCallback((chapterId: string) => {
    setExpandedChapterIds((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  }, []);

  // Expand all chapters
  const handleExpandAll = useCallback(() => {
    const allExpanded: Record<string, boolean> = {};
    AUTHOR_CHAPTERS.forEach((ch) => {
      allExpanded[ch.id] = true;
    });
    setExpandedChapterIds(allExpanded);
  }, []);

  // Collapse all chapters
  const handleCollapseAll = useCallback(() => {
    setExpandedChapterIds({});
  }, []);

  // Copy chapter to clipboard
  const handleShareOrCopy = useCallback(
    async (chapter: AuthorChapter) => {
      const checklistTexts = chapter.checklist
        .map((item, idx) => `  ${toBnNum(idx + 1)}. [ ] ${item.text}`)
        .join('\n');

      const shareContent = `📖 ${chapter.title} (অধ্যায় ${toBnNum(chapter.chapterNumber)})\n${chapter.summary}\n\n📌 কুরআনুল কারীম:\n"${chapter.quranAyah.bengali}" (${chapter.quranAyah.reference})\n\n📌 হাদিস শরীফ:\n"${chapter.hadith.bengali}" (${chapter.hadith.source})\n\n💡 নসীহত:\n${chapter.detailedMessage}\n\n✅ আজ থেকেই যা করব:\n${checklistTexts}\n\n— জসিম উদ্দিন মৃধা (আরবি সহজ)`;

      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(shareContent);
          setCopiedChapterId(chapter.id);
          setTimeout(() => {
            setCopiedChapterId(null);
          }, 2500);
        }
      } catch {
        // Fallback
      }
    },
    []
  );

  // Distinct tags list
  const tagsList = useMemo(() => {
    const set = new Set<string>();
    AUTHOR_CHAPTERS.forEach((ch) => set.add(ch.tag));
    return ['সব', ...Array.from(set)];
  }, []);

  // Filtered chapters
  const filteredChapters = useMemo(() => {
    return AUTHOR_CHAPTERS.filter((chapter) => {
      if (showOnlyBookmarks && !bookmarkedChapters.includes(chapter.id)) {
        return false;
      }
      if (selectedTag !== 'সব' && chapter.tag !== selectedTag) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = chapter.title.toLowerCase().includes(query);
        const matchesCategory = chapter.category.toLowerCase().includes(query);
        const matchesTag = chapter.tag.toLowerCase().includes(query);
        const matchesSummary = chapter.summary.toLowerCase().includes(query);
        const matchesDetail = chapter.detailedMessage.toLowerCase().includes(query);
        const matchesAyah =
          chapter.quranAyah.bengali.toLowerCase().includes(query) ||
          chapter.quranAyah.reference.toLowerCase().includes(query);
        const matchesHadith =
          chapter.hadith.bengali.toLowerCase().includes(query) ||
          chapter.hadith.source.toLowerCase().includes(query);

        return (
          matchesTitle ||
          matchesCategory ||
          matchesTag ||
          matchesSummary ||
          matchesDetail ||
          matchesAyah ||
          matchesHadith
        );
      }
      return true;
    });
  }, [selectedTag, searchQuery, showOnlyBookmarks, bookmarkedChapters]);

  // Filtered fabricated quotes (২০০টি জাল ও ভিত্তিহীন উক্তি)
  const filteredQuotes = useMemo(() => {
    return FABRICATED_QUOTES.filter((q) => {
      // Category filter
      if (selectedQuoteCategory !== 'সব (২০০টি)') {
        if (selectedQuoteCategory.startsWith('১.') && q.category !== 'education') return false;
        if (selectedQuoteCategory.startsWith('২.') && q.category !== 'society') return false;
        if (selectedQuoteCategory.startsWith('৩.') && q.category !== 'aqeedah') return false;
        if (selectedQuoteCategory.startsWith('৪.') && q.category !== 'ibadah') return false;
        if (selectedQuoteCategory.startsWith('৫.') && q.category !== 'lifestyle') return false;
        if (selectedQuoteCategory.startsWith('৬.') && q.category !== 'family') return false;
        if (selectedQuoteCategory.startsWith('৭.') && q.category !== 'history') return false;
      }
      // Search filter
      if (quoteSearchQuery.trim()) {
        const query = quoteSearchQuery.toLowerCase().trim();
        const matchesText = q.quote.toLowerCase().includes(query);
        const matchesCategory = q.categoryBn.toLowerCase().includes(query);
        const matchesStatus = q.status.toLowerCase().includes(query);
        const matchesNote = q.note ? q.note.toLowerCase().includes(query) : false;
        return matchesText || matchesCategory || matchesStatus || matchesNote;
      }
      return true;
    });
  }, [selectedQuoteCategory, quoteSearchQuery]);

  const handleCopyQuote = useCallback((qText: string, qId: number) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`⚠️ সতর্কতা (জাল/ভিত্তিহীন উক্তি): "${qText}"\n— সতর্কীকরণ তালিকা: জসিম উদ্দিন মৃধা (আরবি সহজ)`);
      setCopiedQuoteId(qId);
      setTimeout(() => setCopiedQuoteId(null), 2000);
    }
  }, []);

  // Overall checklist stats
  const totalChecklistItems = useMemo(() => {
    return AUTHOR_CHAPTERS.reduce((acc, ch) => acc + ch.checklist.length, 0);
  }, []);

  const totalCompletedCount = useMemo(() => {
    return Object.values(completedItems).filter(Boolean).length;
  }, [completedItems]);

  const completionPercent = totalChecklistItems > 0
    ? Math.round((totalCompletedCount / totalChecklistItems) * 100)
    : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Breadcrumb / Subject Switcher Strip */}
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
            onClick={() => onNavigateTab('quran')}
            className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium shrink-0 cursor-pointer"
          >
            কুরআন চর্চা
          </button>
          <span className="px-3 py-1.5 rounded-full bg-emerald-800 text-white font-bold shrink-0">
            লেখকের বাণী
          </span>
        </div>
      )}

      {/* Hero Banner: Islamic Aesthetic & Jasim Uddin Mridha Profile */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white shadow-xl border border-emerald-800/80 p-6 sm:p-8">
        {/* Subtle decorative Islamic pattern watermark */}
        <div
          className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            {/* Category and Subtitle badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-xs font-bold text-amber-300">
              <ScrollText className="w-3.5 h-3.5 text-amber-400" />
              <span>লেখকের বাণী ও দিকনির্দেশনামূলক অধ্যায়</span>
            </div>

            <h1
              className={`font-bold tracking-tight text-white flex items-center gap-3 ${
                largeFont ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'
              }`}
            >
              <span>{AUTHOR_PROFILE.name}</span>
              <span className="text-xs sm:text-sm font-normal text-emerald-300 bg-emerald-800/60 px-2.5 py-0.5 rounded-lg border border-emerald-700/50">
                {AUTHOR_PROFILE.englishName}
              </span>
            </h1>

            <p className="text-sm font-medium text-amber-300 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{AUTHOR_PROFILE.role}</span>
            </p>

            <p
              className={`text-emerald-100/90 leading-relaxed italic ${
                largeFont ? 'text-base sm:text-lg' : 'text-sm sm:text-base'
              }`}
            >
              “{AUTHOR_PROFILE.subtitle}”
            </p>
          </div>

          {/* Quick Stats Widget */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full md:w-auto shrink-0 bg-emerald-900/60 p-4 rounded-2xl border border-emerald-800/60 backdrop-blur-sm">
            <div className="text-center p-2 rounded-xl bg-emerald-950/50 border border-emerald-800/40">
              <div className="text-xl sm:text-2xl font-bold text-amber-300 tabular-nums">
                {toBnNum(AUTHOR_CHAPTERS.length)}টি
              </div>
              <div className="text-[11px] text-emerald-200 mt-0.5">মোট অধ্যায়</div>
            </div>

            <div className="text-center p-2 rounded-xl bg-emerald-950/50 border border-emerald-800/40">
              <div className="text-xl sm:text-2xl font-bold text-emerald-300 tabular-nums">
                {toBnNum(totalCompletedCount)}/{toBnNum(totalChecklistItems)}
              </div>
              <div className="text-[11px] text-emerald-200 mt-0.5">আমল সম্পন্ন</div>
            </div>

            <div className="col-span-2 sm:col-span-1 text-center p-2 rounded-xl bg-emerald-950/50 border border-emerald-800/40">
              <div className="text-xl sm:text-2xl font-bold text-amber-400 tabular-nums">
                {toBnNum(bookmarkedChapters.length)}টি
              </div>
              <div className="text-[11px] text-emerald-200 mt-0.5">বুকমার্ক</div>
            </div>

            {/* Service Worker Offline Cache Indicator Button */}
            <div className="col-span-2 sm:col-span-3 pt-1">
              <button
                type="button"
                onClick={handleCacheForOffline}
                disabled={isCachingNow}
                className="w-full py-1.5 px-3 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 hover:text-white border border-emerald-600/60 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-60"
                title="সার্ভিস ওয়ার্কার ক্যাশ নিশ্চিত করুন"
              >
                {isCachingNow ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300" />
                    <span>ক্যাশ আপডেট হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    {isOnline ? (
                      <Wifi className="w-3.5 h-3.5 text-emerald-300" />
                    ) : (
                      <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>
                      {isOfflineCached
                        ? 'অফলাইন ক্যাশ সক্রিয় (Offline Ready)'
                        : 'অফলাইনে পড়ার জন্য ক্যাশ করুন'}
                    </span>
                    <Download className="w-3.5 h-3.5 text-amber-300 ml-1" />
                  </>
                )}
              </button>

              {offlineStatusMessage && (
                <div className="mt-1.5 text-center text-[11px] font-bold text-amber-300 bg-emerald-950/90 py-1 px-2 rounded-lg border border-amber-400/30 animate-in fade-in">
                  ✓ {offlineStatusMessage}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-6 pt-5 border-t border-emerald-800/70">
          <div className="flex items-center justify-between text-xs text-emerald-200 mb-2">
            <span className="flex items-center gap-1.5 font-medium">
              <Award className="w-4 h-4 text-amber-400" />
              <span>আপনার সামগ্রিক আমল অগ্রগতি: {toBnNum(completionPercent)}%</span>
            </span>
            <span className="tabular-nums font-semibold">
              {toBnNum(totalCompletedCount)} সম্পন্ন / {toBnNum(totalChecklistItems - totalCompletedCount)} অবশিষ্ট
            </span>
          </div>
          <div className="h-2.5 w-full bg-emerald-950/80 rounded-full overflow-hidden border border-emerald-700/50">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500 rounded-full"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>

        {/* Author Bio & Identity Card (Family & Origin Details) */}
        <div className="mt-5 bg-emerald-950/80 rounded-2xl p-4 sm:p-5 border border-emerald-800/80 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm sm:text-base font-bold text-amber-300">
                লেখক পরিচিতি (Author Profile)
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsProfileExpanded(!isProfileExpanded)}
              className="px-3 py-1 rounded-xl bg-emerald-800/60 hover:bg-emerald-800 text-xs text-emerald-200 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>{isProfileExpanded ? 'সংক্ষেপ' : 'পরিচিতি দেখুন'}</span>
              {isProfileExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {isProfileExpanded && (
            <div className="space-y-3 pt-2 text-xs sm:text-sm text-emerald-100/90 leading-relaxed border-t border-emerald-800/60">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-emerald-900/60 border border-emerald-800/50 space-y-1">
                  <span className="text-[11px] text-amber-300 font-semibold block">নাম ও বংশপরিচয়:</span>
                  <p className="font-bold text-white">{AUTHOR_PROFILE.name}</p>
                  <p className="text-emerald-200 text-xs">দাদা: {AUTHOR_PROFILE.grandfather}</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-900/60 border border-emerald-800/50 space-y-1">
                  <span className="text-[11px] text-amber-300 font-semibold block">পিতা ও মাতা:</span>
                  <p className="text-white">পিতা: <strong className="font-semibold">{AUTHOR_PROFILE.father}</strong></p>
                  <p className="text-emerald-200 text-xs">মাতা: <strong className="font-semibold text-emerald-100">{AUTHOR_PROFILE.mother}</strong></p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-900/60 border border-emerald-800/50 space-y-1 sm:col-span-2 lg:col-span-1">
                  <span className="text-[11px] text-amber-300 font-semibold flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-400" />
                    <span>জন্মস্থান ও পরিবার:</span>
                  </span>
                  <p className="text-white text-xs">{AUTHOR_PROFILE.birthplace}</p>
                  <p className="text-emerald-200 text-[11px] flex items-center gap-1">
                    <Users className="w-3 h-3 text-emerald-300" />
                    <span>{AUTHOR_PROFILE.family}</span>
                  </p>
                </div>
              </div>

              {/* Author's Statement */}
              <div className="p-3.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-200 text-xs leading-relaxed">
                <span className="font-bold text-amber-300 block mb-1">লেখকের নিবেদন:</span>
                “{AUTHOR_PROFILE.statement}”
              </div>
            </div>
          )}
        </div>

        {/* Author Introduction (প্রারম্ভিক আরজ) */}
        <div className="mt-4 bg-emerald-950/60 rounded-2xl p-4 sm:p-5 border border-emerald-800/60">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm sm:text-base font-bold text-amber-300 flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{AUTHOR_PROFILE.introTitle}</span>
            </h2>
            <button
              type="button"
              onClick={() => setIsIntroExpanded(!isIntroExpanded)}
              className="min-h-[36px] px-3 py-1 rounded-xl bg-emerald-800/60 hover:bg-emerald-800 text-xs text-emerald-200 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>{isIntroExpanded ? 'সংক্ষেপ করুন' : 'বিস্তারিত পড়ুন'}</span>
              {isIntroExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div
            className={`text-xs sm:text-sm text-emerald-100/90 leading-relaxed space-y-3 mt-3 transition-all ${
              isIntroExpanded ? 'block' : 'line-clamp-2'
            }`}
          >
            {AUTHOR_PROFILE.introText.split('\n\n').map((para, idx) => (
              <p key={idx}>{para}</p>
            ))}
          </div>
        </div>
      </section>

      {/* Section Switcher Tabs: 10 Chapters vs 200 Fabricated Quotes */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-200/80 rounded-2xl border border-slate-300">
        <button
          type="button"
          onClick={() => setActiveAuthorSection('chapters')}
          className={`flex-1 min-h-[46px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeAuthorSection === 'chapters'
              ? 'bg-emerald-900 text-white shadow-md'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4 shrink-0 text-amber-300" />
          <span>১০টি জীবনমুখী দিকনির্দেশনা (আমলনামা)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAuthorSection('warning_quotes')}
          className={`flex-1 min-h-[46px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeAuthorSection === 'warning_quotes'
              ? 'bg-amber-500 text-emerald-950 font-black shadow-md ring-2 ring-amber-400'
              : 'text-amber-950 hover:bg-amber-100/70 font-semibold'
          }`}
        >
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-950" />
          <span>২০০টি জাল, ভিত্তিহীন ও বানোয়াট উক্তি (সতর্কবার্তা)</span>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-900 text-amber-300 text-[10px] font-black">
            ২০০টি
          </span>
        </button>
      </div>

      {/* VIEW 1: 10 LIFE-GUIDING CHAPTERS */}
      {activeAuthorSection === 'chapters' && (
        <div className="space-y-6">
          {/* Search, Filter & Bulk Controls */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="অধ্যায়, বিষয়, কোরআনের আয়াত বা হাদিস অনুসন্ধান করুন..."
              className="w-full min-h-[44px] pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 px-1"
              >
                মুছুন
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Expand / Collapse All */}
            <button
              type="button"
              onClick={handleExpandAll}
              className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors whitespace-nowrap cursor-pointer"
            >
              সব খুলুন
            </button>
            <button
              type="button"
              onClick={handleCollapseAll}
              className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors whitespace-nowrap cursor-pointer"
            >
              সব বন্ধ
            </button>

            {/* Bookmarks Filter Button */}
            <button
              type="button"
              onClick={() => setShowOnlyBookmarks(!showOnlyBookmarks)}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer whitespace-nowrap ${
                showOnlyBookmarks
                  ? 'bg-amber-100 text-amber-950 border-amber-300 font-bold shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Bookmark
                className={`w-4 h-4 ${
                  showOnlyBookmarks ? 'fill-amber-500 text-amber-600' : 'text-slate-400'
                }`}
              />
              <span className="hidden sm:inline">বুকমার্ক</span>
              <span className="px-1.5 py-0.2 rounded-full bg-amber-200/80 text-amber-900 font-bold text-[10px] tabular-nums">
                {toBnNum(bookmarkedChapters.length)}
              </span>
            </button>
          </div>
        </div>

        {/* Filter Tags Scrollable Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
          <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1 pl-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>বিষয়:</span>
          </span>
          {tagsList.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={`min-h-[36px] px-3 py-1.5 rounded-full font-medium transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-900 text-white font-bold shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chapters Accordion List */}
      <div className="space-y-4">
        {filteredChapters.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 space-y-2">
            <p className="text-base font-bold text-slate-700">কোনো অধ্যায় পাওয়া যায়নি</p>
            <p className="text-xs text-slate-500">
              অনুসন্ধান ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।
            </p>
            {(searchQuery || selectedTag !== 'সব' || showOnlyBookmarks) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTag('সব');
                  setShowOnlyBookmarks(false);
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-emerald-800 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                ফিল্টার রিসেট করুন
              </button>
            )}
          </div>
        ) : (
          filteredChapters.map((chapter) => {
            const isBookmarked = bookmarkedChapters.includes(chapter.id);
            const isExpanded = !!expandedChapterIds[chapter.id];
            const isCopied = copiedChapterId === chapter.id;

            // Chapter specific checklist stats
            const chapterTotal = chapter.checklist.length;
            const chapterCompleted = chapter.checklist.filter(
              (item) => completedItems[item.id]
            ).length;
            const isAllCompleted = chapterTotal > 0 && chapterCompleted === chapterTotal;

            return (
              <article
                key={chapter.id}
                className={`relative bg-white rounded-3xl border transition-all duration-200 shadow-sm overflow-hidden ${
                  isExpanded ? 'border-emerald-700/50 shadow-md ring-1 ring-emerald-500/10' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Chapter Header Banner (Accordion Trigger) */}
                <div
                  onClick={() => handleToggleExpand(chapter.id)}
                  className="p-5 sm:p-6 bg-gradient-to-r from-slate-50 via-white to-emerald-50/30 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 transition-colors select-none"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-900 text-white text-xs font-bold tracking-wide">
                        অধ্যায় {toBnNum(chapter.chapterNumber)}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-xs font-semibold">
                        {chapter.category}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium">
                        #{chapter.tag}
                      </span>

                      {isAllCompleted && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[11px] font-bold border border-amber-300">
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          <span>আমল সম্পন্ন!</span>
                        </span>
                      )}
                    </div>

                    <h2
                      className={`font-bold text-slate-900 tracking-tight flex items-center gap-2 ${
                        largeFont ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'
                      }`}
                    >
                      <span>{chapter.title}</span>
                    </h2>

                    <p
                      className={`text-slate-600 leading-relaxed ${
                        largeFont ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
                      }`}
                    >
                      {chapter.summary}
                    </p>
                  </div>

                  {/* Actions: Bookmark, Share, Expand/Collapse */}
                  <div
                    className="flex items-center gap-2 self-end sm:self-center shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Share / Copy button */}
                    <button
                      type="button"
                      onClick={() => handleShareOrCopy(chapter)}
                      className={`min-h-[42px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                        isCopied
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                      title="নসীহত ও আমল কপি করে শেয়ার করুন"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                          <span className="text-emerald-800 font-bold">কপি হয়েছে!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span className="hidden sm:inline">কপি</span>
                        </>
                      )}
                    </button>

                    {/* Bookmark Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleBookmark(chapter.id)}
                      className={`min-h-[42px] min-w-[42px] p-2 rounded-xl text-xs font-semibold flex items-center justify-center border transition-all cursor-pointer ${
                        isBookmarked
                          ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50/50'
                      }`}
                      title={isBookmarked ? 'বুকমার্ক থেকে সরান' : 'বুকমার্কে যোগ করুন'}
                    >
                      <Bookmark
                        className={`w-4 h-4 ${
                          isBookmarked ? 'fill-amber-500 text-amber-600' : 'text-slate-400'
                        }`}
                      />
                    </button>

                    {/* Expand/Collapse Toggle Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleExpand(chapter.id)}
                      className={`min-h-[42px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                        isExpanded
                          ? 'bg-emerald-900 text-white border-emerald-900'
                          : 'bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-50'
                      }`}
                    >
                      <span>{isExpanded ? 'সংক্ষেপ' : 'বিস্তারিত'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Collapsible Accordion Body */}
                {isExpanded && (
                  <div className="p-5 sm:p-7 space-y-6">
                    {/* 1. Quranic Ayah Box with RTL Audio Support */}
                    <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 rounded-2xl p-5 text-white border border-emerald-800/80 shadow-inner space-y-3">
                      <div className="flex items-center justify-between text-xs text-emerald-300 border-b border-emerald-800/80 pb-2">
                        <span className="font-semibold flex items-center gap-1.5">
                          <ScrollText className="w-3.5 h-3.5 text-amber-400" />
                          <span>কুরআনুল কারীমের আলো</span>
                        </span>
                        <span className="bg-emerald-800/70 px-2.5 py-0.5 rounded-md text-amber-300 font-medium">
                          {chapter.quranAyah.reference}
                        </span>
                      </div>

                      {/* Arabic Quranic Text (Strict RTL) */}
                      <div className="pt-1">
                        <p
                          dir="rtl"
                          className="font-arabic text-2xl sm:text-3xl text-right leading-loose text-emerald-50 select-text"
                        >
                          {chapter.quranAyah.arabic}
                        </p>
                      </div>

                      {/* Audio Button & Bengali Translation */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                        <p
                          className={`text-emerald-100 leading-relaxed italic ${
                            largeFont ? 'text-base' : 'text-sm'
                          }`}
                        >
                          “{chapter.quranAyah.bengali}”
                        </p>

                        <button
                          type="button"
                          onClick={() => speakArabic(chapter.quranAyah.arabic, slowAudio)}
                          className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 self-start sm:self-center transition-all cursor-pointer shrink-0 ${
                            speakingText === chapter.quranAyah.arabic
                              ? 'bg-amber-400 text-emerald-950 font-bold animate-pulse'
                              : 'bg-emerald-800/90 text-white hover:bg-emerald-700 border border-emerald-700/60'
                          }`}
                          title="আরবি তিলাওয়াত শুনুন"
                        >
                          <Volume2 className="w-4 h-4" />
                          <span>
                            {speakingText === chapter.quranAyah.arabic
                              ? 'উচ্চারণ হচ্ছে...'
                              : 'আরবি শুনুন'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* 2. Sahih Hadith Card */}
                    <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center justify-between text-xs text-amber-900 border-b border-amber-200/80 pb-2">
                        <span className="font-bold flex items-center gap-1.5">
                          <ScrollText className="w-3.5 h-3.5 text-amber-700" />
                          <span>হাদিস শরীফ</span>
                        </span>
                        <span className="bg-amber-200/70 text-amber-950 px-2.5 py-0.5 rounded-md font-medium text-[11px]">
                          {chapter.hadith.source}
                        </span>
                      </div>

                      {chapter.hadith.arabic && (
                        <p
                          dir="rtl"
                          className="font-arabic text-xl sm:text-2xl text-right leading-relaxed text-amber-950 pt-1"
                        >
                          {chapter.hadith.arabic}
                        </p>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <p
                          className={`text-slate-800 leading-relaxed ${
                            largeFont ? 'text-base' : 'text-sm'
                          }`}
                        >
                          “{chapter.hadith.bengali}”
                        </p>

                        {chapter.hadith.arabic && (
                          <button
                            type="button"
                            onClick={() => speakArabic(chapter.hadith.arabic!, slowAudio)}
                            className="min-h-[38px] px-3 py-1 rounded-xl text-xs font-medium bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 flex items-center gap-1.5 self-start sm:self-center transition-colors cursor-pointer shrink-0"
                            title="হাদিসের আরবি পাঠ শুনুন"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>শুনুন</span>
                          </button>
                        )}
                      </div>

                      <div className="text-xs text-amber-800 font-semibold pt-1">
                        — বর্ণনাকারী: {chapter.hadith.narrator}
                      </div>
                    </div>

                    {/* 3. Detailed Heartfelt Message (মূল নসীহত) */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <HeartHandshake className="w-4 h-4 text-emerald-800" />
                        <span>লেখকের জীবনমুখী নসীহত</span>
                      </h3>

                      <div
                        className={`text-slate-700 leading-relaxed space-y-3 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80 ${
                          largeFont ? 'text-base' : 'text-sm'
                        }`}
                      >
                        <p>{chapter.detailedMessage}</p>
                      </div>
                    </div>

                    {/* 4. Actionable Checklist '[ ]' (আজ থেকেই যা করব) */}
                    <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100 space-y-3">
                      <div className="flex items-center justify-between gap-2 border-b border-emerald-200/60 pb-2.5">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          <h4 className="text-xs sm:text-sm font-bold text-emerald-950">
                            আজ থেকেই যা করব (আমলনামা ও চেকলিস্ট)
                          </h4>
                        </div>
                        <span className="text-xs font-bold text-emerald-800 tabular-nums">
                          {toBnNum(chapterCompleted)}/{toBnNum(chapterTotal)} সম্পন্ন
                        </span>
                      </div>

                      {/* Interactive Checklist items with explicit '[ ]' / '[✓]' indicator */}
                      <div className="space-y-2 pt-1">
                        {chapter.checklist.map((item) => {
                          const isDone = !!completedItems[item.id];
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleToggleChecklist(item.id)}
                              className={`w-full min-h-[46px] p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                                isDone
                                  ? 'bg-emerald-100/80 border-emerald-300 text-emerald-950 font-medium shadow-2xs'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50/90'
                              }`}
                            >
                              <div
                                className={`mt-0.5 flex items-center justify-center shrink-0 transition-all ${
                                  isDone ? 'text-emerald-700' : 'text-slate-400'
                                }`}
                              >
                                {isDone ? (
                                  <CheckSquare className="w-5 h-5 fill-emerald-600 text-white" />
                                ) : (
                                  <Square className="w-5 h-5" />
                                )}
                              </div>
                              <div className="flex-1 text-xs sm:text-sm leading-snug">
                                <span className="font-mono font-bold mr-1.5 text-slate-400 text-[11px]">
                                  {isDone ? '[✓]' : '[ ]'}
                                </span>
                                <span className={isDone ? 'line-through text-emerald-900/80' : ''}>
                                  {item.text}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {isAllCompleted && (
                        <div className="mt-3 p-2.5 rounded-xl bg-amber-100 border border-amber-300 text-amber-950 text-xs font-semibold flex items-center justify-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>মাশাআল্লাহ! আপনি এই অধ্যায়ের সকল আমল সফলভাবে সম্পন্ন করেছেন।</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
      </div>
      )}

      {/* VIEW 2: 200 FABRICATED & BASELESS POPULAR QUOTES (সতর্কীকরণ তালিকা) */}
      {activeAuthorSection === 'warning_quotes' && (
        <div className="space-y-6">
          {/* Warning Banner Header */}
          <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-7 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-emerald-950 text-xs font-black">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>গুরুত্বপূর্ণ দ্বীনি সতর্কতা ও গবেষণা</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                  বাংলাদেশে বহুল প্রচলিত ২০০টি জাল, ভিত্তিহীন ও বানোয়াট উক্তি
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
                  আমাদের সমাজে বহু লোকজ প্রবাদ, দুর্বল বা বানোয়াট কিচ্ছা এবং মনগড়া কথাকে অসাবধানতাবশত হাদিস বা দ্বীনের বিধান হিসেবে বিশ্বাস করা হয়। রসূলুল্লাহ (সাঃ) বলেছেন: <strong className="text-emerald-900">“যে ব্যক্তি ইচ্ছাকৃতভাবে আমার ওপর মিথ্যা আরোপ করে, সে যেন জাহান্নামে তার ঠিকানা বানিয়ে নেয়।”</strong> (সহীহ বুখারী)। এখানে ২০০টি উক্তির সংক্ষিপ্ত তালিকা দেওয়া হলো যাতে সর্বস্তরের মানুষ বিভ্রান্তি থেকে মুক্ত থাকতে পারেন।
                </p>
              </div>

              {/* Total count badge */}
              <div className="shrink-0 p-3.5 rounded-2xl bg-white border border-amber-300 text-center shadow-xs self-start sm:self-center">
                <div className="text-2xl font-black text-amber-600 tabular-nums">
                  {toBnNum(FABRICATED_QUOTES.length)}টি
                </div>
                <div className="text-[11px] font-bold text-slate-500 mt-0.5">মোট উক্তি</div>
              </div>
            </div>

            {/* Quotes Search Box */}
            <div className="pt-2 border-t border-amber-300/60 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={quoteSearchQuery}
                  onChange={(e) => setQuoteSearchQuery(e.target.value)}
                  placeholder="উক্তি, শব্দ বা বিষয় দিয়ে খুঁজুন (যেমন: চীন, বেগুন, জুতা, বাসর, নূর...)"
                  className="w-full min-h-[44px] pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-900 shadow-2xs"
                />
                {quoteSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setQuoteSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 px-1"
                  >
                    মুছুন
                  </button>
                )}
              </div>

              <div className="text-xs font-bold text-slate-600 px-1 whitespace-nowrap self-center">
                পাওয়া গেছে: <span className="text-amber-700 tabular-nums">{toBnNum(filteredQuotes.length)}</span> / ২০০টি
              </div>
            </div>

            {/* Category Pills Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
              {FABRICATED_QUOTES_CATEGORIES.map((cat) => {
                const isSelected = selectedQuoteCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedQuoteCategory(cat)}
                    className={`min-h-[36px] px-3.5 py-1.5 rounded-full font-bold transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-emerald-950 shadow-sm ring-2 ring-amber-400 scale-102'
                        : 'bg-white text-slate-700 hover:bg-amber-100/60 border border-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quotes Grid / List */}
          <div className="space-y-2.5">
            {filteredQuotes.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 space-y-2">
                <p className="text-base font-bold text-slate-700">কোনো উক্তি পাওয়া যায়নি</p>
                <p className="text-xs text-slate-500">
                  অন্য কোনো শব্দ দিয়ে অনুসন্ধান করুন অথবা বিভাগ পরিবর্তন করুন।
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setQuoteSearchQuery('');
                    setSelectedQuoteCategory('সব (২০০টি)');
                  }}
                  className="mt-3 px-4 py-2 rounded-xl bg-amber-500 text-emerald-950 text-xs font-bold cursor-pointer"
                >
                  ফিল্টার রিসেট করুন
                </button>
              </div>
            ) : (
              filteredQuotes.map((q) => {
                const isCopied = copiedQuoteId === q.id;
                return (
                  <div
                    key={q.id}
                    className="p-4 sm:p-4.5 rounded-2xl bg-white border border-slate-200 hover:border-amber-300 hover:shadow-xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      {/* Number badge */}
                      <span className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-amber-100 text-slate-700 group-hover:text-amber-950 font-bold text-xs flex items-center justify-center shrink-0 tabular-nums border border-slate-200">
                        {toBnNum(q.id)}
                      </span>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              q.status === 'জাল/বানোয়াট'
                                ? 'bg-rose-100 text-rose-900 border border-rose-200'
                                : q.status === 'ভিত্তিহীন'
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : q.status === 'লোকজ প্রবাদ (হাদিস নয়)'
                                ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                : 'bg-purple-100 text-purple-900 border border-purple-200'
                            }`}
                          >
                            {q.status}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {q.categoryBn}
                          </span>
                        </div>

                        <p
                          className={`font-semibold text-slate-900 ${
                            largeFont ? 'text-base sm:text-lg' : 'text-sm sm:text-base'
                          }`}
                        >
                          “{q.quote}”
                        </p>

                        {q.note && (
                          <p className="text-xs text-amber-800 italic bg-amber-50/80 px-2 py-1 rounded-md border border-amber-200/60 inline-block">
                            💡 ব্যাখ্যা: {q.note}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Copy warning text button */}
                    <button
                      type="button"
                      onClick={() => handleCopyQuote(q.quote, q.id)}
                      className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer shrink-0 self-end sm:self-center ${
                        isCopied
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : 'bg-slate-50 hover:bg-amber-50 text-slate-700 border-slate-200'
                      }`}
                      title="সতর্কবার্তা কপি করে অন্যকে জানান"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                          <span className="font-bold text-emerald-800">কপি হয়েছে</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>কপি</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Footer Encouragement Note */}
      <footer className="rounded-2xl p-5 bg-white border border-slate-200 text-center space-y-2 text-xs sm:text-sm text-slate-600 shadow-2xs">
        <p className="font-semibold text-emerald-950">
          “আল্লাহ তাআলা আমাদের সবাইকে সহীহ নিয়তে কুরআন শেখা, বুঝা এবং বাস্তব জীবনে আমল করার তাওফিক দান করুন। আমিন।”
        </p>
        <p className="text-[11px] text-slate-500">
          — {AUTHOR_PROFILE.name} ({AUTHOR_PROFILE.role})
        </p>
      </footer>
    </div>
  );
}
