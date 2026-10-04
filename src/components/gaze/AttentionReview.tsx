"use client";

import { BookOpenText, Eye, ScanEye, X } from "lucide-react";
import type { AttentionRecord } from "@/lib/context/types";
import { byScreen, formatDwell, readingKind } from "@/lib/gaze/attention";

const SCREEN_NAMES: Record<string, string> = {
  inbox: "Inbox",
  requests: "Requests",
  vendors: "Vendors & quotes",
  scoring: "Scoring sheet",
  approvals: "Approvals",
  messages: "Chat & email",
  procedure: "Procedure",
  week: "Week & schedule",
  context: "Files & meetings",
};

// End of session: the top things the expert looked at on each screen.
export function AttentionReview({ records, expert, onClose }: { records: AttentionRecord[]; expert: string; onClose: () => void }) {
  const screens = byScreen(records, 5);
  const longest = Math.max(1, ...screens.flatMap((s) => s.items.map((r) => r.ms)));
  const total = records.reduce((n, r) => n + r.ms, 0);
  return (
    <div data-gaze-ignore="" className="fixed inset-0 z-40 flex items-center justify-center bg-[#1d1a2f]/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <section data-ari="gaze-review" onClick={(e) => e.stopPropagation()} className="ari-pop relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600">
          <X className="h-4 w-4" />
        </button>
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-xl text-white ari-gradient">
            <ScanEye className="h-4 w-4" />
          </span>
          Where {expert}&rsquo;s eyes went
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          {formatDwell(total)} of attention across {screens.length} screen{screens.length === 1 ? "" : "s"}. Ari shows the next person where to look.
        </p>
        <div className="ari-stagger mt-4 space-y-4">
          {screens.map((s) => (
            <div key={s.screen}>
              <h3 className="flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-zinc-500">
                {SCREEN_NAMES[s.screen] ?? s.screen}
                <span className="font-medium normal-case tracking-normal text-zinc-400">{formatDwell(s.total)}</span>
              </h3>
              <ul className="mt-2 space-y-1.5">
                {s.items.map((r) => {
                  const reading = readingKind(r.ms) === "reading";
                  return (
                    <li key={r.target} className="text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-1.5 text-zinc-800">
                          {reading ? <BookOpenText className="h-3.5 w-3.5 shrink-0 text-ari-500" /> : <Eye className="h-3.5 w-3.5 shrink-0 text-zinc-400" />}
                          <span className="truncate">{r.label}</span>
                        </span>
                        <span className="shrink-0 text-xs tabular-nums text-zinc-500">
                          {formatDwell(r.ms)} · {reading ? "read" : "glance"}
                        </span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-ari-50">
                        <div
                          className={`h-2 rounded-full transition-all duration-700 ${reading ? "ari-gradient" : "bg-zinc-300"}`}
                          style={{ width: `${Math.max(4, (r.ms / longest) * 100)}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
