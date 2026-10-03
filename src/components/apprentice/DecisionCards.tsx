import type { DecisionCard, OptionStatus } from "@/lib/apprentice/types";

const STATUS_NOTE: Record<OptionStatus, string> = {
  procedure: "per procedure",
  allowed: "",
  against: "against procedure",
};

export function DecisionCards({ cards }: { cards: DecisionCard[] }) {
  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">What Ari has learned</h2>
      {cards.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-400">Ari is watching. Decisions will appear here.</p>
      ) : (
        <ol data-ari="decision-cards" className="mt-2 space-y-3">
          {cards.map((card) => (
            <li key={card.id} data-ari={`card-${card.stepId}`} className="rounded-xl border bg-white p-3 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
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
