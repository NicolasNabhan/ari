import { describe, expect, it } from "vitest";
import type { AttentionRecord } from "@/lib/context/types";
import {
  byScreen,
  describeAttention,
  emptyDwell,
  flushDwell,
  hitTarget,
  readingKind,
  smooth,
  stepDwell,
  summarize,
  type DwellState,
  type ElementLike,
  type GazeHit,
} from "./attention";

function el(attrs: Record<string, string>, parent: ElementLike | null = null): ElementLike {
  return { getAttribute: (n) => attrs[n] ?? null, parentElement: parent };
}

const apexHistory: GazeHit = { target: "history-panel-apex", label: "Apex Tech delivery history", screen: "vendors" };
const brightline: GazeHit = { target: "vendor-brightline", label: "Brightline Systems quote", screen: "vendors" };

// Feed a hit every `every` ms from `from` to `to`.
function feed(state: DwellState, hit: GazeHit | null, from: number, to: number, every = 50) {
  const records: AttentionRecord[] = [];
  for (let t = from; t <= to; t += every) {
    const out = stepDwell(state, hit, t);
    state = out.state;
    if (out.record) records.push(out.record);
  }
  return { state, records };
}

describe("smooth", () => {
  it("moves part of the way toward the new sample", () => {
    expect(smooth({ x: 0, y: 0, t: 0 }, { x: 100, y: 50, t: 30 }, 0.5)).toEqual({ x: 50, y: 25, t: 30 });
  });
  it("jumps after a long pause", () => {
    expect(smooth({ x: 0, y: 0, t: 0 }, { x: 100, y: 50, t: 5000 })).toEqual({ x: 100, y: 50, t: 5000 });
  });
});

describe("hitTarget", () => {
  const card = el({ "data-ari": "vendor-apex", "data-gaze-label": "Apex Tech quote" });
  it("prefers the nearest labelled reading area over an inner data-ari button", () => {
    const button = el({ "data-ari": "select-apex" }, card);
    const span = el({}, button);
    expect(hitTarget(span, "vendors")).toEqual({ target: "vendor-apex", label: "Apex Tech quote", screen: "vendors" });
  });
  it("falls back to the nearest data-ari, humanized", () => {
    expect(hitTarget(el({}, el({ "data-ari": "issue-po" })), "approvals")).toEqual({ target: "issue-po", label: "Issue po", screen: "approvals" });
  });
  it("ignores Ari's own UI and empty space", () => {
    expect(hitTarget(el({ "data-ari": "card-vendor" }, el({ "data-gaze-ignore": "" })), "vendors")).toBeNull();
    expect(hitTarget(el({}), "vendors")).toBeNull();
    expect(hitTarget(null, "vendors")).toBeNull();
  });
});

describe("dwell merging", () => {
  it("merges steady samples into one fixation, ended by looking elsewhere", () => {
    let { state, records } = feed(emptyDwell(), apexHistory, 0, 4200);
    expect(records).toEqual([]);
    ({ state, records } = feed(state, brightline, 4250, 4600));
    expect(records).toEqual([{ target: "history-panel-apex", label: "Apex Tech delivery history", screen: "vendors", ms: 4250, firstAt: 0 }]);
    expect(state.current?.target).toBe("vendor-brightline");
  });

  it("drops fixations shorter than ~250 ms (a glance in passing)", () => {
    let { state } = feed(emptyDwell(), brightline, 0, 150);
    const out = feed(state, apexHistory, 200, 2000);
    state = out.state;
    expect(out.records).toEqual([]);
  });

  it("doesn't break a fixation for one stray sample", () => {
    let { state } = feed(emptyDwell(), apexHistory, 0, 1000);
    state = stepDwell(state, brightline, 1050).state; // one noisy sample
    const out = feed(state, apexHistory, 1100, 2000);
    const end = flushDwell(out.state, 2000);
    expect(out.records).toEqual([]);
    expect(end.record?.ms).toBe(2000);
  });

  it("ends a fixation at the last sample when samples stop (looked away)", () => {
    const { state } = feed(emptyDwell(), apexHistory, 0, 800);
    const out = stepDwell(state, apexHistory, 3000);
    expect(out.record?.ms).toBe(800);
    expect(out.state.current?.start).toBe(3000);
  });

  it("flush closes the current fixation and keeps watching the same thing", () => {
    const { state } = feed(emptyDwell(), brightline, 0, 1100);
    const out = flushDwell(state, 1100);
    expect(out.record).toMatchObject({ target: "vendor-brightline", ms: 1100 });
    expect(out.state.current?.start).toBe(1100);
    expect(flushDwell(emptyDwell(), 5).record).toBeNull();
  });
});

describe("summaries", () => {
  const records: AttentionRecord[] = [
    { target: "vendor-brightline", label: "Brightline Systems quote", screen: "vendors", ms: 600, firstAt: 10 },
    { target: "history-panel-apex", label: "Apex Tech delivery history", screen: "vendors", ms: 4200, firstAt: 20 },
    { target: "vendor-brightline", label: "Brightline Systems quote", screen: "vendors", ms: 500, firstAt: 30 },
    { target: "inbox-req-laptops", label: "Laptop request", screen: "inbox", ms: 2000, firstAt: 1 },
  ];
  it("sums dwell per target, longest first", () => {
    expect(summarize(records).map((r) => [r.target, r.ms])).toEqual([
      ["history-panel-apex", 4200],
      ["inbox-req-laptops", 2000],
      ["vendor-brightline", 1100],
    ]);
  });
  it("describes it in words", () => {
    expect(describeAttention(records.filter((r) => r.screen === "vendors"))).toBe("Looked at: Apex Tech delivery history (4.2 s), Brightline Systems quote (1.1 s)");
    expect(describeAttention([])).toBe("");
  });
  it("tells reading from a glance", () => {
    expect(readingKind(4200)).toBe("reading");
    expect(readingKind(400)).toBe("glance");
  });
  it("groups by screen for the review", () => {
    const screens = byScreen(records);
    expect(screens.map((s) => [s.screen, s.total])).toEqual([
      ["vendors", 5300],
      ["inbox", 2000],
    ]);
    expect(screens[0].items[0].label).toBe("Apex Tech delivery history");
  });
});
