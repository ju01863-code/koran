import React, { useState } from 'react';
import { Volume2, CheckCircle2, BookOpenCheck, HeartHandshake } from 'lucide-react';
import {
  WORD_TYPES_OVERVIEW,
  QURANIC_SENTENCE_EXAMPLES,
  VERB_CONJUGATION_TABLE,
  QuranicSentenceExample,
  GrammarSegment,
} from '../data/grammarData';
import { speakArabic, toBnNum } from '../utils/speech';

interface GrammarViewProps {
  completedGrammarIds: number[];
  onToggleGrammarCompleted: (id: number) => void;
  slowAudio: boolean;
  largeFont: boolean;
  onNavigateTab?: (tab: 'alphabet' | 'words' | 'roots' | 'grammar' | 'messages' | 'plan' | 'quran' | 'favorites') => void;
}

export const GrammarView: React.FC<GrammarViewProps> = ({
  completedGrammarIds,
  onToggleGrammarCompleted,
  slowAudio,
  largeFont,
  onNavigateTab,
}) => {
  const [selectedSentence, setSelectedSentence] = useState<QuranicSentenceExample>(
    QURANIC_SENTENCE_EXAMPLES[0]
  );
  const [activeSegmentIdx, setActiveSegmentIdx] = useState<number>(0);

  const activeSegment: GrammarSegment =
    selectedSentence.segments[activeSegmentIdx] || selectedSentence.segments[0];

  const getRoleColorClasses = (role: GrammarSegment['role'], isSelected: boolean) => {
    switch (role) {
      case 'verb':
        return isSelected
          ? 'bg-emerald-900 text-white border-emerald-900'
          : 'bg-emerald-50 text-emerald-950 border-emerald-300 hover:border-emerald-600';
      case 'subject':
        return isSelected
          ? 'bg-sky-900 text-white border-sky-900'
          : 'bg-sky-50 text-sky-950 border-sky-300 hover:border-sky-600';
      case 'object':
        return isSelected
          ? 'bg-amber-900 text-white border-amber-900'
          : 'bg-amber-50 text-amber-950 border-amber-300 hover:border-amber-600';
      case 'predicate':
        return isSelected
          ? 'bg-teal-900 text-white border-teal-900'
          : 'bg-teal-50 text-teal-950 border-teal-300 hover:border-teal-600';
      default:
        return isSelected
          ? 'bg-slate-900 text-white border-slate-900'
          : 'bg-slate-100 text-slate-900 border-slate-300 hover:border-slate-500';
    }
  };

  return (
    <div className="space-y-10">
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
          <span className="px-3 py-1.5 rounded-full bg-emerald-800 text-white font-bold shrink-0">
            সহজ ব্যাকরণ
          </span>
          <button
            type="button"
            onClick={() => onNavigateTab('messages')}
            className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium shrink-0 cursor-pointer"
          >
            লেখকের বাণী
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-sm font-medium text-emerald-800 tabular-nums">
            ০৪. সহজ কুরআনিক ব্যাকরণ · বাক্য গঠন চর্চা {toBnNum(completedGrammarIds.length)}/
            {toBnNum(QURANIC_SENTENCE_EXAMPLES.length)}টি সম্পন্ন
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1 text-balance">
            কর্তা-ক্রিয়া-কর্ম প্যাটার্ন ও কুরআনের সাধারণ বাক্য গঠন
          </h1>
        </div>
        <p className="text-sm text-slate-600 max-w-md">
          কঠিন পরিভাষা ছাড়াই শব্দের শেষের হরকত (পেশ, যবর, যের) দেখে কে কাজ করেছে (কর্তা) এবং কী কাজ হয়েছে (কর্ম) তা চেনার সহজ নিয়ম।
        </p>
      </div>

      {/* Interactive Quranic Sentence Pattern Analyzer */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              কুরআনের বাক্য গঠন বিশ্লেষণ (শব্দের ওপর ট্যাপ করে ব্যাকরণ ও উচ্চারণ দেখুন)
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              কর্তা চেনার উপায়: শেষে পেশ (ـُ) · কর্ম চেনার উপায়: শেষে যবর (ـَ)
            </p>
          </div>

          <button
            type="button"
            onClick={() => onToggleGrammarCompleted(selectedSentence.id)}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap self-start ${
              completedGrammarIds.includes(selectedSentence.id)
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              {completedGrammarIds.includes(selectedSentence.id)
                ? 'অনুশীলন সম্পন্ন'
                : 'অনুশীলন সম্পন্ন চিহ্নিত করুন'}
            </span>
          </button>
        </div>

        {/* Sentence Selector Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {QURANIC_SENTENCE_EXAMPLES.map((ex, idx) => {
            const isSelected = selectedSentence.id === ex.id;
            const isDone = completedGrammarIds.includes(ex.id);
            return (
              <button
                key={ex.id}
                type="button"
                onClick={() => {
                  setSelectedSentence(ex);
                  setActiveSegmentIdx(0);
                  speakArabic(ex.fullArabic, slowAudio);
                }}
                className={`min-h-[72px] p-3.5 rounded-xl border text-left flex items-center justify-between gap-3 transition-colors ${
                  isSelected
                    ? 'bg-emerald-900 text-white border-emerald-900'
                    : 'bg-[#F8FAF9] hover:bg-emerald-50/60 border-slate-200 text-slate-900'
                }`}
              >
                <div className="min-w-0">
                  <p
                    className={`text-xs font-medium ${
                      isSelected ? 'text-emerald-200' : 'text-emerald-800'
                    }`}
                  >
                    উদাহরণ {toBnNum(idx + 1)} · {ex.patternNameBn}
                  </p>
                  <p className="text-sm font-bold truncate mt-0.5">{ex.fullMeaning}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {isDone && (
                    <CheckCircle2
                      className={`w-4 h-4 ${
                        isSelected ? 'text-emerald-300' : 'text-emerald-700'
                      }`}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Sentence Interactive Stage */}
        <div className="p-6 md:p-8 rounded-2xl bg-[#F4F8F6] border border-emerald-900/10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-emerald-800">
                প্যাটার্ন: {selectedSentence.patternNameBn} · {selectedSentence.surahRef}
              </span>
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 mt-1">
                পূর্ণ অর্থ: “{selectedSentence.fullMeaning}”
              </h3>
              <p className="text-sm text-slate-600 mt-0.5">
                পূর্ণ উচ্চারণ: {selectedSentence.fullPronunciation}
              </p>
            </div>

            <button
              type="button"
              onClick={() => speakArabic(selectedSentence.fullArabic, slowAudio)}
              className="min-h-[48px] px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-xl flex items-center gap-2 transition-colors whitespace-nowrap self-start"
            >
              <Volume2 className="w-5 h-5" />
              <span>পুরো বাক্যটি শুনুন</span>
            </button>
          </div>

          {/* Interactive Word-by-Word Grammatical Breakdown (RTL Order) */}
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-3 text-right">
              ডান দিক থেকে প্রতিটি অংশে ট্যাপ করে কর্তা-ক্রিয়া-কর্ম ভূমিকা দেখুন:
            </p>
            <div dir="rtl" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {selectedSentence.segments.map((seg, idx) => {
                const isSegActive = idx === activeSegmentIdx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setActiveSegmentIdx(idx);
                      speakArabic(seg.arabic, slowAudio);
                    }}
                    className={`p-5 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-between min-h-[150px] cursor-pointer ${getRoleColorClasses(
                      seg.role,
                      isSegActive
                    )}`}
                  >
                    <span className="text-xs font-bold" dir="ltr">
                      অংশ {toBnNum(idx + 1)}: {seg.roleLabelBn}
                    </span>

                    <span
                      className={`font-arabic my-2 ${
                        largeFont ? 'text-5xl' : 'text-4xl md:text-5xl'
                      }`}
                    >
                      {seg.arabic}
                    </span>

                    <div dir="ltr" className="space-y-0.5">
                      <p className="text-sm font-bold">{seg.pronunciation}</p>
                      <p className="text-xs opacity-90">অর্থ: {seg.meaning}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Segment Detail Box */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                <BookOpenCheck className="w-4 h-4" />
                <span>নির্বাচিত শব্দের ব্যাকরণগত ব্যাখ্যা ({activeSegment.roleLabelBn})</span>
              </div>
              <p className="text-base font-bold text-slate-900">
                {activeSegment.arabic} ({activeSegment.pronunciation}) — “{activeSegment.meaning}”
              </p>
              <p className="text-sm text-slate-700">{activeSegment.grammarDetailBn}</p>
            </div>
            <div className="md:max-w-sm text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <strong className="text-slate-900 block mb-1">বাক্য গঠনের সারসংক্ষেপ:</strong>
              {selectedSentence.summaryNoteBn}
            </div>
          </div>
        </div>
      </div>

      {/* Part 2: 3 Types of Arabic Words (ইসম, ফি'ল, হারফ) */}
      <div className="space-y-4">
        <h2 className="text-xl md:text-2xl font-bold text-slate-900">
          আরবি ভাষার সকল শব্দ মাত্র ৩ প্রকার
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {WORD_TYPES_OVERVIEW.map((type) => (
            <div
              key={type.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between"
            >
              <div>
                <h3 className="text-xl font-bold text-emerald-950">{type.titleBn}</h3>
                <p className="text-sm text-slate-600 mt-1">{type.subtitleBn}</p>

                <ul className="mt-4 space-y-2 text-sm text-slate-700">
                  {type.identifyingSignsBn.map((sign, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-700 font-bold">•</span>
                      <span>{sign}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 mb-2">
                  উদাহরণে ট্যাপ করে উচ্চারণ শুনুন:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {type.examples.map((ex, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => speakArabic(ex.ar, slowAudio)}
                      className="p-2.5 rounded-xl bg-[#F4F8F6] hover:bg-emerald-100/70 text-center transition-colors"
                    >
                      <span className="font-arabic text-2xl text-emerald-950 block">
                        {ex.ar}
                      </span>
                      <span className="text-xs font-bold text-slate-900 block mt-0.5">
                        {ex.bn}
                      </span>
                      <span className="text-[11px] text-slate-600 block">{ex.meaning}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Part 3: Pronoun & Verb Conjugation Pattern Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-900">
            সর্বনাম অনুযায়ী ক্রিয়ার রূপ পরিবর্তন (উদাহরণ মূল: ع - ل - م / জানা)
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            যেকোনো আরবি ক্রিয়াপদের শুরুতে বা শেষে একটি নির্দিষ্ট অক্ষর যুক্ত হয়ে কর্তা (সে, তারা, তুমি, আমি, আমরা) নির্দেশ করে।
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold text-slate-600 bg-[#F8FAF9]">
                <th className="py-3.5 px-4">সর্বনাম (Pronoun)</th>
                <th className="py-3.5 px-4">অতীত কাল (মাদী)</th>
                <th className="py-3.5 px-4">বর্তমান/ভবিষ্যৎ (মুদারি)</th>
                <th className="py-3.5 px-4">বাংলা অর্থ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {VERB_CONJUGATION_TABLE.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => speakArabic(row.pronounAr, slowAudio)}
                      className="inline-flex items-center gap-2.5 text-left hover:text-emerald-800"
                    >
                      <span className="font-arabic text-2xl text-emerald-950 font-bold">
                        {row.pronounAr}
                      </span>
                      <span className="font-semibold text-slate-900">{row.pronounBn}</span>
                    </button>
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => speakArabic(row.pastAr, slowAudio)}
                      className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#F4F8F6] hover:bg-emerald-100/80 transition-colors"
                    >
                      <span className="font-arabic text-2xl text-emerald-950">{row.pastAr}</span>
                      <span className="text-xs font-semibold text-slate-700">({row.pastBn})</span>
                      <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
                    </button>
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => speakArabic(row.presentAr, slowAudio)}
                      className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#F4F8F6] hover:bg-emerald-100/80 transition-colors"
                    >
                      <span className="font-arabic text-2xl text-emerald-950">
                        {row.presentAr}
                      </span>
                      <span className="text-xs font-semibold text-slate-700">
                        ({row.presentBn})
                      </span>
                      <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
                    </button>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{row.meaningBn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
