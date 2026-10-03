# 09: Teach mode: "show me", Spanish, Procedure

**What to build:** Teaching feels like Aidan. When the newcomer says "show me", Ari takes over the cursor and performs the step live in the workspace (e.g. opens the delivery history, moves to Vendor B) while explaining it, then hands control back. If the newcomer speaks Spanish, Ari answers and keeps teaching in Spanish. The session's decisions are compiled into an ElevenLabs Procedure that the tutor agent follows step by step.

**Blocked by:** 08

**Status:** ready-for-agent

- [ ] Core test: 'show me' emits drive_cursor with the step's actions
- [ ] Ari's own cursor visibly performs the step in the workspace, then control returns
- [ ] Core test: a Spanish utterance emits switch_language; subsequent explanations are in Spanish
- [ ] The session compiles into an ElevenLabs Procedure used by the tutor agent
- [ ] Works with the hand-written session and with any recorded session of the same shape
