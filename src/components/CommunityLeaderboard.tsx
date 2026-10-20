import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Medal,
  Award,
  Flame,
  Clock,
  Layers,
  Sparkles,
  Heart,
  TrendingUp,
  UserCheck,
  ChevronRight,
  ShieldCheck,
  Users,
  Compass,
  Zap,
} from 'lucide-react';
import { UserProgressState, addDaysToDateStr, getTodayStr } from '../utils/storage';
import { toBnNum } from '../utils/speech';

interface CommunityLeaderboardProps {
  progress: UserProgressState;
  onNavigateTab?: (tab: 'alphabet' | 'words' | 'roots' | 'grammar' | 'plan' | 'quran') => void;
  largeFont?: boolean;
}

type LeaderboardTimeframe = 'weekly' | 'monthly' | 'allTime';
type LeaderboardMetric = 'minutes' | 'words' | 'score';

interface CommunityUser {
  id: string;
  nameBn: string;
  locationBn: string;
  titleBn: string;
  avatarBg: string;
  avatarChar: string;
  streakDays: number;
  stats: {
    weekly: { minutes: number; words: number };
    monthly: { minutes: number; words: number };
    allTime: { minutes: number; words: number };
  };
  badgesCount: number;
  cheerCount: number;
  isCurrentUser?: boolean;
}

// Cohort of active community peers
const INITIAL_COMMUNITY_PEERS: CommunityUser[] = [
  {
    id: 'peer-1',
    nameBn: 'তানভীর আহমেদ',
    locationBn: 'ঢাকা',
    titleBn: 'কুরআন অভিযাত্রী',
    avatarBg: 'bg-emerald-700',
    avatarChar: 'তা',
    streakDays: 14,
    stats: {
      weekly: { minutes: 165, words: 48 },
      monthly: { minutes: 540, words: 175 },
      allTime: { minutes: 1420, words: 280 },
    },
    badgesCount: 9,
    cheerCount: 38,
  },
  {
    id: 'peer-2',
    nameBn: 'ফাতিমা নূর',
    locationBn: 'চট্টগ্রাম',
    titleBn: 'শব্দ বিশারদ',
    avatarBg: 'bg-teal-700',
    avatarChar: 'ফা',
    streakDays: 21,
    stats: {
      weekly: { minutes: 180, words: 54 },
      monthly: { minutes: 610, words: 195 },
      allTime: { minutes: 1650, words: 295 },
    },
    badgesCount: 11,
    cheerCount: 52,
  },
  {
    id: 'peer-3',
    nameBn: 'আব্দুল্লাহ আল-মামুন',
    locationBn: 'সিলেট',
    titleBn: 'মাখরাজ সাধক',
    avatarBg: 'bg-sky-700',
    avatarChar: 'আ',
    streakDays: 9,
    stats: {
      weekly: { minutes: 135, words: 36 },
      monthly: { minutes: 440, words: 140 },
      allTime: { minutes: 1180, words: 240 },
    },
    badgesCount: 7,
    cheerCount: 24,
  },
  {
    id: 'peer-4',
    nameBn: 'মারিয়াম আখতার',
    locationBn: 'রাজশাহী',
    titleBn: 'ব্যাকরণ গবেষক',
    avatarBg: 'bg-indigo-700',
    avatarChar: 'মা',
    streakDays: 12,
    stats: {
      weekly: { minutes: 145, words: 42 },
      monthly: { minutes: 490, words: 155 },
      allTime: { minutes: 1290, words: 260 },
    },
    badgesCount: 8,
    cheerCount: 31,
  },
  {
    id: 'peer-5',
    nameBn: 'নাফিস ইকবাল',
    locationBn: 'খুলনা',
    titleBn: 'নিয়মিত শিক্ষার্থী',
    avatarBg: 'bg-amber-700',
    avatarChar: 'না',
    streakDays: 6,
    stats: {
      weekly: { minutes: 110, words: 30 },
      monthly: { minutes: 380, words: 120 },
      allTime: { minutes: 980, words: 210 },
    },
    badgesCount: 6,
    cheerCount: 19,
  },
  {
    id: 'peer-6',
    nameBn: 'সুমাইয়া জাহান',
    locationBn: 'বরিশাল',
    titleBn: 'শব্দ অন্বেষী',
    avatarBg: 'bg-rose-700',
    avatarChar: 'সু',
    streakDays: 18,
    stats: {
      weekly: { minutes: 155, words: 46 },
      monthly: { minutes: 520, words: 165 },
      allTime: { minutes: 1370, words: 275 },
    },
    badgesCount: 10,
    cheerCount: 45,
  },
  {
    id: 'peer-7',
    nameBn: 'তাহমিদ হাসান',
    locationBn: 'ময়মনসিংহ',
    titleBn: 'নবীন শিক্ষার্থী',
    avatarBg: 'bg-cyan-700',
    avatarChar: 'তা',
    streakDays: 5,
    stats: {
      weekly: { minutes: 95, words: 26 },
      monthly: { minutes: 320, words: 105 },
      allTime: { minutes: 840, words: 185 },
    },
    badgesCount: 5,
    cheerCount: 14,
  },
  {
    id: 'peer-8',
    nameBn: 'আরিফুল ইসলাম',
    locationBn: 'রংপুর',
    titleBn: 'ধারাবাহিক পাঠক',
    avatarBg: 'bg-emerald-800',
    avatarChar: 'আ',
    streakDays: 8,
    stats: {
      weekly: { minutes: 120, words: 34 },
      monthly: { minutes: 410, words: 130 },
      allTime: { minutes: 1060, words: 225 },
    },
    badgesCount: 7,
    cheerCount: 22,
  },
];

export const CommunityLeaderboard: React.FC<CommunityLeaderboardProps> = ({
  progress,
  onNavigateTab,
  largeFont = false,
}) => {
  const [timeframe, setTimeframe] = useState<LeaderboardTimeframe>('weekly');
  const [metric, setMetric] = useState<LeaderboardMetric>('minutes');
  const [cheeredUserIds, setCheeredUserIds] = useState<Record<string, number>>({});
  const [cheerNotice, setCheerNotice] = useState<string | null>(null);

  const today = getTodayStr();

  // Compute Current User's Stats across Timeframes from real progress logs
  const currentUserStats = useMemo(() => {
    let weeklyMinutes = 0;
    let weeklyWords = 0;
    let monthlyMinutes = 0;
    let monthlyWords = 0;
    let allTimeMinutes = 0;
    let allTimeWords = 0;

    // Past 7 days
    for (let i = 6; i >= 0; i--) {
      const dStr = addDaysToDateStr(today, -i);
      const log = progress.dailyLogs[dStr];
      if (log) {
        weeklyMinutes += log.minutesStudied || 0;
        weeklyWords += (log.wordsLearned || 0) + (log.wordsReviewed || 0);
      }
    }

    // Past 30 days
    for (let i = 29; i >= 0; i--) {
      const dStr = addDaysToDateStr(today, -i);
      const log = progress.dailyLogs[dStr];
      if (log) {
        monthlyMinutes += log.minutesStudied || 0;
        monthlyWords += (log.wordsLearned || 0) + (log.wordsReviewed || 0);
      }
    }

    // All time across daily logs + total learned words
    Object.values(progress.dailyLogs).forEach((log) => {
      allTimeMinutes += log.minutesStudied || 0;
    });

    allTimeWords = Object.keys(progress.wordSRS).length;
    // ensure allTime is at least monthly
    allTimeMinutes = Math.max(allTimeMinutes, monthlyMinutes);
    allTimeWords = Math.max(allTimeWords, monthlyWords);

    return {
      weekly: { minutes: weeklyMinutes, words: weeklyWords },
      monthly: { minutes: monthlyMinutes, words: monthlyWords },
      allTime: { minutes: allTimeMinutes, words: allTimeWords },
    };
  }, [progress.dailyLogs, progress.wordSRS, today]);

  // Combine Current User with Peers and Rank dynamically
  const rankedUsers = useMemo(() => {
    const currentUser: CommunityUser = {
      id: 'current-user',
      nameBn: 'আপনি (You)',
      locationBn: 'আমার প্রোফাইল',
      titleBn:
        progress.streakDays >= 7
          ? 'অবিচল সাধক 🔥'
          : Object.keys(progress.wordSRS).length >= 50
          ? 'অগ্রগামী শিক্ষার্থী'
          : 'নিয়মিত শিক্ষার্থী',
      avatarBg: 'bg-amber-600',
      avatarChar: 'স্ব',
      streakDays: progress.streakDays || 1,
      stats: currentUserStats,
      badgesCount: (progress.unlockedBadgeIds || []).length,
      cheerCount: 42,
      isCurrentUser: true,
    };

    const allUsers = [...INITIAL_COMMUNITY_PEERS, currentUser];

    // Sorting algorithm based on timeframe & metric
    return allUsers.sort((a, b) => {
      const aStats = a.stats[timeframe];
      const bStats = b.stats[timeframe];

      if (metric === 'minutes') {
        if (bStats.minutes !== aStats.minutes) {
          return bStats.minutes - aStats.minutes;
        }
        return bStats.words - aStats.words;
      }

      if (metric === 'words') {
        if (bStats.words !== aStats.words) {
          return bStats.words - aStats.words;
        }
        return bStats.minutes - aStats.minutes;
      }

      // Combined Score: 1 minute = 10 pts, 1 word = 15 pts, streak bonus
      const aScore = aStats.minutes * 10 + aStats.words * 15 + a.streakDays * 20;
      const bScore = bStats.minutes * 10 + bStats.words * 15 + b.streakDays * 20;
      return bScore - aScore;
    });
  }, [currentUserStats, progress.streakDays, progress.unlockedBadgeIds, progress.wordSRS, timeframe, metric]);

  // Find Current User's Rank
  const currentUserRank = useMemo(() => {
    const idx = rankedUsers.findIndex((u) => u.isCurrentUser);
    return idx !== -1 ? idx + 1 : 1;
  }, [rankedUsers]);

  // Next user ahead of current user for motivation
  const nextTargetUser = useMemo(() => {
    if (currentUserRank > 1) {
      return rankedUsers[currentUserRank - 2];
    }
    return null;
  }, [rankedUsers, currentUserRank]);

  // Cheer / Send Du'a handler
  const handleCheer = (userId: string, userName: string) => {
    setCheeredUserIds((prev) => ({
      ...prev,
      [userId]: (prev[userId] || 0) + 1,
    }));
    setCheerNotice(`${userName}-কে আপনার আন্তরিক দোয়া ও শুভেচ্ছা পাঠানো হয়েছে! 🤲`);
    setTimeout(() => {
      setCheerNotice(null);
    }, 3200);
  };

  // Podium Users (Top 3)
  const topThree = rankedUsers.slice(0, 3);
  const remainingRanked = rankedUsers.slice(3);

  return (
    <section className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
      {/* Header & Hadith Callout */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wide">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>কমিউনিটি লিডারবোর্ড (Community Leaderboard)</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 mt-1">
            সহযাত্রী শিক্ষার্থীদের সক্রিয়তা ও অধ্যয়ন অবস্থান
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            কুরআন শিক্ষার বরকতময় যাত্রায় সহযাত্রীদের সাথে সৎকাজের অনুপ্রেরণামূলক প্রতিযোগিতা করুন। আপনার প্রতিটি মিনিট ও শব্দ সরাসরি র‍্যাংকিংয়ে যুক্ত হয়।
          </p>
        </div>

        {/* Timeframe & Metric Selector Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 self-start lg:self-center">
          {/* Timeframe Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setTimeframe('weekly')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                timeframe === 'weekly'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              এই সপ্তাহ
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('monthly')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                timeframe === 'monthly'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ৩০ দিন
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('allTime')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                timeframe === 'allTime'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              সর্বকালীন
            </button>
          </div>

          {/* Metric Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setMetric('minutes')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                metric === 'minutes'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              পড়ার সময়
            </button>
            <button
              type="button"
              onClick={() => setMetric('words')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                metric === 'words'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              শব্দ সংখ্যা
            </button>
            <button
              type="button"
              onClick={() => setMetric('score')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                metric === 'score'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              পয়েন্ট
            </button>
          </div>
        </div>
      </div>

      {/* Cheer Notification Toast */}
      {cheerNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>{cheerNotice}</span>
        </div>
      )}

      {/* Current User Standings Banner & Next Rank Milestone */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white rounded-3xl p-5 md:p-6 shadow-md border border-emerald-800/80 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex flex-col items-center justify-center font-extrabold shadow-md shrink-0">
            <span className="text-[10px] uppercase font-bold leading-none">র‍্যাংক</span>
            <span className="text-2xl font-black leading-tight">#{toBnNum(currentUserRank)}</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg md:text-xl font-bold text-white">
                আপনার বর্তমান অবস্থান: <span className="text-amber-400 font-extrabold">{toBnNum(currentUserRank)}ম স্থান</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-800 text-emerald-200 text-[10px] font-bold">
                শীর্ষ {toBnNum(Math.min(100, Math.round((currentUserRank / rankedUsers.length) * 100)))}% শিক্ষার্থী
              </span>
            </div>

            <p className="text-xs text-emerald-200/90 mt-1">
              {timeframe === 'weekly' && 'এই সপ্তাহে আপনার অধ্যয়ন:'}
              {timeframe === 'monthly' && 'গত ৩০ দিনে আপনার অধ্যয়ন:'}
              {timeframe === 'allTime' && 'সর্বকালীন সর্বমোট অধ্যয়ন:'}{' '}
              <span className="font-bold text-white">
                {toBnNum(currentUserStats[timeframe].minutes)} মিনিট
              </span>{' '}
              ও{' '}
              <span className="font-bold text-white">
                {toBnNum(currentUserStats[timeframe].words)}টি শব্দ
              </span>
              ।
            </p>

            {nextTargetUser && (
              <p className="text-xs text-amber-300 font-semibold mt-1 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  পরবর্তী স্থান (#{toBnNum(currentUserRank - 1)}) অর্জন করতে আর মাত্র{' '}
                  <span className="underline font-bold text-white">
                    {toBnNum(
                      Math.max(
                        1,
                        metric === 'words'
                          ? nextTargetUser.stats[timeframe].words - currentUserStats[timeframe].words + 1
                          : nextTargetUser.stats[timeframe].minutes - currentUserStats[timeframe].minutes + 2
                      )
                    )}{' '}
                    {metric === 'words' ? 'টি শব্দ' : 'মিনিট'}
                  </span>{' '}
                  চর্চা প্রয়োজন!
                </span>
              </p>
            )}
          </div>
        </div>

        {onNavigateTab && (
          <button
            type="button"
            onClick={() => onNavigateTab('plan')}
            className="px-5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-emerald-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer whitespace-nowrap self-start md:self-center"
          >
            <span>চর্চা শুরু করে র‍্যাংক বাড়ান</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Top 3 Podium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {topThree.map((user, idx) => {
          const rank = idx + 1;
          const isUser = user.isCurrentUser;
          const userStats = user.stats[timeframe];
          const cheerAdded = cheeredUserIds[user.id] || 0;

          return (
            <div
              key={user.id}
              className={`p-5 rounded-3xl border transition-all relative flex flex-col justify-between ${
                rank === 1
                  ? 'bg-gradient-to-b from-amber-50/80 via-white to-amber-50/40 border-amber-300 shadow-sm ring-2 ring-amber-300/60'
                  : rank === 2
                  ? 'bg-gradient-to-b from-slate-50 via-white to-slate-50 border-slate-300 shadow-2xs'
                  : 'bg-gradient-to-b from-orange-50/50 via-white to-orange-50/20 border-orange-200 shadow-2xs'
              } ${isUser ? 'ring-3 ring-emerald-500' : ''}`}
            >
              {/* Podium Badge Top Right */}
              <div className="flex items-center justify-between">
                <span
                  className={`w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center shadow-xs ${
                    rank === 1
                      ? 'bg-amber-400 text-slate-950'
                      : rank === 2
                      ? 'bg-slate-300 text-slate-800'
                      : 'bg-orange-300 text-orange-950'
                  }`}
                >
                  {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                </span>

                <div className="flex items-center gap-1 text-xs text-amber-800 font-bold">
                  <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>{toBnNum(user.streakDays)} দিন স্ট্রিক</span>
                </div>
              </div>

              {/* User Identity */}
              <div className="flex items-center gap-3 my-4">
                <div
                  className={`w-12 h-12 rounded-2xl ${user.avatarBg} text-white font-bold text-lg flex items-center justify-center shrink-0 shadow-xs`}
                >
                  {user.avatarChar}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-base text-slate-900">{user.nameBn}</h4>
                    {isUser && (
                      <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-900 text-[10px] font-bold">
                        আপনি
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {user.titleBn} · {user.locationBn}
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 p-3 bg-white rounded-2xl border border-slate-200/80 text-xs">
                <div>
                  <span className="text-[11px] text-slate-500 block flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-700" /> অধ্যয়ন সময়
                  </span>
                  <span className="font-bold text-slate-900 text-sm tabular-nums">
                    {toBnNum(userStats.minutes)} মিনিট
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block flex items-center gap-1">
                    <Layers className="w-3 h-3 text-teal-700" /> চর্চাকৃত শব্দ
                  </span>
                  <span className="font-bold text-slate-900 text-sm tabular-nums">
                    {toBnNum(userStats.words)}টি শব্দ
                  </span>
                </div>
              </div>

              {/* Bottom Cheer / Send Du'a */}
              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 text-[11px]">
                  সম্মাননা: {toBnNum(user.badgesCount)}টি ব্যাজ
                </span>

                {!isUser ? (
                  <button
                    type="button"
                    onClick={() => handleCheer(user.id, user.nameBn)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    title="দোয়া ও শুভকামনা পাঠান"
                  >
                    <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                    <span>দোয়া ({toBnNum(user.cheerCount + cheerAdded)})</span>
                  </button>
                ) : (
                  <span className="text-emerald-700 font-bold text-[11px]">আপনার প্রোফাইল ✓</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Leaderboard Table / Detailed List (Rank 4+) */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-700" />
          <span>অন্যান্য সক্রিয় শিক্ষার্থীদের অবস্থান (Ranks 4-9):</span>
        </h3>

        <div className="bg-[#FAFDFB] rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
          {remainingRanked.map((user, idx) => {
            const rank = idx + 4;
            const isUser = user.isCurrentUser;
            const userStats = user.stats[timeframe];
            const cheerAdded = cheeredUserIds[user.id] || 0;

            return (
              <div
                key={user.id}
                className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  isUser
                    ? 'bg-emerald-50/90 border-l-4 border-emerald-600 font-semibold'
                    : 'hover:bg-slate-50'
                }`}
              >
                {/* Left: Rank + Avatar + Name */}
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 tabular-nums">
                    #{toBnNum(rank)}
                  </span>

                  <div
                    className={`w-9 h-9 rounded-xl ${user.avatarBg} text-white font-bold text-sm flex items-center justify-center shrink-0`}
                  >
                    {user.avatarChar}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-slate-900">{user.nameBn}</span>
                      {isUser && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-950 text-[10px] font-bold">
                          আপনি
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">
                      {user.titleBn} · {user.locationBn}
                    </span>
                  </div>
                </div>

                {/* Right: Metrics + Streak + Cheer */}
                <div className="flex items-center justify-between sm:justify-end gap-4 text-xs">
                  <div className="flex items-center gap-1 text-amber-700 font-semibold">
                    <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>{toBnNum(user.streakDays)} দিন</span>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-slate-900 block tabular-nums">
                      {toBnNum(userStats.minutes)} মিনিট
                    </span>
                    <span className="text-[11px] text-slate-500 block tabular-nums">
                      {toBnNum(userStats.words)}টি শব্দ
                    </span>
                  </div>

                  {!isUser ? (
                    <button
                      type="button"
                      onClick={() => handleCheer(user.id, user.nameBn)}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 border border-slate-200 text-slate-700 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Heart className="w-3 h-3 text-rose-500" />
                      <span>{toBnNum(user.cheerCount + cheerAdded)}</span>
                    </button>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 text-[11px] font-bold">
                      অধ্যয়নরত
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Community Spiritual Motivation Banner */}
      <div className="bg-[#F8FAF9] rounded-2xl border border-emerald-900/10 p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-emerald-900 font-semibold">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <span>
            পবিত্র কুরআনের নির্দেশ: “তোমরা সৎকাজে একে অপরের সাথে প্রতিযোগিতা করো।” — (সূরা আল-বাকারা: ১৪৮)
          </span>
        </div>

        <div className="text-slate-500">
          আপনার দৈনিক অগ্রগতি স্বয়ংক্রিয়ভাবে লোকাল ডাটাবেজের সাথে সিঙ্ক হয়ে র‍্যাংক হালনাগাদ হয়।
        </div>
      </div>
    </section>
  );
};
