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
