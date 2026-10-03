# 05: Ari watches: Core + decision cards

**What to build:** Ari turns the expert's actions into a live record. The **Apprentice Core** exists as a pure reducer `(state, input) → (state, effects)`, with all judgment going through an injected **Judge** interface. The **normal map** (steps and common options, from the seed's two layers; each option knows if it's required / allowed / outside the procedure) lets the Core turn events into steps and choices ("Vendor step: picked B"). A side panel shows one decision card per step: step name, chosen option, the options not chosen (faded), and ✓ predicted / ✗ didn't predict from the Judge's next-move guess. A scripted fake Judge and a test harness exist so later tickets can replay scenarios through the Core with no network. Core contract (from the spec):

```ts
type CoreInput =
  | { kind: "session_start"; profile: Profile; mode: "expert" | "newcomer" }
  | { kind: "workspace_event"; event: WorkspaceEvent; at: number }
  | { kind: "utterance"; speaker: "expert" | "newcomer"; text: string; lang: string; at: number }
  | { kind: "busy_changed"; busy: boolean }
  | { kind: "tap_to_hear" }
  | { kind: "command"; name: "show_me" | "end_session" | "review_continue" | "review_skip" }
  | { kind: "judge_result"; requestId: string; result: unknown };
```

Effects include `upsert_card`, `judge_request`, `ask`, `signal_pending_question`, `teach_explain`, `warn_guardrail`, `drive_cursor`, `switch_language`, `end_review_item`, `show_review_list`, `avatar`.

**Blocked by:** 03

**Status:** done

- [x] Core is a pure, deterministic reducer; no network calls inside it
- [x] Normal map built from the seed; events map to the right step and option
- [x] Decision cards appear live in the expert-mode side panel with chosen + faded alternatives
- [x] Next-move prediction requested from the Judge and shown as ✓ / ✗ on the card
- [x] Fake Judge + test harness: a test feeds inputs, answers judge_requests from a script, asserts effects
- [x] Test: requesting 3 quotes then picking Vendor B yields two cards with correct options and prediction marks

**Note:** Core inputs/effects implemented so far: session_start, workspace_event, judge_result → upsert_card, judge_request. Later tickets extend the unions. The browser uses a rule-based Judge (procedure-minded predictions) until the Claude Judge lands in 06.
