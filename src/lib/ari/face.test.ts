import { describe, expect, it } from "vitest";
import { chooseFace, estimateWordTimings, LIVE_FACE_CAP_SECONDS } from "./face";

const ok = { liveConfigured: true, demoKeyOn: true, liveSecondsUsed: 0, streamFailed: false };

describe("chooseFace", () => {
  it("uses the live face when everything is fine", () => {
    expect(chooseFace(ok)).toBe("live");
  });
  it("falls back when the live face isn't configured", () => {
    expect(chooseFace({ ...ok, liveConfigured: false })).toBe("fallback");
  });
  it("falls back when the demo key is switched off", () => {
    expect(chooseFace({ ...ok, demoKeyOn: false })).toBe("fallback");
  });
  it("falls back once the per-visit cap is used up", () => {
    expect(chooseFace({ ...ok, liveSecondsUsed: LIVE_FACE_CAP_SECONDS - 1 })).toBe("live");
    expect(chooseFace({ ...ok, liveSecondsUsed: LIVE_FACE_CAP_SECONDS })).toBe("fallback");
  });
  it("falls back when the stream fails", () => {
    expect(chooseFace({ ...ok, streamFailed: true })).toBe("fallback");
  });
});

describe("estimateWordTimings", () => {
  it("gives every word a start and a duration, in order", () => {
    const t = estimateWordTimings("Why B over the cheaper A?");
    expect(t.words).toEqual(["Why", "B", "over", "the", "cheaper", "A?"]);
    expect(t.wtimes).toHaveLength(6);
    expect(t.wtimes.every((x, i) => i === 0 || x > t.wtimes[i - 1])).toBe(true);
    expect(t.totalMs).toBeGreaterThan(1000);
  });
});

import { wordsFromAlignment } from "./face";

describe("wordsFromAlignment", () => {
  it("turns ElevenLabs character timings into word timings in milliseconds", () => {
    const text = "Why B?";
    const t = [0, 0.05, 0.1, 0.15, 0.2, 0.3];
    const alignment = { characters: [...text], character_start_times_seconds: t, character_end_times_seconds: t.map((x) => x + 0.05) };
    expect(wordsFromAlignment(alignment)).toEqual({ words: ["Why", "B?"], wtimes: [0, 200], wdurations: [150, 150] });
  });

  it("ignores repeated spaces", () => {
    const alignment = { characters: [..."a  b"], character_start_times_seconds: [0, 0.1, 0.2, 0.3], character_end_times_seconds: [0.1, 0.2, 0.3, 0.4] };
    expect(wordsFromAlignment(alignment).words).toEqual(["a", "b"]);
  });
});
