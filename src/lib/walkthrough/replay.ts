// The walkthrough at any position, rebuilt by replaying Maria's script from
// the start through the Apprentice Core (with the rule Judge, so it's
// instant and always the same). Going back is just replaying less.
import { initialState, reduce } from "@/lib/apprentice/core";
import { ruleJudge } from "@/lib/apprentice/ruleJudge";
import type { CoreEffect, CoreInput, CoreState, DecisionCard } from "@/lib/apprentice/types";
import { MARIA } from "@/lib/workspace/profile";
import { applyAction, emptyWorkspace, type WorkspaceView } from "./workspaceState";
import type { Beat, Click, Part, Speaker } from "./script";

export type FlatBeat = { beat: Beat; part: number; index: number };

export function flatten(script: Part[]): FlatBeat[] {
  return script.flatMap((p, part) => p.beats.map((beat) => ({ beat, part }))).map((b, index) => ({ ...b, index }));
}

export type Bubble = { speaker: Speaker; text: string };

export type WalkthroughView = {
  position: number;
  part: number;
  beat: Beat;
  bubble: Bubble | null;
  clicks: Click[]; // what Maria's cursor clicks at this beat
  clicksShown: number; // how many of them have happened (the presenter shows them one by one)
  workspace: WorkspaceView; // after this beat's clicks
  core: CoreState;
  cards: DecisionCard[];
  effects: CoreEffect[]; // everything the Core did up to here, in order
};

function feed(state: CoreState, inputs: CoreInput[], effects: CoreEffect[]): CoreState {
  const queue = [...inputs];
  while (queue.length) {
    const out = reduce(state, queue.shift()!);
    state = out.state;
    for (const e of out.effects) {
      effects.push(e);
      if (e.kind === "judge_request") queue.unshift({ kind: "judge_result", requestId: e.requestId, result: ruleJudge(e.call) });
    }
  }
  return state;
}

// clicksShown: how many of the last beat's clicks have happened (all by default).
export function replayTo(script: Part[], position: number, clicksShown = Infinity): WalkthroughView {
  const beats = flatten(script);
  const pos = Math.max(0, Math.min(position, beats.length - 1));
  const effects: CoreEffect[] = [];
  let at = 1_000;
  let core = feed(initialState(), [{ kind: "set_tap_to_hear", on: false }, { kind: "session_start", profile: MARIA, mode: "expert" }], effects);
  let ws = emptyWorkspace();
  let bubble: Bubble | null = null;

  for (const { beat, index } of beats.slice(0, pos + 1)) {
    // What's said at this beat is decided before the beat changes anything.
    bubble = bubbleFor(beat, core);
    switch (beat.kind) {
      case "answer":
        core = feed(core, [{ kind: "utterance", speaker: "expert", text: beat.text, lang: "en-US", at: (at += 1_000) }], effects);
        break;
      case "act":
        for (const r of beat.reads ?? []) {
          core = feed(core, [{ kind: "attention", record: { ...r, screen: ws.screen, firstAt: at }, at: (at += r.ms) }], effects);
        }
        for (const c of index === pos ? beat.clicks.slice(0, clicksShown) : beat.clicks) {
          const out = applyAction(ws, c.action);
          ws = out.ws;
          core = feed(core, out.events.map((event) => ({ kind: "workspace_event", event, at: (at += 1_000) }) as const), effects);
        }
        break;
      case "end":
        core = feed(core, [{ kind: "command", name: "end_session" }], effects);
        break;
    }
  }

  const { beat, part } = beats[pos];
  return {
    position: pos,
    part,
    beat,
    bubble,
    clicks: beat.kind === "act" ? beat.clicks : [],
    clicksShown: beat.kind === "act" ? Math.min(clicksShown, beat.clicks.length) : 0,
    workspace: ws,
    core,
    cards: core.cardOrder.map((id) => core.cards[id]),
    effects,
  };
}

function bubbleFor(beat: Beat, core: CoreState): Bubble | null {
  switch (beat.kind) {
    case "ari-asks":
      return core.openQuestion ? { speaker: "ari", text: core.openQuestion.text } : null;
    case "say":
      return { speaker: beat.speaker, text: beat.text };
    case "answer":
      return { speaker: "maria", text: beat.text };
    case "act":
      return beat.line ? { speaker: "maria", text: beat.line } : null;
    case "end":
      return { speaker: "maria", text: beat.line };
    case "handover":
      return null;
  }
}

// The four buttons. Positions are indexes into the flattened script.
export type NavAction = "next" | "back" | "nextStep" | "backStep";

export function navigate(script: Part[], position: number, action: NavAction): number {
  const beats = flatten(script);
  const last = beats.length - 1;
  const partStart = (part: number) => beats.findIndex((b) => b.part === part);
  const part = beats[position].part;
  switch (action) {
    case "next":
      return Math.min(position + 1, last);
    case "back":
      return Math.max(position - 1, 0);
    case "nextStep":
      return part + 1 < script.length ? partStart(part + 1) : last;
    case "backStep":
      // Mid-part: back to the start of this part. At its start: the previous part.
      return position > partStart(part) ? partStart(part) : partStart(Math.max(part - 1, 0));
  }
}
