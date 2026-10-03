// Test harness for the Apprentice Core: feeds inputs, answers every
// judge_request from a scripted fake Judge, and collects all effects.
import { initialState, reduce } from "./core";
import type { CoreEffect, CoreInput, CoreState, DecisionCard, JudgeCall, JudgeResult } from "./types";
import type { WorkspaceEvent } from "@/lib/workspace/events";
import { MARIA } from "@/lib/workspace/profile";

export type FakeJudge = (call: JudgeCall) => JudgeResult | null; // null: never answers

export function run(inputs: CoreInput[], judge: FakeJudge, start: CoreState = initialState()) {
  let state = start;
  const effects: CoreEffect[] = [];
  const queue = [...inputs];
  while (queue.length) {
    const out = reduce(state, queue.shift()!);
    state = out.state;
    for (const e of out.effects) {
      effects.push(e);
      if (e.kind !== "judge_request") continue;
      const result = judge(e.call);
      if (result) queue.unshift({ kind: "judge_result", requestId: e.requestId, result });
    }
  }
  const cards: DecisionCard[] = state.cardOrder.map((id) => state.cards[id]);
  return { state, effects, cards };
}

let clock = 1_000;
export function ev(event: WorkspaceEvent, at = (clock += 1_000)): CoreInput {
  return { kind: "workspace_event", event, at };
}

export const startAsMaria: CoreInput = { kind: "session_start", profile: MARIA, mode: "expert" };
