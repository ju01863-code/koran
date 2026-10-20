export interface GrammarSegment {
  arabic: string;
  pronunciation: string;
  meaning: string;
  role: 'verb' | 'subject' | 'object' | 'particle' | 'predicate';
  roleLabelBn: string;
  grammarDetailBn: string;
}

export interface QuranicSentenceExample {
  id: number;
  patternType: 'verbal' | 'nominal' | 'harf_ism';
  patternNameBn: string;
  fullArabic: string;
  fullPronunciation: string;
  fullMeaning: string;
  surahRef: string;
  segments: GrammarSegment[];
  summaryNoteBn: string;
}

export interface VerbConjugationRow {
  pronounAr: string;
  pronounBn: string;
  pastAr: string;
  pastBn: string;
  presentAr: string;
  presentBn: string;
  meaningBn: string;
}

export const WORD_TYPES_OVERVIEW = [
  {
    id: 'ism',
    titleBn: '১. ইসম (اِسْمٌ) — বিশেষ্য বা নামপদ',
    subtitleBn: 'ব্যক্তি, বস্তু, স্থান, গুণ বা কাজের নাম',
    identifyingSignsBn: [
      'শব্দের শুরুতে "আল" (الْ) যুক্ত থাকা — যেমন: الْكِتَابُ (কিতাবটি)',
      'শব্দের শেষে তানবীন (দুই যবর ً, দুই যের ٍ, দুই পেশ ٌ) থাকা — যেমন: كِتَابٌ (একটি কিতাব)',
      'শব্দের পূর্বে অব্যয় (حَرْفُ جَرٍّ) থাকা — যেমন: فِي الْبَيْتِ (ঘরের মধ্যে)',
    ],
    examples: [
      { ar: 'اللَّهُ', bn: 'আল্লাহু', meaning: 'আল্লাহ' },
      { ar: 'مُسْلِمٌ', bn: 'মুসলিমুন', meaning: 'একজন মুসলিম' },
      { ar: 'الْجَنَّةُ', bn: 'আল-জান্নাতু', meaning: 'জান্নাত' },
    ],
  },
  {
    id: 'fil',
    titleBn: '২. ফি’ল (فِعْلٌ) — ক্রিয়া বা কাজ',
    subtitleBn: 'কাল বা সময়ের সাথে সম্পর্কিত যেকোনো কাজ',
    identifyingSignsBn: [
      'মাদী (অতীত কাল): কাজ শেষ হয়েছে — যেমন: خَلَقَ (তিনি সৃষ্টি করেছেন), قَالَ (সে বলল)',
      'মুদারি (বর্তমান/ভবিষ্যৎ কাল): শুরুতে ي / ت / أ / ن থাকে — যেমন: يَعْلَمُ (তিনি জানেন), نَعْبُدُ (আমরা ইবাদত করি)',
      'আমর (আদেশ/প্রার্থনা): আদেশ বা দোয়া বোঝায় — যেমন: قُلْ (বলুন), اهْدِنَا (আমাদের পথ দেখান)',
    ],
    examples: [
      { ar: 'خَلَقَ', bn: 'খলাক্বা', meaning: 'তিনি সৃষ্টি করেছেন (অতীত)' },
      { ar: 'يَعْلَمُ', bn: 'ইয়া’লামু', meaning: 'তিনি জানেন (বর্তমান)' },
      { ar: 'اقْرَأْ', bn: 'ইক্বরা’', meaning: 'পড়ুন (আদেশ)' },
    ],
  },
  {
    id: 'harf',
    titleBn: '৩. হারফ (حَرْفٌ) — অব্যয় বা সংযোজক',
    subtitleBn: 'যে শব্দ একা পূর্ণ অর্থ প্রকাশ করে না, বরং ইসম ও ফি’লকে যুক্ত করে',
    identifyingSignsBn: [
      'হারফে যার (Prepositions): পরের শব্দের শেষে যের (Kasra) দেয় — যেমন: مِنْ (থেকে), فِي (মধ্যে), إِلَىٰ (দিকে), عَلَىٰ (উপরে)',
      'হারফে নাসব ও তাকীদ: নিশ্চয়তা বোঝায় — যেমন: إِنَّ (নিশ্চয়ই)',
      'না-বোধক ও প্রশ্নবোধক অব্যয় — যেমন: لَا (না), لَمْ (নি), هَلْ (কি?)',
    ],
    examples: [
      { ar: 'مِنْ', bn: 'মিন', meaning: 'থেকে / হতে' },
      { ar: 'فِي', bn: 'ফী', meaning: 'মধ্যে / ভেতরে' },
      { ar: 'إِنَّ', bn: 'ইন্না', meaning: 'নিশ্চয়ই' },
    ],
  },
];

export const QURANIC_SENTENCE_EXAMPLES: QuranicSentenceExample[] = [
  {
    id: 1,
    patternType: 'verbal',
    patternNameBn: 'ক্রিয়া + কর্তা + কর্ম (জুমলা ফি’লীয়্যাহ)',
    fullArabic: 'خَلَقَ اللَّهُ السَّمَاوَاتِ',
    fullPronunciation: 'খলাক্বাল্লাহুস সামাওয়াতি',
    fullMeaning: 'আল্লাহ আসমানসমূহ সৃষ্টি করেছেন',
    surahRef: 'সূরা আল-আনকাবূত ২৯:৪৪',
    summaryNoteBn:
      'আরবি ক্রিয়াবাচক বাক্যে সাধারণত প্রথমে ক্রিয়া (فِعْل), তারপর কর্তা (فَاعِل - শেষে পেশ/দাম্মা) এবং শেষে কর্ম (مَفْعُول - শেষে যবর/যের) বসে।',
    segments: [
      {
        arabic: 'خَلَقَ',
        pronunciation: 'খলাক্বা',
        meaning: 'সৃষ্টি করেছেন',
        role: 'verb',
        roleLabelBn: 'ক্রিয়া (ফি’ল)',
        grammarDetailBn: 'অতীতকালের ক্রিয়া (ফেল মাদী)। কাজটি সম্পন্ন হওয়া বোঝাচ্ছে।',
      },
      {
        arabic: 'اللَّهُ',
        pronunciation: 'আল্লাহু',
        meaning: 'আল্লাহ',
        role: 'subject',
        roleLabelBn: 'কর্তা (ফা’ইল)',
        grammarDetailBn: 'যিনি কাজটি করেছেন (কর্তা)। আরবিতে কর্তার শেষ অক্ষরে পেশ (ـُ) হয়।',
      },
      {
        arabic: 'السَّمَاوَاتِ',
        pronunciation: 'আস-সামাওয়াতি',
        meaning: 'আসমানসমূহকে',
        role: 'object',
        roleLabelBn: 'কর্ম (মাফ’ঊল)',
        grammarDetailBn: 'যার ওপর কাজটি হয়েছে (কর্ম)। স্ত্রীবাচক বহুবচন হওয়ায় শেষে যের (ـِ) হয়েছে।',
      },
    ],
  },
  {
    id: 2,
    patternType: 'verbal',
    patternNameBn: 'ক্রিয়া + কর্তা + কর্ম (জুমলা ফি’লীয়্যাহ)',
    fullArabic: 'ضَرَبَ اللَّهُ مَثَلًا',
    fullPronunciation: 'দারাবাল্লাহু মাছালান',
    fullMeaning: 'আল্লাহ একটি উপমা পেশ করেছেন',
    surahRef: 'সূরা ইবরাহীম ১৪:২৪',
    summaryNoteBn:
      'এখানে ضَرَبَ (ক্রিয়া - পেশ করেছেন), اللَّهُ (কর্তা - শেষে পেশ) এবং مَثَلًا (কর্ম - শেষে দুই যবর/ফাতহাতাইন)।',
    segments: [
      {
        arabic: 'ضَرَبَ',
        pronunciation: 'দারাবা',
        meaning: 'পেশ করেছেন / বর্ণনা করেছেন',
        role: 'verb',
        roleLabelBn: 'ক্রিয়া (ফি’ল)',
        grammarDetailBn: 'অতীতকালের ক্রিয়াপদ (একবচন)।',
      },
      {
        arabic: 'اللَّهُ',
        pronunciation: 'আল্লাহু',
        meaning: 'আল্লাহ',
        role: 'subject',
        roleLabelBn: 'কর্তা (ফা’ইল)',
        grammarDetailBn: 'কর্তা বা ফা’ইল হওয়ায় শেষ অক্ষর হা (هُ)-তে পেশ হয়েছে।',
      },
      {
        arabic: 'مَثَلًا',
        pronunciation: 'মাছালান',
        meaning: 'একটি উপমা',
        role: 'object',
        roleLabelBn: 'কর্ম (মাফ’ঊল)',
        grammarDetailBn: 'কর্ম বা মাফ’ঊল হওয়ায় শেষে দুই যবর (ـًا) হয়েছে।',
      },
    ],
  },
  {
    id: 3,
    patternType: 'verbal',
    patternNameBn: 'ক্রিয়া + লুকায়িত কর্তা + কর্ম',
    fullArabic: 'عَلَّمَ الْقُرْآنَ',
    fullPronunciation: 'আল্লামাল কুরআনা',
    fullMeaning: '(তিনি) কুরআন শিক্ষা দিয়েছেন',
    surahRef: 'সূরা আর-রহমান ৫৫:২',
    summaryNoteBn:
      'কখনো কর্তা ক্রিয়ার ভেতরে সর্বনাম (তিনি/هُوَ) হিসেবে লুকানো থাকে, এবং সরাসরি পরের শব্দটি কর্ম (শেষে যবর) হয়।',
    segments: [
      {
        arabic: 'عَلَّمَ',
        pronunciation: 'আল্লামা',
        meaning: 'তিনি শিক্ষা দিয়েছেন',
        role: 'verb',
        roleLabelBn: 'ক্রিয়া + কর্তা (তিনি)',
        grammarDetailBn: 'অতীতকালের ক্রিয়া, যার ভেতরে "হুওয়া" (তিনি) কর্তা হিসেবে নিহিত আছে।',
      },
      {
        arabic: 'الْقُرْآنَ',
        pronunciation: 'আল-কুরআনা',
        meaning: 'কুরআনকে',
        role: 'object',
        roleLabelBn: 'কর্ম (মাফ’ঊল)',
        grammarDetailBn: 'কর্মপদ হওয়ায় নূন (نَ) অক্ষরের ওপর যবর হয়েছে।',
      },
    ],
  },
  {
    id: 4,
    patternType: 'verbal',
    patternNameBn: 'জোরপ্রদান মূলক: কর্ম + ক্রিয়া(কর্তাসহ)',
    fullArabic: 'إِيَّاكَ نَعْبُدُ',
    fullPronunciation: 'ইয়্যাকা না’বুদু',
    fullMeaning: 'একমাত্র আপনারই আমরা ইবাদত করি',
    surahRef: 'সূরা আল-ফাতিহা ১:৫',
    summaryNoteBn:
      'আরবিতে কর্মকে (إِيَّاكَ) ক্রিয়ার (نَعْبُدُ) আগে আনলে "একমাত্র / কেবল" অর্থ তৈরি হয় (জোর দেওয়ার জন্য)।',
    segments: [
      {
        arabic: 'إِيَّاكَ',
        pronunciation: 'ইয়্যাকা',
        meaning: 'একমাত্র আপনারই',
        role: 'object',
        roleLabelBn: 'অগ্রগামী কর্ম (মাফ’ঊল)',
        grammarDetailBn: 'কর্মপদকে ক্রিয়ার আগে এনে একনিষ্ঠতা (শুধু আপনারই) প্রকাশ করা হয়েছে।',
      },
      {
        arabic: 'نَعْبُدُ',
        pronunciation: 'না’বুদু',
        meaning: 'আমরা ইবাদত করি',
        role: 'verb',
        roleLabelBn: 'ক্রিয়া + কর্তা (আমরা)',
        grammarDetailBn: 'শুরুতে নূন (نَ) থাকায় অর্থ হয়েছে "আমরা" (বর্তমান কালের ক্রিয়া)।',
      },
    ],
  },
  {
    id: 5,
    patternType: 'nominal',
    patternNameBn: 'উদ্দেশ্য + বিধেয় (জুমলা ইসমীয়্যাহ)',
    fullArabic: 'اللَّهُ غَفُورٌ رَحِيمٌ',
    fullPronunciation: 'আল্লাহু গফূরুর রহীমুন',
    fullMeaning: 'আল্লাহ পরম ক্ষমাশীল ও অসীম দয়ালু',
    surahRef: 'সূরা আল-বাকারা ২:২২৬',
    summaryNoteBn:
      'যে বাক্য বিশেষ্য (ইসম) দিয়ে শুরু হয় তাকে "জুমলা ইসমীয়্যাহ" বলে। প্রথম অংশটি মুবতাদা (উদ্দেশ্য) এবং পরের অংশটি খবর (বিধেয়)। উভয়ের শেষে পেশ হয়।',
    segments: [
      {
        arabic: 'اللَّهُ',
        pronunciation: 'আল্লাহু',
        meaning: 'আল্লাহ',
        role: 'subject',
        roleLabelBn: 'উদ্দেশ্য (মুবতাদা)',
        grammarDetailBn: 'বাক্যটি যে বিশেষ্য দিয়ে শুরু হয়েছে (মুবতাদা), শেষে পেশ।',
      },
      {
        arabic: 'غَفُورٌ',
        pronunciation: 'গফূরুন',
        meaning: 'পরম ক্ষমাশীল',
        role: 'predicate',
        roleLabelBn: '১ম বিধেয় (খবর)',
        grammarDetailBn: 'মুবতাদা সম্পর্কে সংবাদ বা গুণ বর্ণনা করছে (খবর), শেষে দুই পেশ।',
      },
      {
        arabic: 'رَحِيمٌ',
        pronunciation: 'রহীমুন',
        meaning: 'অসীম দয়ালু',
        role: 'predicate',
        roleLabelBn: '২য় বিধেয় (খবর)',
        grammarDetailBn: 'দ্বিতীয় গুণবাচক খবর, শেষে দুই পেশ।',
      },
    ],
  },
  {
    id: 6,
    patternType: 'nominal',
    patternNameBn: 'ইন্না (নিশ্চয়ই) + উদ্দেশ্য + বিধেয়',
    fullArabic: 'إِنَّ اللَّهَ عَلِيمٌ حَكِيمٌ',
    fullPronunciation: 'ইন্নাল্লাহা আলীমুন হাকীমুন',
    fullMeaning: 'নিশ্চয়ই আল্লাহ সর্বজ্ঞ ও প্রজ্ঞাময়',
    surahRef: 'সূরা আত-তাওবাহ ৯:২৮',
    summaryNoteBn:
      'নামবাচক বাক্যের শুরুতে إِنَّ (নিশ্চয়ই) আসলে উদ্দেশ্যের (اللَّهَ) শেষের পেশটি যবরে পরিবর্তিত হয়, কিন্তু খবরের (عَلِيمٌ) পেশ অক্ষুণ্ণ থাকে।',
    segments: [
      {
        arabic: 'إِنَّ',
        pronunciation: 'ইন্না',
        meaning: 'নিশ্চয়ই',
        role: 'particle',
        roleLabelBn: 'নিশ্চয়তাসূচক অব্যয়',
        grammarDetailBn: 'হারফু তাকীদ—বাক্যে দৃঢ়তা আনে এবং পরের বিশেষ্যে যবর দেয়।',
      },
      {
        arabic: 'اللَّهَ',
        pronunciation: 'আল্লাহা',
        meaning: 'আল্লাহ',
        role: 'subject',
        roleLabelBn: 'উদ্দেশ্য (ইসম ইন্না)',
        grammarDetailBn: 'পূর্বে إِنَّ আসার কারণে اللَّهُ না হয়ে اللَّهَ (যবর) হয়েছে।',
      },
      {
        arabic: 'عَلِيمٌ حَكِيمٌ',
        pronunciation: 'আলীমুন হাকীমুন',
        meaning: 'সর্বজ্ঞ ও প্রজ্ঞাময়',
        role: 'predicate',
        roleLabelBn: 'বিধেয় (খবর ইন্না)',
        grammarDetailBn: 'ইন্না-এর খবর হওয়ায় শেষে দুই পেশ (ـٌ) বহাল রয়েছে।',
      },
    ],
  },
];

export const VERB_CONJUGATION_TABLE: VerbConjugationRow[] = [
  {
    pronounAr: 'هُوَ',
    pronounBn: 'হুওয়া (সে/তিনি)',
    pastAr: 'عَلِمَ',
    pastBn: 'আলিমা',
    presentAr: 'يَعْلَمُ',
    presentBn: 'ইয়া’লামু',
    meaningBn: 'সে জেনেছে / সে জানে',
  },
  {
    pronounAr: 'هُمْ',
    pronounBn: 'হুম (তারা)',
    pastAr: 'عَلِمُوا',
    pastBn: 'আলিমূ',
    presentAr: 'يَعْلَمُونَ',
    presentBn: 'ইয়া’লামূনা',
    meaningBn: 'তারা জেনেছে / তারা জানে',
  },
  {
    pronounAr: 'أَنْتَ',
    pronounBn: 'আনতা (তুমি)',
    pastAr: 'عَلِمْتَ',
    pastBn: 'আলিমতা',
    presentAr: 'تَعْلَمُ',
    presentBn: 'তা’লামু',
    meaningBn: 'তুমি জেনেছ / তুমি জানো',
  },
  {
    pronounAr: 'أَنْتُمْ',
    pronounBn: 'আনতুম (তোমরা)',
    pastAr: 'عَلِمْتُمْ',
    pastBn: 'আলিমতুম',
    presentAr: 'تَعْلَمُونَ',
    presentBn: 'তা’লামূনা',
    meaningBn: 'তোমরা জেনেছ / তোমরা জানো',
  },
  {
    pronounAr: 'أَنَا',
    pronounBn: 'আনা (আমি)',
    pastAr: 'عَلِمْتُ',
    pastBn: 'আলিমতু',
    presentAr: 'أَعْلَمُ',
    presentBn: 'আ’লামু',
    meaningBn: 'আমি জেনেছি / আমি জানি',
  },
  {
    pronounAr: 'نَحْنُ',
    pronounBn: 'নাহনু (আমরা)',
    pastAr: 'عَلِمْنَا',
    pastBn: 'আলিমনা',
    presentAr: 'نَعْلَمُ',
    presentBn: 'না’লামু',
    meaningBn: 'আমরা জেনেছি / আমরা জানি',
  },
];
