// Teach mode: turning what Ari learned from the expert into spoken guidance
// for a newcomer, and the must-follow rules it checks before they act.
import { largestOrder, vendor } from "@/lib/northwind/seed";
import type { Profile } from "@/lib/workspace/profile";
import type { WorkspaceEvent } from "@/lib/workspace/events";
import { levelOf } from "./reasonTypes";
import type { DecisionCard, Guardrail, Lessons, StepId } from "./types";

const lcfirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

const STEP_INTRO: Record<StepId, string> = {
  quotes: "First, get quotes.",
  vendor: "Next, pick a vendor.",
  scoring: "Now score the vendors.",
  approval: "Now the approval.",
  po: "Last step: issue the purchase order.",
};

export function intro(profile: Profile, lessons: Lessons): string {
  return `Hi ${profile.name}. I'm Ari. I learned how ${lessons.expert} handles purchase requests, and I'll walk you through it step by step. Open the request in your inbox to start.`;
}

function choiceName(card: DecisionCard) {
  if (card.stepId === "vendor") return vendor(card.chosen)?.name ?? card.chosen;
  return `to ${lcfirst(card.options.find((o) => o.id === card.chosen)?.label ?? card.chosen)}`;
}

export function isUnwritten(card: DecisionCard): boolean {
  const chosen = card.options.find((o) => o.id === card.chosen);
  return !!card.reason && levelOf(card.reason.types) === "must" && chosen?.status !== "procedure";
}

function reasonSentence(card: DecisionCard, expert: string): string {
  const r = card.reason;
  if (!r) return `${expert} didn't say why.`;
  if (r.source === "expert") return `Her reason: "${r.text}"`;
  return `My understanding: ${lcfirst(r.text)}${r.confirmed ? "" : ` That's my best guess, not confirmed by ${expert}.`}`;
}

function levelSentence(card: DecisionCard, expert: string): string {
  if (!card.reason) return "";
  switch (levelOf(card.reason.types)) {
    case "must":
      return isUnwritten(card)
        ? `That isn't in the written procedure. It's ${expert}'s unwritten rule, and you must follow it.`
        : "That's a rule you must follow.";
    case "advice":
      return "That's strong advice from experience, not a hard rule.";
    case "choice":
      return `That's ${expert}'s personal style, so do it your own way.`;
    default:
      return "";
  }
}

export function explainStep(stepId: StepId, lessons: Lessons, quotedVendorIds: string[]): { text: string; highlight?: string } {
  const card = lessons.cards.find((c) => c.stepId === stepId);
  const parts = [STEP_INTRO[stepId]];
  if (stepId === "vendor" && quotedVendorIds.length) {
    const names = quotedVendorIds.map((id) => vendor(id)?.name ?? id);
    parts.push(`Your options are ${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}.`);
  }
  if (card) {
    parts.push(`When ${lessons.expert} did this for "${lessons.requestSubject}", ${lessons.expert} chose ${choiceName(card)}.`);
    parts.push(reasonSentence(card, lessons.expert));
    const level = levelSentence(card, lessons.expert);
    if (level) parts.push(level);
    if (card.howNotes.length) parts.push(`How ${lessons.expert} worked: ${card.howNotes.map((n) => `she ${lcfirst(n)}`).join("; ")}.`);
  }
  const highlight: Partial<Record<StepId, string>> = {
    quotes: "go-to-vendors",
    vendor: quotedVendorIds[0] ? `history-${quotedVendorIds[0]}` : undefined,
    approval: "nav-approvals",
    po: "issue-po",
  };
  return { text: parts.join(" "), highlight: highlight[stepId] };
}

const STEP_WORDS: [RegExp, StepId][] = [
  [/quote/i, "quotes"],
  [/cfo|approv|manager|sign/i, "approval"],
  [/\bpo\b|purchase order|requester|tell/i, "po"],
  [/vendor|supplier|pick|choose|apex|brightline|coreparts|sitwell/i, "vendor"],
];

export function isWhyQuestion(text: string) {
  return /\bwhy\b|how come|por qu[eé]|porqu[eé]/i.test(text);
}

export function answerWhy(text: string, lessons: Lessons, currentStep: StepId | null): string {
  const step = STEP_WORDS.find(([re]) => re.test(text))?.[1] ?? currentStep;
  const card = lessons.cards.find((c) => c.stepId === step);
  if (!card) return `${lessons.expert} didn't do that step in the session I watched, so I don't know yet.`;
  return [`${lessons.expert} chose ${choiceName(card)}.`, reasonSentence(card, lessons.expert), levelSentence(card, lessons.expert)]
    .filter(Boolean)
    .join(" ");
}

// The guardrail an action would break, if any.
export function brokenGuardrail(event: WorkspaceEvent, lessons: Lessons): Guardrail | null {
  if (event.type !== "approval_routed") return null;
  return (
    lessons.guardrails.find(
      (g) =>
        g.step === "approval" &&
        event.to !== g.requiredOption &&
        event.amount > g.minAmount &&
        (!g.onlyNewSuppliers || largestOrder(event.vendorId) <= g.minAmount),
    ) ?? null
  );
}
