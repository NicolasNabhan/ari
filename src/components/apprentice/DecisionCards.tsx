import type { DecisionCard, OptionStatus, Reason } from "@/lib/apprentice/types";

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
      <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{title}</h2>
      {cards.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-400">Ari is watching. Decisions will appear here.</p>
      ) : (
        <ol data-ari="decision-cards" className="mt-2 space-y-3">
          {cards.map((card) => (
            <li
              key={card.id}
              data-ari={`card-${card.stepId}`}
              className={`rounded-xl border bg-white p-3 text-sm shadow-sm dark:bg-zinc-900 ${card.stepId === activeStep ? "border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-900" : "dark:border-zinc-800"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold">{card.title}</span>
                {card.prediction && (
                  <span
                    title={card.prediction.correct ? "Ari predicted this" : "Ari didn't predict this"}
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      card.prediction.correct ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    }`}
                  >
                    {card.prediction.correct ? "✓ predicted" : "✗ didn't predict"}
                  </span>
                )}
              </div>
              <ul className="mt-2 space-y-0.5">
                {card.options.map((o) => {
                  const chosen = o.id === card.chosen;
                  return (
                    <li key={o.id} className={chosen ? "font-medium" : "text-zinc-400 dark:text-zinc-600"}>
                      {chosen ? "● " : "○ "}
                      {o.label}
                      {STATUS_NOTE[o.status] && <span className="ml-1 text-xs text-zinc-400">({STATUS_NOTE[o.status]})</span>}
                    </li>
                  );
                })}
              </ul>
              {card.question && !card.reason && (
                <p className="mt-2 rounded-lg bg-indigo-50 px-2 py-1 text-xs text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  Ari asked: &ldquo;{card.question}&rdquo;
                </p>
              )}
              {card.reason && <ReasonView reason={card.reason} />}
              {card.reason?.source === "ari" && !card.reason.confirmed && (
                <p className="mt-1 text-xs italic text-zinc-400">Ari&rsquo;s best guess, not confirmed</p>
              )}
              {card.howNotes.length > 0 && (
                <ul data-ari="how-notes" className="mt-2 space-y-0.5 text-xs text-zinc-500">
                  {card.howNotes.map((n) => (
                    <li key={n}>· {n}</li>
                  ))}
                </ul>
              )}
              {card.procedureRef && <p className="mt-2 text-xs text-zinc-400">Procedure {card.procedureRef}</p>}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function ReasonView({ reason }: { reason: Reason }) {
  const fromExpert = reason.source === "expert";
  return (
    <div data-ari="reason" data-source={reason.source} className="mt-2 rounded-lg border border-zinc-200 p-2 dark:border-zinc-700">
      <p>
        <span title={fromExpert ? "Maria said this" : "Ari's own explanation"}>{fromExpert ? "🗣" : "🤖"}</span>{" "}
        {fromExpert ? <q>{reason.text}</q> : reason.text}
      </p>
      {reason.types.length > 0 && <p className="mt-1 text-xs text-zinc-500">{reason.types.join(" · ")}</p>}
      {!fromExpert && reason.evidence.length > 0 && <p className="mt-1 text-xs text-zinc-500">Evidence: {reason.evidence.join("; ")}</p>}
      {!fromExpert && reason.confidence !== undefined && (
        <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400" title="How sure Ari is">
          <div className="h-1.5 flex-1 rounded-full bg-zinc-200 dark:bg-zinc-700">
            <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${Math.round(reason.confidence * 100)}%` }} />
          </div>
          {Math.round(reason.confidence * 100)}%
        </div>
      )}
    </div>
  );
}
