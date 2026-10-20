import React, { useState } from 'react';
import { Volume2, CheckCircle2, GitBranch, HeartHandshake } from 'lucide-react';
import { QURANIC_ROOTS, RootWordEntry } from '../data/rootsData';
import { speakArabic, toBnNum } from '../utils/speech';

interface RootsViewProps {
  exploredRoots: number[];
  onToggleRootExplored: (id: number) => void;
  slowAudio: boolean;
  largeFont: boolean;
  onNavigateTab?: (tab: 'alphabet' | 'words' | 'roots' | 'grammar' | 'messages' | 'plan' | 'quran' | 'favorites') => void;
}

export const RootsView: React.FC<RootsViewProps> = ({
  exploredRoots,
  onToggleRootExplored,
  slowAudio,
  largeFont,
  onNavigateTab,
}) => {
  const [selectedRoot, setSelectedRoot] = useState<RootWordEntry>(QURANIC_ROOTS[0]);

  const handleSelectRoot = (root: RootWordEntry) => {
    setSelectedRoot(root);
    speakArabic(root.derivedWords[0]?.arabic || root.rootAr, slowAudio);
  };

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
          <span className="px-3 py-1.5 rounded-full bg-emerald-800 text-white font-bold shrink-0">
            শব্দমূল
          </span>
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

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-sm font-medium text-emerald-800 tabular-nums">
            ০৩. শব্দের মূল (মাদ্দা / Root Word) · নির্বাচিত ১২টি প্রধান মূল · চর্চা হয়েছে{' '}
            {toBnNum(exploredRoots.length)}/{toBnNum(QURANIC_ROOTS.length)}টি
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1 text-balance">
            তিন অক্ষরের মূল থেকে কীভাবে কুরআনের অসংখ্য শব্দ তৈরি হয়
          </h1>
        </div>
        <p className="text-sm text-slate-600 max-w-md">
          আরবি ভাষার সবচেয়ে চমৎকার বৈশিষ্ট্য হলো: মাত্র ৩টি মূল অক্ষর চিনলে তা থেকে গঠিত ৫–১০টি শব্দের অর্থ সহজেই বোঝা যায়।
        </p>
      </div>

      {/* Two-Zone Sandbox Layout: Left Root Selector, Right Root Tree & Derived Words */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 4 cols: Root Selector List */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="text-base font-bold text-slate-900 mb-3">
            তিন অক্ষরের মূল নির্বাচন করুন
          </h2>
          <div className="space-y-2">
            {QURANIC_ROOTS.map((root) => {
              const isSelected = selectedRoot.id === root.id;
              const isDone = exploredRoots.includes(root.id);

              return (
                <button
                  key={root.id}
                  type="button"
                  onClick={() => handleSelectRoot(root)}
                  className={`w-full min-h-[64px] p-3.5 rounded-xl border text-left flex items-center justify-between gap-3 transition-colors ${
                    isSelected
                      ? 'bg-emerald-900 text-white border-emerald-900'
                      : 'bg-[#F8FAF9] hover:bg-emerald-50/60 border-slate-200 text-slate-900'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base truncate">{root.coreMeaningBn}</span>
                      {isDone && (
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 ${
                            isSelected ? 'text-emerald-300' : 'text-emerald-700'
                          }`}
                        />
                      )}
                    </div>
                    <p
                      className={`text-xs mt-0.5 tabular-nums ${
                        isSelected ? 'text-emerald-200' : 'text-slate-500'
                      }`}
                    >
                      {root.pronunciationBn} · কুরআনে {toBnNum(root.totalOccurrences)} বার
                    </p>
                  </div>

                  <span
                    dir="rtl"
                    className={`font-arabic text-2xl font-bold shrink-0 ${
                      isSelected ? 'text-white' : 'text-emerald-950'
                    }`}
                  >
                    {root.rootAr}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 8 cols: Interactive Root Visual Diagram & Derived Words List */}
        <div className="lg:col-span-8 space-y-6">
          {/* Root Core Banner */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <p className="text-xs font-medium text-emerald-800">
                  তিন অক্ষরের মূল (ত্রিবর্ণ মূল) · কুরআনে মোট ব্যবহৃত হয়েছে{' '}
                  {toBnNum(selectedRoot.totalOccurrences)} বার
                </p>
                <h2 className="text-2xl font-bold text-slate-900 mt-1">
                  মূল অর্থ: {selectedRoot.coreMeaningBn}
                </h2>
                <p className="text-sm text-slate-600 mt-1">{selectedRoot.explanationBn}</p>
              </div>

              <button
                type="button"
                onClick={() => onToggleRootExplored(selectedRoot.id)}
                className={`min-h-[46px] px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap self-start ${
                  exploredRoots.includes(selectedRoot.id)
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  {exploredRoots.includes(selectedRoot.id) ? 'চর্চা সম্পন্ন' : 'চর্চা সম্পন্ন চিহ্নিত করুন'}
                </span>
              </button>
            </div>

            {/* Visual 3-Letter Root Nodes (RTL: 1st, 2nd, 3rd letter) */}
            <div className="my-6 p-6 rounded-2xl bg-[#F4F8F6] border border-emerald-900/10">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-900">
                  <GitBranch className="w-4 h-4" />
                  <span>মূল ৩টি বর্ণ (ডান থেকে বামে): {selectedRoot.pronunciationBn}</span>
                </span>
                <span>যেকোনো বর্ণে বা নিচের শব্দে ট্যাপ করে উচ্চারণ শুনুন</span>
              </div>

              <div dir="rtl" className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                {selectedRoot.letters.map((char, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => speakArabic(char, slowAudio)}
                    className="p-4 rounded-2xl bg-white border border-emerald-800/20 hover:border-emerald-600 flex flex-col items-center justify-center transition-colors shadow-2xs"
                  >
                    <span className="text-[11px] text-slate-500" dir="ltr">
                      {index === 0 ? '১ম অক্ষর (ফা)' : index === 1 ? '২য় অক্ষর (আইন)' : '৩য় অক্ষর (লাম)'}
                    </span>
                    <span className="font-arabic text-5xl text-emerald-950 font-bold my-1">
                      {char}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Derived Words List */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4">
                এই মূল ({selectedRoot.rootAr}) থেকে উদ্ভূত কুরআনের শব্দসমূহ ({toBnNum(selectedRoot.derivedWords.length)}টি)
              </h3>

              <div className="space-y-3">
                {selectedRoot.derivedWords.map((dw, idx) => (
                  <div
                    key={idx}
                    className="p-4 md:p-5 rounded-2xl bg-[#F8FAF9] border border-slate-200 hover:border-emerald-500 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-semibold text-emerald-800">{dw.grammarRole}</span>
                          <span aria-hidden="true">·</span>
                          <span>প্যাটার্ন: {dw.patternAr}</span>
                        </div>
                        <h4 className="text-xl font-bold text-slate-900">
                          {dw.meaning}{' '}
                          <span className="text-base font-medium text-emerald-800">
                            ({dw.pronunciation})
                          </span>
                        </h4>
                      </div>

                      <button
                        type="button"
                        onClick={() => speakArabic(dw.arabic, slowAudio)}
                        className="min-h-[56px] px-5 py-2 rounded-xl bg-white border border-slate-200 hover:border-emerald-600 flex items-center justify-between sm:justify-center gap-3 transition-colors shrink-0"
                      >
                        <span
                          dir="rtl"
                          className={`font-arabic text-emerald-950 ${
                            largeFont ? 'text-4xl' : 'text-3xl'
                          }`}
                        >
                          {dw.arabic}
                        </span>
                        <Volume2 className="w-5 h-5 text-emerald-700 shrink-0" />
                      </button>
                    </div>

                    {/* Ayah Example */}
                    <div className="mt-3 pt-3 border-t border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <p className="text-sm text-slate-700">{dw.ayahExampleBn}</p>
                      <button
                        type="button"
                        onClick={() => speakArabic(dw.ayahExampleAr, slowAudio)}
                        dir="rtl"
                        className="font-arabic text-2xl text-emerald-900 hover:text-emerald-700 text-right inline-flex items-center gap-2 self-end sm:self-auto"
                      >
                        <span>{dw.ayahExampleAr}</span>
                        <Volume2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
