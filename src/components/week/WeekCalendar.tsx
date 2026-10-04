"use client";

import { Sparkles } from "lucide-react";
import { DAY_NAMES, toMinutes } from "@/lib/context/patterns";
import { WEEKDAYS, type ContextSource, type Weekday } from "@/lib/context/types";
import { DAY_END, DAY_START, KIND, SOURCE_ICON, endOf, hhmm, useNow, type Block } from "./weekUi";

const PX = 1.3; // pixels per minute
const HOURS = Array.from({ length: 9 }, (_, i) => 9 + i); // 09:00 … 17:00

// Mon–Fri, 08:30–17:30, one coloured block per meeting, break or task.
export function WeekCalendar({
  blocks,
  sources,
  selectedId,
  onSelect,
  today,
}: {
  blocks: Block[];
  sources: ContextSource[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  today: Weekday | null;
}) {
  const now = useNow();
  const nowMin = now ? now.getHours() * 60 + now.getMinutes() : -1;
  const showNow = today && nowMin >= DAY_START && nowMin <= DAY_END;
  const height = (DAY_END - DAY_START) * PX;

  return (
    <div className="overflow-hidden rounded-3xl border border-zinc-200/70 bg-white shadow-sm">
      <div className="grid grid-cols-[3.25rem_repeat(5,minmax(0,1fr))] border-b border-zinc-100 bg-white/80">
        <span />
        {WEEKDAYS.map((d) => (
          <div key={d} className="flex items-center justify-center gap-1.5 px-1 py-2.5 text-sm font-semibold text-zinc-700">
            <span className="hidden lg:inline">{DAY_NAMES[d]}</span>
            <span className="lg:hidden">{d}</span>
            {d === today && <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white ari-gradient">Today</span>}
          </div>
        ))}
      </div>
      <div className="relative grid grid-cols-[3.25rem_repeat(5,minmax(0,1fr))]" style={{ height }}>
        {/* hour lines */}
        {HOURS.map((h) => (
          <div key={h} className="pointer-events-none absolute inset-x-0 border-t border-dashed border-zinc-100" style={{ top: (h * 60 - DAY_START) * PX }}>
            <span className="absolute -top-2 left-1.5 bg-white px-0.5 text-[10px] font-medium tabular-nums text-zinc-400">{String(h).padStart(2, "0")}:00</span>
          </div>
        ))}
        <span />
        {WEEKDAYS.map((d) => (
          <div key={d} className={`relative border-l border-zinc-100 ${d === today ? "bg-ari-50/40" : ""}`}>
            {blocks
              .filter((b) => b.day === d)
              .map((b) => {
                const top = (toMinutes(b.start) - DAY_START) * PX;
                const h = Math.max(b.minutes * PX - 2, 16);
                const k = KIND[b.kind];
                const Icon = k.icon;
                const source = sources.find((s) => s.id === b.sourceId);
                const SourceIcon = source ? SOURCE_ICON[source.kind].icon : null;
                const tall = h >= 38;
                return (
                  <button
                    key={b.id}
                    data-ari={`week-block-${b.id}`}
                    onClick={() => onSelect(b.id)}
                    title={`${b.start}–${endOf(b.start, b.minutes)} ${b.title}`}
                    className={`group absolute inset-x-1 overflow-hidden rounded-lg border px-1.5 text-left text-[11px] leading-tight transition-all hover:z-10 hover:shadow-md ${k.block} ${
                      selectedId === b.id ? "z-10 ring-2 ring-ari-500 ring-offset-1" : b.highlight ? "z-10 shadow-lg shadow-coral-400/30 ring-2 ring-coral-400 ring-offset-1" : ""
                    } ${tall ? "py-1" : "flex items-center"} ${b.noticed && SourceIcon ? "pr-9" : b.noticed || SourceIcon ? "pr-5" : ""}`}
                    style={{ top, height: h }}
                  >
                    <span className="flex min-w-0 items-center gap-1 font-semibold">
                      <Icon className="h-3 w-3 shrink-0 opacity-70" />
                      <span className="truncate">{b.title}</span>
                    </span>
                    {tall && <span className="mt-0.5 block truncate tabular-nums opacity-60">{b.start}–{endOf(b.start, b.minutes)}</span>}
                    {(b.noticed || SourceIcon) && (
                      <span className="absolute right-1 top-1 flex items-center gap-0.5">
                        {SourceIcon && <SourceIcon className="h-3 w-3 opacity-60" aria-label={SOURCE_ICON[source!.kind].label} />}
                        {b.noticed && (
                          <span className="grid h-3.5 w-3.5 place-items-center rounded-full text-white ari-gradient" title="Ari noticed a pattern here">
                            <Sparkles className="h-2.5 w-2.5" />
                          </span>
                        )}
                      </span>
                    )}
                  </button>
                );
              })}
            {showNow && d === today && (
              <div className="pointer-events-none absolute inset-x-0 z-20" style={{ top: (nowMin - DAY_START) * PX }}>
                <div className="relative h-0.5 bg-coral-500">
                  <span className="absolute -left-1 -top-1 h-2.5 w-2.5 rounded-full bg-coral-500 ring-2 ring-white" />
                  <span className="absolute -top-2.5 right-1 rounded-full bg-coral-500 px-1.5 text-[10px] font-bold text-white">{now && hhmm(now)}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function KindLegend() {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {Object.entries(KIND).map(([kind, k]) => {
        const Icon = k.icon;
        return (
          <span key={kind} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ring-1 ${k.chip}`}>
            <Icon className="h-3 w-3" /> {k.label}
          </span>
        );
      })}
      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 font-medium text-zinc-600 ring-1 ring-zinc-200">
        <span className="grid h-3.5 w-3.5 place-items-center rounded-full text-white ari-gradient">
          <Sparkles className="h-2.5 w-2.5" />
        </span>
        Ari noticed a pattern
      </span>
    </div>
  );
}
