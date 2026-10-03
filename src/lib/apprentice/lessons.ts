// Turning a finished expert session into lessons Ari can teach from,
// including the must-follow rules it should check before a newcomer acts.
import { isUnwritten } from "./teach";
import { levelOf } from "./reasonTypes";
import { request } from "./normalMap";
import type { CoreState, DecisionCard, Guardrail, Lessons } from "./types";

const OPTION_WORDS: Record<string, string> = { cfo: "the CFO", manager: "your manager", self: "you" };
const OPTION_WORDS_ES: Record<string, string> = { cfo: "al director financiero", manager: "a tu responsable", self: "a ti" };

// "25k", "$25,000", "25000" → 25000
export function amountIn(text: string): number | null {
  const m = text.match(/\$?\s?(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)\s?(k\b)?/i);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ""));
  return m[2] ? n * 1000 : n;
}

const usdShort = (n: number) => (n % 1000 === 0 ? `$${n / 1000}k` : `$${n.toLocaleString("en-US")}`);

// Must-follow approval rules the expert stated, in a form Ari can check.
export function deriveGuardrails(cards: DecisionCard[], expert: string): Guardrail[] {
  return cards.flatMap((card): Guardrail[] => {
    if (card.stepId !== "approval" || !card.reason || card.reason.source !== "expert") return [];
    if (levelOf(card.reason.types) !== "must") return [];
    const minAmount = amountIn(card.reason.text);
    if (minAmount === null) return [];
    const onlyNewSuppliers = /\bnew\b/i.test(card.reason.text);
    const who = OPTION_WORDS[card.chosen] ?? card.chosen;
    const subject = onlyNewSuppliers ? "New suppliers" : "Purchases";
    return [
      {
        id: card.id,
        text: card.reason.text,
        warning: `Wait. ${subject} over ${usdShort(minAmount)} go to ${who} first. That's ${expert}'s rule.`,
        warningEs: `Espera. ${onlyNewSuppliers ? "Los proveedores nuevos" : "Las compras"} de más de ${minAmount.toLocaleString("es-ES")} dólares van primero ${
          OPTION_WORDS_ES[card.chosen] ?? card.chosen
        }. Es la regla de ${expert}.`,
        step: "approval",
        requiredOption: card.chosen,
        minAmount,
        onlyNewSuppliers,
        unwritten: isUnwritten(card),
      },
    ];
  });
}

export function lessonsFrom(state: CoreState): Lessons | null {
  const cards = state.cardOrder.map((id) => state.cards[id]);
  if (!cards.length || !state.profile) return null;
  const requestId = state.task?.requestId ?? cards[0].requestId;
  const forRequest = cards.filter((c) => c.requestId === requestId);
  return {
    expert: state.profile.name,
    requestSubject: request(requestId)?.subject ?? requestId,
    cards: forRequest,
    guardrails: deriveGuardrails(forRequest, state.profile.name),
  };
}
