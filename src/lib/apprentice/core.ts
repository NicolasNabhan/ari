// The Apprentice Core: everything Ari does, as a pure reducer.
// (state, input) → (state, effects). No network; judgment goes out as
// judge_request effects and comes back as judge_result inputs.
import { northwind } from "@/lib/northwind/seed";
import { howNotes } from "./howNotes";
import { choiceFor, nextStepAfter, request, type Step } from "./normalMap";
import type { CoreEffect, CoreInput, CoreState, DecisionCard, JudgeCall, JudgeContext, TodayTask } from "./types";

// Ari stays quiet only when it's at least this sure of its own explanation.
export const UNDERSTAND_THRESHOLD = 0.7;

type Out = { state: CoreState; effects: CoreEffect[] };

export function initialState(): CoreState {
  return {
    profile: null,
    mode: "expert",
    events: [],
    cards: {},
    cardOrder: [],
    predictions: {},
    pending: {},
    nextRequestId: 1,
    task: null,
    openQuestion: null,
    questionQueue: [],
  };
}

const cardId = (requestId: string, stepId: string) => `${requestId}:${stepId}`;

export function matchTask(text: string): string | null {
  const words = new Set(text.toLowerCase().match(/[a-z]{4,}/g) ?? []);
  let best: { id: string; score: number } | null = null;
  for (const r of northwind.requests) {
    const keys = `${r.subject} ${r.item}`.toLowerCase().match(/[a-z]{4,}/g) ?? [];
    const score = keys.filter((k) => words.has(k) || words.has(k.replace(/s$/, "")) || words.has(`${k}s`)).length;
    if (score > 0 && (!best || score > best.score)) best = { id: r.id, score };
  }
  return best?.id ?? null;
}

function context(state: CoreState, requestId: string): JudgeContext {
  const r = request(requestId)!;
  return {
    profile: state.profile,
    request: { id: r.id, subject: r.subject, body: r.body, budget: r.budget, due: r.due },
    cards: state.cardOrder.map((id) => state.cards[id]),
    task: state.task,
  };
}

function withPrediction(card: DecisionCard, predicted: string | undefined): DecisionCard {
  if (predicted === undefined || card.prediction) return card;
  const firstChoice = card.previousChoices[0] ?? card.chosen;
  return { ...card, prediction: { optionId: predicted, correct: predicted === firstChoice } };
}

function judge(out: Out, cardIdFor: string, call: JudgeCall): Out {
  const requestId = `j${out.state.nextRequestId}`;
  return {
    state: {
      ...out.state,
      nextRequestId: out.state.nextRequestId + 1,
      pending: { ...out.state.pending, [requestId]: { cardId: cardIdFor, call: call.kind } },
    },
    effects: [...out.effects, { kind: "judge_request", requestId, call }],
  };
}

function putCard(out: Out, card: DecisionCard): Out {
  const isNew = !out.state.cards[card.id];
  const effects = out.effects.filter((e) => !(e.kind === "upsert_card" && e.card.id === card.id));
  return {
    state: {
      ...out.state,
      cards: { ...out.state.cards, [card.id]: card },
      cardOrder: isNew ? [...out.state.cardOrder, card.id] : out.state.cardOrder,
    },
    effects: [...effects, { kind: "upsert_card", card }],
  };
}

// Ask now if nothing else is being asked; otherwise wait in line.
function ask(out: Out, question: { cardId: string | null; text: string }): Out {
  if (out.state.openQuestion) {
    if (question.cardId === null) return out;
    return { ...out, state: { ...out.state, questionQueue: [...out.state.questionQueue, { cardId: question.cardId, text: question.text }] } };
  }
  return {
    state: { ...out.state, openQuestion: question },
    effects: [...out.effects, { kind: "avatar", state: "forward" }, { kind: "ask", text: question.text, cardId: question.cardId }],
  };
}

function askNext(out: Out): Out {
  const [next, ...rest] = out.state.questionQueue;
  if (!next) return out;
  return ask({ ...out, state: { ...out.state, questionQueue: rest } }, next);
}

function onWorkspaceEvent(state: CoreState, input: Extract<CoreInput, { kind: "workspace_event" }>): Out {
  const history = [...state.events, { event: input.event, at: input.at }];
  let out: Out = { state: { ...state, events: history }, effects: [] };

  const choice = choiceFor(input.event, history);
  if (choice) {
    const id = cardId(choice.step.requestId, choice.step.stepId);
    const existing = out.state.cards[id];
    if (existing?.chosen !== choice.chosen) {
      const card = withPrediction(
        {
          ...existing,
          id,
          requestId: choice.step.requestId,
          stepId: choice.step.stepId,
          title: choice.step.title,
          procedureRef: choice.step.procedureRef,
          options: choice.step.options,
          chosen: choice.chosen,
          previousChoices: existing ? [...existing.previousChoices, existing.chosen] : [],
          howNotes: existing?.howNotes ?? [],
          at: existing?.at ?? input.at,
        },
        out.state.predictions[id],
      );
      out = putCard(out, card);
      if (!existing) out = judge(out, id, { kind: "assess", card, context: context(out.state, card.requestId) });
    }
  }

  // Any event can change how-notes (a pause ends, a message is sent).
  const allCards = out.state.cardOrder.map((id) => out.state.cards[id]);
  for (const card of allCards) {
    const notes = howNotes(card, allCards, history);
    if (notes.join("\n") !== card.howNotes.join("\n")) out = putCard(out, { ...card, howNotes: notes });
  }

  const upcoming = nextStepAfter(input.event, history);
  if (upcoming) out = predictNext(out, upcoming);
  return out;
}

function predictNext(out: Out, step: Step): Out {
  const id = cardId(step.requestId, step.stepId);
  const alreadyAsked = Object.values(out.state.pending).some((p) => p.cardId === id && p.call === "predict");
  if (out.state.cards[id] || out.state.predictions[id] !== undefined || alreadyAsked) return out;
  return judge(out, id, {
    kind: "predict",
    requestId: step.requestId,
    stepId: step.stepId,
    options: step.options,
    context: context(out.state, step.requestId),
  });
}

function onUtterance(state: CoreState, input: Extract<CoreInput, { kind: "utterance" }>): Out {
  const question = state.openQuestion;
  if (input.speaker !== "expert" || !question) return { state, effects: [] };
  let out: Out = { state: { ...state, openQuestion: null }, effects: [] };

  if (question.cardId === null) {
    const task: TodayTask = { text: input.text, requestId: matchTask(input.text) };
    out = { state: { ...out.state, task }, effects: [{ kind: "task_set", task }] };
  } else {
    const card = out.state.cards[question.cardId];
    out = judge(out, card.id, { kind: "classify", card, answer: input.text, context: context(out.state, card.requestId) });
    out = putCard(out, { ...card, reason: { source: "expert", text: input.text, types: [], evidence: [] } });
  }
  out = { ...out, effects: [...out.effects, { kind: "avatar", state: "bubble" }] };
  return askNext(out);
}

function onJudgeResult(state: CoreState, input: Extract<CoreInput, { kind: "judge_result" }>): Out {
  const purpose = state.pending[input.requestId];
  if (!purpose) return { state, effects: [] };
  const pending = { ...state.pending };
  delete pending[input.requestId];
  let out: Out = { state: { ...state, pending }, effects: [] };
  const result = input.result;
  const card = out.state.cards[purpose.cardId];

  switch (result.kind) {
    case "predict": {
      out.state = { ...out.state, predictions: { ...out.state.predictions, [purpose.cardId]: result.optionId } };
      if (card && !card.prediction) out = putCard(out, withPrediction(card, result.optionId));
      return out;
    }
    case "assess": {
      if (!card) return out;
      const understands = result.confidence >= UNDERSTAND_THRESHOLD;
      if (understands || !result.matters) {
        return putCard(out, {
          ...card,
          reason: { source: "ari", text: result.explanation, types: result.types, evidence: result.evidence, confidence: result.confidence },
        });
      }
      out = putCard(out, { ...card, question: result.question });
      return ask(out, { cardId: card.id, text: result.question });
    }
    case "classify": {
      if (!card?.reason || card.reason.source !== "expert") return out;
      return putCard(out, { ...card, reason: { ...card.reason, types: result.types } });
    }
  }
}

export function reduce(state: CoreState, input: CoreInput): Out {
  switch (input.kind) {
    case "session_start": {
      const next = { ...initialState(), profile: input.profile, mode: input.mode };
      const out: Out = { state: next, effects: [] };
      if (input.mode !== "expert") return out;
      return ask(out, { cardId: null, text: `Hi ${input.profile.name}, what are you working on today?` });
    }
    case "workspace_event":
      return onWorkspaceEvent(state, input);
    case "utterance":
      return onUtterance(state, input);
    case "judge_result":
      return onJudgeResult(state, input);
  }
}
