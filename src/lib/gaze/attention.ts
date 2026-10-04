// Where the expert's eyes went, as pure functions: raw gaze samples (from the
// webcam tracker or the mouse) are smoothed, mapped to the thing on screen
// they land on, and merged into dwell records Ari can use as evidence.
// No DOM here beyond a tiny element-like interface, so it's easy to test.
import type { AttentionRecord } from "@/lib/context/types";

export type GazeSample = { x: number; y: number; t: number };

// The thing a gaze sample landed on.
export type GazeHit = { target: string; label: string; screen: string };

// A fixation shorter than this is noise, not attention.
export const MIN_FIXATION_MS = 250;
// At or above this, it counts as reading rather than a glance.
export const READING_MS = 1000;
// A stray sample on another target shorter than this doesn't end a fixation.
export const SWITCH_MS = 120;
// No sample for this long ends the current fixation (blink, looked away).
export const GAP_MS = 400;

// ---- Smoothing ------------------------------------------------------------

// Exponential smoothing: alpha 1 = raw, lower = steadier. Webcam gaze jitters
// by 50-100px, so the dot and the hit test both use the smoothed point.
export function smooth(prev: GazeSample | null, next: GazeSample, alpha = 0.3): GazeSample {
  if (!prev) return next;
  // A long pause means the old point is stale: jump instead of drifting.
  if (next.t - prev.t > GAP_MS) return next;
  return { x: prev.x + alpha * (next.x - prev.x), y: prev.y + alpha * (next.y - prev.y), t: next.t };
}

// ---- Hit testing -----------------------------------------------------------

// The bits of an Element we need, so tests can use plain objects.
export type ElementLike = { getAttribute(name: string): string | null; parentElement: ElementLike | null };

// "history-panel-apex" → "History panel apex"
export function humanize(target: string): string {
  const words = target.replace(/[-_]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

// The nearest labelled reading area (data-gaze-label) wins; otherwise the
// nearest data-ari element. Anything inside data-gaze-ignore (Ari's own UI,
// navigation) is not evidence about the work.
export function hitTarget(el: ElementLike | null, screen: string): GazeHit | null {
  let fallback: GazeHit | null = null;
  for (let node = el; node; node = node.parentElement) {
    if (node.getAttribute("data-gaze-ignore") !== null) return null;
    const target = node.getAttribute("data-ari");
    const label = node.getAttribute("data-gaze-label");
    if (label) return { target: target ?? label, label, screen };
    if (target && !fallback) fallback = { target, label: humanize(target), screen };
  }
  return fallback;
}

// ---- Dwell merging -------------------------------------------------------

type Dwell = GazeHit & { start: number; last: number };

export type DwellState = {
  current: Dwell | null;
  pending: (GazeHit & { since: number }) | null; // a different target, not yet long enough to switch
};

export const emptyDwell = (): DwellState => ({ current: null, pending: null });

const same = (a: GazeHit, b: GazeHit) => a.target === b.target && a.screen === b.screen;

function close(dwell: Dwell | null, end: number): AttentionRecord | null {
  if (!dwell) return null;
  const ms = Math.round(end - dwell.start);
  if (ms < MIN_FIXATION_MS) return null;
  return { target: dwell.target, label: dwell.label, screen: dwell.screen, ms, firstAt: dwell.start };
}

// Feed one hit (or null: the gaze landed on nothing) at time t. Returns the
// next state and, when a fixation just ended, its record.
export function stepDwell(state: DwellState, hit: GazeHit | null, t: number): { state: DwellState; record: AttentionRecord | null } {
  const { current, pending } = state;

  // A gap in samples ends the fixation where the last sample was.
  if (current && t - current.last > GAP_MS) {
    const record = close(current, current.last);
    const next = stepDwell(emptyDwell(), hit, t);
    return { state: next.state, record };
  }

  if (!current) {
    return { state: { current: hit ? { ...hit, start: t, last: t } : null, pending: null }, record: null };
  }

  if (hit && same(hit, current)) {
    return { state: { current: { ...current, last: t }, pending: null }, record: null };
  }

  // Somewhere else (or nowhere): only switch once it's held for SWITCH_MS.
  const key: GazeHit = hit ?? { target: "", label: "", screen: current.screen };
  if (!pending || !same(pending, key)) {
    return { state: { current, pending: { ...key, since: t } }, record: null };
  }
  if (t - pending.since < SWITCH_MS) return { state, record: null };

  const record = close(current, pending.since);
  const nextCurrent = hit ? { ...hit, start: pending.since, last: t } : null;
  return { state: { current: nextCurrent, pending: null }, record };
}

// End the current fixation now (e.g. right before a click turns into a
// decision, so the card gets what was just being read).
export function flushDwell(state: DwellState, t: number): { state: DwellState; record: AttentionRecord | null } {
  if (!state.current) return { state: emptyDwell(), record: null };
  const end = Math.min(t, state.current.last + GAP_MS);
  const record = close(state.current, end);
  // Keep looking at the same thing: the next sample continues from here.
  return { state: { current: { ...state.current, start: end, last: end }, pending: null }, record };
}

// ---- Summaries ------------------------------------------------------------

export type Reading = "reading" | "glance";
export const readingKind = (ms: number): Reading => (ms >= READING_MS ? "reading" : "glance");

// Merge records on the same thing (summing dwell), longest first.
export function summarize(records: AttentionRecord[], limit = Infinity): AttentionRecord[] {
  const byTarget = new Map<string, AttentionRecord>();
  for (const r of records) {
    const key = `${r.screen}|${r.target}`;
    const seen = byTarget.get(key);
    byTarget.set(key, seen ? { ...seen, ms: seen.ms + r.ms, firstAt: Math.min(seen.firstAt, r.firstAt) } : { ...r });
  }
  return [...byTarget.values()].sort((a, b) => b.ms - a.ms || a.firstAt - b.firstAt).slice(0, limit);
}

// "4.2 s"
export const formatDwell = (ms: number) => `${(ms / 1000).toFixed(1)} s`;

// "Looked at: Apex Tech delivery history (4.2 s), Brightline Systems quote (1.1 s)"
export function describeAttention(records: AttentionRecord[], limit = 3): string {
  const top = summarize(records, limit);
  return top.length ? `Looked at: ${top.map((r) => `${r.label} (${formatDwell(r.ms)})`).join(", ")}` : "";
}

// The top things looked at on each screen, for the end-of-session review.
export function byScreen(records: AttentionRecord[], perScreen = 5): { screen: string; total: number; items: AttentionRecord[] }[] {
  const screens = new Map<string, AttentionRecord[]>();
  for (const r of records) screens.set(r.screen, [...(screens.get(r.screen) ?? []), r]);
  return [...screens.entries()]
    .map(([screen, rs]) => ({ screen, total: rs.reduce((n, r) => n + r.ms, 0), items: summarize(rs, perScreen) }))
    .sort((a, b) => b.total - a.total);
}
