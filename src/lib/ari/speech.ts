"use client";

// Speaking with lip-sync, for any character. Best: ElevenLabs audio with exact
// word timings (the face plays the audio). Fallback: the browser's voice, with
// the mouth moving word by word as each word is spoken.
import { browserSpeak, type BrowserVoiceStyle } from "./browserVoice";
import type { Alignment } from "./face";

export type Speaker = "ari" | "maria";

export type SpeakingFace = {
  ready: () => boolean;
  speakAudio: (audioBase64: string, alignment: Alignment) => Promise<void>;
  mouthWord: (word: string) => void;
  mouth: (text: string, rate?: number, lang?: string) => void;
  stop: () => void;
};

// Browser voices when ElevenLabs isn't configured: two clearly different people.
// The voice lists don't overlap, so they never end up with the same voice:
// Maria is a natural younger adult woman; Ari is playful, quick and high.
const BROWSER_STYLE: Record<Speaker, BrowserVoiceStyle> = {
  maria: { prefer: /ava|zoe|allison|samantha|susan|serena|m[oó]nica/i, pitch: 1.04, rate: 1.0 },
  ari: { prefer: /karen|tessa|moira|fiona|veena|paulina/i, pitch: 1.65, rate: 1.12 },
};

const unavailable = new Set<string>();

async function elevenLabsSpeech(text: string, lang: string, speaker: Speaker) {
  if (unavailable.has(speaker)) return null;
  try {
    const res = await fetch("/api/tts", { method: "POST", body: JSON.stringify({ text, lang, speaker }) });
    if (res.status === 503) unavailable.add(speaker);
    if (!res.ok) return null;
    return (await res.json()) as { audio: string; alignment: Alignment };
  } catch {
    return null;
  }
}

async function speakWithBrowser(text: string, lang: string, face: SpeakingFace | null, speaker: Speaker) {
  let gotWords = false;
  // If this voice doesn't report word boundaries, fall back to estimated timings.
  const fallback = setTimeout(() => {
    if (!gotWords) face?.mouth(text, 1, lang.slice(0, 2));
  }, 350);
  await browserSpeak(
    text,
    lang,
    (word) => {
      if (!gotWords) face?.stop();
      gotWords = true;
      face?.mouthWord(word);
    },
    BROWSER_STYLE[speaker],
  );
  clearTimeout(fallback);
}

// Resolves when the line has been spoken.
export async function speak(face: SpeakingFace | null, text: string, opts: { lang?: string; speaker: Speaker; isCurrent?: () => boolean }) {
  const lang = opts.lang ?? "en-US";
  if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
  face?.stop();
  const voiced = face?.ready() ? await elevenLabsSpeech(text, lang, opts.speaker) : null;
  if (opts.isCurrent && !opts.isCurrent()) return;
  if (voiced && face) {
    try {
      await face.speakAudio(voiced.audio, voiced.alignment);
      return;
    } catch {
      // fall through to the browser voice
    }
  }
  await speakWithBrowser(text, lang, face, opts.speaker);
}
