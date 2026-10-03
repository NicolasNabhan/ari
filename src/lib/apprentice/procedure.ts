// Compiles what Ari learned into a step-by-step procedure for the tutor agent
// (the text of an ElevenLabs Procedure).
import { levelOf } from "./reasonTypes";
import { isUnwritten } from "./teach";
import type { DecisionCard, Lessons, StepId } from "./types";

const ORDER: StepId[] = ["quotes", "vendor", "scoring", "approval", "po"];
const TITLES: Record<StepId, string> = {
  quotes: "Get quotes",
  vendor: "Pick a vendor",
  scoring: "Score the vendors",
  approval: "Approval",
  po: "Issue the purchase order",
};

export type CompiledProcedure = { name: string; steps: { title: string; instructions: string[] }[]; text: string };

function reasonLine(card: DecisionCard): string | null {
  const r = card.reason;
  if (!r) return null;
  const label = { must: isUnwritten(card) ? "MUST FOLLOW (unwritten)" : "MUST FOLLOW", advice: "STRONG ADVICE", choice: "YOUR CHOICE (personal style)", unknown: "REASON" }[
    levelOf(r.types)
  ];
  return `${label}: ${r.text}${r.source === "ari" && !r.confirmed ? " (Ari's guess, not confirmed)" : ""}`;
}

export function compileProcedure(lessons: Lessons): CompiledProcedure {
  const steps = ORDER.flatMap((stepId) => {
    const card = lessons.cards.find((c) => c.stepId === stepId);
    if (!card) return [];
    const chosen = card.options.find((o) => o.id === card.chosen)?.label ?? card.chosen;
    const instructions = [
      `Usual options: ${card.options.map((o) => o.label).join("; ")}.`,
      `${lessons.expert} chose: ${chosen}.`,
      reasonLine(card),
      ...(card.knowledge ?? []).map((k) => `Knowledge: ${k.text}. Source: ${k.source.toLowerCase()}.`),
      card.howNotes.length ? `How ${lessons.expert} worked: ${card.howNotes.join("; ")}.` : null,
    ].filter((x): x is string => !!x);
    return [{ title: TITLES[stepId], instructions }];
  });
  const name = `Purchase request, the way ${lessons.expert} does it`;
  const text = [`# ${name}`, ...steps.map((s, i) => `${i + 1}. ${s.title}\n${s.instructions.map((x) => `   - ${x}`).join("\n")}`)].join("\n");
  return { name, steps, text };
}
