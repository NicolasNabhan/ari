# 14: Demo-ready: full-script replay + polish

**What to build:** The whole demo is locked in. One Core test replays the full demo script end to end with the fake Judge: session start; quiet at 3 quotes; ask at Vendor B → 🟡 lesson learned + deadline; ask at CFO routing → 🔴 team convention + Unwritten; 'where does that number come from?' → told by a person; end-of-session review reads the least-certain first; in teach mode, 'show me' → drive_cursor, Spanish → switch_language, $30k new-supplier approval → warn_guardrail. The repo has a judge-facing README (what Ari is, how to try it, architecture, how real tools would plug in). The optional React Flow graph view is added only if time allows. The final Vercel deploy is verified by walking both judge modes.

**Blocked by:** 07, 09, 10, 11, 12, 13

**Status:** ready-for-agent

- [ ] Full-script replay test passes
- [ ] README for judges: pitch, live link, how to try both modes, architecture, production path
- [ ] Both judge modes walked end to end on the production Vercel URL
- [ ] Fallback face and per-visit cap verified on the deployed app
- [ ] (Optional) graph view toggle
