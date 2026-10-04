// A no-network Judge. It reasons like someone who knows the written procedure
// and nothing else about this expert, which is exactly when Ari should ask.
// Used until the Claude-backed Judge is configured.
import { lateDeliveries, quoteFor, vendor } from "@/lib/northwind/seed";
import { describeAttention, formatDwell, READING_MS } from "@/lib/gaze/attention";
import type { DecisionCard, JudgeCall, JudgeContext, JudgeResult, KnowledgeItem, KnowledgeSource } from "./types";

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

function cheapest(requestId: string, vendorIds: string[]) {
  return [...vendorIds].sort((a, b) => (quoteFor(a, requestId)?.total ?? Infinity) - (quoteFor(b, requestId)?.total ?? Infinity))[0];
}

function predicted(card: DecisionCard) {
  return card.prediction?.correct ? ["Ari predicted it"] : [];
}

// Eye tracking, when it's on: what the expert read before deciding.
function looked(context: JudgeContext) {
  const text = describeAttention(context.attention ?? [], 2);
  return text ? [text] : [];
}

const firstWord = (name: string | undefined) => name?.split(" ")[0] ?? "";

function assess(card: DecisionCard, context: JudgeContext): Extract<JudgeResult, { kind: "assess" }> {
  const chosen = card.options.find((o) => o.id === card.chosen)!;
  const understood = (explanation: string, evidence: string[], types: string[], confidence = 0.9, matters = true) => ({
    kind: "assess" as const, explanation, evidence: [...evidence, ...predicted(card), ...looked(context)], confidence, matters, question: "", types,
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
      // Eye tracking: a long read of the cheaper vendor's late deliveries is a
      // strong hint, but Ari still checks, with a sharper question.
      const read = context.attention?.find((r) => r.target === `history-panel-${best}`);
      if (read && read.ms >= READING_MS && lateDeliveries(best).length) {
        const [cheaper, picked] = [firstWord(vendor(best)?.name), firstWord(vendor(card.chosen)?.name)];
        return {
          kind: "assess",
          explanation: `Probably ${cheaper}'s late deliveries: they were read for ${formatDwell(read.ms)} before picking ${picked}.`,
          evidence: [`Read ${read.label} (${formatDwell(read.ms)})`, ...predicted(card)],
          confidence: 0.6,
          matters: true,
          question: `You spent a while on ${cheaper}'s late deliveries: is that why you picked ${picked}?`,
          types: ["Lesson learned"],
        };
      }
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
    case "scoring":
      // A typed number with no visible source: Ari can't know where it came from.
      return puzzled("Where does that number come from?");
    default:
      return understood("Done as the procedure says.", card.procedureRef ? [`procedure ${card.procedureRef}`] : [], ["Company policy"], 0.95, false);
  }
}

const KEYWORDS: [RegExp, string][] = [
  [/late|delay|last (time|year)|went wrong|burn(ed|t)|never again/i, "Lesson learned"],
  [/deadline|friday|monday|urgent|asap|by (mon|tues|wednes|thurs|fri)day|in time/i, "Time or deadline"],
  [/always|rule|we never|has to|must|not written|unwritten/i, "Team convention"],
  [/polic(y|ies)|compan(y|ies) says|required/i, "Company policy"],
  [/formula|%|percent|weight(ed|ing)/i, "Company-specific method"],
  [/cheap|budget|cost|expensive/i, "Budget"],
  [/safe|risk|careful/i, "Risk avoidance"],
  [/prefer|like (them|it)|my style|just feel|taste/i, "Personal preference"],
  [/habit|just how i do it/i, "Habit"],
];

const SOURCES: [RegExp, KnowledgeSource][] = [
  [/textbook|course|online|google|website|youtube/i, "Online or public"],
  [/manual|onboarding|handbook|procedure doc|written in/i, "Company document"],
  [/system|database|drive|erp|spreadsheet tool/i, "Company system"],
  [/everyone knows|obvious|basic/i, "Already a given"],
  [/told|showed me|learned from|nobody wrote|not written|formula|finance|someone/i, "Told by a person"],
];

export function knowledgeFrom(answer: string): KnowledgeItem[] {
  const source = SOURCES.find(([re]) => re.test(answer))?.[1] ?? "Told by a person";
  return [{ text: answer, source }];
}

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
    case "classify": {
      const types = classifyAnswer(call.answer);
      // "I just like them better" could be experience or taste; that changes
      // what the next person should do, so it's worth one gentle follow-up.
      const vague = types.length === 1 && (types[0] === "No clear reason yet" || (types[0] === "Personal preference" && /just|better|like/i.test(call.answer)));
      const followUp = vague
        ? `Is that from past experience${call.card.stepId === "vendor" ? " with them" : ""}, or personal taste?`
        : undefined;
      const knowledge = call.card.stepId === "scoring" ? knowledgeFrom(call.answer) : undefined;
      return { kind: "classify", types, summary: call.answer, followUp, knowledge };
    }
  }
}
