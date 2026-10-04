// Which face Ari shows: the live LiveAvatar stream, or the in-browser
// TalkingHead fallback. Voice keeps working either way.
export const LIVE_FACE_CAP_SECONDS = 5 * 60;

export type FaceChoice = "live" | "fallback";
export type AvatarState = "bubble" | "forward" | "tutor";

export function chooseFace(s: {
  liveConfigured: boolean;
  demoKeyOn: boolean;
  liveSecondsUsed: number;
  streamFailed: boolean;
}): FaceChoice {
  if (!s.liveConfigured || !s.demoKeyOn || s.streamFailed) return "fallback";
  return s.liveSecondsUsed < LIVE_FACE_CAP_SECONDS ? "live" : "fallback";
}

// Rough word timings so the fallback face can lip-sync to speech it can't
// measure (browser speech synthesis gives no audio buffer).
export function estimateWordTimings(text: string, rate = 1) {
  const words = text.split(/\s+/).filter(Boolean);
  const wtimes: number[] = [];
  const wdurations: number[] = [];
  let t = 0;
  for (const w of words) {
    const d = Math.max(180, w.replace(/[^\p{L}\p{N}]/gu, "").length * 70) / rate;
    wtimes.push(t);
    wdurations.push(d);
    t += d + (/[.,!?;:]$/.test(w) ? 250 : 60) / rate;
  }
  return { words, wtimes, wdurations, totalMs: t };
}

export type Alignment = {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
};

// ElevenLabs returns when each character is spoken; the face needs words.
export function wordsFromAlignment(a: Alignment) {
  const words: string[] = [];
  const wtimes: number[] = [];
  const wdurations: number[] = [];
  let word = "";
  let start = 0;
  let end = 0;
  const flush = () => {
    if (!word) return;
    words.push(word);
    wtimes.push(Math.round(start * 1000));
    wdurations.push(Math.round((end - start) * 1000));
    word = "";
  };
  a.characters.forEach((ch, i) => {
    if (/\s/.test(ch)) return flush();
    if (!word) start = a.character_start_times_seconds[i];
    word += ch;
    end = a.character_end_times_seconds[i];
  });
  flush();
  return { words, wtimes, wdurations };
}
