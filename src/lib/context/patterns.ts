// Patterns only visible across the whole week: numbers that move steadily from
// day to day (trend), the same kind of block that differs by weekday
// (by-weekday), and meetings or tasks that come back at the same time
// (recurring-slot). Pure: schedule + observations + sources in, patterns out.

import type { Level } from "@/lib/apprentice/reasonTypes";
import { WEEKDAYS, type ContextSource, type Pattern, type ScheduleItem, type Weekday, type WeeklyObservation } from "./types";

// A pattern plus what the screens need to draw and place it.
export type DetectedPattern = Pattern & {
  itemIds: string[]; // schedule blocks it explains
  sourceIds: string[]; // meetings or files that back it up
  series?: { day: Weekday; value: number; unit?: string }[]; // trends: the week's values, Mon..Fri
  bestDay?: Weekday; // trends: the day to act
};

export const DAY_NAMES: Record<Weekday, string> = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday" };

const dayIndex = (d: Weekday) => WEEKDAYS.indexOf(d);
export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
};
const clamp = (n: number) => Math.round(Math.min(0.97, Math.max(0.05, n)) * 100) / 100;
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// "Order office supplies (OfficeHub)" → "order office supplies"
export function normTitle(title: string): string {
  return title
    .replace(/\(.*?\)/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// "Mon, Tue, Wed" → "Mon to Wed" when consecutive; all five → "every day".
export function dayRange(days: Weekday[]): string {
  const sorted = [...new Set(days)].sort((a, b) => dayIndex(a) - dayIndex(b));
  if (sorted.length === 5) return "every day";
  if (sorted.length === 1) return `on ${DAY_NAMES[sorted[0]]}s`;
  const consecutive = sorted.every((d, i) => i === 0 || dayIndex(d) === dayIndex(sorted[i - 1]) + 1);
  if (consecutive && sorted.length > 2) return `${sorted[0]} to ${sorted[sorted.length - 1]}`;
  return sorted.join(", ");
}

const partOfDay = (start: string) => (toMinutes(start) < 12 * 60 ? "morning" : toMinutes(start) < 17 * 60 ? "afternoon" : "evening");

// Metrics where a smaller number is the better deal.
const LOWER_IS_BETTER = /price|cost|fee|lead|delay|wait|late|queue/i;

const fmt = (value: number, unit?: string) => `${value}${unit === "%" ? "%" : unit ? ` ${unit}` : ""}`;

// ---- trend --------------------------------------------------------------

function detectTrends(observations: WeeklyObservation[], schedule: ScheduleItem[], sources: ContextSource[]): DetectedPattern[] {
  const groups = new Map<string, WeeklyObservation[]>();
  for (const o of observations) {
    const key = `${o.subject}|${o.metric}`;
    groups.set(key, [...(groups.get(key) ?? []), o]);
  }
  const out: DetectedPattern[] = [];
  for (const obs of groups.values()) {
    const byDay = [...obs].sort((a, b) => dayIndex(a.day) - dayIndex(b.day));
    // The longest run of consecutive weekdays with the same non-zero step.
    let best: WeeklyObservation[] = [];
    for (let i = 0; i < byDay.length; i++) {
      const run = [byDay[i]];
      for (let j = i + 1; j < byDay.length; j++) {
        const prev = byDay[j - 1];
        const cur = byDay[j];
        if (dayIndex(cur.day) !== dayIndex(prev.day) + 1) break;
        const step = cur.value - prev.value;
        const firstStep = run.length > 1 ? run[1].value - run[0].value : step;
        if (step === 0 || Math.abs(step - firstStep) > Math.max(1, Math.abs(firstStep) * 0.25)) break;
        run.push(cur);
      }
      if (run.length > best.length) best = run;
    }
    if (best.length < 3) continue;

    const { subject, metric, unit } = best[0];
    const step = Math.round(((best[best.length - 1].value - best[0].value) / (best.length - 1)) * 10) / 10;
    const falling = step < 0;
    const lowerBetter = LOWER_IS_BETTER.test(metric);
    // The best day of the whole week, not just of the run.
    const bestObs = byDay.reduce((a, b) => (lowerBetter ? (b.value < a.value ? b : a) : b.value > a.value ? b : a));
    const bestDay = bestObs.day;
    const runDays = best.map((o) => o.day);
    const outside = byDay.filter((o) => !runDays.includes(o.day));
    const flatOutside = outside.length > 0 && outside.every((o) => o.value === outside[0].value);
    const amount = unit === "%" ? `${Math.abs(step)} points` : fmt(Math.abs(step), unit);
    const verb = falling ? "drops" : "rises";
    const afterOrUntil = falling === !lowerBetter ? `after ${DAY_NAMES[bestDay]}` : `until ${DAY_NAMES[bestDay]}`;
    const summary = `${subject}'s ${metric} ${verb} ${amount} a day ${afterOrUntil}`;

    // Blocks and sources that mention the subject.
    const mentions = (text: string) => text.toLowerCase().includes(subject.toLowerCase());
    const linked = schedule.filter((s) => mentions(`${s.title} ${s.notes ?? ""}`));
    const onBestDay = linked.filter((s) => s.day === bestDay);
    const backing = sources.filter((s) => mentions(`${s.title} ${s.text}`) || (s.from && mentions(s.from)));

    let confidence = 0.55 + 0.08 * (best.length - 3) + (flatOutside ? 0.05 : 0);
    if (onBestDay.length) confidence += 0.2;
    else if (linked.length) confidence -= 0.1; // the task is done on a worse day
    if (backing.length) confidence += 0.1;

    const lastRun = best[best.length - 1];
    const action = onBestDay[0] ? normTitle(onBestDay[0].title).replace(subject.toLowerCase(), "").trim() : null;
    const question = onBestDay[0]
      ? `${summary}. Is that why you always ${action} on ${DAY_NAMES[bestDay]} ${partOfDay(onBestDay[0].start)}?`
      : `${summary}. Should whoever does this plan around ${DAY_NAMES[bestDay]}?`;
    const tail = flatOutside ? `, and ${fmt(outside[0].value, unit)} on ${outside.map((o) => DAY_NAMES[o.day]).join(" and ")}` : "";
    const advice = `${action ? capitalize(action) : `Deal with ${subject}`} on ${DAY_NAMES[bestDay]}: ${subject}'s ${metric} is ${fmt(bestObs.value, unit)} that day, only ${fmt(lastRun.value, unit)} by ${DAY_NAMES[lastRun.day]}${tail}.`;

    out.push({
      id: `trend:${slug(subject)}:${slug(metric)}`,
      kind: "trend",
      summary,
      evidence: byDay.map((o) => `${o.day} ${fmt(o.value, o.unit)}`),
      days: runDays,
      confidence: clamp(confidence),
      level: "advice", // a better deal, not a rule
      question,
      advice,
      itemIds: linked.map((s) => s.id),
      sourceIds: backing.map((s) => s.id),
      series: WEEKDAYS.flatMap((d) => {
        const o = byDay.find((x) => x.day === d);
        return o ? [{ day: d, value: o.value, unit: o.unit }] : [];
      }),
      bestDay,
    });
  }
  return out;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

// ---- by-weekday ---------------------------------------------------------

// Breaks are grouped by their slot ("the 14:00 break"), other blocks by title.
const weekdayKey = (s: ScheduleItem) => (s.kind === "break" ? `break@${s.start}` : `${s.kind}:${normTitle(s.title)}`);

function detectByWeekday(schedule: ScheduleItem[]): DetectedPattern[] {
  const groups = new Map<string, ScheduleItem[]>();
  for (const s of schedule) groups.set(weekdayKey(s), [...(groups.get(weekdayKey(s)) ?? []), s]);
  const out: DetectedPattern[] = [];
  for (const [key, items] of groups) {
    if (items.length < 2) continue;
    const sorted = [...items].sort((a, b) => dayIndex(a.day) - dayIndex(b.day));
    const lengths = new Set(sorted.map((s) => s.minutes));
    const starts = new Set(sorted.map((s) => s.start));
    if (lengths.size < 2 && starts.size < 2) continue;

    const isBreak = sorted[0].kind === "break";
    const name = isBreak ? (/lunch/i.test(sorted.map((s) => s.title).join(" ")) ? "lunch" : `${sorted[0].start} break`) : normTitle(sorted[0].title);
    let summary: string;
    let evidence: string[];
    let odd: ScheduleItem[] = [];
    if (lengths.size >= 2) {
      // The usual length, and the days that differ.
      const counts = new Map<number, number>();
      sorted.forEach((s) => counts.set(s.minutes, (counts.get(s.minutes) ?? 0) + 1));
      const usual = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
      const usualIsClear = (counts.get(usual) ?? 0) > 1;
      odd = usualIsClear ? sorted.filter((s) => s.minutes !== usual) : [];
      evidence = sorted.map((s) => `${s.day} ${s.minutes} min`);
      summary = usualIsClear
        ? `${capitalize(name)} is ${usual} minutes, but ${odd.map((s) => `${s.minutes} on ${DAY_NAMES[s.day]}`).join(" and ")}`
        : `The ${name} is ${sorted.map((s) => `${s.minutes} minutes on ${DAY_NAMES[s.day]}`).join(" and ")}`;
    } else {
      evidence = sorted.map((s) => `${s.day} ${s.start}`);
      summary = `${capitalize(name)} moves around: ${sorted.map((s) => `${s.start} on ${DAY_NAMES[s.day]}`).join(", ")}`;
    }
    const social = sorted.some((s) => /team/i.test(s.title) || (s.with?.length ?? 0) > 0);
    const level: Level = social ? "advice" : "choice";
    const question = isBreak
      ? `${summary}. Is that fixed by something, or just how the day goes?`
      : `${summary}. Is there a reason it changes by day?`;
    const advice = isBreak
      ? social && odd.length
        ? `Keep ${DAY_NAMES[odd[0].day]} ${odd[0].start} free: ${odd[0].title.toLowerCase()}, ${odd[0].minutes} minutes.`
        : `Take the ${name}: ${sorted.map((s) => `${s.day} ${s.minutes} min`).join(", ")}.`
      : `${capitalize(name)}: ${evidence.join(", ")}.`;
    out.push({
      id: `weekday:${slug(key)}`,
      kind: "by-weekday",
      summary,
      evidence,
      days: sorted.map((s) => s.day),
      confidence: clamp(0.5 + 0.08 * sorted.length),
      level,
      question,
      advice,
      itemIds: sorted.map((s) => s.id),
      sourceIds: [],
    });
  }
  return out;
}

// ---- recurring-slot -----------------------------------------------------

const STOP = new Set(["weekly", "with", "from", "open", "new", "this", "that", "every", "about", "check", "call"]);
const keywords = (title: string) =>
  normTitle(title)
    .split(/[^a-z]+/)
    .filter((w) => w.length > 3 && !STOP.has(w));

// A sentence in a source that names the item and its day ("send me the spend report on Fridays").
function backingQuote(item: ScheduleItem, sources: ContextSource[]): { source: ContextSource; quote: string } | null {
  const words = keywords(item.title);
  const day = DAY_NAMES[item.day].toLowerCase();
  for (const source of sources) {
    for (const sentence of source.text.split(/(?<=[.!?])\s+|\n/)) {
      const s = sentence.toLowerCase();
      if (!s.includes(day)) continue;
      const hits = words.filter((w) => s.includes(w)).length;
      if (hits >= Math.min(2, words.length)) return { source, quote: sentence.replace(/^[^:]{1,30}:\s*/, "").trim() };
    }
  }
  return null;
}

function detectRecurring(schedule: ScheduleItem[], sources: ContextSource[], taken: Set<string>): DetectedPattern[] {
  const groups = new Map<string, ScheduleItem[]>();
  for (const s of schedule) {
    if (s.kind === "break" || taken.has(s.id)) continue;
    const key = `${normTitle(s.title)}@${s.start}`;
    groups.set(key, [...(groups.get(key) ?? []), s]);
  }
  const out: DetectedPattern[] = [];
  for (const items of groups.values()) {
    const sorted = [...items].sort((a, b) => dayIndex(a.day) - dayIndex(b.day));
    const first = sorted[0];
    const isMeeting = first.kind === "meeting";
    const many = sorted.length >= 2;
    const backing = many ? null : backingQuote(first, sources);
    const weekly = /weekly|always|every/i.test(`${first.title} ${first.notes ?? ""}`);
    // One-off blocks only count when something says they come back every week.
    if (!many && !isMeeting && !weekly && !backing) continue;
    if (!many && isMeeting && !first.with?.length) continue;

    const when = many ? `${dayRange(sorted.map((s) => s.day))} at ${first.start}` : `every ${DAY_NAMES[first.day]} at ${first.start}`;
    const title = first.title.replace(/^weekly\s+/i, "");
    const summary = `${capitalize(title)} ${when}`;
    const level: Level = isMeeting || backing ? "must" : "advice"; // a fixed meeting is a team convention
    let confidence = many ? 0.5 + 0.09 * sorted.length : 0.6;
    if (weekly) confidence += 0.1;
    if (backing) confidence += 0.2;
    const who = first.with?.length ? ` with ${first.with.join(", ")}` : "";
    const question = isMeeting
      ? `You have ${title}${who} ${when}. Is that a fixed team meeting the next person should join?`
      : backing
        ? `${capitalize(title)} ${when}. ${backing.source.from ?? "Someone"} asked for it in "${backing.source.title}". Is that a standing rule?`
        : `You do ${lowerFirst(title)} ${when}. Is that a habit, or does something depend on it?`;
    const advice = isMeeting
      ? `Join ${title}${who} ${when}.`
      : `Do ${lowerFirst(title)} ${when}${backing ? `: ${backing.source.from ?? "they"} expect${backing.source.from ? "s" : ""} it` : ""}.`;
    out.push({
      id: `slot:${slug(normTitle(first.title))}-${first.start.replace(":", "")}`,
      kind: "recurring-slot",
      summary,
      evidence: [...sorted.map((s) => `${s.day} ${s.start}`), ...(backing ? [`"${backing.quote}"`] : [])],
      days: sorted.map((s) => s.day),
      confidence: clamp(confidence),
      level,
      question,
      advice,
      itemIds: sorted.map((s) => s.id),
      sourceIds: [...new Set([...sorted.flatMap((s) => (s.sourceId ? [s.sourceId] : [])), ...(backing ? [backing.source.id] : [])])],
    });
  }
  return out;
}

// ---- all together -------------------------------------------------------

const KIND_ORDER: Record<Pattern["kind"], number> = { trend: 0, "by-weekday": 1, "recurring-slot": 2 };

export function detectPatterns({
  schedule,
  observations = [],
  sources = [],
}: {
  schedule: ScheduleItem[];
  observations?: WeeklyObservation[];
  sources?: ContextSource[];
}): DetectedPattern[] {
  const trends = detectTrends(observations, schedule, sources);
  const taken = new Set(trends.flatMap((t) => t.itemIds));
  const patterns = [...trends, ...detectByWeekday(schedule), ...detectRecurring(schedule, sources, taken)];
  return patterns.sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || b.confidence - a.confidence);
}
