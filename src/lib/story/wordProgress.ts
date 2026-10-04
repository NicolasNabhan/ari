// Word progress for spoken lines: which word is being said, when, and for how
// long. Pure (no browser APIs), so the speech bubble and lip-sync can share it
// and it can be unit-tested.
import { estimateWordTimings, wordsFromAlignment, type Alignment } from "@/lib/ari/face";

// Where the timings came from, best first.
export type WordSource = "alignment" | "boundary" | "estimate";

export type WordEvent = {
  wordIndex: number;
  word: string;
  // Milliseconds from the start of the line.
  startMs: number;
  durationMs: number;
  source: WordSource;
};

// The words of a line, exactly as the bubble shows them (split on whitespace).
export function tokenizeWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

function normalize(word: string) {
  return word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

// A full timeline estimated from the text alone (no audio to measure).
export function estimateWordEvents(text: string, rate = 1): { events: WordEvent[]; totalMs: number } {
  const t = estimateWordTimings(text, rate);
  return {
    events: t.words.map((word, i) => ({
      wordIndex: i,
      word,
      startMs: Math.round(t.wtimes[i]),
      durationMs: Math.round(t.wdurations[i]),
      source: "estimate" as const,
    })),
    totalMs: Math.round(t.totalMs),
  };
}

// A timeline from ElevenLabs' per-character alignment, mapped onto the text's
// own words. If the counts differ (the voice normalised "$5,000", say), the
// alignment words are spread proportionally over the text words.
export function alignmentWordEvents(text: string, alignment: Alignment): WordEvent[] {
  const words = tokenizeWords(text);
  const a = wordsFromAlignment(alignment);
  if (!words.length || !a.words.length) return [];
  const events: WordEvent[] = [];
  let last = -1;
  for (let i = 0; i < a.words.length; i++) {
    const idx = a.words.length === words.length ? i : Math.min(words.length - 1, Math.floor((i * words.length) / a.words.length));
    if (idx <= last) continue;
    // Any text words skipped over start with this one.
    for (let k = last + 1; k <= idx; k++) {
      events.push({ wordIndex: k, word: words[k], startMs: a.wtimes[i], durationMs: k === idx ? a.wdurations[i] : 0, source: "alignment" });
    }
    last = idx;
  }
  // Text words the alignment never reached share the last word's end.
  const end = a.wtimes[a.wtimes.length - 1] + a.wdurations[a.wdurations.length - 1];
  for (let k = last + 1; k < words.length; k++) events.push({ wordIndex: k, word: words[k], startMs: end, durationMs: 0, source: "alignment" });
  return events;
}

// Which text word a browser boundary event refers to. Looks a few words ahead
// of the cursor (voices skip punctuation-only tokens like "-"); if nothing
// matches, assumes the next word.
export function matchSpokenWord(words: string[], from: number, spoken: string, lookahead = 3): number {
  const target = normalize(spoken);
  if (target) {
    for (let i = from; i < Math.min(words.length, from + lookahead + 1); i++) {
      if (normalize(words[i]) === target) return i;
    }
  }
  return Math.min(from, words.length - 1);
}

// Turns timing sources of any quality into a clean stream: every word exactly
// once, in order, never going backwards. Skipped words are emitted (with zero
// duration) so the count of spoken words is always "last index + 1".
export function createWordSequencer(text: string, emit: (e: WordEvent) => void) {
  const words = tokenizeWords(text);
  let last = -1;
  const reach = (index: number, startMs: number, durationMs: number, source: WordSource) => {
    const target = Math.min(index, words.length - 1);
    for (let k = last + 1; k <= target; k++) {
      emit({ wordIndex: k, word: words[k], startMs: Math.round(startMs), durationMs: k === target ? Math.round(durationMs) : 0, source });
    }
    if (target > last) last = target;
  };
  return {
    words,
    get spoken() {
      return last + 1;
    },
    get done() {
      return last >= words.length - 1;
    },
    // Up to and including this word.
    reach,
    push: (e: WordEvent) => reach(e.wordIndex, e.startMs, e.durationMs, e.source),
    // A word reported by the browser voice; durationFor guesses how long it lasts.
    spokenWord: (word: string, startMs: number, durationFor: (index: number) => number) => {
      const i = matchSpokenWord(words, last + 1, word);
      reach(i, startMs, durationFor(i), "boundary");
    },
    // The line has ended: whatever was not reported counts as spoken.
    finish: (atMs: number, source: WordSource = "estimate") => reach(words.length - 1, atMs, 0, source),
  };
}
export type WordSequencer = ReturnType<typeof createWordSequencer>;

// Events due by a given time (ms into the line), for clock-driven playback.
export function eventsDue(timeline: WordEvent[], fromIndex: number, nowMs: number): WordEvent[] {
  const due: WordEvent[] = [];
  for (let i = fromIndex; i < timeline.length && timeline[i].startMs <= nowMs; i++) due.push(timeline[i]);
  return due;
}
