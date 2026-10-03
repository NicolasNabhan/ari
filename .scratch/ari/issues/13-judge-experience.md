# 13: Judge experience

**What to build:** A judge opening the Vercel link alone gets a great experience. The real start page offers "Learn from Maria" first (newcomer mode on a **preloaded Maria session recorded from a real run**, replacing the hand-written one) and "Teach Ari as Maria" (profile prefilled: Maria · Procurement Manager · Northwind Supply; small script cards suggest what to do and say; Ari reacts for real if the judge goes off script). When a guided session ends, the app switches to newcomer mode with the line "Now watch Ari teach what you just taught it", using the judge's own answers.

**Blocked by:** 06, 08

**Status:** done

- [x] Start page with both modes, 'Learn from Maria' first
- [x] Preloaded Maria session recorded from a real run and shipped as a static file
- [x] Guided mode: prefilled profile, script cards for each demo moment
- [x] Off-script actions get real reactions (not canned)
- [x] Ending a guided session hands off to teach mode with the judge's own session

**Notes:** Preloaded session = src/lib/apprentice/mariaRecorded.json, captured from a real guided run in the browser (rule Judge). The hand-written mariaSession.ts stays as the test fixture. Guardrails are derived from the expert's must-follow approval answers (lessons.ts). Teaching wording made gender-neutral ("Maria's reason", no she/her).
