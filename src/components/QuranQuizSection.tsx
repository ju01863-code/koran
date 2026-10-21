import React, { useState, useMemo, useCallback } from 'react';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  Volume2,
  RotateCcw,
  Sparkles,
  Award,
  ChevronRight,
  BookOpen,
  ArrowLeft,
  Check,
  Brain,
  Layers,
} from 'lucide-react';
import { HIGH_FREQUENCY_WORDS, QuranWord } from '../data/wordsData';
import { WordSRSState } from '../utils/storage';
import { speakArabic, toBnNum } from '../utils/speech';

interface QuranQuizSectionProps {
  wordSRS: Record<number, WordSRSState>;
  onRateWord?: (wordId: number, rating: 'again' | 'good' | 'easy') => void;
  slowAudio: boolean;
  speakingText: string | null;
  largeFont: boolean;
  onCloseQuiz?: () => void;
  onNavigateTab?: (tab: string) => void;
}

interface QuizQuestion {
  id: number; // 1..5
  word: QuranWord;
  isFromUserSRS: boolean;
  options: string[];
  correctOptionIndex: number;
}

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Generate 5 questions prioritizing words in wordSRS
function generateFiveQuestions(wordSRS: Record<number, WordSRSState>): {
  questions: QuizQuestion[];
  srsWordCount: number;
} {
  const srsWordIds = Object.keys(wordSRS).map(Number);
  const userStudiedWords = HIGH_FREQUENCY_WORDS.filter((w) => srsWordIds.includes(w.id));
  const srsCount = userStudiedWords.length;

  let selectedWords: { word: QuranWord; isFromUserSRS: boolean }[] = [];

  if (userStudiedWords.length >= 5) {
    // Pick 5 random from user's studied vocabulary
    const shuffled = shuffleArray(userStudiedWords);
    selectedWords = shuffled.slice(0, 5).map((word) => ({ word, isFromUserSRS: true }));
  } else {
    // Take all user studied words
    selectedWords = userStudiedWords.map((word) => ({ word, isFromUserSRS: true }));

    // Fill the remainder up to 5 from high frequency words not yet in selectedWords
    const remainingCount = 5 - selectedWords.length;
    const existingIds = new Set(selectedWords.map((s) => s.word.id));
    const pool = HIGH_FREQUENCY_WORDS.filter((w) => !existingIds.has(w.id));
    const randomPool = shuffleArray(pool).slice(0, remainingCount);

    selectedWords = [
      ...selectedWords,
      ...randomPool.map((word) => ({ word, isFromUserSRS: false })),
    ];
  }

  // Shuffle the 5 questions order
  selectedWords = shuffleArray(selectedWords);

  // Generate 4 multiple-choice options for each word
  const questions: QuizQuestion[] = selectedWords.map((item, idx) => {
    const correctMeaning = item.word.meaning;

    // Pick 3 distractors with distinct meanings
    const distractorPool = HIGH_FREQUENCY_WORDS.filter(
      (w) => w.id !== item.word.id && w.meaning !== correctMeaning
    );
    const shuffledDistractors = shuffleArray(distractorPool);
    const chosenDistractors: string[] = [];
    const usedMeanings = new Set<string>([correctMeaning]);

    for (const d of shuffledDistractors) {
      if (!usedMeanings.has(d.meaning)) {
        chosenDistractors.push(d.meaning);
        usedMeanings.add(d.meaning);
        if (chosenDistractors.length === 3) break;
      }
    }

    // Combine and shuffle options
    const rawOptions = [correctMeaning, ...chosenDistractors];
    const shuffledOptions = shuffleArray(rawOptions);
    const correctOptionIndex = shuffledOptions.indexOf(correctMeaning);

    return {
      id: idx + 1,
      word: item.word,
      isFromUserSRS: item.isFromUserSRS,
      options: shuffledOptions,
      correctOptionIndex,
    };
  });

  return { questions, srsWordCount: srsCount };
}

const OPTION_PREFIXES = ['ক', 'খ', 'গ', 'ঘ'];

export const QuranQuizSection: React.FC<QuranQuizSectionProps> = ({
  wordSRS,
  onRateWord,
  slowAudio,
  speakingText,
  largeFont,
  onCloseQuiz,
  onNavigateTab,
}) => {
  // Generation counter to force re-generation when user retakes
  const [quizGenerationKey, setQuizGenerationKey] = useState<number>(1);

  // Current question index (0 to 4)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);

  // User answers map: { [questionId: number]: number } (selected option index)
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});

  // Has the user completed the 5 questions?
  const [isQuizCompleted, setIsQuizCompleted] = useState<boolean>(false);

  // Generate 5 questions based on current wordSRS state
  const { questions, srsWordCount } = useMemo(() => {
    return generateFiveQuestions(wordSRS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizGenerationKey]);

  const currentQ = questions[currentQuestionIndex];
  const selectedAnswer = currentQ ? userAnswers[currentQ.id] : undefined;
  const isCurrentAnswered = selectedAnswer !== undefined;

  // Handle option selection
  const handleSelectOption = useCallback(
    (optionIndex: number) => {
      if (isCurrentAnswered || !currentQ) return;

      setUserAnswers((prev) => ({
        ...prev,
        [currentQ.id]: optionIndex,
      }));

      const isCorrect = optionIndex === currentQ.correctOptionIndex;

      // Update SRS retention if handler available
      if (onRateWord) {
        onRateWord(currentQ.word.id, isCorrect ? 'good' : 'again');
      }
    },
    [isCurrentAnswered, currentQ, onRateWord]
  );

  // Next question or finish
  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setIsQuizCompleted(true);
    }
  }, [currentQuestionIndex, questions.length]);

  // Restart quiz with fresh 5 questions
  const handleRestartQuiz = useCallback(() => {
    setQuizGenerationKey((prev) => prev + 1);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setIsQuizCompleted(false);
  }, []);

  // Compute final score
  const totalScore = useMemo(() => {
    return questions.reduce((score, q) => {
      const ans = userAnswers[q.id];
      return ans === q.correctOptionIndex ? score + 1 : score;
    }, 0);
  }, [questions, userAnswers]);

  const scorePercentage = Math.round((totalScore / 5) * 100);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-4 sm:p-6 md:p-8 space-y-6 animate-in fade-in duration-300">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wide mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 flex items-center gap-1">
              <Brain className="w-3.5 h-3.5 text-emerald-700" />
              <span>কুরআন কুইজ · শব্দার্থ স্মরণ পরীক্ষা</span>
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-600 font-medium">৫টি প্রশ্ন</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>কুরআনিক শব্দভাণ্ডার কুইজ (Quran Quiz)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {srsWordCount >= 5 ? (
              <span>
                আপনার অধীত <strong>{toBnNum(srsWordCount)}টি</strong> শব্দভাণ্ডার (wordSRS) থেকে ৫টি
                প্রশ্ন তৈরি করা হয়েছে।
              </span>
            ) : srsWordCount > 0 ? (
              <span>
                আপনার অধীত <strong>{toBnNum(srsWordCount)}টি</strong> শব্দ এবং উচ্চ-ফ্রিকোয়েন্সি কুরআন
                শব্দভাণ্ডার মিলিয়ে ৫টি প্রশ্ন তৈরি করা হয়েছে।
              </span>
            ) : (
              <span>
                কুরআনে সর্বাধিক ব্যবহৃত উচ্চ-ফ্রিকোয়েন্সি শব্দমালা থেকে ৫টি প্রশ্ন তৈরি করা হয়েছে।
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          {onCloseQuiz && (
            <button
              type="button"
              onClick={onCloseQuiz}
              className="min-h-[42px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>সূরা পাঠে ফিরুন</span>
            </button>
          )}
        </div>
      </div>

      {!isQuizCompleted ? (
        /* Active Quiz Question Screen */
        <div className="space-y-6">
          {/* Progress Indicator */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
              <span className="text-emerald-900 font-bold">
                প্রশ্ন {toBnNum(currentQuestionIndex + 1)} / ৫
              </span>
              <span className="tabular-nums">
                অগ্রগতি: {toBnNum((currentQuestionIndex + 1) * 20)}%
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 h-2">
              {[0, 1, 2, 3, 4].map((idx) => {
                const isPassed = idx < currentQuestionIndex;
                const isCurrent = idx === currentQuestionIndex;
                const qId = questions[idx]?.id;
                const answered = userAnswers[qId];
                const isCorrect = answered === questions[idx]?.correctOptionIndex;

                let bgClass = 'bg-slate-200';
                if (isPassed) {
                  bgClass = isCorrect ? 'bg-emerald-600' : 'bg-rose-500';
                } else if (isCurrent) {
                  bgClass = isCurrentAnswered
                    ? isCorrect
                      ? 'bg-emerald-600'
                      : 'bg-rose-500'
                    : 'bg-emerald-800 animate-pulse';
                }

                return (
                  <div
                    key={idx}
                    className={`h-full rounded-full transition-all duration-300 ${bgClass}`}
                  />
                );
              })}
            </div>
          </div>

          {/* Question Card */}
          {currentQ && (
            <div className="bg-[#F8FAF9] rounded-2xl border border-emerald-900/10 p-5 sm:p-7 space-y-6">
              {/* Word Presentation */}
              <div className="flex flex-col items-center justify-center text-center p-4 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200/60">
                    {currentQ.word.category}
                  </span>
                  {currentQ.isFromUserSRS && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                      আপনার wordSRS থেকে
                    </span>
                  )}
                </div>

                {/* Big Arabic Word Display */}
                <span
                  dir="rtl"
                  className={`font-arabic text-emerald-950 font-bold select-none my-2 tracking-wide ${
                    largeFont ? 'text-5xl sm:text-6xl' : 'text-4xl sm:text-5xl'
                  }`}
                >
                  {currentQ.word.arabic}
                </span>

                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm sm:text-base font-semibold text-slate-700">
                    উচ্চারণ: {currentQ.word.pronunciation}
                  </span>
                  <button
                    type="button"
                    onClick={() => speakArabic(currentQ.word.arabic, slowAudio)}
                    className="p-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors cursor-pointer"
                    title="উচ্চারণ শুনুন"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs sm:text-sm text-slate-500 mt-2 font-medium">
                  কুরআনে মোট ব্যবহৃত: <strong>{toBnNum(currentQ.word.frequency)} বার</strong>
                  {currentQ.word.root && (
                    <span className="ml-2">· শব্দমূল: {currentQ.word.root}</span>
                  )}
                </p>
              </div>

              {/* Question Text */}
              <div className="text-center">
                <p className="text-base sm:text-lg font-bold text-slate-900">
                  নিচের কোন অর্থটি ‘<span className="font-arabic text-emerald-800 text-xl mx-1">{currentQ.word.arabic}</span>’ শব্দের সঠিক বাংলা অর্থ?
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  সঠিক অপশনটিতে ট্যাপ করুন
                </p>
              </div>

              {/* Multiple Choice Options (4 Choices) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentQ.options.map((optionText, optIdx) => {
                  const isSelected = selectedAnswer === optIdx;
                  const isCorrectAnswer = optIdx === currentQ.correctOptionIndex;

                  let optionStyle =
                    'bg-white border-slate-200 text-slate-800 hover:border-emerald-600 hover:bg-emerald-50/40 cursor-pointer shadow-2xs';

                  if (isCurrentAnswered) {
                    if (isCorrectAnswer) {
                      optionStyle =
                        'bg-emerald-700 text-white border-emerald-700 shadow-md ring-2 ring-emerald-500/50 cursor-default';
                    } else if (isSelected) {
                      optionStyle =
                        'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-400/50 cursor-default';
                    } else {
                      optionStyle =
                        'bg-slate-50 border-slate-200 text-slate-400 cursor-default opacity-60';
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      disabled={isCurrentAnswered}
                      onClick={() => handleSelectOption(optIdx)}
                      className={`min-h-[56px] p-3.5 rounded-xl border font-semibold text-sm sm:text-base text-left flex items-center justify-between gap-3 transition-all active:scale-[0.98] ${optionStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                            isCurrentAnswered && isCorrectAnswer
                              ? 'bg-white text-emerald-800'
                              : isCurrentAnswered && isSelected
                              ? 'bg-white text-rose-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {OPTION_PREFIXES[optIdx]}
                        </span>
                        <span className="leading-snug">{optionText}</span>
                      </div>

                      {isCurrentAnswered && isCorrectAnswer && (
                        <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
                      )}
                      {isCurrentAnswered && isSelected && !isCorrectAnswer && (
                        <XCircle className="w-5 h-5 text-white shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Answer Explanation & Quranic Reference Context (Appears after answer) */}
              {isCurrentAnswered && (
                <div
                  className={`p-4 sm:p-5 rounded-2xl border text-sm space-y-2 animate-in fade-in duration-200 ${
                    selectedAnswer === currentQ.correctOptionIndex
                      ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                      : 'bg-amber-50/90 border-amber-300 text-amber-950'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold flex items-center gap-1.5 text-base">
                      {selectedAnswer === currentQ.correctOptionIndex ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                          <span>সঠিক উত্তর! মাশাআল্লাহ!</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-rose-600" />
                          <span>ভুল উত্তর! সঠিক অর্থ: “{currentQ.word.meaning}”</span>
                        </>
                      )}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">
                      wordSRS মেমরিতে আপডেট করা হয়েছে
                    </span>
                  </div>

                  {/* Quranic Ayah Reference Example */}
                  <div className="bg-white/80 p-3 rounded-xl border border-slate-200/80 mt-2">
                    <p className="text-xs font-bold text-slate-500 mb-1">
                      কুরআনে ব্যবহারের উদাহরণ ({currentQ.word.ayahRef}):
                    </p>
                    <p dir="rtl" className="font-arabic text-lg text-emerald-950 font-bold mb-1">
                      {currentQ.word.ayahAr}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-700">
                      উচ্চারণ: {currentQ.word.ayahBnPronunciation}
                    </p>
                    <p className="text-xs sm:text-sm font-semibold text-emerald-900 mt-0.5">
                      অনুবাদ: “{currentQ.word.ayahBnMeaning}”
                    </p>
                  </div>
                </div>
              )}

              {/* Next Question / Finish Button */}
              {isCurrentAnswered && (
                <div className="flex items-center justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="min-h-[48px] px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm sm:text-base flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <span>
                      {currentQuestionIndex < questions.length - 1
                        ? 'পরবর্তী প্রশ্ন'
                        : 'ফলাফল ও মূল্যায়ন দেখুন'}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Results & Scorecard Screen */
        <div className="space-y-6">
          {/* Hero Scorecard */}
          <div className="text-center p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white shadow-lg space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-400/20 border-2 border-amber-400 text-amber-300 flex items-center justify-center mx-auto shadow-inner">
              <Award className="w-8 h-8 text-amber-400" />
            </div>

            <div>
              <span className="text-xs font-bold text-emerald-200 uppercase tracking-widest block mb-1">
                কুইজ সমাপ্তি রিপোর্ট
              </span>
              <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                ৫-এ {toBnNum(totalScore)}টি সঠিক!
              </h3>
              <p className="text-base text-emerald-100 mt-1 font-semibold">
                সঠিকতার হার: {toBnNum(scorePercentage)}%
              </p>
            </div>

            <p className="text-sm text-emerald-100/90 max-w-md mx-auto leading-relaxed">
              {totalScore === 5 &&
                'মাশাআল্লাহ! অসাধারণ স্মরণশক্তি! আপনি সবগুলো কুরআনিক শব্দের সঠিক অর্থ নির্ভুলভাবে শনাক্ত করেছেন।'}
              {totalScore >= 3 &&
                totalScore < 5 &&
                'আলহামদুলিল্লাহ! খুব ভালো ফলাফল হয়েছে! ভুল হওয়া শব্দগুলো নিয়মিত রিভিশন দিলে স্মৃতিতে দৃঢ় হয়ে যাবে।'}
              {totalScore < 3 &&
                'ইনশাআল্লাহ চর্চা চালিয়ে যান! কুরআনিক শব্দগুলো কয়েকবার শুনলে ও পড়লে সহজেই আয়ত্ত হয়ে যাবে।'}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleRestartQuiz}
                className="min-h-[46px] px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-sm flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>নতুন ৫টি প্রশ্নের কুইজ দিন</span>
              </button>

              {onCloseQuiz && (
                <button
                  type="button"
                  onClick={onCloseQuiz}
                  className="min-h-[46px] px-5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-sm flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>সূরা তিলাওয়াতে ফিরুন</span>
                </button>
              )}

              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('words')}
                  className="min-h-[46px] px-5 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-950 text-emerald-200 font-bold text-sm flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Layers className="w-4 h-4" />
                  <span>৩০০ শব্দভাণ্ডারে যান</span>
                </button>
              )}
            </div>
          </div>

          {/* Detailed Question Review List */}
          <div className="space-y-3">
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-800" />
              <span>আজকের কুইজে পরীক্ষিত ৫টি শব্দের পর্যালোচনা</span>
            </h4>

            <div className="grid grid-cols-1 gap-3">
              {questions.map((q, idx) => {
                const userAnsIndex = userAnswers[q.id];
                const isCorrect = userAnsIndex === q.correctOptionIndex;
                const userAnsText =
                  userAnsIndex !== undefined ? q.options[userAnsIndex] : 'উত্তর দেওয়া হয়নি';

                return (
                  <div
                    key={q.id}
                    className={`p-4 rounded-2xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isCorrect
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : 'bg-rose-50/50 border-rose-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                          isCorrect
                            ? 'bg-emerald-700 text-white'
                            : 'bg-rose-600 text-white'
                        }`}
                      >
                        {isCorrect ? '✓' : '✗'}
                      </span>

                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            dir="rtl"
                            className="font-arabic text-2xl font-bold text-emerald-950"
                          >
                            {q.word.arabic}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            ({q.word.pronunciation})
                          </span>
                          <button
                            type="button"
                            onClick={() => speakArabic(q.word.arabic, slowAudio)}
                            className="p-1 rounded-full text-emerald-800 hover:bg-emerald-100 transition-colors"
                            title="উচ্চারণ শুনুন"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <p className="text-xs text-slate-600 mt-0.5">
                          সঠিক অর্থ: <strong className="text-emerald-900 font-bold">{q.word.meaning}</strong>
                          {!isCorrect && (
                            <span className="text-rose-700 ml-2">
                              (আপনার উত্তর ছিল: {userAnsText})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right text-xs text-slate-500">
                      <span className="block font-medium">{q.word.ayahRef}</span>
                      <span className="text-[11px] text-slate-400">
                        {q.word.category}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
