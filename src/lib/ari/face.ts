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
