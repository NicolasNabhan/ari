"use client";

import { useState } from "react";
import { CalendarRange, Check, Lightbulb, MessageCircleQuestion, Repeat, Sparkles, TrendingDown, TrendingUp, Undo2, Volume2, X, type LucideIcon } from "lucide-react";
import { useAri } from "@/components/ari/AriProvider";
import type { DetectedPattern } from "@/lib/context/patterns";
import { WEEKDAYS, type ScheduleItem, type Weekday } from "@/lib/context/types";
import { LevelBadge, usePatternAnswers, type PatternAnswer } from "./weekUi";

const KIND_LABEL: Record<DetectedPattern["kind"], { label: string; icon: LucideIcon; tone: string }> = {
  trend: { label: "Changes across the week", icon: TrendingDown, tone: "from-ari-500 to-coral-500" },
  "by-weekday": { label: "Different by day", icon: CalendarRange, tone: "from-emerald-400 to-teal-500" },
  "recurring-slot": { label: "Same time, every week", icon: Repeat, tone: "from-sky-400 to-indigo-500" },
};

// The "Patterns Ari noticed" panel. The expert confirms or corrects Ari's
// question; the newcomer sees what it means for them.
export function PatternsPanel({
  patterns,
  schedule,
  audience,
  expert = "Maria",
  onFocus,
}: {
  patterns: DetectedPattern[];
  schedule: ScheduleItem[];
  audience: "expert" | "newcomer";
  expert?: string;
  onFocus?: (p: DetectedPattern) => void;
}) {
  const { say } = useAri();
  const { answers, answer } = usePatternAnswers();
  const [asking, setAsking] = useState<string | null>(null);
  const isExpert = audience === "expert";
  const open = patterns.filter((p) => !answers[p.id]);

  function ask(p: DetectedPattern) {
    setAsking(p.id);
    onFocus?.(p);
    void say(isExpert ? p.question ?? p.summary : `${p.summary}. ${p.advice ?? ""}`);
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl text-white shadow-md shadow-ari-500/30 ari-gradient">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-semibold text-zinc-900">{isExpert ? "Patterns Ari noticed" : `What ${expert}'s week taught Ari`}</h2>
            <p className="text-xs text-zinc-500">
              {isExpert
                ? `Only visible across the whole week. ${open.length} question${open.length === 1 ? "" : "s"} waiting for you.`
                : "Things you'd only learn after weeks on the job."}
            </p>
          </div>
        </div>
        {isExpert && open.length > 0 && (
          <button
            data-ari="week-ask-me"
            onClick={() => ask(open[0])}
            className="ari-lift inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-white shadow-md shadow-ari-500/30 ari-gradient"
          >
            <MessageCircleQuestion className="h-4 w-4" /> Ari, ask me
          </button>
        )}
      </div>
      <div className="ari-stagger grid gap-3 2xl:grid-cols-2">
        {patterns.map((p) => (
          <PatternCard
            key={p.id}
            pattern={p}
            schedule={schedule}
            isExpert={isExpert}
            expert={expert}
            asking={asking === p.id}
            answer={answers[p.id]}
            onAnswer={(a) => {
              answer(p.id, a);
              if (a) setAsking(null);
            }}
            onSpeak={() => ask(p)}
          />
        ))}
      </div>
    </section>
  );
}

function PatternCard({
  pattern: p,
  schedule,
  isExpert,
  expert,
  asking,
  answer,
  onAnswer,
  onSpeak,
}: {
  pattern: DetectedPattern;
  schedule: ScheduleItem[];
  isExpert: boolean;
  expert: string;
  asking: boolean;
  answer?: PatternAnswer;
  onAnswer: (a: PatternAnswer | null) => void;
  onSpeak: () => void;
}) {
  const [correcting, setCorrecting] = useState(false);
  const [text, setText] = useState("");
  const kind = KIND_LABEL[p.kind];
  const KindIcon = p.kind === "trend" && p.summary.includes(" rises ") ? TrendingUp : kind.icon;
  const bars = barsFor(p, schedule);

  return (
    <article
      data-ari={`pattern-${p.id}`}
      className={`rounded-2xl border bg-white p-4 shadow-sm transition-all ${asking ? "border-ari-300 ring-4 ring-ari-100" : "border-zinc-200/70"}`}
    >
      <div className="flex items-start gap-3">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white ${kind.tone}`}>
          <KindIcon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold uppercase tracking-wide text-zinc-400">{kind.label}</span>
            <LevelBadge level={p.level} />
            <span className="text-zinc-400">{Math.round(p.confidence * 100)}% sure</span>
          </div>
          <p className="mt-1 font-semibold leading-snug text-zinc-900">{p.summary}</p>
        </div>
        <button onClick={onSpeak} className="rounded-lg p-1.5 text-zinc-400 hover:bg-ari-50 hover:text-ari-600" title="Hear Ari say it" aria-label="Hear Ari say it">
          <Volume2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-4">
        <div className="flex flex-1 flex-wrap gap-1.5">
          {p.evidence.map((e) => (
            <span key={e} className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${e.startsWith('"') ? "bg-zinc-50 italic text-zinc-600 ring-zinc-200" : "bg-ari-50 text-ari-700 ring-ari-100"}`}>
              {e}
            </span>
          ))}
        </div>
        {bars && <MiniBars bars={bars} />}
      </div>

      {isExpert ? (
        <div className="mt-3 rounded-xl bg-gradient-to-br from-ari-50 to-white p-3 ring-1 ring-ari-100">
          <p className="flex items-start gap-2 text-sm text-zinc-800">
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-white ari-gradient">
              <Sparkles className="h-3 w-3" />
            </span>
            <span>{p.question}</span>
          </p>
          {answer ? (
            <div className={`ari-rise mt-2 flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm ${answer.verdict === "yes" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}>
              {answer.verdict === "yes" ? <Check className="h-4 w-4" /> : <Lightbulb className="h-4 w-4" />}
              <span className="flex-1">{answer.verdict === "yes" ? "You confirmed it. Ari will teach it this way." : `You said: "${answer.text}"`}</span>
              <button onClick={() => onAnswer(null)} className="text-xs text-zinc-500 hover:text-zinc-800" title="Answer again">
                <Undo2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : correcting ? (
            <form
              className="ari-rise mt-2 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!text.trim()) return;
                onAnswer({ verdict: "no", text: text.trim() });
                setCorrecting(false);
              }}
            >
              <input
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="No, it's because…"
                className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-ari-400 focus:ring-2 focus:ring-ari-100"
              />
              <button className="rounded-lg px-3 py-1.5 text-sm font-semibold text-white ari-gradient">Save</button>
              <button type="button" onClick={() => setCorrecting(false)} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100" aria-label="Cancel">
                <X className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                data-ari={`pattern-yes-${p.id}`}
                onClick={() => onAnswer({ verdict: "yes" })}
                className="ari-lift inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm shadow-emerald-500/30"
              >
                <Check className="h-4 w-4" /> Yes, that&apos;s why
              </button>
              <button
                data-ari={`pattern-no-${p.id}`}
                onClick={() => setCorrecting(true)}
                className="ari-lift inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-zinc-700 ring-1 ring-zinc-200"
              >
                No, it&apos;s…
              </button>
            </div>
          )}
        </div>
      ) : (
        p.advice && (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <span>
              <span className="font-semibold">For you: </span>
              {p.advice}
              {answer?.verdict === "yes" && <span className="ml-1 text-emerald-700">({expert} confirmed)</span>}
            </span>
          </div>
        )
      )}
    </article>
  );
}

type Bar = { day: Weekday; value: number; label: string; best?: boolean };

// Trends: the metric per day. By-weekday: the block's length per day.
function barsFor(p: DetectedPattern, schedule: ScheduleItem[]): Bar[] | null {
  if (p.kind === "trend" && p.series?.length) {
    return WEEKDAYS.flatMap((d) => {
      const s = p.series!.find((x) => x.day === d);
      return s ? [{ day: d, value: s.value, label: `${s.value}${s.unit === "%" ? "%" : ""}`, best: d === p.bestDay }] : [];
    });
  }
  if (p.kind === "by-weekday") {
    const items = schedule.filter((s) => p.itemIds.includes(s.id));
    const max = Math.max(...items.map((s) => s.minutes));
    return WEEKDAYS.flatMap((d) => {
      const s = items.find((x) => x.day === d);
      return s ? [{ day: d, value: s.minutes, label: `${s.minutes}m`, best: s.minutes === max }] : [];
    });
  }
  return null;
}

function MiniBars({ bars }: { bars: Bar[] }) {
  const max = Math.max(1, ...bars.map((b) => b.value));
  return (
    <div className="flex items-end gap-1.5" aria-label="Values by day">
      {bars.map((b) => (
        <div key={b.day} className="flex w-8 flex-col items-center gap-0.5">
          <span className={`text-[10px] font-semibold tabular-nums ${b.best ? "text-ari-700" : "text-zinc-400"}`}>{b.label}</span>
          <div className="flex h-12 w-5 items-end rounded-md bg-zinc-50">
            <div
              className={`w-full rounded-md transition-all ${b.best ? "ari-gradient" : b.value === 0 ? "bg-zinc-200" : "bg-ari-200"}`}
              style={{ height: `${Math.max(6, (b.value / max) * 100)}%` }}
            />
          </div>
          <span className="text-[10px] font-medium text-zinc-500">{b.day}</span>
        </div>
      ))}
    </div>
  );
}
