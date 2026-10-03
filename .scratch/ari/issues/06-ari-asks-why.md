# 06: Ari asks why, out loud

**What to build:** The core loop works end to end. A session opens with Ari asking "Hi Maria, what are you working on today?"; the spoken answer sets today's task and loads the matching part of the map. At each choice the Core asks the Judge (backed by Claude with typed outputs via Instructor) to explain it (explanation, evidence, confidence 0–1) and whether it matters to the next person. Rule: ask when **not understood** (confidence below threshold; evidence normally lifts confidence, a simple obvious reason can clear it without evidence, a correct prediction counts as evidence) **and it matters**. Otherwise stay quiet and save Ari's own explanation. When asking, Ari's face comes forward and asks right away by voice (e.g. "Why B over the cheaper A?"); Maria answers by voice; the answer is saved on the card with a basic type classification. Cards show 🗣 (Maria said) or 🤖 (Ari's explanation) plus the evidence and a certainty bar for 🤖.

**Blocked by:** 02, 05

**Status:** done

- [x] Session start greeting by name and today's-task question, answered by voice
- [ ] Claude-backed Judge returns typed results for explain / matters / predict / basic classify *(code done: /api/judge, claude-opus-5-5, structured outputs, fallbacks: "default"; not yet run live: needs ANTHROPIC_API_KEY. The rule Judge covers the demo meanwhile.)*
- [x] Core test: the 2×2 rule — asks only when not-understood AND matters; usual-but-unexplained choices still ask
- [x] Core test: quiet at 'request 3 quotes' (card: follows procedure §2), asks at Vendor B over cheaper A
- [x] Avatar goes forward to ask and back to bubble afterwards
- [x] Spoken answer transcribed and attached to the card as 🗣 with a type
- [x] 🤖 cards show evidence and a certainty bar

**Notes:** assess = explain + matters in one Judge call (types, evidence, confidence, question). Voice runs on browser speech for now; the answer box under Ari's caption accepts typed answers when there's no microphone. Sessions start from a 'Start session with Ari' button (browsers block speech without a click).
