"use client";

import { useEffect, useRef, useState } from "react";
import { useAri } from "@/components/ari/AriProvider";
import { initialState, reduce } from "@/lib/apprentice/core";
import { ruleJudge } from "@/lib/apprentice/ruleJudge";
import { MARIA_SESSION } from "@/lib/apprentice/mariaSession";
import type { CoreEffect, CoreInput, DecisionCard, JudgeCall, JudgeResult, Mode, StepId, TodayTask } from "@/lib/apprentice/types";
import type { EventBus, WorkspaceEvent } from "@/lib/workspace/events";
import { highlight, clearHighlight } from "./highlight";
import type { Profile } from "@/lib/workspace/profile";

// Claude when the server has a key; the rule Judge otherwise (or on any error).
let claudeAvailable = true;
async function judge(call: JudgeCall): Promise<JudgeResult> {
  if (claudeAvailable) {
    try {
      const res = await fetch("/api/judge", { method: "POST", body: JSON.stringify(call) });
      if (res.status === 503) claudeAvailable = false;
      if (res.ok) return (await res.json()) as JudgeResult;
    } catch {
      // fall through to the rule Judge
    }
  }
  return ruleJudge(call);
}

// Runs the Apprentice Core in the browser: workspace events and speech in,
// cards, questions and avatar moves out.
export function useApprentice(bus: EventBus, profile: Profile | null, mode: Mode, started: boolean) {
  const ari = useAri();
  const ariRef = useRef(ari);
  useEffect(() => {
    ariRef.current = ari;
  }, [ari]);
  const state = useRef(initialState());
  const [cards, setCards] = useState<DecisionCard[]>([]);
  const [task, setTask] = useState<TodayTask | null>(null);
  const [teachingStep, setTeachingStep] = useState<StepId | null>(null);
  const [questionWaiting, setQuestionWaiting] = useState(false);
  const [reviewList, setReviewList] = useState<string[] | null>(null);
  const [ended, setEnded] = useState(false);
  const [tapToHear, setTapToHearState] = useState(false);
  const tapRef = useRef(false);
  useEffect(() => {
    try {
      const on = localStorage.getItem("ari.tapToHear") === "1";
      tapRef.current = on;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTapToHearState(on);
    } catch {
      // storage blocked: default to asking right away
    }
  }, []);
  const dispatchRef = useRef<(input: CoreInput) => CoreEffect[]>(() => []);

  useEffect(() => {
    if (!profile || !started) return;
    let alive = true;

    function dispatch(input: CoreInput): CoreEffect[] {
      if (!alive) return [];
      const out = reduce(state.current, input);
      state.current = out.state;
      out.effects.forEach(handle);
      return out.effects;
    }
    dispatchRef.current = dispatch;

    function handle(effect: CoreEffect) {
      switch (effect.kind) {
        case "upsert_card":
          setCards(state.current.cardOrder.map((id) => state.current.cards[id]));
          break;
        case "judge_request":
          judge(effect.call).then((result) => dispatch({ kind: "judge_result", requestId: effect.requestId, result }));
          break;
        case "avatar":
          ariRef.current.setState(effect.state);
          break;
        case "task_set":
          setTask(effect.task);
          break;
        case "teach_explain":
          if (effect.stepId) setTeachingStep(effect.stepId);
          if (effect.highlight) highlight(effect.highlight);
          ariRef.current.say(effect.text);
          break;
        case "warn_guardrail":
          clearHighlight();
          ariRef.current.setState("forward");
          ariRef.current.say(effect.text).then(() => ariRef.current.setState("tutor"));
          break;
        case "signal_pending_question":
          setQuestionWaiting(true);
          break;
        case "show_review_list":
          setReviewList(effect.cardIds);
          break;
        case "session_ended":
          setReviewList(null);
          setEnded(true);
          ariRef.current.say("Thanks, that's everything. I'll remember it for the next person.");
          break;
        case "end_review_item":
        case "ask":
          setQuestionWaiting(false);
          (async () => {
            await ariRef.current.say(effect.text);
            const heard = await ariRef.current.listen();
            dispatch({ kind: "utterance", speaker: "expert", text: heard, lang: "en-US", at: Date.now() });
          })();
          break;
      }
    }

    state.current = initialState();
    dispatch({ kind: "set_tap_to_hear", on: tapRef.current });
    dispatch({ kind: "session_start", profile, mode, lessons: mode === "newcomer" ? MARIA_SESSION : undefined });
    const unsubscribe = bus.subscribe(({ event, at }) => {
      clearHighlight();
      dispatch({ kind: "workspace_event", event, at });
    });
    return () => {
      alive = false;
      dispatchRef.current = () => [];
      clearHighlight();
      unsubscribe();
    };
  }, [bus, profile, mode, started]);

  // Before an action happens: false means Ari warned and the action should wait.
  function allow(event: WorkspaceEvent): boolean {
    return !dispatchRef.current({ kind: "workspace_intent", event }).some((e) => e.kind === "warn_guardrail");
  }

  async function askWhy() {
    const heard = await ariRef.current.listen();
    dispatchRef.current({ kind: "utterance", speaker: "newcomer", text: heard, lang: "en-US", at: Date.now() });
  }

  function setTapToHear(on: boolean) {
    tapRef.current = on;
    setTapToHearState(on);
    try {
      localStorage.setItem("ari.tapToHear", on ? "1" : "0");
    } catch {
      // not remembered, still applies to this session
    }
    dispatchRef.current({ kind: "set_tap_to_hear", on });
  }

  function hearQuestion() {
    dispatchRef.current({ kind: "tap_to_hear" });
  }

  const review = {
    list: reviewList,
    ended,
    end: () => dispatchRef.current({ kind: "command", name: "end_session" }),
    skip: () => dispatchRef.current({ kind: "command", name: "review_skip" }),
    confirm: (cardId: string) => {
      dispatchRef.current({ kind: "review_confirm", cardId });
      setReviewList((l) => l?.filter((id) => id !== cardId) ?? null);
    },
    correct: (cardId: string, text: string) => {
      dispatchRef.current({ kind: "review_correct", cardId, text });
      setReviewList((l) => l?.filter((id) => id !== cardId) ?? null);
    },
  };

  return { cards, task, teachingStep, allow, askWhy, tapToHear, setTapToHear, questionWaiting, hearQuestion, review };
}
