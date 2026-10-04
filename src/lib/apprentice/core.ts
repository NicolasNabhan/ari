// The Apprentice Core: everything Ari does, as a pure reducer.
// (state, input) → (state, effects). No network; judgment goes out as
// judge_request effects and comes back as judge_result inputs.
import { northwind } from "@/lib/northwind/seed";
import { summarize } from "@/lib/gaze/attention";
import { howNotes } from "./howNotes";
import { choiceFor, nextStepAfter, request, type Step } from "./normalMap";
import { scheduleBriefing } from "@/lib/context/briefing";
import { answerWhy, brokenGuardrail, explainStep, intro, isSpanish, isWhyQuestion, showMe } from "./teach";
import type { CoreEffect, CoreInput, CoreState, DecisionCard, JudgeCall, JudgeContext, Review, StepId, TodayTask } from "./types";

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
    briefed: false,
    questionQueue: [],
    lessons: null,
    taught: [],
    warned: [],
    busy: [],
    tapToHear: false,
    pendingTap: null,
    followedUp: [],
    review: null,
    lang: "en-US",
    ended: false,
    attention: [],
    attentionMark: 0,
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

// Eye tracking: what the expert looked at that isn't on a card yet.
const unattributed = (state: CoreState) => state.attention.slice(state.attentionMark);

function context(state: CoreState, requestId: string, card?: DecisionCard): JudgeContext {
  const r = request(requestId)!;
  const attention = card ? card.attention ?? [] : summarize(unattributed(state), 5);
  return {
    profile: state.profile,
    request: { id: r.id, subject: r.subject, body: r.body, budget: r.budget, due: r.due },
    cards: state.cardOrder.map((id) => state.cards[id]),
    task: state.task,
    ...(attention.length ? { attention } : {}),
  };
}

// Attach what the expert looked at since the last decision to this one.
function withAttention(state: CoreState, card: DecisionCard): { state: CoreState; card: DecisionCard } {
  const fresh = unattributed(state);
  if (!fresh.length) return { state, card };
  return {
    state: { ...state, attentionMark: state.attention.length },
    card: { ...card, attention: summarize([...(card.attention ?? []), ...fresh], 5) },
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

type Question = { cardId: string | null; text: string };

function speak(out: Out, question: Question): Out {
  return {
    state: { ...out.state, openQuestion: question, pendingTap: null },
    effects: [...out.effects, { kind: "avatar", state: "forward" }, { kind: "ask", text: question.text, cardId: question.cardId }],
  };
}

// Ask now if Ari can; otherwise wait in line. Ari never talks over another
// question, never while the expert is busy, and in tap-to-hear mode only
// after the expert taps.
function ask(out: Out, question: Question): Out {
  const s = out.state;
  if (s.openQuestion || s.pendingTap || s.busy.length) {
    if (question.cardId === null) return out;
    return { ...out, state: { ...s, questionQueue: [...s.questionQueue, { cardId: question.cardId, text: question.text }] } };
  }
  if (s.tapToHear && question.cardId !== null) {
    return { state: { ...s, pendingTap: question }, effects: [...out.effects, { kind: "signal_pending_question" }] };
  }
  return speak(out, question);
}

function askNext(out: Out): Out {
  const [next, ...rest] = out.state.questionQueue;
  if (!next) return out;
  return ask({ ...out, state: { ...out.state, questionQueue: rest } }, next);
}

// In teach mode, each step is explained when the newcomer reaches it.
const STEP_AFTER: Partial<Record<string, StepId>> = {
  request_opened: "quotes",
  quotes_requested: "vendor",
  vendor_selected: "approval",
  approval_routed: "po",
};

function quotedVendorIds(state: CoreState): string[] {
  for (let i = state.events.length - 1; i >= 0; i--) {
    const e = state.events[i].event;
    if (e.type === "quotes_requested") return e.vendorIds;
  }
  return [];
}

function teachOnEvent(state: CoreState): Out {
  const event = state.events[state.events.length - 1].event;
  // The schedule comes first: a briefing on the week the first time it's opened.
  if (event.type === "screen_opened" && event.screen === "week" && state.lessons && !state.briefed) {
    return {
      state: { ...state, briefed: true },
      effects: [{ kind: "teach_explain", text: scheduleBriefing(state.lessons.expert), highlight: "nav-inbox", lang: state.lang }],
    };
  }
  const step = STEP_AFTER[event.type];
  if (!state.lessons || !step || state.taught.includes(step)) return { state, effects: [] };
  const { text, highlight } = explainStep(step, state.lessons, quotedVendorIds(state), state.lang);
  return {
    state: { ...state, taught: [...state.taught, step] },
    effects: [{ kind: "teach_explain", text, highlight, stepId: step, lang: state.lang }],
  };
}

function onBusyChanged(out: Out, busy: boolean, reason: string): Out {
  const was = out.state.busy;
  const now = busy ? [...new Set([...was, reason])] : was.filter((r) => r !== reason);
  out = { ...out, state: { ...out.state, busy: now } };
  return was.length && !now.length ? askNext(out) : out;
}

function onWorkspaceEvent(state: CoreState, input: Extract<CoreInput, { kind: "workspace_event" }>): Out {
  const history = [...state.events, { event: input.event, at: input.at }];
  if (state.mode === "newcomer") return teachOnEvent({ ...state, events: history });
  let out: Out = { state: { ...state, events: history }, effects: [] };
  if (input.event.type === "busy_changed") out = onBusyChanged(out, input.event.busy, input.event.reason);

  const choice = choiceFor(input.event, history);
  if (choice) {
    const id = cardId(choice.step.requestId, choice.step.stepId);
    const existing = out.state.cards[id];
    if (existing?.chosen !== choice.chosen) {
      const predicted = withPrediction(
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
      const looked = withAttention(out.state, predicted);
      const card = looked.card;
      out = putCard({ ...out, state: looked.state }, card);
      if (!existing) out = judge(out, id, { kind: "assess", card, context: context(out.state, card.requestId, card) });
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

// ---- End-of-session review ----------------------------------------------

const REVIEW = "review"; // openQuestion.cardId while Ari is reviewing
const REVIEW_BATCH = 3;
// Anything that isn't a yes counts as a no (in the offer) or a correction (for a guess).
const isYes = (t: string) => /^\s*(yes|yeah|yep|yup|sure|ok(ay)?|right|correct|exactly|that'?s right|go ahead|please|s[ií])\b/i.test(t);

function quietGuesses(state: CoreState): string[] {
  return state.cardOrder
    .map((id) => state.cards[id])
    .filter((c) => c.reason?.source === "ari" && !c.reason.confirmed)
    .sort((a, b) => (a.reason!.confidence ?? 1) - (b.reason!.confidence ?? 1))
    .map((c) => c.id);
}

function reviewSay(out: Out, review: Review, text: string): Out {
  return speak({ ...out, state: { ...out.state, review } }, { cardId: REVIEW, text });
}

function endSession(out: Out): Out {
  return {
    state: { ...out.state, review: null, openQuestion: null, questionQueue: [], ended: true },
    effects: [...out.effects, { kind: "avatar", state: "bubble" }, { kind: "session_ended" }],
  };
}

function showList(out: Out, queue: string[]): Out {
  if (!queue.length) return endSession(out);
  return {
    state: { ...out.state, review: { phase: "list", queue }, openQuestion: null },
    effects: [...out.effects, { kind: "avatar", state: "bubble" }, { kind: "show_review_list", cardIds: queue }],
  };
}

function readNext(out: Out, queue: string[], readThisRound: number): Out {
  if (!queue.length) return endSession(out);
  if (readThisRound >= REVIEW_BATCH) {
    return reviewSay(out, { phase: "continue", queue }, "That's the three I was least sure about. Want me to continue?");
  }
  const [current, ...rest] = queue;
  const card = out.state.cards[current];
  const text = `For "${card.title}", I assumed: ${card.reason!.text} Is that right?`;
  return {
    state: { ...out.state, review: { phase: "reading", queue: rest, current, readThisRound: readThisRound + 1 }, openQuestion: { cardId: REVIEW, text } },
    effects: [...out.effects, { kind: "avatar", state: "forward" }, { kind: "end_review_item", cardId: current, text }],
  };
}

function confirmGuess(out: Out, cardId: string): Out {
  const card = out.state.cards[cardId];
  if (!card?.reason) return out;
  return putCard(out, { ...card, reason: { ...card.reason, confirmed: true } });
}

function correctGuess(out: Out, cardId: string, spoken: string): Out {
  const card = out.state.cards[cardId];
  if (!card) return out;
  // "No, it's because…" → "It's because…"
  const stripped = spoken.replace(/^\s*(no|nope|nah|not quite)\b[,.!]?\s*/i, "");
  const text = stripped ? stripped.charAt(0).toUpperCase() + stripped.slice(1) : spoken;
  out = putCard(out, { ...card, reason: { source: "expert", text, types: card.reason?.types ?? [], evidence: [] } });
  return judge(out, card.id, { kind: "classify", card, answer: text, context: context(out.state, card.requestId) });
}

function onReviewAnswer(state: CoreState, text: string): Out {
  const review = state.review!;
  const out: Out = { state: { ...state, openQuestion: null }, effects: [] };
  switch (review.phase) {
    case "offer":
      return isYes(text) ? readNext(out, review.queue, 0) : showList(out, review.queue);
    case "continue":
      return isYes(text) ? readNext(out, review.queue, 0) : showList(out, review.queue);
    case "reading": {
      const checked = isYes(text) ? confirmGuess(out, review.current) : correctGuess(out, review.current, text);
      return readNext(checked, review.queue, review.readThisRound);
    }
    default:
      return out;
  }
}

function currentRequestId(state: CoreState): string | null {
  for (let i = state.events.length - 1; i >= 0; i--) {
    const e = state.events[i].event;
    if (e.type === "request_opened") return e.requestId;
  }
  return null;
}

function onShowMe(state: CoreState): Out {
  const step = state.taught[state.taught.length - 1];
  const requestId = currentRequestId(state);
  if (!state.lessons || !step || !requestId) return { state, effects: [] };
  const { actions, narration } = showMe(step, requestId, quotedVendorIds(state), state.lessons, state.lang);
  return { state, effects: [{ kind: "teach_explain", text: narration, stepId: step, lang: state.lang }, { kind: "drive_cursor", actions }] };
}

function onCommand(state: CoreState, name: Extract<CoreInput, { kind: "command" }>["name"]): Out {
  const out: Out = { state, effects: [] };
  if (name === "show_me") return state.mode === "newcomer" ? onShowMe(state) : out;
  if (state.mode !== "expert") return out;
  if (name === "review_skip") return endSession(out);
  if (name !== "end_session") return out;
  const queue = quietGuesses(state);
  if (!queue.length) return endSession({ state: { ...state, questionQueue: [], pendingTap: null }, effects: [] });
  const cleared = { ...state, openQuestion: null, questionQueue: [], pendingTap: null };
  return reviewSay({ state: cleared, effects: [] }, { phase: "offer", queue }, "Want me to go through the decisions I'm least sure about?");
}

function onListAction(state: CoreState, input: Extract<CoreInput, { kind: "review_confirm" | "review_correct" }>): Out {
  if (state.review?.phase !== "list") return { state, effects: [] };
  let out: Out = { state, effects: [] };
  out = input.kind === "review_confirm" ? confirmGuess(out, input.cardId) : correctGuess(out, input.cardId, input.text);
  const queue = state.review.queue.filter((id) => id !== input.cardId);
  return { ...out, state: { ...out.state, review: { phase: "list", queue } } };
}

function onUtterance(state: CoreState, input: Extract<CoreInput, { kind: "utterance" }>): Out {
  if (state.review && state.openQuestion?.cardId === REVIEW && input.speaker === "expert") return onReviewAnswer(state, input.text);
  if (state.mode === "newcomer") {
    if (input.speaker !== "newcomer" || !state.lessons) return { state, effects: [] };
    const effects: CoreEffect[] = [];
    let next = state;
    const lang = input.lang.startsWith("es") || isSpanish(input.text) ? "es-ES" : "en-US";
    if (lang !== state.lang) {
      next = { ...state, lang };
      effects.push({ kind: "switch_language", lang });
    }
    if (!isWhyQuestion(input.text)) return { state: next, effects };
    const current = next.taught[next.taught.length - 1] ?? null;
    effects.push({ kind: "teach_explain", text: answerWhy(input.text, next.lessons!, current, lang), stepId: current ?? undefined, lang });
    return { state: next, effects };
  }
  const question = state.openQuestion;
  if (input.speaker !== "expert" || !question) return { state, effects: [] };
  let out: Out = { state: { ...state, openQuestion: null }, effects: [] };

  if (question.cardId === null) {
    const task: TodayTask = { text: input.text, requestId: matchTask(input.text) };
    out = { state: { ...out.state, task }, effects: [{ kind: "task_set", task }] };
  } else {
    const card = out.state.cards[question.cardId];
    // A follow-up answer adds to the first one.
    const previous = out.state.followedUp.includes(card.id) && card.reason?.source === "expert" ? card.reason : null;
    const answer = previous ? `${previous.text} ${input.text}` : input.text;
    out = judge(out, card.id, { kind: "classify", card, answer, context: context(out.state, card.requestId) });
    out = putCard(out, { ...card, reason: { source: "expert", text: answer, types: previous?.types ?? [], evidence: [] } });
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
      out = putCard(out, { ...card, reason: { ...card.reason, types: result.types }, ...(result.knowledge ? { knowledge: result.knowledge } : {}) });
      // No follow-ups during the end-of-session review: Maria is wrapping up.
      if (!result.followUp || out.state.review || out.state.ended || out.state.followedUp.includes(card.id)) return out;
      out = { ...out, state: { ...out.state, followedUp: [...out.state.followedUp, card.id] } };
      return ask(out, { cardId: card.id, text: result.followUp });
    }
  }
}

export function reduce(state: CoreState, input: CoreInput): Out {
  switch (input.kind) {
    case "session_start": {
      const next = { ...initialState(), profile: input.profile, mode: input.mode, lessons: input.lessons ?? null, tapToHear: state.tapToHear };
      const out: Out = { state: next, effects: [] };
      if (input.mode === "newcomer") {
        if (!next.lessons) return out;
        return { state: next, effects: [{ kind: "avatar", state: "tutor" }, { kind: "teach_explain", text: intro(input.profile, next.lessons), highlight: "nav-week" }] };
      }
      return ask(out, { cardId: null, text: `Hi ${input.profile.name}, what are you working on today?` });
    }
    case "workspace_event":
      return onWorkspaceEvent(state, input);
    case "command":
      return onCommand(state, input.name);
    case "review_confirm":
    case "review_correct":
      return onListAction(state, input);
    case "set_tap_to_hear":
      return { state: { ...state, tapToHear: input.on }, effects: [] };
    case "tap_to_hear":
      return state.pendingTap && !state.openQuestion ? speak({ state, effects: [] }, state.pendingTap) : { state, effects: [] };
    case "workspace_intent": {
      if (state.mode !== "newcomer" || !state.lessons) return { state, effects: [] };
      const rule = brokenGuardrail(input.event, state.lessons);
      if (!rule) return { state, effects: [] };
      const key = `${rule.id}:${JSON.stringify(input.event)}`;
      if (state.warned.includes(key)) return { state, effects: [] }; // they heard the warning and chose to go ahead
      return {
        state: { ...state, warned: [...state.warned, key] },
        effects: [{ kind: "warn_guardrail", text: state.lang === "es-ES" ? rule.warningEs ?? rule.warning : rule.warning, ruleId: rule.id }],
      };
    }
    case "utterance":
      return onUtterance(state, input);
    case "judge_result":
      return onJudgeResult(state, input);
    case "attention":
      if (state.mode !== "expert" || state.ended || input.record.ms <= 0) return { state, effects: [] };
      return { state: { ...state, attention: [...state.attention, input.record] }, effects: [] };
  }
}
