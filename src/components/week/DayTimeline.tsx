"use client";

import { Fragment } from "react";
import { Sparkles, Users } from "lucide-react";
import { DAY_NAMES, toMinutes } from "@/lib/context/patterns";
import { WEEKDAYS, type ContextSource, type Weekday } from "@/lib/context/types";
import { KIND, LevelBadge, SOURCE_ICON, endOf, hhmm, useNow, type Block } from "./weekUi";

const ROLE: Record<NonNullable<Block["role"]>, string> = { attend: "You'll attend", do: "You do it", break: "Break" };

export function DayPicker({ day, today, onPick }: { day: Weekday; today: Weekday | null; onPick: (d: Weekday) => void }) {
  return (
    <div className="inline-flex rounded-2xl bg-white p-1 shadow-sm ring-1 ring-zinc-200/70">
      {WEEKDAYS.map((d) => (
        <button
          key={d}
          onClick={() => onPick(d)}
          className={`relative rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors ${d === day ? "text-white shadow-md shadow-ari-500/30 ari-gradient" : "text-zinc-600 hover:bg-zinc-50"}`}
        >
          {d}
          {d === today && <span className={`absolute right-1 top-1 h-1.5 w-1.5 rounded-full ${d === day ? "bg-white" : "bg-coral-500"}`} />}
        </button>
      ))}
    </div>
  );
}

// One day as a timeline, with a line for "now" when it's today.
export function DayTimeline({
  day,
  blocks,
  sources,
  isToday,
  selectedId,
  onSelect,
}: {
  day: Weekday;
  blocks: Block[];
  sources: ContextSource[];
  isToday: boolean;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const now = useNow();
  const nowMin = now && isToday ? now.getHours() * 60 + now.getMinutes() : null;
  const items = blocks.filter((b) => b.day === day).sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  const inBlock = nowMin !== null && items.some((b) => toMinutes(b.start) <= nowMin && nowMin < toMinutes(b.start) + b.minutes);
  const nowIndex = nowMin === null || inBlock ? -2 : items.findIndex((b) => toMinutes(b.start) > nowMin);
  const nowLine = (
    <li className="relative flex items-center gap-3 py-1" aria-label="Now">
      <span className="w-14 text-right text-xs font-bold tabular-nums text-coral-500">{now && hhmm(now)}</span>
      <span className="relative z-10 h-3 w-3 rounded-full bg-coral-500 ring-4 ring-coral-400/25" />
      <span className="h-0.5 flex-1 rounded bg-gradient-to-r from-coral-500 to-coral-400/0" />
      <span className="text-xs font-semibold text-coral-500">Now</span>
    </li>
  );

  return (
    <div className="rounded-3xl border border-zinc-200/70 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-zinc-900">{DAY_NAMES[day]}</h2>
        <span className="text-xs text-zinc-400">
          {items.length} blocks · {items.filter((b) => b.kind === "break").reduce((n, b) => n + b.minutes, 0)} min of breaks
        </span>
      </div>
      <ol className="relative">
        <span className="absolute bottom-3 left-[4.95rem] top-3 w-px bg-zinc-200" />
        {items.map((b, i) => {
          const k = KIND[b.kind];
          const Icon = k.icon;
          const source = sources.find((s) => s.id === b.sourceId);
          const SourceIcon = source ? SOURCE_ICON[source.kind].icon : null;
          const current = nowMin !== null && toMinutes(b.start) <= nowMin && nowMin < toMinutes(b.start) + b.minutes;
          const past = nowMin !== null && toMinutes(b.start) + b.minutes <= nowMin;
          return (
            <Fragment key={b.id}>
              {i === nowIndex && nowLine}
              <li className={`relative flex items-start gap-3 py-1.5 ${past ? "opacity-55" : ""}`}>
                <span className="w-14 pt-2.5 text-right text-xs font-semibold tabular-nums text-zinc-500">{b.start}</span>
                <span className={`relative z-10 mt-3 h-3 w-3 shrink-0 rounded-full ring-4 ring-white ${k.dot}`} />
                <button
                  onClick={() => onSelect?.(b.id)}
                  className={`ari-lift flex-1 rounded-2xl border p-3 text-left ${k.block} ${current ? "ring-2 ring-coral-400" : ""} ${selectedId === b.id ? "ring-2 ring-ari-500" : ""}`}
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <Icon className="h-4 w-4 opacity-70" />
                    <span className="font-semibold">{b.title}</span>
                    <span className="text-xs tabular-nums opacity-60">
                      until {endOf(b.start, b.minutes)} · {b.minutes} min
                    </span>
                    {current && <span className="rounded-full bg-coral-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">Now</span>}
                    {b.role && <span className="ml-auto rounded-full bg-white/70 px-2 py-0.5 text-xs font-medium text-zinc-600">{ROLE[b.role]}</span>}
                    {SourceIcon && <SourceIcon className={`h-3.5 w-3.5 opacity-60 ${b.role ? "" : "ml-auto"}`} />}
                  </span>
                  {b.with?.length ? (
                    <span className="mt-1 flex items-center gap-1 text-xs opacity-70">
                      <Users className="h-3 w-3" /> {b.with.join(", ")}
                    </span>
                  ) : null}
                  {b.advice && (
                    <span className="mt-2 flex items-start gap-1.5 rounded-xl bg-white/80 p-2 text-sm text-zinc-700">
                      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-ari-500" />
                      <span className="flex-1">{b.advice}</span>
                      <LevelBadge level={b.level} />
                    </span>
                  )}
                </button>
              </li>
            </Fragment>
          );
        })}
        {nowIndex === -1 && nowMin !== null && items.length > 0 && nowMin >= toMinutes(items.at(-1)!.start) + items.at(-1)!.minutes && nowLine}
      </ol>
      {items.length === 0 && <p className="py-6 text-center text-sm text-zinc-400">Nothing planned.</p>}
    </div>
  );
}
