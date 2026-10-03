# Spec: Ari, the AI Apprentice

Status: open
Label: ready-for-agent

Source: `written-prototype.md` (settled in the 2026-10-03 design review). Deadline: everything submitted to Hack-Nation by 9 AM Sunday; feature freeze around 6 AM.

## Problem Statement

When an experienced employee leaves, the company loses more than their output: it loses *how* and *why* they did the job. A Procurement Manager like Maria knows the written procedure, but also the unwritten rules ("new suppliers over $25k always go to the CFO"), the lessons learned ("Vendor A shipped late twice"), the formulas that live only in Finance's head (40% price, 60% delivery record), and who to contact for what. None of that is in the procedure manual. A newcomer can copy the steps and still break a rule nobody told them about, or treat Maria's personal habits as hard rules.

Experts don't have time to write all this down or to teach every new hire. And asking them "why?" about every click would be unbearable.

## Solution

**Ari** is a voice-powered apprentice with a live face. It sits beside the expert while they work in their (for the prototype: a fake) company workspace. It watches every step. It speaks up only when it can't work out the reason for a choice **and** the reason matters to the next person, and it asks right away, out loud. Every reason is sorted into a type and a level (🔴 must follow / 🟡 strong advice / 🟢 your choice), and anything not in the written procedure is flagged as **Unwritten**. Ari also notices *how* the expert works and what knowledge the work depends on.

Later, Ari teaches a newcomer inside the same workspace. It explains every step out loud, answers "why?", takes the cursor to show how Maria did a step, switches language on request, and warns before the newcomer breaks one of Maria's rules.

Judges use a Vercel-hosted link with two modes: **Learn from Maria** (her session is preloaded) and **Teach Ari as Maria** (guided). The guided mode ends with Ari teaching back the judge's own answers.

## User Stories

### Account and session

1. As an expert, I want to enter my name, job role and company once on a one-screen profile, so that Ari knows my general job without asking every session.
2. As an expert, I want the profile to need no password, so that I can start in seconds.
3. As an expert, I want my profile remembered in this browser, so that I don't fill it in again.
4. As an expert, I want Ari to greet me by name and ask "what are you working on today?" when I start a session, so that it knows today's specific task.
5. As an expert, I want to answer that question by voice, so that I don't stop to type.
6. As an expert, I want Ari to load the matching part of the procedure from my answer, so that it knows what "normal" looks like for today's task.
7. As an expert, I want to end a session with one clear action, so that Ari knows I'm done.

### The workspace

8. As an expert, I want an inbox where purchase requests arrive, so that I can start work the way I normally do.
9. As an expert, I want a purchase-request queue, so that I can open and track the request I'm handling.
10. As an expert, I want a vendor list with each vendor's quote and delivery history, so that I can compare suppliers.
11. As an expert, I want to request quotes from vendors, so that I can follow the 3-quote rule.
12. As an expert, I want a scoring sheet where I can type vendor scores, so that I can rank suppliers my usual way.
13. As an expert, I want to select a vendor and change my mind, so that I can work naturally.
14. As an expert, I want to approve an order myself or route it to my manager or the CFO, so that I can follow (or go beyond) the approval rules.
15. As an expert, I want a team chat and email to message Finance, the requester or the CFO, so that I can coordinate the way I really do.
16. As an expert, I want to open the company's written procurement procedure, so that I can check it while working.
17. As a builder, I want every workspace action to report a named event with a timestamp, so that Ari always knows the exact step and option without screen-scraping.

### Watching

18. As an expert, I want Ari to turn my actions into steps and choices ("Vendor step: picked B"), so that my path is recorded in plain terms.
19. As an expert, I want to see a live decision card appear for each step in a side panel, so that I can see what Ari is learning.
20. As an expert, I want each card to show the options I didn't pick, faded, so that the choice is clear in context.
21. As an expert, I want Ari to guess my next move and show ✓ predicted or ✗ didn't predict on the card, so that I can see when it understood me.
22. As an expert, I want Ari to note when I pause before a decision, so that hard calls are visible to the next person.
23. As an expert, I want Ari to note what I checked before deciding (e.g. a vendor's delivery history, the procedure page), so that the newcomer learns my research habits.
24. As an expert, I want Ari to note who I contacted and about what, so that the newcomer knows who to go to.
25. As an expert, I want Ari to note when I do steps in a different order from the procedure, so that my real workflow is captured.
26. As an expert, I want Ari to note when I change my mind, so that the hard choices are visible.
27. As an expert, I want these "how" notes shown as small grey lines on the cards, so that they don't clutter the reason.

### Asking why

28. As an expert, I want Ari to stay quiet when it can explain my choice confidently, so that I'm not interrupted needlessly.
29. As an expert, I want Ari to stay quiet about choices that don't matter to the next person, even if it doesn't understand them, so that it never asks about every click.
30. As an expert, I want Ari to ask when it doesn't understand a choice that matters, even if the choice is the usual one, so that the real reasons get captured.
31. As an expert, I want Ari to ask when it has some evidence but still has doubt, so that wrong guesses don't slip through.
32. As an expert, I want Ari to stay quiet when a reason is simple and obvious even without specific evidence, so that it isn't pedantic.
33. As an expert, I want Ari to use my past answers as evidence, so that it asks less over time.
34. As an expert, I want Ari to ask right away, at the moment of the choice, so that the reason is fresh.
35. As an expert, I want Ari's face to come forward from its corner bubble when it asks, so that it's clear Ari is talking to me.
36. As an expert, I want Ari to wait while I'm typing in chat or on a call, so that it never talks over a supplier.
37. As an expert, I want a setting to switch Ari to "I have a question" signals that I tap to hear, so that I control interruptions when I'm busy.
38. As an expert, I want to answer Ari's question by voice, so that I keep working.
39. As an expert, I want Ari to ask at most one gentle follow-up when my answer is vague and the difference matters, so that "past experience" and "personal taste" aren't confused.
40. As an expert, I want Ari to accept "it's just my taste" without pushing further, so that it doesn't nag.
41. As an expert, I want Ari to ask "Why?" when I go beyond the written procedure (e.g. sending a $38k order to the CFO), so that unwritten rules get captured.

### Reasons and levels

42. As an expert, I want each reason sorted into one or more types (e.g. lesson learned, deadline), so that its nature is clear.
43. As an expert, I want each reason to carry a level (must follow, strong advice, your choice), so that the next person knows what to copy and what to decide for themselves.
44. As a viewer, I want the level shown as a big coloured badge with the types in smaller text below, so that I get it in a second.
45. As an expert, I want reasons that aren't in the written procedure to show an "Unwritten" ribbon, so that hidden rules stand out.
46. As an expert, I want each card to show whether the reason came from me (🗣) or Ari's own explanation (🤖), so that I know what's confirmed.
47. As an expert, I want Ari's own explanations to show the evidence it used and a certainty bar, so that I can judge them.
48. As a builder, I want the list of reason types kept in data, so that new types can be added without code changes.

### Knowledge behind the work

49. As an expert, I want Ari to work out what knowledge a step needs on its own when it can, so that it doesn't ask the obvious.
50. As an expert, I want Ari to ask "Where does that number come from?" when it can't tell and it matters, so that hidden formulas are captured.
51. As an expert, I want each piece of knowledge tagged with where it lives (public, company document, company system, told by a person, already a given), so that the newcomer knows where to find it.
52. As a company, I want "told by a person" knowledge recorded in full, so that it doesn't disappear when the expert leaves.

### End of session

53. As an expert, I want Ari to offer to go through the decisions it's least sure about when I end the session, so that its guesses can be checked.
54. As an expert, I want Ari to read the three least-certain quiet decisions one at a time, so that checking is quick.
55. As an expert, I want to confirm or correct each one by voice, so that I don't type.
56. As an expert, I want Ari to ask whether to continue after the three, so that I decide how much time to spend.
57. As an expert, I want the remaining quiet decisions shown as a list, least certain first, so that I can check more if I want.
58. As an expert, I want to skip the list with Continue / End session, so that checking is never forced.
59. As a newcomer, I want reasons Maria never confirmed labelled "my best guess, not confirmed by Maria", so that I know how much to trust them.

### Teach mode

60. As a newcomer, I want to do a real task in the same workspace while Ari teaches, so that I learn by doing.
61. As a newcomer, I want a full spoken explanation at every step (options, Maria's choice, the reason and its level), so that I understand the job.
62. As a newcomer, I want Maria's personal-style choices pointed out as optional, so that I don't copy habits as rules.
63. As a newcomer, I want Ari to tell me what knowledge each step needs and where to find it, so that I can actually do the work.
64. As a newcomer, I want Ari to share Maria's "how" habits (e.g. "she always opened the delivery history first"), so that I pick up good practice.
65. As a newcomer, I want the next button or field highlighted, so that I know where to act.
66. As a newcomer, I want to ask "why?" out loud at any step and hear Maria's reason, so that I learn the reasoning, not just the steps.
67. As a newcomer, I want to say "show me" and watch Ari take the cursor and do the step live while explaining it, so that I see exactly how Maria did it.
68. As a newcomer, I want Ari to warn me before I break a must-follow rule, including unwritten ones, so that I don't make a costly mistake.
69. As a newcomer, I want to ask in Spanish and have Ari answer and keep teaching in Spanish, so that language isn't a barrier.
70. As a builder, I want Maria's decisions compiled into an ElevenLabs Procedure, so that the tutor follows a step-by-step playbook.

### Ari's presence

71. As any user, I want Ari to have a live, lip-synced human face, so that the experience feels magical.
72. As any user, I want Ari to be its own character that talks *about* Maria, so that it never impersonates a real person.
73. As an expert, I want Ari as a small quiet bubble in the corner while I work, so that it isn't distracting.
74. As a newcomer, I want Ari's face always visible as my tutor, so that it feels like a person teaching me.
75. As any user, I want a 3D fallback face to take over smoothly if the live stream fails or runs out, so that I never see a broken avatar.

### Judges and the live link

76. As a judge, I want a start page with two clear choices, so that I can try Ari on my own without a presenter.
77. As a judge, I want "Learn from Maria" first, with her session preloaded, so that I see the payoff within a minute.
78. As a judge, I want "Teach Ari as Maria" with a prefilled profile (Maria · Procurement Manager · Northwind Supply), so that I can start with one click.
79. As a judge, I want small script cards suggesting what to do and say, so that I hit the interesting moments.
80. As a judge, I want Ari to react for real when I go off-script, so that I can tell it isn't a recording.
81. As a judge, I want Ari to teach back my own answers after I finish playing Maria, so that I see proof it really learns.
82. As the team, I want each visit capped at about 5 minutes of the live face, then switched to the fallback, so that our credits survive judging.
83. As the team, I want a demo key we can switch off, so that we can stop spending after judging.

### Demo content

84. As the team, I want a seeded Northwind Supply company (procedure, three vendors with quotes and delivery histories, scoring sheet, the 40-laptop request, the 30-chair request), so that the demo is believable and repeatable.
85. As the team, I want the seed to plant Vendor A's late deliveries, the unwritten $25k CFO rule and the 40/60 formula, so that the scripted moments happen.
86. As the team, I want Maria's preloaded session stored as data, so that "Learn from Maria" works without anyone recording live.

## Implementation Decisions

**Architecture.** One Next.js app, started from the ElevenLabs `agents/nextjs/quickstart` example and deployed on Vercel. Vercel only hosts the page and short server routes. Voice, avatar, recording and the on-screen pointing all run in the browser or at ElevenLabs, Claude and HeyGen. Server routes exist only to call Claude and to hand out short-lived ElevenLabs and LiveAvatar session tokens. Prototype-grade throughout: fake data, JSON storage, no logins, no performance or security hardening beyond the credit cap.

**Modules.**

1. **Workspace.** React screens for inbox, request queue, vendors and quotes, scoring sheet, approvals, chat and email, and the procedure page. Every user action emits a typed workspace event through a single event bus. The workspace knows nothing about Ari.
2. **Seed content.** One data file holding the Northwind company, the written procedure (as structured rules with section ids plus readable text), the general procurement layer, vendors, quotes, delivery histories, the scoring formula's existence (not its meaning), both requests, and the guided-mode script cards.
3. **Normal map.** The steps of the task and the common options at each, built from the seed's two layers (general practice + Northwind procedure). Each option knows whether it is required, allowed or outside the procedure.
4. **Apprentice Core** *(the one tested seam)*. A pure reducer: `(state, input) → (state, effects)`. It owns all of Ari's behaviour: turning events into steps and choices, the ask-why policy, the how-factors, card building, follow-ups, the end-of-session review, and teach mode (explanations, guardrail warnings, "show me", language). It never calls the network directly; judgment goes through the Judge interface. It's deterministic given the same inputs and Judge answers.
5. **Judge.** An interface with one implementation backed by Claude (typed outputs via Instructor) and one scripted fake for tests. Calls:
   - explain a choice → explanation, evidence list, confidence 0–1
   - does it matter to the next person → yes/no plus why
   - predict the next move → event guess
   - classify an answer → types (one or more), level, whether it's in the procedure
   - is the answer vague in a way that matters → follow-up question or none
   - infer the knowledge a step needs → knowledge items with source tags, plus confidence
   - detect the language of an utterance
6. **Voice adapter.** An ElevenLabs agent that stays muted while the expert works. The Core's `ask`, `teach_explain` and `warn_guardrail` effects make it speak. Scribe transcripts come back to the Core as utterance inputs. The 10-minute session limit is raised.
7. **Avatar adapter.** HeyGen LiveAvatar through its official ElevenLabs integration. It falls back automatically to TalkingHead on stream failure, when the ~5-minute per-visit cap is reached, or when the demo key is off. Presentation states: corner bubble, coming forward, tutor.
8. **Teach adapter.** It compiles the session's decisions into an ElevenLabs Procedure for the tutor agent. It uses driver.js for highlights and our own scripted cursor that drives the workspace for `drive_cursor` effects.
9. **Decision cards UI.** It renders the Core's cards: step, chosen option and faded alternatives, reason, level badge with types, 🗣/🤖 source, evidence and certainty bar for Ari's own explanations, knowledge items with source tags, the Unwritten ribbon, ✓/✗ prediction, grey how-notes, and the "best guess, not confirmed" label. An optional React Flow graph view comes only if time allows.
10. **Session store.** JSON: the profile in browser storage, the preloaded Maria session as a static file, and new sessions in browser storage. Guided mode's handoff into teach mode reads the just-finished session.
11. **Recording.** rrweb records the workspace, giving timestamps for pauses (backup to the event bus).

**Core inputs and effects** (the contract every adapter speaks):

```ts
type CoreInput =
  | { kind: "session_start"; profile: Profile; mode: "expert" | "newcomer" }
  | { kind: "workspace_event"; event: WorkspaceEvent; at: number }
  | { kind: "utterance"; speaker: "expert" | "newcomer"; text: string; lang: string; at: number }
  | { kind: "busy_changed"; busy: boolean }          // typing in chat / on a call
  | { kind: "tap_to_hear" }                          // expert accepts a pending question
  | { kind: "command"; name: "show_me" | "end_session" | "review_continue" | "review_skip" }
  | { kind: "judge_result"; requestId: string; result: unknown };

type CoreEffect =
  | { kind: "ask"; text: string; cardId: string }
  | { kind: "signal_pending_question" }              // tap-to-hear mode
  | { kind: "upsert_card"; card: DecisionCard }
  | { kind: "judge_request"; requestId: string; call: JudgeCall }
  | { kind: "teach_explain"; text: string; highlight?: string }
  | { kind: "warn_guardrail"; text: string; ruleId: string }
  | { kind: "drive_cursor"; actions: CursorAction[] }
  | { kind: "switch_language"; lang: string }
  | { kind: "end_review_item"; cardId: string; text: string }
  | { kind: "show_review_list"; cardIds: string[] }  // least certain first
  | { kind: "avatar"; state: "bubble" | "forward" | "tutor" };
```

**The ask-why rule** (decided in the design review):
- Ask when `understands == false` AND `matters == true`.
- `understands` means confidence ≥ threshold. Evidence normally lifts confidence. Evidence with doubt stays below the threshold, so Ari asks. A simple, obvious reason without evidence can still clear it.
- A correct next-move prediction counts as evidence. It's not a trigger on its own.
- Ask immediately, unless `busy` is true; then the question is held until `busy` turns false. In tap-to-hear mode, emit `signal_pending_question` and ask only after `tap_to_hear`.
- At most one follow-up per question, only when the Judge flags the answer as vague in a way that matters.
- Borrow interruption thresholds from thoughtful-agents as a starting point.

**Reason levels.** Types live in data, each with a default level. Outside rules and organization rules default to 🔴; practical constraints default to 🔴 with override; experience and judgment default to 🟡; personal defaults to 🟢. A reason's level is the highest level among its types. A reason not covered by the written procedure is flagged Unwritten.

**End-of-session review.** Rank quiet decisions by confidence, lowest first. Read the first three one at a time as `end_review_item`, then ask whether to continue. The rest go out as `show_review_list`. Unreviewed quiet decisions keep `confirmed: false`.

**Teach mode.** At each step: a full spoken explanation, style choices called optional, knowledge and where to find it, how-habits. "Why?" is answered from saved reasons, with unconfirmed ones flagged. Before an action that would break a 🔴 rule (checked against the saved rules, including Unwritten ones), Ari warns before the action completes. Ari follows the newcomer's language once detected.

**Avatar.** Ari is its own character: a friendly young professional from LiveAvatar's stock avatars, with a stock ElevenLabs voice. No voice cloning; it never plays Maria.

**Judges.** The start page offers two modes, with "Learn from Maria" first. Guided mode has a prefilled profile and script cards, and hands off to teach mode with the judge's own session. There's a per-visit live-face cap of about 5 minutes and a switchable demo key.

**Build order.** M1 workspace → M2 watching → M3 asking by voice with the avatar → M6 teach mode → M4 reasons and knowledge → M5 end of session → M7 polish and videos. Each milestone leaves a demoable app.

## Testing Decisions

- **One seam: the Apprentice Core reducer.** Tests feed it a sequence of `CoreInput`s, answer its `judge_request` effects with a scripted fake Judge, and assert on the emitted effects and resulting cards. They test only external behaviour: what Ari says, when, and what the cards show. They never test internal state shape or helper functions.
- **The main test is the demo script replayed end to end:**
  - quiet at "request 3 quotes" (✓ predicted, "follows procedure §2")
  - `ask` at Vendor B over A, with pause and checked-history notes on the card
  - the answer is classified 🟡 lesson learned + deadline
  - `ask` when the $38k order goes to the CFO, classified 🔴 team convention + Unwritten
  - "where does that number come from?", tagged told by a person
  - the end-of-session review reads the least-certain decision first
  - in teach mode, `warn_guardrail` fires when the newcomer approves a $30k new-supplier order, before it completes
  - "show me" emits `drive_cursor`
  - a Spanish utterance emits `switch_language`
- **Focused behaviour tests at the same seam:**
  - the 2×2 rule (understands × matters)
  - a held question while busy
  - tap-to-hear
  - at most one follow-up
  - the level is the highest of its types
  - unconfirmed reasons labelled in teach mode
  - review ordering and the "continue?" prompt after three
- **Not tested automatically:** React UI, ElevenLabs, LiveAvatar, TalkingHead, Claude prompts, driver.js. These are thin adapters, checked by running the demo.
- **Prior art:** none. The repo is greenfield. Use the framework's default test runner (e.g. Vitest).

## Out of Scope

- Watching real tools (email clients, ERPs, spreadsheets) or anything outside our own workspace; no Playwright, Midscene, vision models or desktop recording.
- Real authentication, passwords, multi-user accounts, server-side persistence, Neo4j, Graphiti.
- Voice cloning or any avatar that represents the expert.
- Performance work, security hardening, scaling.
- Roles other than Procurement Manager; a general-purpose normal-map builder.
- BPMN/DMN export, a downloadable checklist, the ghost-cursor replay (replaced by live "show me").
- A separate privacy approval screen (covered by the end-of-session review).
- Showing "asks less over time" in the demo (built simply, not demonstrated).
- Any demo moment where Ari gets something wrong.

## Further Notes

- **Submission (Hack-Nation):**
  - demo video (the script in `written-prototype.md`)
  - tech video (architecture, the ask-why rule, how real tools would plug in)
  - team video
  - a new, dedicated public GitHub repo
  - the live demo on Vercel
  - upload everything to app.hack-nation.ai and the backup Google form
- **Riskiest pieces, so test them first:** LiveAvatar with the ElevenLabs agent, the muted-agent-then-ask pattern, and voice over venue Wi-Fi.
- **Record the demo video** as soon as M6 works, and again after polish.
- **The teammate's research** (commit 19d62a5) is still only in their cloud session. Copy it into the new repo's `docs/research/` once recovered.
- **Northwind content is drafted by Claude** and reviewed by the team. It must plant Vendor A's late deliveries, the unwritten $25k CFO rule and the 40/60 formula.
