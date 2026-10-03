"use client";

import { useEffect, useRef, useState } from "react";
import { initialState, reduce } from "@/lib/apprentice/core";
import { ruleJudge } from "@/lib/apprentice/ruleJudge";
import type { CoreEffect, CoreInput, DecisionCard, JudgeCall, JudgeResult, Mode } from "@/lib/apprentice/types";
import type { EventBus } from "@/lib/workspace/events";
import type { Profile } from "@/lib/workspace/profile";

export type Judge = (call: JudgeCall) => Promise<JudgeResult>;

const localJudge: Judge = async (call) => ruleJudge(call);

// Runs the Apprentice Core in the browser: workspace events in, effects out.
export function useApprentice(bus: EventBus, profile: Profile | null, mode: Mode, judge: Judge = localJudge) {
  const state = useRef(initialState());
  const [cards, setCards] = useState<DecisionCard[]>([]);

  useEffect(() => {
    if (!profile) return;
    let alive = true;

    function dispatch(input: CoreInput) {
      const out = reduce(state.current, input);
      state.current = out.state;
      out.effects.forEach(handle);
    }

    function handle(effect: CoreEffect) {
      if (effect.kind === "upsert_card") {
        setCards(state.current.cardOrder.map((id) => state.current.cards[id]));
      } else if (effect.kind === "judge_request") {
        judge(effect.call)
          .then((result) => alive && dispatch({ kind: "judge_result", requestId: effect.requestId, result }))
          .catch(() => {}); // No prediction mark is better than a broken session.
      }
    }

    state.current = initialState();
    dispatch({ kind: "session_start", profile, mode });
    const unsubscribe = bus.subscribe(({ event, at }) => dispatch({ kind: "workspace_event", event, at }));
    return () => {
      alive = false;
      unsubscribe();
    };
  }, [bus, profile, mode, judge]);

  return { cards };
}
