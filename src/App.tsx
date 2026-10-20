import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Layers,
  GitBranch,
  Compass,
  Clock,
  BookMarked,
  Volume2,
  Type,
  Bookmark,
  HeartHandshake,
  PenTool,
  Sparkles,
} from 'lucide-react';
import {
  UserProgressState,
  DailyReminderSettings,
  getInitialProgressState,
  saveProgressState,
  computeNextSRS,
  getTodayStr,
} from './utils/storage';
import { subscribeSpeechState, speakArabic, toBnNum } from './utils/speech';
import { AlphabetView } from './components/AlphabetView';
import { WordsView } from './components/WordsView';
import { RootsView } from './components/RootsView';
import { GrammarView } from './components/GrammarView';
import { DailyPlanView } from './components/DailyPlanView';
import { QuranPracticeView } from './components/QuranPracticeView';
import { FavoritesView } from './components/FavoritesView';
import { AuthorMessagesView } from './components/AuthorMessagesView';

type TabKey =
  | 'alphabet'
  | 'words'
  | 'roots'
  | 'grammar'
  | 'plan'
  | 'quran'
  | 'messages'
  | 'favorites';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      if (
        ['alphabet', 'words', 'roots', 'grammar', 'plan', 'quran', 'messages', 'favorites'].includes(
          hash
        )
      ) {
        return hash as TabKey;
      }
    }
    return 'messages';
  });
  const [targetSurahForPractice, setTargetSurahForPractice] = useState<number | null>(null);
  const [progress, setProgress] = useState<UserProgressState>(() => getInitialProgressState());
  const [speakingText, setSpeakingText] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.location.hash = activeTab;
    }
  }, [activeTab]);

  useEffect(() => {
    const unsub = subscribeSpeechState((txt) => setSpeakingText(txt));
    return unsub;
  }, []);

  useEffect(() => {
    saveProgressState(progress);
  }, [progress]);

  // Toggle letter mastery (1..28)
  const handleToggleLetterMastered = useCallback((letterId: number) => {
    setProgress((prev) => {
      const exists = prev.masteredLetters.includes(letterId);
      const nextLetters = exists
        ? prev.masteredLetters.filter((id) => id !== letterId)
        : [...prev.masteredLetters, letterId];
      return {
        ...prev,
        masteredLetters: nextLetters,
      };
    });
  }, []);

  // Rate word with Spaced Repetition SM-2
  const handleRateWord = useCallback((wordId: number, rating: 'again' | 'good' | 'easy') => {
    setProgress((prev) => {
      const today = getTodayStr();
      const existing = prev.wordSRS[wordId];
      const updatedSRS = computeNextSRS(existing, wordId, rating);

      const currentLog = prev.dailyLogs[today] || {
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

      const isNewWord = !existing;
      const updatedLog = {
        ...currentLog,
        wordsLearned: isNewWord ? currentLog.wordsLearned + 1 : currentLog.wordsLearned,
        wordsReviewed: !isNewWord ? currentLog.wordsReviewed + 1 : currentLog.wordsReviewed,
      };

      return {
        ...prev,
        wordSRS: {
          ...prev.wordSRS,
          [wordId]: updatedSRS,
        },
        dailyLogs: {
          ...prev.dailyLogs,
          [today]: updatedLog,
        },
      };
    });
  }, []);

  // Change daily word goal (5, 8, or 10)
  const handleChangeDailyGoal = useCallback((goal: 5 | 8 | 10) => {
    setProgress((prev) => ({
      ...prev,
      dailyWordGoal: goal,
    }));
  }, []);

  // Toggle explored 3-letter root
  const handleToggleRootExplored = useCallback((rootId: number) => {
    setProgress((prev) => {
      const exists = prev.exploredRoots.includes(rootId);
      return {
        ...prev,
        exploredRoots: exists
          ? prev.exploredRoots.filter((id) => id !== rootId)
          : [...prev.exploredRoots, rootId],
      };
    });
  }, []);

  // Toggle grammar sentence completion
  const handleToggleGrammarCompleted = useCallback((grammarId: number) => {
    setProgress((prev) => {
      const exists = prev.completedGrammarIds.includes(grammarId);
      return {
        ...prev,
        completedGrammarIds: exists
          ? prev.completedGrammarIds.filter((id) => id !== grammarId)
          : [...prev.completedGrammarIds, grammarId],
      };
    });
  }, []);

  // Toggle Ayah practiced
  const handleToggleAyahPracticed = useCallback((ayahKey: string) => {
    setProgress((prev) => {
      const today = getTodayStr();
      const exists = prev.practicedAyahKeys.includes(ayahKey);
      const nextKeys = exists
        ? prev.practicedAyahKeys.filter((k) => k !== ayahKey)
        : [...prev.practicedAyahKeys, ayahKey];

      const currentLog = prev.dailyLogs[today] || {
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

      return {
        ...prev,
        practicedAyahKeys: nextKeys,
        dailyLogs: {
          ...prev.dailyLogs,
          [today]: {
            ...currentLog,
            ayahsPracticed: !exists ? currentLog.ayahsPracticed + 1 : currentLog.ayahsPracticed,
          },
        },
      };
    });
  }, []);

  // Toggle Favorite Ayah
  const handleToggleFavoriteAyah = useCallback((ayahKey: string) => {
    setProgress((prev) => {
      const currentList = prev.favoriteAyahKeys || [];
      const exists = currentList.includes(ayahKey);
      return {
        ...prev,
        favoriteAyahKeys: exists
          ? currentList.filter((k) => k !== ayahKey)
          : [...currentList, ayahKey],
      };
    });
  }, []);

  // Toggle Favorite Word
  const handleToggleFavoriteWord = useCallback((wordId: number) => {
    setProgress((prev) => {
      const currentList = prev.favoriteWordIds || [];
      const exists = currentList.includes(wordId);
      return {
        ...prev,
        favoriteWordIds: exists
          ? currentList.filter((id) => id !== wordId)
          : [...currentList, wordId],
      };
    });
  }, []);

  // Mark 20-minute daily plan step completed
  const handleMarkPlanStep = useCallback(
    (step: 'step1NewWords' | 'step2Review' | 'step3AyahPractice') => {
      setProgress((prev) => {
        const today = getTodayStr();
        const currentLog = prev.dailyLogs[today] || {
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

        return {
          ...prev,
          dailyLogs: {
            ...prev.dailyLogs,
            [today]: {
              ...currentLog,
              planStepsCompleted: {
                ...currentLog.planStepsCompleted,
                [step]: true,
              },
            },
          },
        };
      });
    },
    []
  );

  // Increment study minute
  const handleAddStudyMinute = useCallback(() => {
    setProgress((prev) => {
      const today = getTodayStr();
      const currentLog = prev.dailyLogs[today] || {
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

      return {
        ...prev,
        dailyLogs: {
          ...prev.dailyLogs,
          [today]: {
            ...currentLog,
            minutesStudied: currentLog.minutesStudied + 1,
          },
        },
      };
    });
  }, []);

  // Update daily word goal reminder settings
  const handleUpdateReminderSettings = useCallback(
    (settings: Partial<DailyReminderSettings>) => {
      setProgress((prev) => ({
        ...prev,
        dailyReminder: {
          enabled: true,
          reminderTime: '17:00',
          browserNotificationsEnabled: false,
          soundEnabled: true,
          ...prev.dailyReminder,
          ...settings,
        },
      }));
    },
    []
  );

  // Toggle virtual badge unlock status
  const handleToggleBadge = useCallback((badgeId: string) => {
    setProgress((prev) => {
      const currentList = prev.unlockedBadgeIds || [];
      const exists = currentList.includes(badgeId);
      const nextBadges = exists
        ? currentList.filter((id) => id !== badgeId)
        : [...currentList, badgeId];
      return {
        ...prev,
        unlockedBadgeIds: nextBadges,
      };
    });
  }, []);

  const navItems: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'alphabet', label: 'বর্ণমালা', icon: BookOpen },
    { key: 'words', label: '৩০০ শব্দ', icon: Layers },
    { key: 'roots', label: 'শব্দমূল', icon: GitBranch },
    { key: 'grammar', label: 'সহজ ব্যাকরণ', icon: Compass },
    { key: 'quran', label: 'কুরআন চর্চা', icon: BookMarked },
    { key: 'messages', label: 'লেখকের বাণী', icon: PenTool },
    { key: 'plan', label: '২০ মিনিট প্ল্যান', icon: Clock },
    { key: 'favorites', label: 'আমার প্রিয়', icon: Bookmark },
  ];

  const totalLearnedWords = Object.keys(progress.wordSRS).length;
  const totalFavoritesCount =
    (progress.favoriteAyahKeys?.length || 0) + (progress.favoriteWordIds?.length || 0);

  return (
    <div
      className={`min-h-screen flex flex-col bg-[#F8FAF9] text-slate-900 pb-28 sm:pb-24 md:pb-16 pb-safe ${
        progress.largeFontMode ? 'text-lg' : 'text-base'
      }`}
    >
      {/* Top Bar Contract: Strictly 3 Zones (Brand Wordmark, Clean Text Nav Links, Primary Actions) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Single Text Element Brand Wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('alphabet');
          }}
          className="text-xl md:text-2xl font-bold tracking-tight text-emerald-950 whitespace-nowrap"
        >
          আরবি সহজ
        </a>

        {/* Zone 2: Clean Text Navigation Links with subtle hover/active underlines */}
        <nav className="hidden md:flex items-center gap-5 text-sm font-semibold text-slate-600">
          {navItems.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key)}
                className={`py-2 transition-colors whitespace-nowrap shrink-0 border-b-2 flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'text-emerald-900 border-emerald-800 font-bold'
                    : 'border-transparent hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <span>{item.label}</span>
                {item.key === 'favorites' && totalFavoritesCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold tabular-nums">
                    {toBnNum(totalFavoritesCount)}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Actions (Favorites quick-button, Slow Audio Toggle & Large Font Toggle) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('favorites')}
            className={`min-h-[44px] min-w-[44px] px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
              activeTab === 'favorites'
                ? 'bg-amber-100 text-amber-950 border-amber-300 font-bold'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50/60'
            }`}
            title="আমার বুকমার্ক ও প্রিয় সংগ্রহ"
          >
            <Bookmark
              className={`w-4 h-4 shrink-0 ${
                activeTab === 'favorites' || totalFavoritesCount > 0
                  ? 'fill-amber-500 text-amber-600'
                  : 'text-slate-400'
              }`}
            />
            <span className="hidden sm:inline">প্রিয়</span>
            <span className="px-1.5 py-0.5 rounded-full bg-amber-200/90 text-amber-900 font-bold text-[10px] tabular-nums">
              {toBnNum(totalFavoritesCount)}
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              setProgress((prev) => ({
                ...prev,
                slowAudioDefault: !prev.slowAudioDefault,
              }))
            }
            className={`min-h-[44px] min-w-[44px] px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
              progress.slowAudioDefault
                ? 'bg-emerald-800 text-white border-emerald-800'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="ধীরগতিতে স্পষ্ট আরবি উচ্চারণ শুনুন"
          >
            <Volume2 className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">
              {progress.slowAudioDefault ? 'ধীর উচ্চারণ: চালু' : 'ধীর উচ্চারণ'}
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              setProgress((prev) => ({
                ...prev,
                largeFontMode: !prev.largeFontMode,
              }))
            }
            className={`min-h-[44px] min-w-[44px] px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
              progress.largeFontMode
                ? 'bg-emerald-800 text-white border-emerald-800'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="বয়স্ক ও শিশুদের সুবিধার জন্য বড় অক্ষর চালু করুন"
          >
            <Type className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">
              {progress.largeFontMode ? 'বড় অক্ষর: চালু' : 'বড় অক্ষর'}
            </span>
          </button>
        </div>
      </header>

      {/* 100% Mobile-Friendly Horizontal Pill Navigation Bar (All 8 Sections Easily Accessible & Visible) */}
      <nav
        aria-label="বিভাগ নির্বাচন"
        className="sticky top-16 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 md:px-8 py-2 overflow-x-auto no-scrollbar flex items-center gap-2"
      >
        <span className="text-[11px] font-bold text-slate-400 shrink-0 uppercase tracking-wider pl-1 hidden sm:inline">
          বিভাগ:
        </span>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveTab(item.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
              {item.key === 'favorites' && totalFavoritesCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[9px] font-bold">
                  {toBnNum(totalFavoritesCount)}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Subtle Welcome & Progress Strip */}
      <section className="bg-emerald-900 text-white border-b border-emerald-800">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => speakArabic('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', progress.slowAudioDefault)}
              className="font-arabic text-2xl md:text-3xl text-emerald-200 hover:text-white transition-colors cursor-pointer"
              title="ট্যাপ করে বিসমিল্লাহর উচ্চারণ শুনুন"
            >
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </button>
            <span aria-hidden="true" className="hidden sm:inline text-emerald-600">
              ·
            </span>
            <p className="text-xs md:text-sm text-emerald-100">
              বাংলাভাষী সব বয়সের মানুষের জন্য সহজ আরবি বর্ণমালা ও কুরআনের অর্থ শিক্ষা
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-emerald-100 tabular-nums">
            <span>বর্ণ: {toBnNum(progress.masteredLetters.length)}/২৮</span>
            <span aria-hidden="true">·</span>
            <span>শব্দ: {toBnNum(totalLearnedWords)}/৩০০</span>
            <span aria-hidden="true">·</span>
            <span>আয়াত: {toBnNum(progress.practicedAyahKeys.length)}</span>
            <button
              type="button"
              onClick={() => setActiveTab('plan')}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-white/95 text-emerald-950 font-bold hover:bg-white transition-colors whitespace-nowrap cursor-pointer shadow-xs"
            >
              ২০ মিনিটের প্ল্যান →
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Container (1440px desktop baseline with max-w-7xl) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8">
        {activeTab === 'alphabet' && (
          <AlphabetView
            masteredLetters={progress.masteredLetters}
            onToggleMastered={handleToggleLetterMastered}
            slowAudio={progress.slowAudioDefault}
            speakingText={speakingText}
            largeFont={progress.largeFontMode}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'words' && (
          <WordsView
            wordSRS={progress.wordSRS}
            dailyWordGoal={progress.dailyWordGoal}
            onChangeDailyGoal={handleChangeDailyGoal}
            onRateWord={handleRateWord}
            slowAudio={progress.slowAudioDefault}
            speakingText={speakingText}
            largeFont={progress.largeFontMode}
            favoriteWordIds={progress.favoriteWordIds || []}
            onToggleFavoriteWord={handleToggleFavoriteWord}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'roots' && (
          <RootsView
            exploredRoots={progress.exploredRoots}
            onToggleRootExplored={handleToggleRootExplored}
            slowAudio={progress.slowAudioDefault}
            largeFont={progress.largeFontMode}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'grammar' && (
          <GrammarView
            completedGrammarIds={progress.completedGrammarIds}
            onToggleGrammarCompleted={handleToggleGrammarCompleted}
            slowAudio={progress.slowAudioDefault}
            largeFont={progress.largeFontMode}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'plan' && (
          <DailyPlanView
            progress={progress}
            onRateWord={handleRateWord}
            onMarkPlanStep={handleMarkPlanStep}
            onAddStudyMinute={handleAddStudyMinute}
            onNavigateTab={setActiveTab}
            slowAudio={progress.slowAudioDefault}
            largeFont={progress.largeFontMode}
            onUpdateReminderSettings={handleUpdateReminderSettings}
            onToggleBadge={handleToggleBadge}
          />
        )}

        {activeTab === 'quran' && (
          <QuranPracticeView
            practicedAyahKeys={progress.practicedAyahKeys}
            onToggleAyahPracticed={handleToggleAyahPracticed}
            favoriteAyahKeys={progress.favoriteAyahKeys || []}
            onToggleFavoriteAyah={handleToggleFavoriteAyah}
            favoriteWordIds={progress.favoriteWordIds || []}
            onToggleFavoriteWord={handleToggleFavoriteWord}
            slowAudio={progress.slowAudioDefault}
            speakingText={speakingText}
            largeFont={progress.largeFontMode}
            initialSurahNumber={targetSurahForPractice}
            onNavigateTab={(tab) => setActiveTab(tab as TabKey)}
          />
        )}

        {activeTab === 'messages' && (
          <AuthorMessagesView
            slowAudio={progress.slowAudioDefault}
            speakingText={speakingText}
            largeFont={progress.largeFontMode}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'favorites' && (
          <FavoritesView
            favoriteAyahKeys={progress.favoriteAyahKeys || []}
            favoriteWordIds={progress.favoriteWordIds || []}
            onToggleFavoriteAyah={handleToggleFavoriteAyah}
            onToggleFavoriteWord={handleToggleFavoriteWord}
            slowAudio={progress.slowAudioDefault}
            speakingText={speakingText}
            largeFont={progress.largeFontMode}
            onNavigateTab={setActiveTab}
            onSelectSurahForPractice={(surahNum) => {
              setTargetSurahForPractice(surahNum);
              setActiveTab('quran');
            }}
          />
        )}
      </main>

      {/* Clean Desktop Footer */}
      <footer className="hidden md:block border-t border-slate-200 bg-white py-6 px-8 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            আরবি সহজ — বাংলাভাষী সব বয়সের মানুষের জন্য আরবি বর্ণমালা, ৩০০ উচ্চ-ফ্রিকোয়েন্সি শব্দ ও কুরআনের অর্থ শিক্ষা।
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('alphabet')}
              className="hover:text-emerald-800 transition-colors"
            >
              বর্ণমালা
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('words')}
              className="hover:text-emerald-800 transition-colors"
            >
              ৩০০ শব্দ
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('roots')}
              className="hover:text-emerald-800 transition-colors"
            >
              শব্দমূল
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('grammar')}
              className="hover:text-emerald-800 transition-colors"
            >
              সহজ ব্যাকরণ
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('quran')}
              className="hover:text-emerald-800 transition-colors"
            >
              কুরআন চর্চা
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('messages')}
              className="hover:text-emerald-800 transition-colors"
            >
              লেখকের বাণী
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('plan')}
              className="hover:text-emerald-800 transition-colors"
            >
              ২০ মিনিটের প্ল্যান
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('favorites')}
              className="hover:text-amber-800 transition-colors font-medium text-amber-700"
            >
              আমার প্রিয় ({toBnNum(totalFavoritesCount)})
            </button>
          </div>
        </div>
      </footer>

      {/* Universal Fixed Bottom Navigation Bar - 100% Mobile Optimized */}
      <nav
        aria-label="ন্যাভিগেশন বার"
        className="fixed bottom-0 left-0 right-0 z-50 bg-white/98 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_25px_rgba(0,0,0,0.06)] px-2 pt-1.5 pb-[max(env(safe-area-inset-bottom,0px),0.5rem)] flex items-center justify-start sm:justify-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth touch-pan-x"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveTab(item.key)}
              className={`shrink-0 relative flex flex-col items-center justify-center py-1.5 px-2.5 sm:px-3.5 rounded-xl transition-all cursor-pointer min-h-[50px] min-w-[62px] active:scale-95 ${
                isActive
                  ? 'text-white font-black bg-emerald-800 shadow-md'
                  : 'text-slate-600 hover:text-emerald-900 hover:bg-emerald-50/80 font-medium'
              }`}
              title={item.label}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    isActive ? 'text-white stroke-[2.5]' : 'stroke-2'
                  }`}
                />
                {item.key === 'favorites' && totalFavoritesCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 px-1 py-0.2 rounded-full bg-amber-500 text-white font-bold text-[8px] leading-none tabular-nums shadow-xs">
                    {totalFavoritesCount > 9 ? '9+' : toBnNum(totalFavoritesCount)}
                  </span>
                )}
              </div>
              <span className="text-[10px] sm:text-xs tracking-tight mt-0.5 text-center leading-tight whitespace-nowrap select-none">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
