import { BookOpen, Check, CircleCheck, Circle, CircleX, Eye, FileWarning, Lightbulb, Palette, Quote, ShieldAlert, Sparkles, type LucideIcon } from "lucide-react";
import { levelOf, type Level } from "@/lib/apprentice/reasonTypes";
import { isUnwritten } from "@/lib/apprentice/teach";
import { SourcedKnowledge } from "@/components/context/SourcedKnowledge";
import type { DecisionCard, KnowledgeItem, OptionStatus, Reason } from "@/lib/apprentice/types";

const LEVEL: Record<Level, { label: string; icon: LucideIcon; className: string } | null> = {
  must: { label: "Must follow", icon: ShieldAlert, className: "bg-rose-50 text-rose-700 ring-rose-200" },
  advice: { label: "Strong advice", icon: Lightbulb, className: "bg-amber-50 text-amber-800 ring-amber-200" },
  choice: { label: "Your choice", icon: Palette, className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  unknown: null,
};

const STATUS_NOTE: Record<OptionStatus, string> = {
  procedure: "per procedure",
  allowed: "",
  against: "against procedure",
};

export function DecisionCards({
  cards,
  title = "What Ari has learned",
  activeStep = null,
}: {
  cards: DecisionCard[];
  title?: string;
  activeStep?: string | null;
}) {
  return (
    <section>
      <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
        <Sparkles className="h-3.5 w-3.5 text-ari-500" /> {title}
      </h2>
      {cards.length === 0 ? (
        <div className="mt-3 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-ari-200 bg-white/60 px-4 py-8 text-center">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-ari-50 text-ari-500">
            <Eye className="h-5 w-5 animate-pulse" />
          </span>
          <p className="text-sm text-zinc-500">Ari is watching. Each decision you make will appear here.</p>
        </div>
      ) : (
        <ol data-ari="decision-cards" className="mt-3 space-y-3">
          {cards.map((card) => (
            <li
              key={card.id}
              data-ari={`card-${card.stepId}`}
              className={`ari-new-card overflow-hidden rounded-2xl border bg-white text-sm shadow-sm transition-all ${
                card.stepId === activeStep ? "border-ari-400 ring-4 ring-ari-100" : "border-zinc-200/70"
              }`}
            >
              {isUnwritten(card) && (
                <div data-ari="unwritten" className="flex items-center gap-1.5 bg-gradient-to-r from-rose-500 to-coral-500 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white">
                  <FileWarning className="h-3.5 w-3.5" /> Unwritten rule · not in the procedure
                </div>
              )}
              <div className="p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-zinc-900">{card.title}</span>
                  {card.prediction && (
                    <span
                      title={card.prediction.correct ? "Ari predicted this" : "Ari didn't predict this"}
                      className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        card.prediction.correct ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {card.prediction.correct ? <Check className="h-3 w-3" /> : <CircleX className="h-3 w-3" />}
                      {card.prediction.correct ? "Predicted" : "Surprised Ari"}
                    </span>
                  )}
                </div>
                <ul className="mt-2 space-y-1">
                  {card.options.map((o) => {
                    const chosen = o.id === card.chosen;
                    return (
                      <li key={o.id} className={`flex items-start gap-1.5 ${chosen ? "font-medium text-zinc-900" : "text-zinc-400"}`}>
                        {chosen ? <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-ari-600" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0" />}
                        <span>
                          {o.label}
                          {STATUS_NOTE[o.status] && <span className="ml-1 text-xs font-normal text-zinc-400">({STATUS_NOTE[o.status]})</span>}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                {card.question && !card.reason && (
                  <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-ari-50 px-2.5 py-1.5 text-xs text-ari-700">
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Ari asked: &ldquo;{card.question}&rdquo;
                  </p>
                )}
                {card.reason && <ReasonView reason={card.reason} />}
                {card.knowledge && card.knowledge.length > 0 && <KnowledgeView items={card.knowledge} />}
                <SourcedKnowledge stepId={card.stepId} withHeader={!card.knowledge?.length} />
                {card.howNotes.length > 0 && (
                  <ul data-ari="how-notes" className="mt-2 space-y-0.5 border-l-2 border-zinc-100 pl-2 text-xs text-zinc-500">
                    {card.howNotes.map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                )}
                {card.procedureRef && <p className="mt-2 text-[11px] font-medium text-zinc-400">Procedure {card.procedureRef}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function ReasonView({ reason }: { reason: Reason }) {
  const fromExpert = reason.source === "expert";
  const level = LEVEL[levelOf(reason.types)];
  return (
    <div data-ari="reason" data-source={reason.source} className={`mt-2.5 rounded-xl p-2.5 ${fromExpert ? "bg-zinc-50" : "bg-ari-50/60"}`}>
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {fromExpert ? <Quote className="h-3.5 w-3.5 text-coral-500" /> : <Sparkles className="h-3.5 w-3.5 text-ari-500" />}
        {fromExpert ? "In their words" : "Ari's own explanation"}
      </p>
      <p className="mt-1 text-zinc-800">{fromExpert ? <q>{reason.text}</q> : reason.text}</p>
      {reason.types.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {level && (
            <span data-ari="level" className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ${level.className}`}>
              <level.icon className="h-3 w-3" /> {level.label}
            </span>
          )}
          {reason.types.map((t) => (
            <span key={t} className="rounded-full bg-white px-2 py-0.5 text-[11px] text-zinc-500 ring-1 ring-zinc-200">
              {t.toLowerCase()}
            </span>
          ))}
        </div>
      )}
      {!fromExpert && reason.evidence.length > 0 && <p className="mt-1.5 text-xs text-zinc-500">Evidence: {reason.evidence.join(" · ")}</p>}
      {!fromExpert && reason.confidence !== undefined && (
        <div className="mt-1.5 flex items-center gap-2 text-[11px] text-zinc-400" title="How sure Ari is">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200">
            <div className="h-1.5 rounded-full ari-gradient transition-all duration-700" style={{ width: `${Math.round(reason.confidence * 100)}%` }} />
          </div>
          {Math.round(reason.confidence * 100)}% sure
        </div>
      )}
      {!fromExpert && !reason.confirmed && <p className="mt-1 text-[11px] italic text-zinc-400">Best guess, not confirmed</p>}
    </div>
  );
}

function KnowledgeView({ items }: { items: KnowledgeItem[] }) {
  return (
    <div data-ari="knowledge" className="mt-2.5 rounded-xl bg-sky-50 p-2.5 text-xs">
      <p className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-sky-700">
        <BookOpen className="h-3.5 w-3.5" /> Knowledge behind this
      </p>
      {items.map((k) => (
        <p key={k.text} className="mt-1 text-sky-950">
          {k.text}{" "}
          <span className="whitespace-nowrap rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-sky-700 ring-1 ring-sky-200">{k.source}</span>
        </p>
      ))}
    </div>
  );
}
