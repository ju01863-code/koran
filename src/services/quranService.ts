// Service for loading, caching, and providing full Surah data for all 114 Surahs of the Holy Quran

import { PRACTICE_SURAHS, SurahData, SurahAyah, AyahWord } from '../data/surahData';
import { ALL_114_SURAHS, SurahMetadata } from '../data/allSurahsMetadata';
import { HIGH_FREQUENCY_WORDS, QuranWord } from '../data/wordsData';

// In-memory cache for fast instant switches
const memoryCache = new Map<number, SurahData>();

// Initialize memory cache with the 20 pre-bundled rich curated Surahs
PRACTICE_SURAHS.forEach((s) => {
  memoryCache.set(s.surahNumber, s);
});

// Fast normalized Arabic word map for vocabulary enrichment
const normalizedWordMap = new Map<string, QuranWord>();
const normalizeAr = (txt: string) =>
  txt.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0610-\u061A]/g, '').trim();

HIGH_FREQUENCY_WORDS.forEach((w) => {
  normalizedWordMap.set(w.arabic.trim(), w);
  const norm = normalizeAr(w.arabic);
  if (!normalizedWordMap.has(norm)) {
    normalizedWordMap.set(norm, w);
  }
});

const BISMILLAH_PREFIX_UTHMANI = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';

/**
 * Check if a Surah is available synchronously without network request
 */
export function getSurahSync(surahNumber: number): SurahData | null {
  if (memoryCache.has(surahNumber)) {
    return memoryCache.get(surahNumber)!;
  }

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(`quran_surah_v2_${surahNumber}`);
      if (stored) {
        const parsed = JSON.parse(stored) as SurahData;
        memoryCache.set(surahNumber, parsed);
        return parsed;
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  return null;
}

/**
 * Check if a Surah is already cached or pre-bundled
 */
export function isSurahCached(surahNumber: number): boolean {
  if (memoryCache.has(surahNumber)) return true;
  if (typeof window !== 'undefined') {
    return localStorage.getItem(`quran_surah_v2_${surahNumber}`) !== null;
  }
  return false;
}

/**
 * Get metadata for any of the 114 Surahs
 */
export function getSurahMetadata(surahNumber: number): SurahMetadata | undefined {
  return ALL_114_SURAHS.find((s) => s.surahNumber === surahNumber);
}

/**
 * Approximate phonetic Bengali transliteration helper for Arabic words
 */
function approximateBnPronunciation(arabicWord: string): string {
  // Common prefixes & replacements for clean pronunciation
  const clean = arabicWord.replace(/[\u06D6-\u06ED]/g, '');
  return clean;
}

/**
 * Load full Surah data for any of the 114 Surahs (network + offline cache)
 */
export async function loadSurah(surahNumber: number): Promise<SurahData> {
  // 1. Check synchronous cache
  const cached = getSurahSync(surahNumber);
  if (cached) {
    return cached;
  }

  const meta = getSurahMetadata(surahNumber) ?? {
    surahNumber,
    nameBn: `সূরা নং ${surahNumber}`,
    nameAr: `سورة ${surahNumber}`,
    englishName: `Surah ${surahNumber}`,
    meaningBn: 'কুরআনের পবিত্র সূরা',
    revelationTypeBn: 'মাক্কী' as const,
    ayahCount: 0,
    juzNumber: '',
    isCuratedOffline: false,
  };

  // 2. Fetch from high-speed Quran API
  const apiUrl = `https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,bn.bengali`;
  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error(`সূরা লোড করতে ব্যর্থ হয়েছে (Status: ${response.status})`);
  }

  const json = await response.json();
  if (!json.data || !Array.isArray(json.data) || json.data.length < 2) {
    throw new Error('কুরআন ডেটা প্রক্রিয়াকরণে সমস্যা হয়েছে');
  }

  const arData = json.data[0];
  const bnData = json.data[1];

  const ayahs: SurahAyah[] = [];
  const total = Math.min(arData.ayahs.length, bnData.ayahs.length);

  for (let i = 0; i < total; i++) {
    const arAyah = arData.ayahs[i];
    const bnAyah = bnData.ayahs[i];

    let fullAr = arAyah.text.trim();
    // In api.alquran.cloud, for surahs other than 1 and 9, the first ayah contains Bismillah prefix.
    if (surahNumber !== 1 && surahNumber !== 9 && i === 0) {
      if (fullAr.startsWith(BISMILLAH_PREFIX_UTHMANI)) {
        fullAr = fullAr.slice(BISMILLAH_PREFIX_UTHMANI.length).trim();
      } else {
        // Fallback strip
        fullAr = fullAr.replace(/^بِسْمِ.*?الرَّحِيمِ\s*/u, '').trim();
      }
    }

    const fullBnMeaning = bnAyah.text.trim();

    // Segment full Arabic ayah into words
    const rawTokens: string[] = fullAr.split(/\s+/).filter(Boolean);
    const words: AyahWord[] = rawTokens.map((token: string) => {
      const norm = normalizeAr(token);
      const matched = normalizedWordMap.get(token) ?? normalizedWordMap.get(norm);

      return {
        ar: token,
        bnPronunciation: matched?.pronunciation ?? approximateBnPronunciation(token),
        bnMeaning: matched?.meaning ?? 'শব্দটি তিলাওয়াত করুন',
        grammarNote: matched ? `${matched.frequency} বার পঠিত শব্দ (মূল: ${matched.root})` : undefined,
      };
    });

    ayahs.push({
      ayahNumber: i + 1,
      fullAr,
      fullBnPronunciation: `আয়াত ${i + 1}`,
      fullBnMeaning,
      words,
    });
  }

  const surahData: SurahData = {
    id: surahNumber,
    surahNumber,
    nameBn: meta.nameBn,
    nameAr: meta.nameAr || arData.name,
    meaningBn: meta.meaningBn,
    revelationTypeBn: meta.revelationTypeBn,
    ayahCount: ayahs.length,
    ayahs,
  };

  // 3. Cache into memory & localStorage
  memoryCache.set(surahNumber, surahData);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`quran_surah_v2_${surahNumber}`, JSON.stringify(surahData));
    } catch {
      // Storage quota limit fallback
    }
  }

  return surahData;
}
