// A no-network Judge. It reasons like someone who knows the written procedure
// and nothing else about this expert, which is exactly when Ari should ask.
// Used until the Claude-backed Judge is configured.
import { quoteFor, vendor } from "@/lib/northwind/seed";
import type { DecisionCard, JudgeCall, JudgeContext, JudgeResult } from "./types";

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

function cheapest(requestId: string, vendorIds: string[]) {
  return [...vendorIds].sort((a, b) => (quoteFor(a, requestId)?.total ?? Infinity) - (quoteFor(b, requestId)?.total ?? Infinity))[0];
}

function predicted(card: DecisionCard) {
  return card.prediction?.correct ? ["Ari predicted it"] : [];
}

function assess(card: DecisionCard, context: JudgeContext): Extract<JudgeResult, { kind: "assess" }> {
  const chosen = card.options.find((o) => o.id === card.chosen)!;
  const understood = (explanation: string, evidence: string[], types: string[], confidence = 0.9, matters = true) => ({
    kind: "assess" as const, explanation, evidence: [...evidence, ...predicted(card)], confidence, matters, question: "", types,
  });
  const puzzled = (question: string) => ({
    kind: "assess" as const, explanation: "", evidence: predicted(card), confidence: 0.35, matters: true, question, types: [],
  });

  switch (card.stepId) {
    case "quotes":
      return chosen.status === "procedure"
        ? understood("Follows the procedure: at least 3 quotes for purchases over $5,000.", [`follows procedure ${card.procedureRef}`], ["Company policy"])
        : puzzled("The procedure asks for 3 quotes here. Why fewer?");
    case "vendor": {
      const best = cheapest(card.requestId, card.options.map((o) => o.id));
      if (card.chosen === best) return understood("Picked the lowest quote.", ["lowest quote"], ["Budget"], 0.85);
      return puzzled(`Why ${vendor(card.chosen)?.name} over the cheaper ${vendor(best)?.name}?`);
    }
    case "approval": {
      if (chosen.status === "procedure") return understood("Routed as the procedure says for this amount.", [`procedure ${card.procedureRef}`], ["Company policy"]);
      const vendorCard = context.cards.find((c) => c.requestId === card.requestId && c.stepId === "vendor");
      const amount = vendorCard && quoteFor(vendorCard.chosen, card.requestId)?.total;
      const who = card.chosen === "cfo" ? "the CFO" : card.chosen === "manager" ? "your manager" : "yourself";
      return chosen.status === "against"
        ? puzzled(`That goes against the procedure. Why approve it ${who === "yourself" ? "yourself" : `through ${who}`}?`)
        : puzzled(`The procedure doesn't require that${amount ? ` for ${usd(amount)}` : ""}. Why send it to ${who}?`);
    }
    default:
      return understood("Done as the procedure says.", card.procedureRef ? [`procedure ${card.procedureRef}`] : [], ["Company policy"], 0.95, false);
  }
}

const KEYWORDS: [RegExp, string][] = [
  [/late|delay|last (time|year)|went wrong|burn(ed|t)|never again/i, "Lesson learned"],
  [/deadline|friday|monday|urgent|asap|by (mon|tues|wednes|thurs|fri)day|in time/i, "Time or deadline"],
  [/always|rule|we never|has to|must|not written|unwritten/i, "Team convention"],
  [/polic(y|ies)|compan(y|ies) says|required/i, "Company policy"],
  [/cheap|budget|cost|price|expensive/i, "Budget"],
  [/safe|risk|careful/i, "Risk avoidance"],
  [/prefer|i like|my style|just feel|taste/i, "Personal preference"],
];

export function classifyAnswer(answer: string): string[] {
  const types = KEYWORDS.filter(([re]) => re.test(answer)).map(([, t]) => t);
  return types.length ? types : ["No clear reason yet"];
}

export function ruleJudge(call: JudgeCall): JudgeResult {
  switch (call.kind) {
    case "predict": {
      if (call.stepId === "vendor") return { kind: "predict", optionId: cheapest(call.requestId, call.options.map((o) => o.id)) };
      const byProcedure = call.options.find((o) => o.status === "procedure") ?? call.options[0];
      return { kind: "predict", optionId: byProcedure.id };
    }
    case "assess":
      return assess(call.card, call.context);
    case "classify":
      return { kind: "classify", types: classifyAnswer(call.answer), summary: call.answer };
  }
}
