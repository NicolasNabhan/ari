// The newcomer's plan, built from the expert's week and what Ari learned:
// their recurring week, a plan for one day, and how each recurring task works.
// Pure: schedule + patterns (+ lessons) in, plan out.

import { levelOf, type Level } from "@/lib/apprentice/reasonTypes";
import { isUnwritten } from "@/lib/apprentice/teach";
import type { DecisionCard, Lessons, StepId } from "@/lib/apprentice/types";
import { DAY_NAMES, normTitle, toMinutes, type DetectedPattern } from "./patterns";
import { WEEKDAYS, type Pattern, type ScheduleItem, type ScheduleKind, type Weekday } from "./types";

export type PlanItem = {
  id: string;
  day: Weekday;
  start: string;
  minutes: number;
  kind: ScheduleKind;
  title: string;
  role: "attend" | "do" | "break";
  note?: string; // "You'll attend with Dana (Finance)"
  advice?: string; // from a pattern: why this slot
  level?: Level;
  patternId?: string;
  taskId?: string; // the guide in `tasks` for this block
  sourceId?: string;
};

export type TaskStep = { text: string; detail?: string; how?: string[]; level?: Level; unwritten?: boolean };

export type TaskGuide = {
  id: string;
  title: string;
  when: string; // "Tue 09:30, 30 min"
  days: Weekday[];
  from: "lessons" | "schedule";
  steps: TaskStep[];
  tip?: string; // pattern advice
  level?: Level;
};

export type NewcomerPlan = {
  week: PlanItem[];
  today: { day: Weekday; items: PlanItem[]; spoken: string };
  tasks: TaskGuide[];
};

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const byTime = (a: { day: Weekday; start: string }, b: { day: Weekday; start: string }) =>
  WEEKDAYS.indexOf(a.day) - WEEKDAYS.indexOf(b.day) || toMinutes(a.start) - toMinutes(b.start);
const clean = (title: string) => title.replace(/\s*\(.*?\)/g, "").trim();

// Schedule tasks that are part of a purchase request, and the lesson steps they cover.
const STEP_MATCH: { re: RegExp; steps: StepId[] }[] = [
  { re: /request quotes|get quotes/i, steps: ["quotes"] },
  { re: /compare quotes|score vendors|pick a vendor/i, steps: ["vendor", "scoring"] },
  { re: /approval/i, steps: ["approval"] },
  { re: /issue (purchase orders?|POs?)/i, steps: ["po"] },
];
const stepsFor = (title: string): StepId[] => STEP_MATCH.find((m) => m.re.test(title))?.steps ?? [];

function lessonStep(card: DecisionCard, expert: string): TaskStep {
  const chosen = card.options.find((o) => o.id === card.chosen)?.label ?? card.chosen;
  const level = card.reason ? levelOf(card.reason.types) : undefined;
  return {
    text: `${card.title}: ${chosen}`,
    detail: card.reason ? `${expert}: "${card.reason.text}"` : undefined,
    how: card.howNotes.filter((h) => !/^paused/i.test(h)),
    level: level === "unknown" ? undefined : level,
    unwritten: isUnwritten(card) || undefined,
  };
}

// Short generic steps for a task Ari has no lesson for.
function genericSteps(item: ScheduleItem, extra?: string[]): TaskStep[] {
  if (extra?.length) return extra.map((text) => ({ text }));
  const steps: TaskStep[] = [{ text: `Block ${item.minutes} minutes for it` }, { text: clean(item.title) }];
  if (item.notes) steps.push({ text: item.notes });
  steps.push({ text: "Note anything unusual and tell your manager" });
  return steps;
}

function roleOf(kind: ScheduleKind): PlanItem["role"] {
  return kind === "meeting" ? "attend" : kind === "break" ? "break" : "do";
}

function noteFor(item: ScheduleItem): string | undefined {
  if (item.kind === "meeting") return `You'll attend${item.with?.length ? ` with ${item.with.join(", ")}` : ""}`;
  if (item.kind === "break") return `Take it: ${item.minutes} min`;
  if (item.kind === "focus") return "Focus time: no meetings";
  return undefined;
}

// Today's line about a trend, said on its best day: "OfficeHub's discount is 50% today, only 30% by Thursday".
function trendLine(p: DetectedPattern, day: Weekday): string | undefined {
  if (p.kind !== "trend" || !p.series?.length) return p.advice;
  const today = p.series.find((s) => s.day === day);
  const last = p.series.filter((s) => p.days.includes(s.day)).at(-1);
  const subject = p.summary.split("'s ")[0];
  if (!today || !last || last.day === day) return p.advice;
  const off = /discount|saving/i.test(p.summary) ? " off" : "";
  const val = (v: number, unit?: string) => `${v}${unit === "%" ? "%" : unit ? ` ${unit}` : ""}`;
  return `${subject} is ${val(today.value, today.unit)}${off} today, only ${val(last.value, last.unit)} by ${DAY_NAMES[last.day]}`;
}

export function buildPlan({
  schedule,
  patterns,
  lessons,
  taskSteps = {},
  today,
}: {
  schedule: ScheduleItem[];
  patterns: (Pattern | DetectedPattern)[];
  lessons?: Lessons | null;
  taskSteps?: Record<string, string[]>; // extra steps per schedule item id
  today?: Weekday;
}): NewcomerPlan {
  const expert = lessons?.expert ?? "Maria";
  const detected = patterns as DetectedPattern[];
  const patternFor = (id: string) => detected.find((p) => p.itemIds?.includes(id));

  // ---- tasks: one guide per recurring task title
  const taskItems = schedule.filter((s) => s.kind !== "meeting" && s.kind !== "break");
  const groups = new Map<string, ScheduleItem[]>();
  for (const s of taskItems) groups.set(normTitle(s.title), [...(groups.get(normTitle(s.title)) ?? []), s]);
  const tasks: TaskGuide[] = [];
  const taskIdOf = new Map<string, string>();
  for (const [key, items] of groups) {
    const first = items[0];
    const id = `task:${slug(key)}`;
    items.forEach((s) => taskIdOf.set(s.id, id));
    const pattern = items.map((s) => patternFor(s.id)).find(Boolean);
    const lessonCards = stepsFor(first.title).flatMap((step) => lessons?.cards.filter((c) => c.stepId === step) ?? []);
    const fromLessons = lessonCards.length > 0;
    tasks.push({
      id,
      title: clean(first.title),
      when: items.map((s) => `${s.day} ${s.start}`).join(", ") + `, ${first.minutes} min`,
      days: items.map((s) => s.day),
      from: fromLessons ? "lessons" : "schedule",
      steps: fromLessons
        ? [...(taskSteps[first.id] ?? []).map((text) => ({ text })), ...lessonCards.map((c) => lessonStep(c, expert))]
        : genericSteps(first, taskSteps[first.id]),
      tip: pattern?.advice,
      level: pattern?.level,
    });
  }
  // The whole purchase, end to end, the way the expert does it.
  if (lessons?.cards.length) {
    tasks.unshift({
      id: "task:purchase-request",
      title: `A purchase request, the way ${expert} does it`,
      when: "Mon to Thu, see your week",
      days: ["Mon", "Tue", "Wed", "Thu"],
      from: "lessons",
      steps: lessons.cards.map((c) => lessonStep(c, expert)),
      tip: `Learned from ${expert}'s "${lessons.requestSubject}"`,
    });
  }

  // ---- week: the expert's blocks, re-said for the newcomer
  const week: PlanItem[] = schedule.map((s) => {
    const p = patternFor(s.id);
    return {
      id: `plan-${s.id}`,
      day: s.day,
      start: s.start,
      minutes: s.minutes,
      kind: s.kind,
      title: clean(s.title),
      role: roleOf(s.kind),
      note: noteFor(s),
      advice: p ? adviceFor(p, s, schedule) : undefined,
      level: p?.level,
      patternId: p?.id,
      taskId: taskIdOf.get(s.id),
      sourceId: s.sourceId,
    };
  });
  // A trend with no block of its own gets one, first thing on its best day.
  for (const p of detected) {
    if (p.kind !== "trend" || !p.bestDay || p.itemIds?.length) continue;
    week.push({
      id: `plan-${p.id}`,
      day: p.bestDay,
      start: firstFreeSlot(week.filter((w) => w.day === p.bestDay), 30),
      minutes: 30,
      kind: "task",
      title: `Deal with ${p.summary.split("'s ")[0]}`,
      role: "do",
      advice: trendLine(p, p.bestDay),
      level: p.level,
      patternId: p.id,
    });
  }
  week.sort(byTime);

  // ---- today
  const day = today ?? "Mon";
  const items = week.filter((w) => w.day === day);
  const spoken = [
    `Here's your ${DAY_NAMES[day]}.`,
    ...items.map((w) => {
      const what = w.role === "attend" ? `${w.title}, you'll attend` : w.role === "break" ? `${w.title}, ${w.minutes} minutes` : w.title;
      return `${w.start}, ${what}${w.advice ? `. ${w.advice.replace(/\.$/, "")}` : ""}.`;
    }),
  ].join(" ");

  return { week, today: { day, items, spoken }, tasks };
}

// What a pattern means for one block of the newcomer's week.
function adviceFor(p: DetectedPattern, item: ScheduleItem, schedule: ScheduleItem[]): string | undefined {
  if (p.kind === "trend") return trendLine(p, item.day);
  if (p.kind === "recurring-slot") return item.kind === "meeting" ? undefined : p.advice; // meetings already say "you'll attend"
  // by-weekday: say it on the days that differ from the usual.
  const group = schedule.filter((s) => p.itemIds.includes(s.id));
  const count = (m: number) => group.filter((s) => s.minutes === m).length;
  const usual = group.map((s) => s.minutes).sort((a, b) => count(b) - count(a))[0];
  return count(usual) > 1 && item.minutes === usual ? undefined : `${p.summary}.`;
}

// The first gap of `minutes` after 09:15 on a day, or 09:30.
function firstFreeSlot(items: PlanItem[], minutes: number): string {
  const busy = items.map((i) => [toMinutes(i.start), toMinutes(i.start) + i.minutes]).sort((a, b) => a[0] - b[0]);
  let t = 9 * 60 + 15;
  for (const [from, to] of busy) {
    if (from - t >= minutes) break;
    t = Math.max(t, to);
  }
  const hh = String(Math.floor(t / 60)).padStart(2, "0");
  const mm = String(t % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

// The weekday for a date; weekends plan for Monday.
export function weekdayOf(date: Date): Weekday {
  const i = date.getDay(); // 0 = Sunday
  return i >= 1 && i <= 5 ? WEEKDAYS[i - 1] : "Mon";
}
