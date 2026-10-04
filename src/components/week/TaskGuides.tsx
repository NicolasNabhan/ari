"use client";

import { BookOpenCheck, CalendarClock, ChevronDown, FileWarning, Lightbulb, Volume2 } from "lucide-react";
import { useAri } from "@/components/ari/AriProvider";
import type { TaskGuide } from "@/lib/context/plan";
import { LevelBadge } from "./weekUi";

// "How each task works": every recurring task with its steps. Purchase steps
// come from what Ari learned; the others from the expert's calendar.
export function TaskGuides({ tasks, openId, onToggle, expert }: { tasks: TaskGuide[]; openId: string | null; onToggle: (id: string) => void; expert: string }) {
  const { say } = useAri();
  return (
    <ul className="ari-stagger space-y-3">
      {tasks.map((t) => {
        const open = openId === t.id;
        return (
          <li key={t.id} data-ari={`guide-${t.id}`} className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-all ${open ? "border-ari-300 ring-4 ring-ari-100" : "border-zinc-200/70"}`}>
            <button onClick={() => onToggle(t.id)} className="flex w-full items-center gap-3 p-4 text-left">
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white ${t.from === "lessons" ? "ari-gradient" : "bg-gradient-to-br from-sky-400 to-indigo-500"}`}>
                {t.from === "lessons" ? <BookOpenCheck className="h-4 w-4" /> : <CalendarClock className="h-4 w-4" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-zinc-900">{t.title}</span>
                <span className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                  <span className="tabular-nums">{t.when}</span>
                  <span className={`rounded-full px-2 py-0.5 font-semibold ${t.from === "lessons" ? "bg-ari-50 text-ari-700" : "bg-sky-50 text-sky-700"}`}>
                    {t.from === "lessons" ? `Learned from ${expert}` : `From ${expert}'s calendar`}
                  </span>
                  <span>{t.steps.length} step{t.steps.length === 1 ? "" : "s"}</span>
                </span>
              </span>
              <ChevronDown className={`h-5 w-5 text-zinc-300 transition-transform ${open ? "rotate-180 text-ari-500" : ""}`} />
            </button>
            {open && (
              <div className="ari-rise border-t border-zinc-100 px-4 pb-4 pt-3">
                {t.tip && (
                  <p className="mb-3 flex items-start gap-2 rounded-xl bg-amber-50 p-2.5 text-sm text-amber-900">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    <span className="flex-1">{t.tip}</span>
                    <LevelBadge level={t.level} />
                  </p>
                )}
                <ol className="space-y-2.5">
                  {t.steps.map((s, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ari-50 text-xs font-bold text-ari-700 ring-1 ring-ari-100">{i + 1}</span>
                      <div className="min-w-0 flex-1 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-zinc-900">{s.text}</span>
                          <LevelBadge level={s.level} />
                          {s.unwritten && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500 px-2 py-0.5 text-xs font-semibold text-white">
                              <FileWarning className="h-3 w-3" /> Not written down
                            </span>
                          )}
                        </div>
                        {s.detail && <p className="mt-0.5 text-zinc-500">{s.detail}</p>}
                        {s.how?.map((h) => (
                          <p key={h} className="mt-0.5 text-xs text-zinc-400">
                            {h}
                          </p>
                        ))}
                      </div>
                    </li>
                  ))}
                </ol>
                <button
                  onClick={() => void say(`${t.title}. ${t.steps.map((s, i) => `Step ${i + 1}: ${s.text}.`).join(" ")}${t.tip ? ` Tip: ${t.tip}` : ""}`)}
                  className="ari-lift mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-sm font-semibold text-ari-700 ring-1 ring-ari-200"
                >
                  <Volume2 className="h-4 w-4" /> Hear Ari explain it
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
