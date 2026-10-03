# 06: Ari asks why, out loud

**What to build:** The core loop works end to end. A session opens with Ari asking "Hi Maria, what are you working on today?"; the spoken answer sets today's task and loads the matching part of the map. At each choice the Core asks the Judge (backed by Claude with typed outputs via Instructor) to explain it (explanation, evidence, confidence 0–1) and whether it matters to the next person. Rule: ask when **not understood** (confidence below threshold; evidence normally lifts confidence, a simple obvious reason can clear it without evidence, a correct prediction counts as evidence) **and it matters**. Otherwise stay quiet and save Ari's own explanation. When asking, Ari's face comes forward and asks right away by voice (e.g. "Why B over the cheaper A?"); Maria answers by voice; the answer is saved on the card with a basic type classification. Cards show 🗣 (Maria said) or 🤖 (Ari's explanation) plus the evidence and a certainty bar for 🤖.

**Blocked by:** 02, 05

**Status:** ready-for-agent

- [ ] Session start greeting by name and today's-task question, answered by voice
- [ ] Claude-backed Judge returns typed results for explain / matters / predict / basic classify
- [ ] Core test: the 2×2 rule — asks only when not-understood AND matters; usual-but-unexplained choices still ask
- [ ] Core test: quiet at 'request 3 quotes' (card: follows procedure §2), asks at Vendor B over cheaper A
- [ ] Avatar goes forward to ask and back to bubble afterwards
- [ ] Spoken answer transcribed and attached to the card as 🗣 with a type
- [ ] 🤖 cards show evidence and a certainty bar
