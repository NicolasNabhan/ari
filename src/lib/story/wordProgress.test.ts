import { describe, expect, it } from "vitest";
import type { Alignment } from "@/lib/ari/face";
import { alignmentWordEvents, createWordSequencer, estimateWordEvents, eventsDue, matchSpokenWord, tokenizeWords, type WordEvent } from "./wordProgress";

function alignmentFor(text: string, msPerChar = 50): Alignment {
  const characters = [...text];
  return {
    characters,
    character_start_times_seconds: characters.map((_, i) => (i * msPerChar) / 1000),
    character_end_times_seconds: characters.map((_, i) => ((i + 1) * msPerChar) / 1000),
  };
}

describe("tokenizeWords", () => {
  it("splits on any whitespace and drops empties", () => {
    expect(tokenizeWords("  Hello,\n  Maria!  How   are you? ")).toEqual(["Hello,", "Maria!", "How", "are", "you?"]);
    expect(tokenizeWords("   ")).toEqual([]);
  });
});

describe("estimateWordEvents", () => {
  it("gives one event per word, in order, with growing start times", () => {
    const { events, totalMs } = estimateWordEvents("Why three invoices? To spot a jump.");
    expect(events.map((e) => e.word)).toEqual(["Why", "three", "invoices?", "To", "spot", "a", "jump."]);
    expect(events.map((e) => e.wordIndex)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    for (let i = 1; i < events.length; i++) expect(events[i].startMs).toBeGreaterThan(events[i - 1].startMs);
    expect(events.every((e) => e.source === "estimate" && e.durationMs >= 180)).toBe(true);
    const last = events[events.length - 1];
    expect(totalMs).toBeGreaterThanOrEqual(last.startMs + last.durationMs);
  });

  it("pauses longer after punctuation and longer words take longer", () => {
    const { events } = estimateWordEvents("ok, so extraordinarily ok");
    const gapAfterComma = events[1].startMs - (events[0].startMs + events[0].durationMs);
    const gapPlain = events[2].startMs - (events[1].startMs + events[1].durationMs);
    expect(gapAfterComma).toBeGreaterThan(gapPlain);
    expect(events[2].durationMs).toBeGreaterThan(events[3].durationMs);
  });

  it("speaks faster at a higher rate", () => {
    expect(estimateWordEvents("one two three", 2).totalMs).toBeLessThan(estimateWordEvents("one two three", 1).totalMs);
  });

  it("is empty for empty text", () => {
    expect(estimateWordEvents("")).toEqual({ events: [], totalMs: 0 });
  });
});

describe("alignmentWordEvents", () => {
  it("maps ElevenLabs character timings onto the text's words", () => {
    const text = "Check the invoices";
    const events = alignmentWordEvents(text, alignmentFor(text));
    expect(events.map((e) => [e.wordIndex, e.word, e.startMs, e.durationMs])).toEqual([
      [0, "Check", 0, 250],
      [1, "the", 300, 150],
      [2, "invoices", 500, 400],
    ]);
    expect(events.every((e) => e.source === "alignment")).toBe(true);
  });

  it("still covers every text word, in order, when the voice's words differ", () => {
    const text = "Approve 5,000 euros today please";
    // The voice said it as more words ("five thousand").
    const events = alignmentWordEvents(text, alignmentFor("Approve five thousand euros today please"));
    expect(events.map((e) => e.wordIndex)).toEqual([0, 1, 2, 3, 4]);
    expect(events.map((e) => e.word)).toEqual(tokenizeWords(text));
    for (let i = 1; i < events.length; i++) expect(events[i].startMs).toBeGreaterThanOrEqual(events[i - 1].startMs);
  });

  it("fills in words the alignment never reached", () => {
    const events = alignmentWordEvents("one two three four", alignmentFor("one two"));
    expect(events.map((e) => e.wordIndex)).toEqual([0, 1, 2, 3]);
  });
});

describe("matchSpokenWord", () => {
  const words = tokenizeWords("Hello - Maria, the invoice is late.");
  it("matches ignoring case and punctuation", () => {
    expect(matchSpokenWord(words, 0, "hello")).toBe(0);
    expect(matchSpokenWord(words, 1, "MARIA")).toBe(2); // skips the lone dash
  });
  it("assumes the next word when nothing matches", () => {
    expect(matchSpokenWord(words, 3, "zzz")).toBe(3);
  });
  it("never runs past the last word", () => {
    expect(matchSpokenWord(words, 99, "late")).toBe(words.length - 1);
  });
});

describe("createWordSequencer", () => {
  const collect = (text: string) => {
    const out: WordEvent[] = [];
    return { out, seq: createWordSequencer(text, (e) => out.push(e)) };
  };

  it("emits every word once, in order, even when sources jump ahead or go back", () => {
    const { out, seq } = collect("a b c d e");
    seq.reach(0, 0, 100, "boundary");
    seq.reach(2, 300, 100, "boundary"); // skipped b
    seq.reach(1, 400, 100, "boundary"); // late duplicate: ignored
    seq.reach(2, 400, 100, "boundary"); // duplicate: ignored
    expect(out.map((e) => e.wordIndex)).toEqual([0, 1, 2]);
    expect(out[1]).toMatchObject({ word: "b", startMs: 300, durationMs: 0 });
    expect(seq.spoken).toBe(3);
    seq.finish(900);
    expect(out.map((e) => e.wordIndex)).toEqual([0, 1, 2, 3, 4]);
    expect(seq.done).toBe(true);
  });

  it("follows browser boundary words by matching them to the text", () => {
    const { out, seq } = collect("Why - three invoices?");
    seq.spokenWord("Why", 0, () => 200);
    seq.spokenWord("three", 250, () => 210);
    seq.spokenWord("invoices", 500, () => 400);
    expect(out.map((e) => [e.wordIndex, e.word, e.source])).toEqual([
      [0, "Why", "boundary"],
      [1, "-", "boundary"],
      [2, "three", "boundary"],
      [3, "invoices?", "boundary"],
    ]);
    expect(out[2].durationMs).toBe(210);
  });

  it("ignores anything past the end", () => {
    const { out, seq } = collect("one two");
    seq.reach(10, 0, 50, "estimate");
    seq.finish(100);
    expect(out.map((e) => e.wordIndex)).toEqual([0, 1]);
  });
});

describe("eventsDue", () => {
  it("returns the events whose time has come, from a cursor", () => {
    const { events } = estimateWordEvents("one two three four");
    expect(eventsDue(events, 0, -1)).toEqual([]);
    expect(eventsDue(events, 0, events[1].startMs).map((e) => e.wordIndex)).toEqual([0, 1]);
    expect(eventsDue(events, 2, 1e9).map((e) => e.wordIndex)).toEqual([2, 3]);
  });
});
