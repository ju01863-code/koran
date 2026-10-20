import React, { useState, useMemo, useCallback } from 'react';
import {
  Award,
  Crown,
  Flame,
  Sunrise,
  Sparkles,
  BookOpen,
  Compass,
  Trophy,
  Clock,
  Target,
  Moon,
  Layers,
  Lock,
  CheckCircle2,
  ChevronRight,
  Filter,
  X,
  Volume2,
  ExternalLink,
  Info,
  Sparkle,
  Zap,
} from 'lucide-react';
import { UserProgressState, DailyLog, getTodayStr } from '../utils/storage';
import {
  BADGES_LIST,
  BadgeDefinition,
  BADGE_TIER_STYLES,
  BadgeCategory,
} from '../data/badgesData';
import { toBnNum, playBadgeUnlockFanfare } from '../utils/speech';

interface BadgesSectionProps {
  progress: UserProgressState;
  onNavigateTab: (tab: 'alphabet' | 'words' | 'roots' | 'grammar' | 'plan' | 'quran') => void;
  onToggleBadge?: (badgeId: string) => void;
  largeFont?: boolean;
}

export const BadgesSection: React.FC<BadgesSectionProps> = ({
  progress,
  onNavigateTab,
  onToggleBadge,
  largeFont,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | 'unlocked' | 'locked'>('all');
  const [activeModalBadge, setActiveModalBadge] = useState<BadgeDefinition | null>(null);
  const [showCelebrationToast, setShowCelebrationToast] = useState<string | null>(null);
  const [showDevSimulate, setShowDevSimulate] = useState(false);

  const today = getTodayStr();
  const todayLog: DailyLog = progress.dailyLogs?.[today] || {
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

  // Evaluate all badges with progress and state
  const evaluatedBadges = useMemo(() => {
    return BADGES_LIST.map((badge) => {
      const evaluation = badge.checkProgress(progress, todayLog);
      return {
        badge,
        evaluation,
      };
    });
  }, [progress, todayLog]);

  // Statistics
  const unlockedCount = useMemo(() => {
    return evaluatedBadges.filter((b) => b.evaluation.isUnlocked).length;
  }, [evaluatedBadges]);

  const totalBadges = evaluatedBadges.length;
  const overallUnlockedPct = Math.round((unlockedCount / totalBadges) * 100);

  // Next closest locked badge
  const nextClosestBadge = useMemo(() => {
    const lockedOnes = evaluatedBadges.filter((b) => !b.evaluation.isUnlocked);
    if (lockedOnes.length === 0) return null;
    return lockedOnes.reduce((prev, curr) =>
      curr.evaluation.percent > prev.evaluation.percent ? curr : prev
    );
  }, [evaluatedBadges]);

  // Filtered badges list
  const filteredBadges = useMemo(() => {
    return evaluatedBadges.filter(({ badge, evaluation }) => {
      if (selectedCategory === 'all') return true;
      if (selectedCategory === 'unlocked') return evaluation.isUnlocked;
      if (selectedCategory === 'locked') return !evaluation.isUnlocked;
      return badge.category === selectedCategory;
    });
  }, [evaluatedBadges, selectedCategory]);

  // Icon mapper
  const renderBadgeIcon = (iconName: BadgeDefinition['iconName'], className: string) => {
    switch (iconName) {
      case 'Sunrise':
        return <Sunrise className={className} />;
      case 'Flame':
        return <Flame className={className} />;
      case 'Crown':
        return <Crown className={className} />;
      case 'Sparkles':
        return <Sparkles className={className} />;
      case 'BookOpen':
        return <BookOpen className={className} />;
      case 'Compass':
        return <Compass className={className} />;
      case 'Trophy':
        return <Trophy className={className} />;
      case 'Clock':
        return <Clock className={className} />;
      case 'Target':
        return <Target className={className} />;
      case 'Award':
        return <Award className={className} />;
      case 'Moon':
        return <Moon className={className} />;
      case 'Layers':
        return <Layers className={className} />;
      default:
        return <Award className={className} />;
    }
  };

  const handleBadgeClick = useCallback((badge: BadgeDefinition, isUnlocked: boolean) => {
    setActiveModalBadge(badge);
    if (isUnlocked) {
      playBadgeUnlockFanfare();
    }
  }, []);

  const handleManualUnlockToggle = useCallback(
    (badgeId: string, badgeTitle: string) => {
      onToggleBadge?.(badgeId);
      playBadgeUnlockFanfare();
      setShowCelebrationToast(`‘${badgeTitle}’ ব্যাজের অবস্থা পরিবর্তিত হয়েছে!`);
      setTimeout(() => setShowCelebrationToast(null), 3500);
    },
    [onToggleBadge]
  );

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-6">
      {/* Toast Notification for celebration */}
      {showCelebrationToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-emerald-900 text-white px-5 py-3.5 rounded-2xl shadow-xl border border-emerald-700 animate-bounce">
          <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
          <span className="text-sm font-bold">{showCelebrationToast}</span>
          <button
            type="button"
            onClick={() => setShowCelebrationToast(null)}
            className="p-1 hover:bg-emerald-800 rounded-lg text-emerald-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800 tabular-nums">
            <Award className="w-4 h-4 text-amber-600" />
            <span>ভার্চুয়াল সম্মাননা ও অর্জন স্মারক · Gamified Milestones</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">
            কুরআনিক ব্যাজ ও সম্মাননা (Badges & Honors)
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            আপনার ধারাবাহিক অধ্যয়ন, শব্দভাণ্ডার আয়ত্ত ও কুরআন চর্চার বাস্তব অগ্রগতির ওপর ভিত্তি করে অর্জিত ভার্চুয়াল ব্যাজ
          </p>
        </div>

        {/* Quick Simulation / Demo Toggle */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => {
              playBadgeUnlockFanfare();
              setShowCelebrationToast('শুভকামনা! ব্যাজ আনলক ফ্যানফেয়ার বাজানো হয়েছে।');
              setTimeout(() => setShowCelebrationToast(null), 3000);
            }}
            className="min-h-[40px] px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-xs font-bold flex items-center gap-1.5 hover:bg-amber-100 transition-colors cursor-pointer"
            title="ব্যাজ অর্জনের সানাই শুনুন"
          >
            <Volume2 className="w-3.5 h-3.5 text-amber-700" />
            <span>অর্জনের সুর</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDevSimulate((s) => !s)}
            className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
            title="ব্যাজ টেস্ট ও সিমুলেশন টুলবার খুলুন"
          >
            <span>{showDevSimulate ? 'টুলবার লুকান' : 'টেস্ট টুলস'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Testing Toolbar (If toggled) */}
      {showDevSimulate && (
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-600" />
              <span>ভার্চুয়াল ব্যাজ সিমুলেশন ও দ্রুত টেস্টিং</span>
            </span>
            <span className="text-[11px] text-amber-800">
              অ্যাপের যে কোনো ভার্চুয়াল ব্যাজ তাৎক্ষণিক আনলক বা রি-লক করে পরীক্ষা করুন
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {BADGES_LIST.map((b) => {
              const isCurrentlyUnlocked =
                progress.unlockedBadgeIds?.includes(b.id) ||
                b.checkProgress(progress, todayLog).isUnlocked;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleManualUnlockToggle(b.id, b.titleBn)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                    isCurrentlyUnlocked
                      ? 'bg-emerald-700 text-white border-emerald-800'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-amber-400'
                  }`}
                >
                  {isCurrentlyUnlocked ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>{b.titleEn}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Overview Stat Box with Progress Ring / Meter */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-5 rounded-2xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 text-white">
        <div className="md:col-span-7 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
            <Sparkle className="w-4 h-4 text-amber-400" />
            <span>সম্মাননা সংগ্রহশালা (Achievement Collection)</span>
          </div>
          <h3 className="text-xl md:text-2xl font-bold">
            আপনি মোট {toBnNum(totalBadges)}টির মধ্যে{' '}
            <span className="text-amber-300">{toBnNum(unlockedCount)}টি</span> ব্যাজ অর্জন করেছেন
          </h3>
          <p className="text-xs md:text-sm text-emerald-100/90 leading-relaxed">
            প্রতিটি ব্যাজ কুরআনের শব্দ, আয়াত, সঠিক উচ্চারণ ও নিয়মিত রুটিন পালনের জীবন্ত স্মারক।
            ধারাবাহিক অধ্যয়ন বজায় রেখে বাকি ভার্চুয়াল পদকগুলো নিজের করে নিন।
          </p>

          {/* Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-emerald-200">সার্বিক ব্যাজ অগ্রগতি</span>
              <span className="text-amber-300 tabular-nums">
                {toBnNum(overallUnlockedPct)}% সম্পন্ন ({toBnNum(unlockedCount)}/{toBnNum(totalBadges)})
              </span>
            </div>
            <div className="w-full bg-emerald-950/80 rounded-full h-3 border border-emerald-700/60 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-300 transition-all duration-700"
                style={{ width: `${overallUnlockedPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tier Distribution & Next Badge Suggestion */}
        <div className="md:col-span-5 flex flex-col justify-between gap-3 bg-emerald-900/60 border border-emerald-700/50 rounded-xl p-4">
          <div>
            <span className="text-xs text-emerald-200 block font-semibold mb-2">পদক বিভাজন:</span>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-emerald-950/70 rounded-lg p-2 border border-amber-600/40">
                <span className="text-[10px] text-amber-300 block font-medium">ব্রোঞ্জ</span>
                <span className="text-base font-bold text-white tabular-nums">
                  {toBnNum(
                    evaluatedBadges.filter(
                      (b) => b.evaluation.isUnlocked && b.badge.tier === 'bronze'
                    ).length
                  )}
                </span>
              </div>
              <div className="bg-emerald-950/70 rounded-lg p-2 border border-slate-400/40">
                <span className="text-[10px] text-slate-300 block font-medium">সিলভার</span>
                <span className="text-base font-bold text-white tabular-nums">
                  {toBnNum(
                    evaluatedBadges.filter(
                      (b) => b.evaluation.isUnlocked && b.badge.tier === 'silver'
                    ).length
                  )}
                </span>
              </div>
              <div className="bg-emerald-950/70 rounded-lg p-2 border border-yellow-400/40">
                <span className="text-[10px] text-yellow-300 block font-medium">গোল্ড</span>
                <span className="text-base font-bold text-white tabular-nums">
                  {toBnNum(
                    evaluatedBadges.filter(
                      (b) => b.evaluation.isUnlocked && b.badge.tier === 'gold'
                    ).length
                  )}
                </span>
              </div>
              <div className="bg-emerald-950/70 rounded-lg p-2 border border-cyan-400/40">
                <span className="text-[10px] text-cyan-300 block font-medium">ডায়মন্ড</span>
                <span className="text-base font-bold text-white tabular-nums">
                  {toBnNum(
                    evaluatedBadges.filter(
                      (b) => b.evaluation.isUnlocked && b.badge.tier === 'diamond'
                    ).length
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Next closest badge */}
          {nextClosestBadge && (
            <div className="bg-emerald-950/90 rounded-lg p-3 border border-emerald-700/70 text-xs">
              <div className="flex items-center justify-between text-emerald-300 font-bold mb-1">
                <span className="flex items-center gap-1">
                  <Target className="w-3.5 h-3.5 text-amber-400" />
                  <span>পরবর্তী লক্ষ্য</span>
                </span>
                <span className="text-amber-300 tabular-nums">
                  {toBnNum(nextClosestBadge.evaluation.percent)}% সম্পন্ন
                </span>
              </div>
              <p className="font-bold text-white text-xs truncate">
                {nextClosestBadge.badge.titleBn}
              </p>
              <p className="text-[11px] text-emerald-200/90 mt-0.5 line-clamp-1">
                {nextClosestBadge.evaluation.tipBn}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-b border-slate-100 pb-3">
        <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" />
          <span>ফিল্টার:</span>
        </span>

        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
        >
          সকল ব্যাজ ({toBnNum(totalBadges)})
        </button>

        <button
          type="button"
          onClick={() => setSelectedCategory('unlocked')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
            selectedCategory === 'unlocked'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-300" />
          <span>অর্জিত ({toBnNum(unlockedCount)})</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedCategory('locked')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
            selectedCategory === 'locked'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
        >
          <Lock className="w-3 h-3 text-slate-400" />
          <span>লকড ({toBnNum(totalBadges - unlockedCount)})</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedCategory('streak')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            selectedCategory === 'streak'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
        >
          ধারাবাহিকতা (Streak)
        </button>

        <button
          type="button"
          onClick={() => setSelectedCategory('words')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            selectedCategory === 'words'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
        >
          শব্দ ও হরফ
        </button>

        <button
          type="button"
          onClick={() => setSelectedCategory('quran')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            selectedCategory === 'quran'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
        >
          কুরআন তিলাওয়াত
        </button>

        <button
          type="button"
          onClick={() => setSelectedCategory('habits')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            selectedCategory === 'habits'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
        >
          অভ্যাস ও রুটিন
        </button>
      </div>

      {/* Badges Grid (Responsive: 1-col on mobile, 2 on tablet, 3 on desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBadges.map(({ badge, evaluation }) => {
          const tierStyle = BADGE_TIER_STYLES[badge.tier];
          const isUnlocked = evaluation.isUnlocked;

          return (
            <div
              key={badge.id}
              onClick={() => handleBadgeClick(badge, isUnlocked)}
              className={`relative rounded-2xl border p-5 transition-all duration-300 flex flex-col justify-between cursor-pointer group ${
                isUnlocked
                  ? 'bg-white border-slate-200 hover:border-emerald-600 hover:shadow-md'
                  : 'bg-slate-50/70 border-slate-200 opacity-85 hover:opacity-100 hover:border-slate-300'
              }`}
            >
              {/* Top Tier Ribbon & Status Pill */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${tierStyle.chipClass}`}
                >
                  {tierStyle.labelBn}
                </span>

                {isUnlocked ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>অর্জিত</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-200/80 px-2.5 py-0.5 rounded-full">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>লকড ({toBnNum(evaluation.percent)}%)</span>
                  </span>
                )}
              </div>

              {/* Central Badge Graphic & Title */}
              <div className="flex items-start gap-4 my-2">
                {/* 3D Shield Emblem */}
                <div
                  className={`relative w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105 ${
                    isUnlocked
                      ? `bg-gradient-to-br ${tierStyle.badgeClass} shadow-md`
                      : 'bg-slate-200 text-slate-400 border border-slate-300'
                  }`}
                >
                  {renderBadgeIcon(
                    badge.iconName,
                    `w-7 h-7 ${isUnlocked ? 'text-white drop-shadow-sm' : 'text-slate-400'}`
                  )}

                  {/* Corner indicator */}
                  {isUnlocked && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center">
                      <Sparkles className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>

                {/* Badge Meta */}
                <div className="space-y-1 min-w-0">
                  <h4
                    className={`font-bold text-slate-900 group-hover:text-emerald-900 transition-colors leading-snug ${
                      largeFont ? 'text-base' : 'text-sm'
                    }`}
                  >
                    {badge.titleBn}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {badge.shortDescriptionBn}
                  </p>
                </div>
              </div>

              {/* Bottom Progress Bar & Action */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">
                    {isUnlocked ? 'অর্জন স্থিতি:' : 'বর্তমান অগ্রগতি:'}
                  </span>
                  <span
                    className={`font-bold tabular-nums ${
                      isUnlocked ? 'text-emerald-800' : 'text-slate-700'
                    }`}
                  >
                    {evaluation.progressText}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isUnlocked
                        ? 'bg-emerald-600'
                        : evaluation.percent > 0
                        ? 'bg-amber-500'
                        : 'bg-slate-300'
                    }`}
                    style={{ width: `${Math.max(5, evaluation.percent)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-slate-400 truncate max-w-[170px]">
                    {isUnlocked ? 'বিস্তারিত দেখতে ট্যাপ করুন' : evaluation.tipBn}
                  </span>
                  <span className="text-emerald-800 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                    <span>{isUnlocked ? 'দেখুন' : 'শুরু'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Badge Inspection / Detail Modal */}
      {activeModalBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className={`p-6 pb-8 relative overflow-hidden bg-gradient-to-br ${
                BADGE_TIER_STYLES[activeModalBadge.tier].badgeClass
              } text-white`}
            >
              <button
                type="button"
                onClick={() => setActiveModalBadge(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white/90 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center text-center space-y-3">
                {/* Large Shield Emblem */}
                <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-xl">
                  {renderBadgeIcon(activeModalBadge.iconName, 'w-10 h-10 text-white drop-shadow-md')}
                </div>

                <div className="space-y-1">
                  <span className="inline-block px-3 py-0.5 rounded-full bg-white/25 text-white font-bold text-xs backdrop-blur-sm border border-white/30">
                    {BADGE_TIER_STYLES[activeModalBadge.tier].labelBn}
                  </span>
                  <h3 className="text-2xl font-bold">{activeModalBadge.titleBn}</h3>
                  <p className="text-xs text-white/80 font-medium">{activeModalBadge.titleEn}</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-slate-800 text-sm">
              {/* Unlock Status Alert */}
              {(() => {
                const evalResult = activeModalBadge.checkProgress(progress, todayLog);
                return (
                  <div
                    className={`p-4 rounded-2xl border ${
                      evalResult.isUnlocked
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                        : 'bg-amber-50 border-amber-200 text-amber-950'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs flex items-center gap-1.5">
                        {evalResult.isUnlocked ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Lock className="w-4 h-4 text-amber-600" />
                        )}
                        <span>{evalResult.isUnlocked ? 'সম্মাননাটি অর্জিত হয়েছে' : 'সম্মাননাটি এখনও লকড'}</span>
                      </span>
                      <span className="text-xs font-bold tabular-nums">
                        {evalResult.progressText} ({toBnNum(evalResult.percent)}%)
                      </span>
                    </div>

                    <div className="w-full bg-black/10 rounded-full h-2 overflow-hidden mb-2">
                      <div
                        className={`h-full rounded-full ${
                          evalResult.isUnlocked ? 'bg-emerald-600' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.max(5, evalResult.percent)}%` }}
                      />
                    </div>

                    <p className="text-xs leading-relaxed">{evalResult.tipBn}</p>
                  </div>
                );
              })()}

              {/* Requirement */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-emerald-700" />
                  <span>ব্যাজ অর্জনের পূর্বশর্ত (Requirement)</span>
                </h4>
                <p className="text-sm font-semibold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {activeModalBadge.requirementBn}
                </p>
              </div>

              {/* Background Lore & Importance */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-emerald-700" />
                  <span>তাৎপর্য ও ফজিলত</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {activeModalBadge.loreBn}
                </p>
              </div>

              {/* Islamic Hadith or Quranic Inspiration */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
                <span className="text-[11px] font-bold text-emerald-800 block">
                  পবিত্র কুরআন ও হাদিসের অনুপ্রেরণা:
                </span>
                <p className="text-xs text-slate-800 italic leading-relaxed">
                  “{activeModalBadge.hadithOrQuoteBn}”
                </p>
                <span className="text-[11px] text-emerald-700 font-bold block text-right">
                  — {activeModalBadge.hadithSourceBn}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  playBadgeUnlockFanfare();
                  setShowCelebrationToast('আল্লাহ আপনার ইলম ও আমলে বরকত দান করুন!');
                  setTimeout(() => setShowCelebrationToast(null), 3000);
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Volume2 className="w-4 h-4 text-emerald-700" />
                <span>সুর শুনুন</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const target = activeModalBadge.targetTab;
                    setActiveModalBadge(null);
                    onNavigateTab(target);
                  }}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
                >
                  <span>অনুশীলন করতে যান</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
