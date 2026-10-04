"use client";

import { BookOpen, MessageSquareQuote } from "lucide-react";
import type { StepId } from "@/lib/apprentice/types";
import { citeSource, speakerOf } from "@/lib/context/knowledge";
import { taughtFor, useKnowledge } from "@/lib/context/knowledgeStore";

// On a decision card: the knowledge taught to Ari from meetings and files that
// explains this step, and where it was said or written. Shown under the card's
// own "Knowledge behind this" (or as it, when the card has none).
export function SourcedKnowledge({ stepId, withHeader }: { stepId: StepId; withHeader: boolean }) {
  const linked = taughtFor(useKnowledge(), stepId);
  if (!linked.length) return null;
  return (
    <div data-ari="sourced-knowledge" className={`rounded-xl bg-sky-50 p-2.5 text-xs ${withHeader ? "mt-2.5" : "mt-1.5"}`}>
      {withHeader && (
        <p className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-sky-700">
          <BookOpen className="h-3.5 w-3.5" /> Knowledge behind this
        </p>
      )}
      {linked.map(({ item, source }) => {
        const who = source && speakerOf(item.quote, source);
        const unwritten = source?.kind === "meeting" && item.level === "must";
        return (
          <div key={item.id} className="mt-1.5">
            <p className="text-sky-950">
              {item.text}{" "}
              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-sky-700 ring-1 ring-sky-200">
                {item.source}
                {source && `: ${citeSource(source)}`}
              </span>
            </p>
            {unwritten && source && (
              <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-rose-700">
                <MessageSquareQuote className="h-3 w-3" /> Unwritten rule{who ? `, said by ${who}` : ""} in the {source.title}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
