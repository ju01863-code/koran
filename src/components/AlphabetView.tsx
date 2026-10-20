import React, { useState } from 'react';
import { Volume2, CheckCircle2, Sparkles, RotateCcw, Ear, Mic, HeartHandshake } from 'lucide-react';
import { ARABIC_ALPHABET, ArabicLetter } from '../data/alphabetData';
import { speakArabic, toBnNum } from '../utils/speech';
import { PronunciationGuideSection } from './PronunciationGuideSection';

interface AlphabetViewProps {
  masteredLetters: number[];
  onToggleMastered: (id: number) => void;
  slowAudio: boolean;
  speakingText: string | null;
  largeFont: boolean;
  onNavigateTab?: (tab: 'alphabet' | 'words' | 'roots' | 'grammar' | 'messages' | 'plan' | 'quran' | 'favorites') => void;
}

export const AlphabetView: React.FC<AlphabetViewProps> = ({
  masteredLetters,
  onToggleMastered,
  slowAudio,
  speakingText,
  largeFont,
  onNavigateTab,
}) => {
  const [selectedLetter, setSelectedLetter] = useState<ArabicLetter>(ARABIC_ALPHABET[0]);
  const [filterMode, setFilterMode] = useState<'all' | 'unlearned' | 'mastered'>('all');
  const [quizActive, setQuizActive] = useState(false);
  const [quizTarget, setQuizTarget] = useState<ArabicLetter>(ARABIC_ALPHABET[1]);
  const [quizOptions, setQuizOptions] = useState<ArabicLetter[]>(ARABIC_ALPHABET.slice(0, 4));
  const [quizFeedback, setQuizFeedback] = useState<{ correct: boolean; message: string } | null>(null);

  const filteredLetters = ARABIC_ALPHABET.filter((item) => {
    if (filterMode === 'mastered') return masteredLetters.includes(item.id);
    if (filterMode === 'unlearned') return !masteredLetters.includes(item.id);
    return true;
  });

  const startNewQuizRound = () => {
    const randomTarget = ARABIC_ALPHABET[Math.floor(Math.random() * ARABIC_ALPHABET.length)];
    const distractors = ARABIC_ALPHABET.filter((l) => l.id !== randomTarget.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    const options = [randomTarget, ...distractors].sort(() => Math.random() - 0.5);
    setQuizTarget(randomTarget);
    setQuizOptions(options);
    setQuizFeedback(null);
    setTimeout(() => {
      speakArabic(randomTarget.nameAr, slowAudio);
    }, 150);
  };

  const handleSelectLetter = (letter: ArabicLetter) => {
    setSelectedLetter(letter);
    speakArabic(letter.nameAr, slowAudio);
  };

  const handleQuizAnswer = (option: ArabicLetter) => {
    if (option.id === quizTarget.id) {
      setQuizFeedback({
        correct: true,
        message: `মাশাআল্লাহ! সঠিক উত্তর: ${quizTarget.nameBn} (${quizTarget.letter})`,
      });
      speakArabic(quizTarget.nameAr, slowAudio);
    } else {
      setQuizFeedback({
        correct: false,
        message: `আবার চেষ্টা করুন! এটি ছিল "${option.nameBn}" (${option.letter})`,
      });
      speakArabic(option.nameAr, slowAudio);
    }
  };

  return (
    <div className="space-y-8">
      {/* Quick Navigation / Subject Switcher Strip */}
      {onNavigateTab && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 px-1 text-xs border-b border-slate-200">
          <span className="font-bold text-slate-500 shrink-0">শিক্ষা ও দিকনির্দেশনা:</span>
          <span className="px-3 py-1.5 rounded-full bg-emerald-800 text-white font-bold shrink-0">
            বর্ণমালা
          </span>
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
        </div>
      )}

      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-sm font-medium text-emerald-800">
            ০১. আরবি বর্ণমালা (আলিফ থেকে ইয়া) · মোট ২৮টি হরফ · শেখা হয়েছে {toBnNum(masteredLetters.length)}/{toBnNum(28)}টি
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1 text-balance">
            শব্দের শুরুতে, মাঝে ও শেষে আরবি বর্ণের রূপ ও উচ্চারণ
          </h1>
        </div>

        {/* Interactive Mode & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`min-h-[42px] px-3.5 py-1.5 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
                filterMode === 'all'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              সব ({toBnNum(28)})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('unlearned')}
              className={`min-h-[42px] px-3.5 py-1.5 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
                filterMode === 'unlearned'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              বাকি আছে ({toBnNum(28 - masteredLetters.length)})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('mastered')}
              className={`min-h-[42px] px-3.5 py-1.5 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
                filterMode === 'mastered'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              শেখা হয়েছে ({toBnNum(masteredLetters.length)})
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!quizActive) {
                setQuizActive(true);
                startNewQuizRound();
              } else {
                setQuizActive(false);
              }
            }}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
              quizActive
                ? 'bg-emerald-800 text-white'
                : 'bg-white border border-slate-200 text-slate-800 hover:bg-emerald-50 hover:border-emerald-300'
            }`}
          >
            <Ear className="w-4 h-4 shrink-0" />
            <span>{quizActive ? 'কুইজ বন্ধ করুন' : 'শুনুন ও বর্ণ চিনুন'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('pronunciation-guide-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap bg-emerald-50 border border-emerald-300 text-emerald-950 hover:bg-emerald-100 shadow-2xs cursor-pointer"
          >
            <Mic className="w-4 h-4 text-emerald-700" />
            <span>উচ্চারণ নির্দেশিকা</span>
          </button>
        </div>
      </div>

      {/* Interactive Audio Quiz Mode (when active) */}
      {quizActive && (
        <div className="bg-emerald-950 text-white rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-emerald-800/70">
            <div>
              <p className="text-xs text-emerald-300 font-medium">
                শ্রবণ ও বর্ণ শনাক্তকরণ অনুশীলন
              </p>
              <h2 className="text-xl md:text-2xl font-bold mt-1">
                উচ্চারণটি মনোযোগ দিয়ে শুনুন এবং সঠিক আরবি বর্ণটিতে ট্যাপ করুন
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => speakArabic(quizTarget.nameAr, slowAudio)}
                className="min-h-[48px] px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl flex items-center gap-2.5 transition-colors whitespace-nowrap"
              >
                <Volume2 className="w-5 h-5" />
                <span>আবার উচ্চারণ শুনুন</span>
              </button>
              <button
                type="button"
                onClick={startNewQuizRound}
                className="min-h-[48px] px-4 py-2.5 bg-emerald-900 hover:bg-emerald-800 text-emerald-100 font-semibold rounded-xl flex items-center gap-2 transition-colors whitespace-nowrap"
              >
                <RotateCcw className="w-4 h-4" />
                <span>পরবর্তী বর্ণ</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {quizOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleQuizAnswer(opt)}
                className="min-h-[110px] p-4 rounded-xl bg-emerald-900/70 hover:bg-emerald-800 border border-emerald-700/60 flex flex-col items-center justify-center gap-2 transition-transform active:scale-[0.98]"
              >
                <span className="font-arabic text-5xl text-white">{opt.letter}</span>
                <span className="text-sm text-emerald-200 font-medium">{opt.nameBn}</span>
              </button>
            ))}
          </div>

          {quizFeedback && (
            <div
              className={`mt-5 p-4 rounded-xl flex items-center justify-between ${
                quizFeedback.correct
                  ? 'bg-emerald-800/90 text-emerald-50'
                  : 'bg-amber-900/80 text-amber-100'
              }`}
            >
              <span className="font-semibold text-base">{quizFeedback.message}</span>
              {quizFeedback.correct && (
                <button
                  type="button"
                  onClick={startNewQuizRound}
                  className="min-h-[40px] px-4 py-1.5 bg-white text-emerald-950 font-bold text-sm rounded-lg hover:bg-emerald-50 whitespace-nowrap"
                >
                  পরের প্রশ্ন →
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Two-Zone Sandbox Layout: Selected Letter Interactive Stage */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Zone: Selected Letter Calligraphic Stage */}
          <div className="lg:col-span-5 flex flex-col items-center text-center p-6 rounded-2xl bg-[#F4F8F6] border border-emerald-900/10">
            <div className="w-full flex items-center justify-between text-xs text-slate-600 mb-2">
              <span>হরফ নং {toBnNum(selectedLetter.id)}</span>
              <span>
                {selectedLetter.isNonConnector
                  ? 'বাম পাশে যুক্ত হয় না (অসংযুক্ত বর্ণ)'
                  : 'উভয় পাশে যুক্ত হতে পারে'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => speakArabic(selectedLetter.nameAr, slowAudio)}
              className="group relative my-2 w-36 h-36 md:w-44 md:h-44 rounded-2xl bg-white border border-emerald-800/15 flex flex-col items-center justify-center hover:border-emerald-600 transition-colors cursor-pointer"
              aria-label={`${selectedLetter.nameBn} এর উচ্চারণ শুনুন`}
            >
              <span
                dir="rtl"
                className={`font-arabic text-emerald-950 select-none ${
                  largeFont ? 'text-8xl' : 'text-7xl md:text-8xl'
                }`}
              >
                {selectedLetter.letter}
              </span>
              <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 group-hover:text-emerald-800">
                <Volume2 className="w-4 h-4" />
                <span>{speakingText === selectedLetter.nameAr ? 'বাজছে...' : 'শুনতে ট্যাপ করুন'}</span>
              </span>
            </button>

            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mt-3">
              {selectedLetter.nameBn}{' '}
              <span className="font-arabic text-emerald-800 font-normal">
                ({selectedLetter.nameAr})
              </span>
            </h2>
            <p className="text-base font-medium text-emerald-900 mt-1">
              উচ্চারণ: {selectedLetter.pronunciationBn}
            </p>
            <p className="text-sm text-slate-600 mt-1 max-w-md">
              মাখরাজ (উচ্চারণ স্থান): {selectedLetter.makhrajBn}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 mt-5 w-full">
              <button
                type="button"
                onClick={() => speakArabic(selectedLetter.nameAr, false)}
                className="min-h-[48px] flex-1 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              >
                <Volume2 className="w-5 h-5 shrink-0" />
                <span>স্বাভাবিক উচ্চারণ</span>
              </button>
              <button
                type="button"
                onClick={() => speakArabic(selectedLetter.nameAr, true)}
                className="min-h-[48px] px-4 py-2.5 bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300 font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4 shrink-0 text-emerald-700" />
                <span>ধীরে শুনুন</span>
              </button>
            </div>
          </div>

          {/* Right Zone: Positional Forms, Harakat & Example Word */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-slate-900">
                  শব্দের শুরুতে, মাঝে ও শেষে বর্ণের রূপ (ডান থেকে বামে)
                </h3>
                <span className="text-xs text-slate-500">আরবি ডান দিক থেকে পড়া হয়</span>
              </div>

              {/* RTL Grid for Initial -> Medial -> Final -> Isolated */}
              <div dir="rtl" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => speakArabic(selectedLetter.nameAr, slowAudio)}
                  className="p-4 rounded-xl bg-[#F8FAF9] border border-slate-200 hover:border-emerald-500 text-center transition-colors min-h-[112px] flex flex-col justify-between"
                >
                  <span className="text-xs font-semibold text-slate-500" dir="ltr">
                    শুরুতে (Initial)
                  </span>
                  <span className="font-arabic text-4xl md:text-5xl text-emerald-900 my-1">
                    {selectedLetter.forms.initial}
                  </span>
                  <span className="text-xs text-emerald-700" dir="ltr">
                    বামে যুক্ত হয়
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => speakArabic(selectedLetter.nameAr, slowAudio)}
                  className="p-4 rounded-xl bg-[#F8FAF9] border border-slate-200 hover:border-emerald-500 text-center transition-colors min-h-[112px] flex flex-col justify-between"
                >
                  <span className="text-xs font-semibold text-slate-500" dir="ltr">
                    মাঝে (Medial)
                  </span>
                  <span className="font-arabic text-4xl md:text-5xl text-emerald-900 my-1">
                    {selectedLetter.forms.medial}
                  </span>
                  <span className="text-xs text-emerald-700" dir="ltr">
                    দুই পাশে যুক্ত
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => speakArabic(selectedLetter.nameAr, slowAudio)}
                  className="p-4 rounded-xl bg-[#F8FAF9] border border-slate-200 hover:border-emerald-500 text-center transition-colors min-h-[112px] flex flex-col justify-between"
                >
                  <span className="text-xs font-semibold text-slate-500" dir="ltr">
                    শেষে (Final)
                  </span>
                  <span className="font-arabic text-4xl md:text-5xl text-emerald-900 my-1">
                    {selectedLetter.forms.final}
                  </span>
                  <span className="text-xs text-emerald-700" dir="ltr">
                    ডানে যুক্ত হয়
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => speakArabic(selectedLetter.nameAr, slowAudio)}
                  className="p-4 rounded-xl bg-[#F8FAF9] border border-slate-200 hover:border-emerald-500 text-center transition-colors min-h-[112px] flex flex-col justify-between"
                >
                  <span className="text-xs font-semibold text-slate-500" dir="ltr">
                    একক (Isolated)
                  </span>
                  <span className="font-arabic text-4xl md:text-5xl text-slate-900 my-1">
                    {selectedLetter.forms.isolated}
                  </span>
                  <span className="text-xs text-slate-500" dir="ltr">
                    মূল রূপ
                  </span>
                </button>
              </div>
            </div>

            {/* Harakat (যবর, যের, পেশ) Interactive Practice */}
            <div className="pt-4 border-t border-slate-200/80">
              <h3 className="text-base font-bold text-slate-900 mb-3">
                স্বরচিহ্ন (যবর, যের, পেশ) দিয়ে উচ্চারণ চর্চা (ট্যাপ করে শুনুন)
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => speakArabic(selectedLetter.harakat.fatha.ar, slowAudio)}
                  className="min-h-[72px] p-3 rounded-xl bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200 flex items-center justify-between px-4 transition-colors"
                >
                  <div className="text-left">
                    <span className="block text-xs text-slate-600">যবর (ফাতহা)</span>
                    <span className="text-lg font-bold text-emerald-950">
                      {selectedLetter.harakat.fatha.bn}
                    </span>
                  </div>
                  <span className="font-arabic text-3xl md:text-4xl text-emerald-900">
                    {selectedLetter.harakat.fatha.ar}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => speakArabic(selectedLetter.harakat.kasra.ar, slowAudio)}
                  className="min-h-[72px] p-3 rounded-xl bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200 flex items-center justify-between px-4 transition-colors"
                >
                  <div className="text-left">
                    <span className="block text-xs text-slate-600">যের (কাসরা)</span>
                    <span className="text-lg font-bold text-emerald-950">
                      {selectedLetter.harakat.kasra.bn}
                    </span>
                  </div>
                  <span className="font-arabic text-3xl md:text-4xl text-emerald-900">
                    {selectedLetter.harakat.kasra.ar}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => speakArabic(selectedLetter.harakat.damma.ar, slowAudio)}
                  className="min-h-[72px] p-3 rounded-xl bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200 flex items-center justify-between px-4 transition-colors"
                >
                  <div className="text-left">
                    <span className="block text-xs text-slate-600">পেশ (দাম্মা)</span>
                    <span className="text-lg font-bold text-emerald-950">
                      {selectedLetter.harakat.damma.bn}
                    </span>
                  </div>
                  <span className="font-arabic text-3xl md:text-4xl text-emerald-900">
                    {selectedLetter.harakat.damma.ar}
                  </span>
                </button>
              </div>
            </div>

            {/* Quranic Word Example & Mastered Button */}
            <div className="pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => speakArabic(selectedLetter.exampleWord.ar, slowAudio)}
                  className="min-h-[56px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-emerald-50 border border-slate-200 flex items-center gap-3 transition-colors"
                >
                  <span className="font-arabic text-3xl text-emerald-950">
                    {selectedLetter.exampleWord.ar}
                  </span>
                  <Volume2 className="w-5 h-5 text-emerald-700 shrink-0" />
                </button>
                <div>
                  <p className="text-xs text-slate-500">
                    কুরআনের শব্দে উদাহরণ · {selectedLetter.exampleWord.positionNote}
                  </p>
                  <p className="text-base font-bold text-slate-900">
                    {selectedLetter.exampleWord.bnPronunciation} —{' '}
                    <span className="text-emerald-800">{selectedLetter.exampleWord.bnMeaning}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onToggleMastered(selectedLetter.id)}
                className={`min-h-[48px] px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
                  masteredLetters.includes(selectedLetter.id)
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>
                  {masteredLetters.includes(selectedLetter.id)
                    ? 'শেখা সম্পন্ন হয়েছে'
                    : 'শেখা হয়েছে চিহ্নিত করুন'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* New 'Pronunciation Guide' Section: Speech-to-Text Recording & Native Audio Comparison */}
      <div id="pronunciation-guide-section" className="scroll-mt-6">
        <PronunciationGuideSection
          selectedLetterId={selectedLetter.id}
          onSelectLetter={(l) => setSelectedLetter(l)}
          slowAudio={slowAudio}
          largeFont={largeFont}
        />
      </div>

      {/* All 28 Arabic Letter Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">
            ২৮টি আরবি বর্ণের সম্পূর্ণ তালিকা (কার্ডে ট্যাপ করলে উচ্চারণ শোনা যাবে)
          </h2>
          <span className="text-xs text-slate-500">
            প্রদর্শিত হচ্ছে {toBnNum(filteredLetters.length)}টি বর্ণ
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredLetters.map((item) => {
            const isSelected = selectedLetter.id === item.id;
            const isMastered = masteredLetters.includes(item.id);
            const isSpeaking = speakingText === item.nameAr;

            return (
              <div
                key={item.id}
                onClick={() => handleSelectLetter(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectLetter(item);
                  }
                }}
                className={`rounded-2xl p-5 bg-white border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-emerald-700 ring-2 ring-emerald-700/20'
                    : 'border-slate-200 hover:border-emerald-500'
                }`}
              >
                {/* Top metadata & audio button */}
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                    <span className="tabular-nums font-medium">
                      ক্রমিক {toBnNum(item.id)} · {item.nameAr}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleMastered(item.id);
                        }}
                        className={`min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                          isMastered
                            ? 'text-emerald-800 bg-emerald-50'
                            : 'text-slate-500 hover:text-slate-900 bg-slate-100'
                        }`}
                        title="শেখা সম্পন্ন চিহ্নিত করুন"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isMastered ? 'শেখা হয়েছে' : 'চিহ্নিত করুন'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Main Letter & Name */}
                  <div className="flex items-center justify-between gap-3 my-2">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{item.nameBn}</h3>
                      <p className="text-sm text-slate-600 mt-0.5 line-clamp-2">
                        {item.pronunciationBn}
                      </p>
                    </div>
                    <div
                      className={`w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                        isSpeaking
                          ? 'bg-emerald-700 text-white'
                          : 'bg-[#F4F8F6] text-emerald-950'
                      }`}
                    >
                      <span
                        className={`font-arabic ${
                          largeFont ? 'text-6xl' : 'text-5xl'
                        } select-none`}
                      >
                        {item.letter}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Initial, Medial, Final Forms directly on Every Card */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div
                    dir="rtl"
                    className="grid grid-cols-3 gap-2 text-center bg-[#F8FAF9] rounded-xl p-2.5"
                  >
                    <div>
                      <span className="block text-[11px] text-slate-500" dir="ltr">
                        শুরুতে
                      </span>
                      <span className="font-arabic text-2xl text-emerald-900 font-bold">
                        {item.forms.initial}
                      </span>
                    </div>
                    <div className="border-x border-slate-200/70">
                      <span className="block text-[11px] text-slate-500" dir="ltr">
                        মাঝে
                      </span>
                      <span className="font-arabic text-2xl text-emerald-900 font-bold">
                        {item.forms.medial}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-500" dir="ltr">
                        শেষে
                      </span>
                      <span className="font-arabic text-2xl text-emerald-900 font-bold">
                        {item.forms.final}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-emerald-800 font-semibold">
                    <span>উদাহরণ: {item.exampleWord.ar} ({item.exampleWord.bnMeaning})</span>
                    <span className="inline-flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>শুনুন</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
