// The pop-up that lands near the top of the story stage after Maria answers:
// what she said, how strongly the next person should follow it, and the
// knowledge it rests on. Pure presentational: the story director decides
// when to show it; onDone fires when the countdown runs out.
import { BookOpen, FileWarning, Lightbulb, Palette, Quote, ShieldAlert, Sparkles, type LucideIcon } from "lucide-react";
import { levelOf, type Level } from "@/lib/apprentice/reasonTypes";
import { isUnwritten } from "@/lib/apprentice/teach";
import type { DecisionCard } from "@/lib/apprentice/types";
import s from "./storyUi.module.css";

const LEVEL: Record<Exclude<Level, "unknown">, { label: string; icon: LucideIcon; badge: string; glow: string; bar: string }> = {
  must: { label: "Must follow", icon: ShieldAlert, badge: "bg-rose-50 text-rose-700 ring-rose-200", glow: "shadow-rose-500/25", bar: "from-rose-500 to-coral-500" },
  advice: { label: "Strong advice", icon: Lightbulb, badge: "bg-amber-50 text-amber-800 ring-amber-200", glow: "shadow-amber-500/25", bar: "from-amber-400 to-coral-400" },
  choice: { label: "Your choice", icon: Palette, badge: "bg-emerald-50 text-emerald-700 ring-emerald-200", glow: "shadow-emerald-500/25", bar: "from-emerald-400 to-sky-400" },
};

export type KnowledgePopupProps = {
  card: DecisionCard;
  speaker?: string; // who said it (default "Maria")
  durationMs?: number; // countdown length (default 5000); 0 hides the countdown
  onDone?: () => void; // the countdown ran out
  leaving?: boolean; // play the exit animation (unmount after ~320ms)
  className?: string; // positioning; defaults to top centre of a positioned parent
};

export function KnowledgePopup({
  card,
  speaker = "Maria",
  durationMs = 5000,
  onDone,
  leaving = false,
  className = "absolute left-1/2 top-8 z-50 -translate-x-1/2",
}: KnowledgePopupProps) {
  const reason = card.reason;
  const levelKey = reason ? levelOf(reason.types) : "unknown";
  const level = levelKey === "unknown" ? null : LEVEL[levelKey];
  const unwritten = isUnwritten(card);
  const knowledge = card.knowledge ?? [];

  return (
    <div className={`pointer-events-none w-[560px] ${className}`} role="status" aria-live="polite" data-ari="knowledge-popup">
      <div
        key={card.id}
        className={`${leaving ? s.popOut : s.popIn} pointer-events-auto relative overflow-hidden rounded-[28px] bg-white/95 shadow-2xl ring-1 ring-ari-100 backdrop-blur ${level?.glow ?? "shadow-ari-500/25"}`}
      >
        {/* gradient rim + one sweep of light */}
        <div className="h-1.5 ari-gradient-animated" />
        <div className={`${s.shine} pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-white/60 to-transparent`} />

        {unwritten && (
          <div data-ari="popup-unwritten" className={`${s.ribbon} flex items-center gap-2 bg-gradient-to-r from-rose-500 via-coral-500 to-amber-400 px-5 py-2 text-xs font-bold uppercase tracking-widest text-white`}>
            <FileWarning className="h-4 w-4" /> Unwritten rule
            <span className="font-medium normal-case tracking-normal text-white/85">· not in the procedure</span>
          </div>
        )}

        <div className={`${s.stagger} space-y-3.5 px-6 pb-5 pt-4`}>
          {/* who said it */}
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 to-coral-500 text-white shadow-md shadow-coral-500/30">
              <Quote className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-zinc-900">{speaker} explained</p>
              <p className="truncate text-xs text-zinc-500">{card.title}</p>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-ari-50 px-2.5 py-1 text-[11px] font-semibold text-ari-700">
              <Sparkles className="h-3.5 w-3.5" /> Ari learned
            </span>
          </div>

          {/* the reason, in her words */}
          <p className="text-[19px] font-medium leading-snug text-zinc-900">
            <span className="ari-gradient-text text-2xl font-black leading-none">&ldquo;</span>
            {reason?.text ?? "No reason given yet."}
            <span className="ari-gradient-text text-2xl font-black leading-none">&rdquo;</span>
          </p>

          {/* level + reason types */}
          {(level || (reason && reason.types.length > 0)) && (
            <div className="flex flex-wrap items-center gap-1.5">
              {level && (
                <span data-ari="popup-level" className={`${s.stamp} inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ring-1 ${level.badge}`}>
                  <level.icon className="h-3.5 w-3.5" /> {level.label}
                </span>
              )}
              {reason?.types.map((t) => (
                <span key={t} className="rounded-full bg-zinc-50 px-2.5 py-1 text-xs text-zinc-600 ring-1 ring-zinc-200">
                  {t.toLowerCase()}
                </span>
              ))}
            </div>
          )}

          {/* what it rests on, and where the next person finds it */}
          {knowledge.length > 0 && (
            <div className="space-y-1.5 rounded-2xl bg-sky-50/80 p-3 ring-1 ring-sky-100">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-sky-700">
                <BookOpen className="h-3.5 w-3.5" /> Knowledge behind this
              </p>
              {knowledge.map((k) => (
                <p key={k.text} className="flex flex-wrap items-center gap-1.5 text-sm text-sky-950">
                  {k.text}
                  <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-sky-700 ring-1 ring-sky-200">
                    <BookOpen className="h-3 w-3" /> {k.source}
                  </span>
                </p>
              ))}
            </div>
          )}
        </div>

        {durationMs > 0 && (
          <div className="h-1 bg-zinc-100">
            <div
              key={`${card.id}-${durationMs}`}
              className={`${s.countdown} h-full bg-gradient-to-r ${level?.bar ?? "from-ari-500 to-coral-500"}`}
              style={{ animationDuration: `${durationMs}ms` }}
              onAnimationEnd={() => onDone?.()}
            />
          </div>
        )}
      </div>
    </div>
  );
}
