// The Apprentice Core: everything Ari does, as a pure reducer.
// (state, input) → (state, effects). No network; judgment goes out as
// judge_request effects and comes back as judge_result inputs.
import { choiceFor, nextStepAfter, request, type Step } from "./normalMap";
import type { CoreEffect, CoreInput, CoreState, DecisionCard, JudgeCall } from "./types";

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
  };
}

const cardId = (requestId: string, stepId: string) => `${requestId}:${stepId}`;

function withPrediction(card: DecisionCard, predicted: string | undefined): DecisionCard {
  if (predicted === undefined || card.prediction) return card;
  const firstChoice = card.previousChoices[0] ?? card.chosen;
  return { ...card, prediction: { optionId: predicted, correct: predicted === firstChoice } };
}

function judgeCall(state: CoreState, step: Step): JudgeCall {
  const r = request(step.requestId)!;
  return {
    kind: "predict",
    requestId: step.requestId,
    stepId: step.stepId,
    options: step.options,
    context: {
      profile: state.profile,
      request: { id: r.id, subject: r.subject, body: r.body, budget: r.budget, due: r.due },
      cards: state.cardOrder.map((id) => state.cards[id]),
    },
  };
}

export function reduce(state: CoreState, input: CoreInput): { state: CoreState; effects: CoreEffect[] } {
  switch (input.kind) {
    case "session_start":
      return { state: { ...state, profile: input.profile, mode: input.mode }, effects: [] };

    case "workspace_event": {
      const history = [...state.events, { event: input.event, at: input.at }];
      let next: CoreState = { ...state, events: history };
      const effects: CoreEffect[] = [];

      const choice = choiceFor(input.event, history);
      if (choice) {
        const id = cardId(choice.step.requestId, choice.step.stepId);
        const existing = next.cards[id];
        if (existing?.chosen !== choice.chosen) {
          const card: DecisionCard = withPrediction(
            {
              id,
              requestId: choice.step.requestId,
              stepId: choice.step.stepId,
              title: choice.step.title,
              procedureRef: choice.step.procedureRef,
              options: choice.step.options,
              chosen: choice.chosen,
              previousChoices: existing ? [...existing.previousChoices, existing.chosen] : [],
              prediction: existing?.prediction,
              at: existing?.at ?? input.at,
            },
            next.predictions[id],
          );
          next = {
            ...next,
            cards: { ...next.cards, [id]: card },
            cardOrder: existing ? next.cardOrder : [...next.cardOrder, id],
          };
          effects.push({ kind: "upsert_card", card });
        }
      }

      const upcoming = nextStepAfter(input.event, history);
      if (upcoming) {
        const id = cardId(upcoming.requestId, upcoming.stepId);
        const alreadyAsked = Object.values(next.pending).some((p) => p.cardId === id);
        if (!next.cards[id] && next.predictions[id] === undefined && !alreadyAsked) {
          const requestId = `j${next.nextRequestId}`;
          next = { ...next, nextRequestId: next.nextRequestId + 1, pending: { ...next.pending, [requestId]: { cardId: id } } };
          effects.push({ kind: "judge_request", requestId, call: judgeCall(next, upcoming) });
        }
      }
      return { state: next, effects };
    }

    case "judge_result": {
      const purpose = state.pending[input.requestId];
      if (!purpose) return { state, effects: [] };
      const pending = { ...state.pending };
      delete pending[input.requestId];
      let next: CoreState = {
        ...state,
        pending,
        predictions: { ...state.predictions, [purpose.cardId]: input.result.optionId },
      };
      const card = next.cards[purpose.cardId];
      if (!card || card.prediction) return { state: next, effects: [] };
      const updated = withPrediction(card, input.result.optionId);
      next = { ...next, cards: { ...next.cards, [card.id]: updated } };
      return { state: next, effects: [{ kind: "upsert_card", card: updated }] };
    }
  }
}
