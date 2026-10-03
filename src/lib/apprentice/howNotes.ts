// How the expert worked, noticed from timestamps alone, without asking.
import { person, vendor } from "@/lib/northwind/seed";
import type { TimedEvent } from "@/lib/workspace/events";
import type { DecisionCard, StepId } from "./types";

const LONG_PAUSE_MS = 8_000;
const PROCEDURE_ORDER: StepId[] = ["quotes", "vendor", "approval", "po"];
const STEP_NAMES: Record<StepId, string> = {
  quotes: "Get quotes",
  vendor: "Pick a vendor",
  scoring: "Score vendors",
  approval: "Approval",
  po: "Issue the purchase order",
};

function optionName(card: DecisionCard, optionId: string) {
  if (card.stepId === "vendor") return vendor(optionId)?.name ?? optionId;
  return card.options.find((o) => o.id === optionId)?.label ?? optionId;
}

export function howNotes(card: DecisionCard, cards: DecisionCard[], history: TimedEvent[]): string[] {
  const notes: string[] = [];
  const earlier = cards.filter((c) => c.at < card.at);
  const windowStart = Math.max(-Infinity, ...earlier.filter((c) => c.requestId === card.requestId).map((c) => c.at));
  const nextCardAt = Math.min(Infinity, ...cards.filter((c) => c.at > card.at).map((c) => c.at));

  // 1. Pause right before the decision.
  const before = history.filter((e) => e.at < card.at);
  const last = before[before.length - 1];
  if (last && card.at - last.at >= LONG_PAUSE_MS) notes.push(`Paused ${Math.round((card.at - last.at) / 1000)}s before choosing`);

  // 2. What she checked first.
  for (const { event, at } of history) {
    if (at <= windowStart || at >= card.at) continue;
    let note: string | null = null;
    if (event.type === "delivery_history_opened") note = `Opened ${vendor(event.vendorId)?.name}'s delivery history before deciding`;
    if (event.type === "screen_opened" && event.screen === "procedure") note = "Checked the written procedure before deciding";
    if (event.type === "screen_opened" && event.screen === "scoring") note = "Looked at the scoring sheet before deciding";
    if (note && !notes.includes(note)) notes.push(note);
  }

  // 3. Who she contacted after this decision, before the next one.
  for (const { event, at } of history) {
    if (event.type !== "message_sent" || at < card.at || at >= nextCardAt) continue;
    const p = person(event.to);
    notes.push(`${event.channel === "email" ? "Emailed" : "Messaged"} ${p?.name ?? event.to} (${p?.role ?? ""}): "${event.text}"`);
  }

  // 4. Steps done in a different order from the procedure.
  const position = PROCEDURE_ORDER.indexOf(card.stepId);
  for (const step of PROCEDURE_ORDER.slice(0, Math.max(position, 0))) {
    const done = earlier.some((c) => c.requestId === card.requestId && c.stepId === step);
    if (!done) notes.push(`Did this before "${STEP_NAMES[step]}" (the procedure has that first)`);
  }

  // 5. Changes of mind.
  if (card.previousChoices.length) {
    const [first, ...rest] = [...card.previousChoices, card.chosen].map((id) => optionName(card, id));
    notes.push(`Selected ${first}, then switched to ${rest.join(", then ")}`);
  }

  return notes;
}
