"use client";

import { useMemo, useState } from "react";
import { CalendarDays, CalendarRange, Clock, Coffee, ListChecks, Sparkles, Sun, Users, Volume2, type LucideIcon } from "lucide-react";
import type { Audience } from "@/lib/workspace/profile";
import type { Lessons } from "@/lib/apprentice/types";
import { MARIA_RECORDED } from "@/lib/apprentice/mariaSession";
import { MARIA_OBSERVATIONS, MARIA_SCHEDULE, MARIA_SOURCES, MARIA_TASK_STEPS } from "@/lib/context/mariaWeek";
import { DAY_NAMES, detectPatterns, type DetectedPattern } from "@/lib/context/patterns";
import { buildPlan, type PlanItem } from "@/lib/context/plan";
import type { ScheduleItem, Weekday } from "@/lib/context/types";
import { useAri } from "@/components/ari/AriProvider";
import { WeekCalendar, KindLegend } from "@/components/week/WeekCalendar";
import { DayPicker, DayTimeline } from "@/components/week/DayTimeline";
import { BlockDetails } from "@/components/week/BlockDetails";
import { PatternsPanel } from "@/components/week/PatternsPanel";
import { TaskGuides } from "@/components/week/TaskGuides";
import { useNow, type Block } from "@/components/week/weekUi";
import { PageTitle } from "./PageTitle";

const schedule = MARIA_SCHEDULE;
const sources = MARIA_SOURCES;

const weekdayOrNull = (d: Date): Weekday | null => (d.getDay() >= 1 && d.getDay() <= 5 ? (["Mon", "Tue", "Wed", "Thu", "Fri"] as Weekday[])[d.getDay() - 1] : null);

// The expert's whole week: meetings, breaks, recurring tasks, and patterns
// only visible across days. For the newcomer: their own week, day and tasks.
export function WeekView({ audience, lessons }: { audience: Audience; lessons?: Lessons }) {
  const patterns = useMemo(() => detectPatterns({ schedule, observations: MARIA_OBSERVATIONS, sources }), []);
  const now = useNow();
  const today = now ? weekdayOrNull(now) : null;
  return audience === "expert" ? (
    <ExpertWeek patterns={patterns} today={today} />
  ) : (
    <NewcomerWeek patterns={patterns} today={today} lessons={lessons ?? MARIA_RECORDED} />
  );
}

function fromSchedule(s: ScheduleItem, patterns: DetectedPattern[], focus: string[]): Block {
  return { ...s, noticed: patterns.some((p) => p.itemIds.includes(s.id)), highlight: focus.includes(s.id) };
}

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string; icon: LucideIcon }[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-2xl bg-white p-1 shadow-sm ring-1 ring-zinc-200/70">
      {options.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          data-ari={`week-tab-${id}`}
          onClick={() => onChange(id)}
          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors ${value === id ? "text-white shadow-md shadow-ari-500/30 ari-gradient" : "text-zinc-600 hover:bg-zinc-50"}`}
        >
          <Icon className="h-4 w-4" /> {label}
        </button>
      ))}
    </div>
  );
}

function Stats({ items, patterns }: { items: { kind: string; minutes: number }[]; patterns: number }) {
  const sum = (k: string) => items.filter((i) => i.kind === k).reduce((n, i) => n + i.minutes, 0);
  const stats: { icon: LucideIcon; value: string; label: string; tone: string }[] = [
    { icon: Users, value: String(items.filter((i) => i.kind === "meeting").length), label: "meetings", tone: "text-sky-600 bg-sky-50" },
    { icon: Clock, value: `${Math.round((sum("task") + sum("focus") + sum("admin")) / 60)}h`, label: "of tasks & focus", tone: "text-ari-600 bg-ari-50" },
    { icon: Coffee, value: `${sum("break")}m`, label: "of breaks", tone: "text-emerald-600 bg-emerald-50" },
    { icon: Sparkles, value: String(patterns), label: "patterns", tone: "text-coral-500 bg-rose-50" },
  ];
  return (
    <div className="ari-stagger grid grid-cols-2 gap-2 lg:grid-cols-4">
      {stats.map(({ icon: Icon, value, label, tone }) => (
        <div key={label} className="flex items-center gap-3 rounded-2xl border border-zinc-200/70 bg-white px-3 py-2.5 shadow-sm">
          <span className={`grid h-9 w-9 place-items-center rounded-xl ${tone}`}>
            <Icon className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-lg font-bold leading-none tracking-tight text-zinc-900">{value}</span>
            <span className="text-xs text-zinc-500">{label}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

// The calendar with a floating details card for the clicked block.
function CalendarWithDetails({
  blocks,
  patterns,
  today,
  onOpenTask,
}: {
  blocks: Block[];
  patterns: DetectedPattern[];
  today: Weekday | null;
  onOpenTask?: (taskId: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = blocks.find((b) => b.id === selectedId) ?? null;
  const onRight = selected && ["Mon", "Tue", "Wed"].includes(selected.day);
  return (
    <div className="relative">
      <WeekCalendar blocks={blocks} sources={sources} selectedId={selectedId} onSelect={(id) => setSelectedId(id === selectedId ? null : id)} today={today} />
      {selected && (
        <div className={`absolute top-12 z-30 w-[min(22rem,90%)] ${onRight ? "right-3" : "left-16"}`}>
          <BlockDetails block={selected} sources={sources} patterns={patterns} onClose={() => setSelectedId(null)} onOpenTask={onOpenTask} />
        </div>
      )}
    </div>
  );
}

function DayWithDetails({ day, blocks, patterns, today, onOpenTask }: { day: Weekday; blocks: Block[]; patterns: DetectedPattern[]; today: Weekday | null; onOpenTask?: (id: string) => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = blocks.find((b) => b.id === selectedId && b.day === day) ?? null;
  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <DayTimeline day={day} blocks={blocks} sources={sources} isToday={day === today} selectedId={selectedId} onSelect={(id) => setSelectedId(id === selectedId ? null : id)} />
      <div className="lg:sticky lg:top-20">
        {selected ? (
          <BlockDetails block={selected} sources={sources} patterns={patterns} onClose={() => setSelectedId(null)} onOpenTask={onOpenTask} />
        ) : (
          <p className="rounded-2xl border border-dashed border-zinc-200 bg-white/60 p-4 text-center text-sm text-zinc-400">Click a block to see who, what, and the meeting or file behind it.</p>
        )}
      </div>
    </div>
  );
}

// ---- the expert: Maria's week -------------------------------------------

function ExpertWeek({ patterns, today }: { patterns: DetectedPattern[]; today: Weekday | null }) {
  const [view, setView] = useState<"week" | "today">("week");
  const [day, setDay] = useState<Weekday | null>(null);
  const [focus, setFocus] = useState<string[]>([]);
  const shownDay = day ?? today ?? "Mon";
  const blocks = schedule.map((s) => fromSchedule(s, patterns, focus));
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle icon={CalendarDays} tone="sky" title="Week & schedule" subtitle="Your whole week: meetings, files, breaks and the patterns behind them" />
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { id: "week", label: "Week", icon: CalendarRange },
            { id: "today", label: "Today", icon: Sun },
          ]}
        />
      </div>
      <Stats items={schedule} patterns={patterns.length} />
      <KindLegend />
      {view === "week" ? (
        <CalendarWithDetails blocks={blocks} patterns={patterns} today={today} />
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <DayPicker day={shownDay} today={today} onPick={setDay} />
            {!today && <span className="text-sm text-zinc-500">It&apos;s the weekend: here&apos;s {DAY_NAMES[shownDay]}.</span>}
          </div>
          <DayWithDetails day={shownDay} blocks={blocks} patterns={patterns} today={today} />
        </div>
      )}
      <PatternsPanel patterns={patterns} schedule={schedule} audience="expert" onFocus={(p) => setFocus(p.itemIds)} />
    </section>
  );
}

// ---- the newcomer: your week, your day, how each task works ---------------

function planBlock(w: PlanItem): Block {
  const s = schedule.find((x) => `plan-${x.id}` === w.id);
  return { ...w, with: s?.with, notes: w.note, noticed: !!w.advice };
}

function NewcomerWeek({ patterns, today, lessons }: { patterns: DetectedPattern[]; today: Weekday | null; lessons: Lessons }) {
  const { say } = useAri();
  const [tab, setTab] = useState<"week" | "day" | "tasks">("week");
  const [day, setDay] = useState<Weekday | null>(null);
  const [openTask, setOpenTask] = useState<string | null>(null);
  const shownDay = day ?? today ?? "Mon";
  const plan = useMemo(
    () => buildPlan({ schedule, patterns, lessons, taskSteps: MARIA_TASK_STEPS, today: shownDay }),
    [patterns, lessons, shownDay],
  );
  const blocks = plan.week.map(planBlock);
  const goToTask = (id: string) => {
    setOpenTask(id);
    setTab("tasks");
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle icon={CalendarDays} tone="sky" title="Your plan" subtitle={`Built from ${lessons.expert}'s week, so you know your schedule from day one`} />
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { id: "week", label: "Your week", icon: CalendarRange },
            { id: "day", label: "Your day", icon: Sun },
            { id: "tasks", label: "How each task works", icon: ListChecks },
          ]}
        />
      </div>
      {tab === "week" && (
        <>
          <Stats items={plan.week} patterns={patterns.length} />
          <KindLegend />
          <CalendarWithDetails blocks={blocks} patterns={patterns} today={today} onOpenTask={goToTask} />
          <PatternsPanel patterns={patterns} schedule={schedule} audience="newcomer" expert={lessons.expert} />
        </>
      )}
      {tab === "day" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <DayPicker day={shownDay} today={today} onPick={setDay} />
            <button
              data-ari="read-my-day"
              onClick={() => void say(plan.today.spoken)}
              className="ari-lift inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-white shadow-md shadow-ari-500/30 ari-gradient"
            >
              <Volume2 className="h-4 w-4" /> Read my {shownDay === today ? "day" : DAY_NAMES[shownDay]} aloud
            </button>
            {!today && <span className="text-sm text-zinc-500">It&apos;s the weekend: here&apos;s {DAY_NAMES[shownDay]}.</span>}
          </div>
          <DayWithDetails day={shownDay} blocks={blocks} patterns={patterns} today={today} onOpenTask={goToTask} />
        </div>
      )}
      {tab === "tasks" && <TaskGuides tasks={plan.tasks} openId={openTask} onToggle={(id) => setOpenTask(openTask === id ? null : id)} expert={lessons.expert} />}
    </section>
  );
}
