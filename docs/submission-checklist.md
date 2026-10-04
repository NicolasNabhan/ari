# Submission checklist: Hack-Nation, due 9:00 AM Sunday Oct 4

Everything goes to **app.hack-nation.ai** and to the **backup Google form**.
Feature freeze is **6:00 AM**. After that: only bug fixes, videos and submitting.

## The five things to submit

| # | Item | Status | Who |
|---|---|---|---|
| 1 | **Live demo on Vercel** | Not deployed yet | You (import), me (checks) |
| 2 | **Public GitHub repo**: github.com/NicolasNabhan/ari | Public; latest work not pushed yet | Me (push when you say go) |
| 3 | **Demo video**: shows the product | Not started | You record |
| 4 | **Tech video**: explains how it's built | Not started | You record; I write the script |
| 5 | **Team video**: introduces the team | Not started | You |

## Step by step

### Now until about 6 AM: finish the product
- [ ] Put the real ElevenLabs key in `.env.local`: `ELEVENLABS_API_KEY=…` (you)
- [ ] Optional: `ANTHROPIC_API_KEY=…` for Claude. Without it, Ari uses its built-in rules and the demo still works. (you)
- [ ] Merge the three features as they finish: eye tracking, week and schedule, files and meetings (me)
- [ ] Run the whole demo in Chrome once: start page → step 1 → step 2. Fix what breaks. (me)
- [ ] Test the ElevenLabs voice and transcription with the real key (me)
- [ ] Update the README: what Ari is, how to try it, how it's built, and licences. TalkingHead avatar is CC BY-NC; WebGazer is GPLv3. (me)
- [ ] Push to GitHub (me, once you say go)

### Make it live (about 15 minutes)
- [ ] vercel.com → **Add New → Project** → import `NicolasNabhan/ari` (you)
- [ ] **Settings → Environment Variables**: add `ELEVENLABS_API_KEY`, plus `ANTHROPIC_API_KEY` if you have one (you)
- [ ] Deploy, then open the link in a fresh Chrome window (incognito). Allow the mic, run step 1 and step 2. (you + me)
- [ ] Every later push redeploys automatically

### About 6 to 8:30 AM: videos
- [ ] **Demo video (2 to 3 minutes)**, recorded on the live link:
  1. Start page: "Ari is our AI that learns from veteran employees… Maria is a simulated veteran."
  2. Step 1: Maria picks Brightline. Ari asks why, files it under strong advice, and catches the CFO rule as an unwritten rule. Show eye tracking, the week patterns and a meeting transcript.
  3. Step 2: the new hire asks "why?", says "show me", switches to Spanish, and gets stopped before breaking the CFO rule. Show the generated week plan.
- [ ] **Tech video (2 to 3 minutes)**: workspace events → Apprentice Core (a pure, tested reducer) → Judge (Claude, or the built-in rules) → ElevenLabs voice (speech and Scribe transcription) → eye tracking, week patterns, files and meetings → teach mode. I'll write the script.
- [ ] **Team video**: who's on the team and why this problem matters
- [ ] Upload the videos (YouTube unlisted, or wherever the form asks)

### Before 9:00 AM: submit
- [ ] Fill in **app.hack-nation.ai**: the Vercel link, the GitHub link and the three videos
- [ ] Fill in the **backup Google form** with the same links
- [ ] Open each link once from the form to check it works
