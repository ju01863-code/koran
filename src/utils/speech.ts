// Web Speech API helper for Arabic pronunciation + Bengali formatting utilities

const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBnNum(value: number | string): string {
  return String(value).replace(/\d/g, (d) => BENGALI_DIGITS[Number(d)] ?? d);
}

type SpeechListener = (speakingText: string | null) => void;
const listeners = new Set<SpeechListener>();
let currentSpeakingText: string | null = null;

function notifyListeners(text: string | null) {
  currentSpeakingText = text;
  listeners.forEach((fn) => fn(text));
}

export function subscribeSpeechState(fn: SpeechListener): () => void {
  listeners.add(fn);
  fn(currentSpeakingText);
  return () => {
    listeners.delete(fn);
  };
}

// Gentle Web Audio API chime as tactile feedback when speech starts or when TTS voice is unavailable
function playSoftTone(freq = 528, duration = 0.08) {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, duration * 1000 + 50);
  } catch {
    // Ignore audio context errors
  }
}

export function speakArabic(text: string, slow = false, onEnd?: () => void): void {
  if (typeof window === 'undefined') return;

  playSoftTone(slow ? 440 : 528, 0.06);

  if (!('speechSynthesis' in window)) {
    notifyListeners(text);
    setTimeout(() => {
      notifyListeners(null);
      onEnd?.();
    }, 900);
    return;
  }

  try {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    utterance.rate = slow ? 0.65 : 0.9;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const arabicVoice =
      voices.find((v) => v.lang === 'ar-SA') ||
      voices.find((v) => v.lang.startsWith('ar-')) ||
      voices.find((v) => v.lang === 'ar');

    if (arabicVoice) {
      utterance.voice = arabicVoice;
    }

    notifyListeners(text);

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      if (currentSpeakingText === text) {
        notifyListeners(null);
      }
      onEnd?.();
    };

    utterance.onend = finish;
    utterance.onerror = finish;

    window.speechSynthesis.speak(utterance);

    // Safety fallback timer in case browser TTS hangs on certain environments
    const estimatedMs = Math.max(1200, Math.min(8000, text.length * (slow ? 220 : 150)));
    setTimeout(finish, estimatedMs);
  } catch {
    notifyListeners(null);
    onEnd?.();
  }
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  notifyListeners(null);
}

/**
 * Play a gentle, encouraging melodious chime for daily goal reminders
 */
export function playGoalReminderChime(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // 3 harmonic notes in an ascending cheerful triad
    const notes = [
      { freq: 440.0, time: 0.0, dur: 0.3 },   // A4
      { freq: 554.37, time: 0.12, dur: 0.35 }, // C#5
      { freq: 659.25, time: 0.24, dur: 0.5 },  // E5
    ];

    notes.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + time);

      gain.gain.setValueAtTime(0.001, now + time);
      gain.gain.linearRampToValueAtTime(0.08, now + time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + dur);
    });

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 1000);
  } catch {
    // Audio context not supported or restricted by autoplay policy
  }
}

/**
 * Play a sparkling, triumphant celebratory fanfare for badge unlocks
 */
export function playBadgeUnlockFanfare(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // 4 ascending triumphant notes: C5, E5, G5, High C6
    const notes = [
      { freq: 523.25, time: 0.0, dur: 0.22, vol: 0.08 },  // C5
      { freq: 659.25, time: 0.12, dur: 0.22, vol: 0.09 }, // E5
      { freq: 783.99, time: 0.24, dur: 0.25, vol: 0.1 },  // G5
      { freq: 1046.50, time: 0.38, dur: 0.65, vol: 0.12 }, // C6
    ];

    notes.forEach(({ freq, time, dur, vol }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + time);

      gain.gain.setValueAtTime(0.001, now + time);
      gain.gain.linearRampToValueAtTime(vol, now + time + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + dur);
    });

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 1400);
  } catch {
    // Audio context not supported or restricted
  }
}

