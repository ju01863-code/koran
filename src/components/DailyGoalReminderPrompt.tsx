import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Bell,
  BellRing,
  Clock,
  CheckCircle2,
  AlertCircle,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowRight,
  Settings,
  X,
  RotateCcw,
  Coffee,
  Trophy,
  BookOpen,
  Send,
} from 'lucide-react';
import { UserProgressState, DailyReminderSettings, getTodayStr } from '../utils/storage';
import { toBnNum, playGoalReminderChime } from '../utils/speech';

interface DailyGoalReminderPromptProps {
  progress: UserProgressState;
  todayWordsLearned: number;
  dailyWordGoal: number;
  onStartStep1: () => void;
  onUpdateReminderSettings: (settings: Partial<DailyReminderSettings>) => void;
  largeFont?: boolean;
}

const PRESET_TIMES = [
  { time: '14:00', labelBn: 'দুপুর ২:০০টা (যোহর পর)', shortBn: 'দুপুর ২টা' },
  { time: '17:00', labelBn: 'বিকেল ৫:০০টা (আসর পর · প্রস্তাবিত)', shortBn: 'বিকেল ৫টা' },
  { time: '20:00', labelBn: 'রাত ৮:০০টা (এশা পর)', shortBn: 'রাত ৮টা' },
  { time: '21:30', labelBn: 'রাত ৯:৩০টা (ঘুমের পূর্বে)', shortBn: 'রাত ৯:৩০' },
];

export const DailyGoalReminderPrompt: React.FC<DailyGoalReminderPromptProps> = ({
  progress,
  todayWordsLearned,
  dailyWordGoal,
  onStartStep1,
  onUpdateReminderSettings,
  largeFont = false,
}) => {
  const reminder: DailyReminderSettings = progress.dailyReminder || {
    enabled: true,
    reminderTime: '17:00',
    browserNotificationsEnabled: false,
    soundEnabled: true,
  };

  const today = getTodayStr();

  // Local state for interactive features
  const [testMode, setTestMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [customTime, setCustomTime] = useState(reminder.reminderTime || '17:00');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [currentMinutesOfDay, setCurrentMinutesOfDay] = useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });

  // Track browser Notification API permission
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setBrowserPermission(Notification.permission);
    } else {
      setBrowserPermission('unsupported');
    }
  }, []);

  // Update current time every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setCurrentMinutesOfDay(d.getHours() * 60 + d.getMinutes());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Parse reminder time
  const reminderMinutesOfDay = useMemo(() => {
    const parts = (reminder.reminderTime || '17:00').split(':').map(Number);
    const h = isNaN(parts[0]) ? 17 : parts[0];
    const m = isNaN(parts[1]) ? 0 : parts[1];
    return h * 60 + m;
  }, [reminder.reminderTime]);

  const isGoalMet = todayWordsLearned >= dailyWordGoal;
  const remainingWords = Math.max(0, dailyWordGoal - todayWordsLearned);
  const completionPct = Math.min(100, Math.round((todayWordsLearned / dailyWordGoal) * 100));

  const isPastReminderTime = currentMinutesOfDay >= reminderMinutesOfDay;
  const isSnoozed = !!(reminder.snoozedUntil && Date.now() < reminder.snoozedUntil);
  const isDismissedToday = reminder.lastDismissedDate === today;

  // Active prompt trigger condition
  const shouldShowPrompt =
    reminder.enabled &&
    !isGoalMet &&
    ((isPastReminderTime && !isSnoozed && !isDismissedToday) || testMode);

  // Auto trigger chime and optional browser notification once when prompt becomes active
  useEffect(() => {
    if (shouldShowPrompt && reminder.soundEnabled && testMode) {
      playGoalReminderChime();
    }
  }, [shouldShowPrompt, reminder.soundEnabled, testMode]);

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 4000);
  };

  const handleSnooze = (minutes = 60) => {
    const snoozedUntil = Date.now() + minutes * 60 * 1000;
    onUpdateReminderSettings({ snoozedUntil });
    showFeedback(`${toBnNum(minutes)} মিনিটের জন্য রিমাইন্ডার স্নুজ করা হয়েছে।`);
    setTestMode(false);
  };

  const handleDismissToday = () => {
    onUpdateReminderSettings({ lastDismissedDate: today });
    showFeedback('আজকের জন্য রিমাইন্ডার বন্ধ করা হয়েছে। কাল আবার মনে করিয়ে দেওয়া হবে।');
    setTestMode(false);
  };

  const handleResetDismissal = () => {
    onUpdateReminderSettings({ lastDismissedDate: undefined, snoozedUntil: undefined });
    showFeedback('রিমাইন্ডার পুনরায় সক্রিয় করা হয়েছে।');
  };

  const handleSelectPresetTime = (time: string) => {
    onUpdateReminderSettings({ reminderTime: time });
    setCustomTime(time);
    showFeedback(`রিমাইন্ডার সময় পরিবর্তিত হয়েছে: ${formatTimeBn(time)}`);
  };

  const handleApplyCustomTime = () => {
    if (/^\d{2}:\d{2}$/.test(customTime)) {
      onUpdateReminderSettings({ reminderTime: customTime });
      showFeedback(`রিমাইন্ডার সময় নির্ধারণ করা হয়েছে: ${formatTimeBn(customTime)}`);
      setIsSettingsOpen(false);
    }
  };

  const handleRequestBrowserNotification = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      showFeedback('আপনার ব্রাউজার পুশ নোটিফিকেশন সমর্থন করে না।');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setBrowserPermission(permission);
      if (permission === 'granted') {
        onUpdateReminderSettings({ browserNotificationsEnabled: true });
        new Notification('কুরআনিক আরবি শিক্ষা · দৈনিক লক্ষ্য 📖', {
          body: `মাশাআল্লাহ! নোটিফিকেশন চালু হয়েছে। প্রতিদিনের ${toBnNum(dailyWordGoal)}টি শব্দের লক্ষ্য অর্জনে রিমাইন্ডার পাবেন।`,
        });
        showFeedback('ব্রাউজার নোটিফিকেশন সফলভাবে চালু করা হয়েছে! ✨');
      } else {
        onUpdateReminderSettings({ browserNotificationsEnabled: false });
        showFeedback('নোটিফিকেশনের অনুমতি দেওয়া হয়নি। আপনি ব্রাউজার সেটিংস থেকে অনুমতি দিতে পারেন।');
      }
    } catch {
      showFeedback('নোটিফিকেশন অনুমতি নিতে সমস্যা হয়েছে।');
    }
  };

  const handleSendTestNotification = () => {
    if (reminder.soundEnabled) {
      playGoalReminderChime();
    }
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('কুরআনিক আরবি শিক্ষা · দৈনিক লক্ষ্য তাগিদ 📖', {
        body: `আজকের লক্ষ্য অর্জনে আর মাত্র ${toBnNum(remainingWords)}টি নতুন শব্দ বাকি! ৫ মিনিট সময় দিয়ে শিখে নিন।`,
      });
      showFeedback('টেস্ট নোটিফিকেশন পাঠানো হয়েছে ও সাউন্ড বাজানো হয়েছে!');
    } else {
      showFeedback('টেস্ট সাউন্ড বাজানো হয়েছে! (ব্রাউজার নোটিফিকেশন অনুমোদিত নয়)');
    }
  };

  // Convert "17:00" to readable Bengali string e.g. "বিকেল ৫:০০টা"
  function formatTimeBn(timeStr: string): string {
    const [hStr, mStr] = timeStr.split(':');
    const h = Number(hStr);
    const m = Number(mStr);
    let period = 'সকাল';
    let displayH = h;
    if (h >= 12 && h < 16) {
      period = 'দুপুর';
      displayH = h === 12 ? 12 : h - 12;
    } else if (h >= 16 && h < 19) {
      period = 'বিকেল';
      displayH = h - 12;
    } else if (h >= 19 && h <= 23) {
      period = 'রাত';
      displayH = h - 12;
    } else if (h === 0) {
      period = 'রাত';
      displayH = 12;
    }
    const mDisplay = m === 0 ? '০০' : String(m).padStart(2, '0');
    return `${period} ${toBnNum(displayH)}:${toBnNum(mDisplay)}টা`;
  }

  const formattedReminderTime = formatTimeBn(reminder.reminderTime || '17:00');

  // Format current local time for user clarity
  const now = new Date();
  const currentFormatted = formatTimeBn(
    `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  );

  return (
    <div className="w-full space-y-4">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className="p-3 bg-slate-900 text-white text-xs md:text-sm font-medium rounded-xl shadow-md flex items-center justify-between gap-3 animate-fade-in border border-slate-700">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STATE 1: Goal Met Celebration Banner */}
      {isGoalMet && (
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-2xl p-5 md:p-6 shadow-md border border-emerald-600/40">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0 text-amber-300">
                <Trophy className="w-6 h-6 animate-bounce" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-emerald-950 uppercase tracking-wide">
                    আজকের লক্ষ্য সম্পন্ন ✨
                  </span>
                  <span className="text-xs text-emerald-200">
                    {toBnNum(todayWordsLearned)}/{toBnNum(dailyWordGoal)} শব্দ আয়ত্ত
                  </span>
                </div>
                <h3 className={`font-bold text-white ${largeFont ? 'text-xl md:text-2xl' : 'text-lg md:text-xl'}`}>
                  মাশাআল্লাহ! আজকের দৈনিক শব্দের লক্ষ্য সফলভাবে অর্জিত হয়েছে!
                </h3>
                <p className="text-xs md:text-sm text-emerald-100 max-w-2xl leading-relaxed">
                  কুরআনের অর্থ শিক্ষার ধারাবাহিকতা বজায় রাখার জন্য মোবারকবাদ। নিয়মিত অল্প অল্প শেখাই স্থায়ী ইলমের পথ।
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="p-2.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="রিমাইন্ডার সেটিংস"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden md:inline">রিমাইন্ডার সেটিংস</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATE 2: Active Urgent / Encouraging Reminder Prompt (Past reminder time or in Test mode) */}
      {!isGoalMet && shouldShowPrompt && (
        <div
          role="alert"
          aria-live="polite"
          className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-emerald-50/60 to-amber-50/80 dark:from-slate-900 dark:via-slate-900/95 dark:to-emerald-950/40 rounded-2xl border-2 border-amber-400/90 dark:border-amber-500/70 p-5 md:p-6 shadow-lg transition-all"
        >
          {/* Top highlight bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-emerald-600 to-amber-500" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Left Content */}
            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-slate-950 shadow-xs">
                  <BellRing className="w-3.5 h-3.5 animate-pulse text-slate-950" />
                  <span>দৈনিক লক্ষ্য তাগিদ · {formattedReminderTime}</span>
                </span>
                {testMode && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    টেস্ট প্রিভিউ মোড
                  </span>
                )}
                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  বর্তমান সময়: {currentFormatted}
                </span>
              </div>

              <div>
                <h3
                  className={`font-extrabold text-slate-900 dark:text-white flex items-center gap-2 ${
                    largeFont ? 'text-xl md:text-2xl' : 'text-lg md:text-xl'
                  }`}
                >
                  <span>আজকের {toBnNum(dailyWordGoal)}টি শব্দের লক্ষ্য এখনো পূরণ হয়নি!</span>
                  <span className="text-amber-600 dark:text-amber-400 font-bold">
                    (আর মাত্র {toBnNum(remainingWords)}টি বাকি)
                  </span>
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  দিনের শেষ হওয়ার আগেই মাত্র ৫ থেকে ৭ মিনিট সময় দিন। আজকের কুরআনিক শব্দগুলো আয়ত্ত করে আপনার
                  ধারাবাহিকতার স্ট্রিক রক্ষা করুন।
                </p>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5 max-w-md">
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>অগ্রগতি: {toBnNum(todayWordsLearned)} / {toBnNum(dailyWordGoal)}টি শব্দ</span>
                  <span className="text-emerald-700 dark:text-emerald-400">{toBnNum(completionPct)}% সম্পন্ন</span>
                </div>
                <div className="w-full h-3 bg-amber-200/60 dark:bg-slate-700 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${Math.max(8, completionPct)}%` }}
                  />
                </div>
              </div>

              {/* Motivational Hadith snippet */}
              <div className="p-3 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-amber-200/80 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5 max-w-xl">
                <BookOpen className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-arabic text-sm text-emerald-900 dark:text-emerald-300 font-semibold" dir="rtl">
                    «خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ»
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                    "তোমাদের মধ্যে সর্বোত্তম ব্যক্তি সে, যে নিজে কুরআন শেখে ও অন্যকে শেখায়।" (সহীহ বুখারী: ৫০২৭)
                  </p>
                </div>
              </div>
            </div>

            {/* Right Action Buttons */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full lg:w-auto shrink-0">
              {/* Primary CTA */}
              <button
                type="button"
                onClick={() => {
                  if (reminder.soundEnabled) playGoalReminderChime();
                  onStartStep1();
                }}
                className="min-h-[48px] px-6 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
              >
                <span>এখনই শব্দ শিখুন ({toBnNum(remainingWords)}টি বাকি)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                {/* Snooze 1 Hour */}
                <button
                  type="button"
                  onClick={() => handleSnooze(60)}
                  className="flex-1 min-h-[42px] px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="১ ঘণ্টার জন্য বিরতি নিন"
                >
                  <Coffee className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>১ ঘণ্টা স্নুজ</span>
                </button>

                {/* Dismiss Today */}
                <button
                  type="button"
                  onClick={handleDismissToday}
                  className="min-h-[42px] px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  title="আজকের জন্য প্রম্পট বন্ধ করুন"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>আজকের জন্য বন্ধ</span>
                </button>

                {/* Toggle Settings */}
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className="min-h-[42px] px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer"
                  title="রিমাইন্ডার সময় পরিবর্তন করুন"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>

              {testMode && (
                <button
                  type="button"
                  onClick={() => setTestMode(false)}
                  className="text-[11px] text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 underline text-center cursor-pointer"
                >
                  টেস্ট মোড থেকে প্রস্থান করুন
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STATE 3: Upcoming / Scheduled Reminder Strip (When before reminder time and goal not yet met) */}
      {!isGoalMet && !shouldShowPrompt && (
        <div className="bg-[#F8FAF9] dark:bg-slate-900 border border-emerald-900/15 dark:border-slate-800 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-emerald-800 dark:text-emerald-300 shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400">
                  দৈনিক শব্দ লক্ষ্য রিমাইন্ডার
                </span>
                {isSnoozed && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                    স্নুজ মোডে আছে
                  </span>
                )}
                {isDismissedToday && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    আজকের জন্য বন্ধ
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                লক্ষ্য: {toBnNum(dailyWordGoal)}টি নতুন শব্দ ({toBnNum(remainingWords)}টি বাকি) · তাগিদ নির্ধারিত:{' '}
                <span className="text-emerald-800 dark:text-emerald-400 font-bold">{formattedReminderTime}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            {isDismissedToday ? (
              <button
                type="button"
                onClick={handleResetDismissal}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>পুনরায় চালু করুন</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setTestMode(true)}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="রিমাইন্ডার প্রম্পটটি কেমন দেখাবে তা পরীক্ষা করুন"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>প্রম্পট টেস্ট দেখুন</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>সময় পরিবর্তন</span>
            </button>
          </div>
        </div>
      )}

      {/* Collapsible Reminder Settings & Notifications Panel */}
      {isSettingsOpen && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 md:p-6 shadow-md space-y-5 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
              <h4 className="font-bold text-slate-900 dark:text-white text-base">
                দৈনিক লক্ষ্য রিমাইন্ডার ও নোটিফিকেশন সেটিংস
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Time Presets */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide block">
                রিমাইন্ডারের সময় নির্বাচন করুন (দিনের কোন সময়ে তাগিদ চান?)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESET_TIMES.map((preset) => (
                  <button
                    key={preset.time}
                    type="button"
                    onClick={() => handleSelectPresetTime(preset.time)}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                      reminder.reminderTime === preset.time
                        ? 'border-emerald-700 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-600/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:border-emerald-400'
                    }`}
                  >
                    <span className="block font-bold text-slate-900 dark:text-white">{preset.shortBn}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{preset.labelBn}</span>
                  </button>
                ))}
              </div>

              {/* Custom time picker */}
              <div className="pt-2 flex items-center gap-2">
                <span className="text-xs text-slate-600 dark:text-slate-400">কাস্টম সময়:</span>
                <input
                  type="time"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleApplyCustomTime}
                  className="min-h-[34px] px-3 py-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  প্রয়োগ করুন
                </button>
              </div>
            </div>

            {/* Notification & Sound Toggles */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide block">
                নোটিফিকেশন ও অডিও অ্যালার্ট
              </label>

              {/* Push Notification button */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      ব্রাউজার পুশ নোটিফিকেশন
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      browserPermission === 'granted'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {browserPermission === 'granted' ? 'সক্রিয়' : 'অনুমতি প্রয়োজন'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  ব্রাউজার ব্যাকগ্রাউন্ডে থাকলেও নির্দিষ্ট সময়ে দৈনিক লক্ষ্য তাগিদ পাবেন।
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleRequestBrowserNotification}
                    className="min-h-[36px] px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {browserPermission === 'granted' ? 'পুনরায় টেস্ট পাঠান' : 'নোটিফিকেশন অনুমতি দিন'}
                  </button>
                  {browserPermission === 'granted' && (
                    <button
                      type="button"
                      onClick={handleSendTestNotification}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Send className="w-3 h-3 text-emerald-600" />
                      <span>টেস্ট পাঠান</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Sound chime toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  {reminder.soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-400" />
                  )}
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      মনোহর চাইম সাউন্ড
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      রিমাইন্ডার আসার সময়ে মৃদু সুর বাজবে
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !reminder.soundEnabled;
                    onUpdateReminderSettings({ soundEnabled: next });
                    if (next) playGoalReminderChime();
                    showFeedback(next ? 'সাউন্ড সক্রিয় করা হয়েছে' : 'সাউন্ড বন্ধ করা হয়েছে');
                  }}
                  className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    reminder.soundEnabled
                      ? 'bg-emerald-800 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {reminder.soundEnabled ? 'চালু' : 'বন্ধ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
