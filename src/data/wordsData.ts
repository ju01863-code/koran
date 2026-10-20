import { QuranWord, RAW_WORDS_PART_1, RawWordTuple } from './wordsDataPart1';
import { RAW_WORDS_PART_2 } from './wordsDataPart2';

export type { QuranWord };

function mapTupleToWord(tuple: RawWordTuple): QuranWord {
  const [
    id,
    arabic,
    pronunciation,
    meaning,
    category,
    frequency,
    root,
    ayahAr,
    ayahBnPronunciation,
    ayahBnMeaning,
    ayahRef,
  ] = tuple;
  return {
    id,
    arabic,
    pronunciation,
    meaning,
    category,
    frequency,
    root: root === '-' ? undefined : root,
    ayahAr,
    ayahBnPronunciation,
    ayahBnMeaning,
    ayahRef,
  };
}

export const HIGH_FREQUENCY_WORDS: QuranWord[] = [
  ...RAW_WORDS_PART_1.map(mapTupleToWord),
  ...RAW_WORDS_PART_2.map(mapTupleToWord),
];

export const WORD_CATEGORIES: string[] = [
  'সব বিভাগ',
  'অব্যয় ও সংযোজক',
  'সর্বনাম ও ইশারা',
  'আল্লাহ ও তাঁর গুণাবলী',
  'নবী, ফেরেশতা ও মানুষ',
  'আসমান, জমিন ও প্রকৃতি',
  'ঈমান, আমল ও ইবাদত',
  'আখিরাত, জান্নাত ও জাহান্নাম',
  'উচ্চ-ফ্রিকোয়েন্সি ক্রিয়াপদ - ১',
  'উচ্চ-ফ্রিকোয়েন্সি ক্রিয়াপদ - ২',
  'কাল, সংখ্যা ও দিকনির্দেশ',
];
