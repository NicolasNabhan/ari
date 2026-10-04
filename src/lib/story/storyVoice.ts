"use client";

// The story's voice: say(speaker, text) speaks a line (ElevenLabs when
// configured, else the browser's voice) and reports each word as it is said,
// so the speech bubble and the characters' lip-sync stay in step with it.
//
// Word timings, best first: ElevenLabs' exact alignment, the browser voice's
// word boundary events, or an estimate from the text. Whatever the source,
// words arrive once each, in order, and every word has arrived by onEnd.
//
// Lip-sync (or anything else) can listen to every line with subscribeVoice()
// instead of being wired to each say() call.
import { speak, type SpeakingFace, type Speaker } from "@/lib/ari/speech";
import { onSoundsMutedChange, soundsMuted } from "@/lib/ari/sounds";
import { alignmentWordEvents, createWordSequencer, estimateWordEvents, eventsDue, tokenizeWords, type WordEvent, type WordSource } from "./wordProgress";

export type { Speaker, WordEvent, WordSource };

export type LineStart = {
  speaker: Speaker;
  text: string;
  words: string[];
  source: WordSource;
  // The planned timeline (exact for "alignment", estimated otherwise).
  timeline: WordEvent[];
  totalMs: number;
};

export type LineEnd = { speaker: Speaker; text: string; cancelled: boolean };

export type SayOptions = {
  lang?: string;
  onStart?: (line: LineStart) => void;
  onWord?: (e: WordEvent) => void;
  onEnd?: (line: LineEnd) => void;
};

export type VoiceEvent =
  | ({ type: "start" } & LineStart)
  | { type: "word"; speaker: Speaker; text: string; event: WordEvent }
  | ({ type: "end" } & LineEnd);

// --- Listeners and a progress snapshot (for useSyncExternalStore) ---

// The line being said (or last said), plus the lines said recently in full,
// so a bubble can tell "not said yet" from "already said".
export type VoiceProgress = { speaker: Speaker | null; text: string; spoken: number; total: number; saying: boolean; said: string[] };

const listeners = new Set<(e: VoiceEvent) => void>();
let progress: VoiceProgress = { speaker: null, text: "", spoken: 0, total: 0, saying: false, said: [] };

export const lineKey = (speaker: Speaker, text: string) => `${speaker}:${text}`;

function broadcast(e: VoiceEvent) {
  if (e.type === "start") progress = { ...progress, speaker: e.speaker, text: e.text, spoken: 0, total: e.words.length, saying: true };
  else if (e.type === "word") progress = { ...progress, spoken: e.event.wordIndex + 1 };
  else progress = { ...progress, saying: false, said: e.cancelled ? progress.said : [lineKey(e.speaker, e.text), ...progress.said].slice(0, 20) };
  listeners.forEach((fn) => fn(e));
}

// How many words of this line have been said: null if it hasn't started.
export function wordsSaidOf(p: VoiceProgress, speaker: Speaker, text: string): number | null {
  if (p.speaker === speaker && p.text === text) return p.saying ? p.spoken : p.said.includes(lineKey(speaker, text)) ? p.total : p.spoken;
  return p.said.includes(lineKey(speaker, text)) ? tokenizeWords(text).length : null;
}

export function subscribeVoice(fn: (e: VoiceEvent) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getVoiceProgress(): VoiceProgress {
  return progress;
}

// --- Speaking ---

let current: { cancel: () => void } | null = null;

// Stops whatever is being said (its onEnd reports cancelled: true).
export function stopSaying() {
  current?.cancel();
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// Speaks one line; resolves when it has been said (or was cut off by stopSaying
// or by the next say). A new line always cuts off the previous one.
export async function say(speaker: Speaker, text: string, opts: SayOptions = {}): Promise<LineEnd> {
  current?.cancel();
  const lang = opts.lang ?? "en-US";
  const estimate = estimateWordEvents(text);

  let cancelled = false;
  let started = false;
  let startedAt = 0;
  let source: WordSource = "estimate";
  const timers = new Set<ReturnType<typeof setTimeout>>();
  let raf = 0;
  let audio: HTMLAudioElement | null = null;
  let onCancel = () => {};
  const cancelledSignal = new Promise<void>((r) => (onCancel = r));

  const seq = createWordSequencer(text, (e) => {
    if (cancelled) return;
    opts.onWord?.(e);
    broadcast({ type: "word", speaker, text, event: e });
  });
  const now = () => (started ? performance.now() - startedAt : 0);

  const begin = (from: WordSource, timeline: WordEvent[], totalMs: number, alreadyMs = 0) => {
    if (started || cancelled) return;
    started = true;
    source = from;
    startedAt = performance.now() - alreadyMs;
    const line: LineStart = { speaker, text, words: seq.words, source, timeline, totalMs };
    opts.onStart?.(line);
    broadcast({ type: "start", ...line });
  };

  const clearSchedule = () => {
    timers.forEach(clearTimeout);
    timers.clear();
    if (raf && typeof cancelAnimationFrame !== "undefined") cancelAnimationFrame(raf);
    raf = 0;
  };

  // Plays a timeline against the clock (from now()).
  const schedule = (timeline: WordEvent[]) => {
    if (cancelled) return;
    const offset = now();
    for (const e of timeline) {
      const t = setTimeout(() => {
        timers.delete(t);
        seq.push(e);
      }, Math.max(0, e.startMs - offset));
      timers.add(t);
    }
  };

  // Ends the line exactly once: on completion, or right away when cut off (so a
  // cut-off line's end is heard before the next line's start).
  let ended = false;
  const end = (): LineEnd => {
    const result: LineEnd = { speaker, text, cancelled };
    if (ended) return result;
    ended = true;
    clearSchedule();
    if (!cancelled) seq.finish(now(), source); // every word has arrived by onEnd
    if (current === line) current = null;
    opts.onEnd?.(result);
    // Listeners only hear the end of lines they heard start.
    if (started) broadcast({ type: "end", ...result });
    return result;
  };

  const line = {
    cancel: () => {
      if (cancelled || ended) return;
      cancelled = true;
      clearSchedule();
      audio?.pause();
      if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
      end();
      onCancel();
    },
  };
  current = line;

  // speech.ts drives a "face"; this one turns what it does into word events.
  const face: SpeakingFace = {
    // Muted: skip the ElevenLabs request (no audio will be played).
    ready: () => !soundsMuted(),
    speakAudio: async (audioBase64, alignment) => {
      if (cancelled) return;
      const timeline = alignmentWordEvents(text, alignment);
      const last = timeline[timeline.length - 1];
      const el = new Audio(`data:audio/mpeg;base64,${audioBase64}`);
      el.muted = soundsMuted();
      audio = el;
      await el.play(); // a blocked autoplay throws, and speech.ts falls back to the browser voice
      begin("alignment", timeline, last ? last.startMs + last.durationMs : 0);
      await new Promise<void>((resolve) => {
        let next = 0;
        const tick = () => {
          if (cancelled) return resolve();
          const due = eventsDue(timeline, next, el.currentTime * 1000);
          next += due.length;
          due.forEach(seq.push);
          raf = requestAnimationFrame(tick);
        };
        el.onended = () => resolve();
        el.onerror = () => resolve();
        tick();
      });
      clearSchedule();
    },
    // The browser voice reported a word as it started.
    mouthWord: (word) => {
      begin("boundary", estimate.events, estimate.totalMs);
      seq.spokenWord(word, now(), (i) => estimate.events[i]?.durationMs ?? 250);
    },
    // The browser voice reports no words: estimate. speech.ts only calls this
    // after waiting ~350ms, by which time the voice has usually begun.
    mouth: () => {
      begin("estimate", estimate.events, estimate.totalMs, 250);
      schedule(estimate.events.filter((e) => e.wordIndex >= seq.spoken));
    },
    stop: clearSchedule,
  };

  const unmute = onSoundsMutedChange((m) => {
    if (audio) audio.muted = m;
  });

  try {
    if (soundsMuted() || !tokenizeWords(text).length) {
      // Silent: the words still appear at a natural pace.
      begin("estimate", estimate.events, estimate.totalMs);
      schedule(estimate.events);
      await Promise.race([wait(estimate.totalMs), cancelledSignal]);
    } else {
      await Promise.race([speak(face, text, { lang, speaker, isCurrent: () => !cancelled }), cancelledSignal]);
      // No voice at all (none installed, or it ended instantly): show the words at a natural pace.
      if (!started && !cancelled) {
        begin("estimate", estimate.events, estimate.totalMs);
        schedule(estimate.events);
        await Promise.race([wait(estimate.totalMs), cancelledSignal]);
      }
    }
  } finally {
    unmute();
  }
  return end();
}
