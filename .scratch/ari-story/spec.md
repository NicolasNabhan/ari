# Spec: Ari, the story version (AI-video characters)

Status: open
Label: ready-for-agent

Re-prototype of the judge experience, decided 2026-10-03. The characters are **AI-generated video clips** (Kling / Veo) composited on top of the real website, not real-time 3D. Reuses the workspace, the Apprentice Core, teach mode and the voice stack.

## Problem Statement

The current site doesn't make it clear who is teaching and who is learning. The judge plays Maria, Ari is a face in a box, and the story of "knowledge passing from an expert to a newcomer" has to be pieced together from cards and banners. Real-time 3D characters available on the web aren't the cartoon-quality look the team wants.

## Solution

A short, cinematic story played over the real website:

- **Maria** (a young, stylised high-quality 3D cartoon woman, AI-generated video) walks in and talks to the viewer: it's one of her last days, so they gave her a pet to learn how she works. **Ari, a corgi puppy** (the learner), jumps into her arms: "…and I'll pass it all on to the next person!"
- Maria does the laptop purchase on the website. In each click clip she reaches out and taps; the player lines up her fingertip with the real button and fires the real click on that frame. For a high button she pulls out a telescoping pointer; its tip is aligned the same way.
- Ari interrupts at the key moments ("Wait, why Brightline? It's more expensive!"), and Maria answers. An animated pop-up shows what kind of knowledge that was (level + type), driven by the real Core.
- Depth comes from the clips themselves: walking toward the camera, walking away, side steps.
- The judge watches, with play / pause / skip.
- **Learning:** Maria waves goodbye. The judge is the new hire. Ari (looping clips: idle, talking, happy, alarmed, pointing) teaches the chair request with a live voice: "why?", "show me", Spanish, and the guardrail warning.

## User Stories

1. As a judge, I want to understand within seconds who the expert is and who the learner is.
2. As a judge, I want Maria to look like a high-quality, young, stylised 3D character, with lip-synced speech.
3. As a judge, I want Maria to explain why the pet is there, and the pet to jump into her arms.
4. As a judge, I want Maria to click the real website, with her fingertip exactly on each button, and the website to react.
5. As a judge, I want her to use an extendable pointer for a high button, with its tip exactly on the button.
6. As a judge, I want the pet to ask "why?" only at the moments that matter, and Maria to answer.
7. As a judge, I want a pop-up showing what type of knowledge each answer was.
8. As a judge, I want to pause, resume and skip to the learning part.
9. As a new hire, I want the pet to teach me step by step, answer "why?", show me, speak Spanish, and stop me before I break Maria's rule.
10. As the team, I want to drop generated clips into a folder and mark the fingertip once per clip, without code changes.

## Implementation Decisions

- **Fixed stage:** in story mode the website renders on a fixed 1440×900 stage scaled uniformly to fit the window, so clip positions and button positions never drift relative to each other.
- **Keyed video:** clips are generated on a flat green background; a WebGL shader removes the green live (with spill suppression), so the clips need no preprocessing.
- **Clip manifest (JSON):** for each clip: file, size, the line spoken (for captions), and anchors in video pixels, e.g. `press` (the fingertip or pointer tip at a given time) and `feet` (ground contact).
- **Placement:** a clip is placed either on a fixed stage rectangle, or so that its `press` anchor lands on a target element's centre (scaled to a target height). The real click fires when playback reaches the press time.
- **Episode:** a timeline of beats (play clip, place, wait for the press, feed Maria's scripted answer to the Core, show pop-up). Maria's actions are real workspace events, so the Core runs underneath and produces the real decision cards and classifications.
- **Audio:** dialogue comes from the clips (Veo native audio, or Kling lip-sync to a voice track). In the learning part the pet's lines are live TTS over looping clips.
- **Anchor-marking tool:** a dev page to scrub a clip, click the fingertip on the press frame, and save the anchor into the manifest.
- **Placeholder clips** (generated locally with ffmpeg) until the real ones arrive.

## Testing Decisions

Pure, tested modules:
- stage fit (window → scale/offset)
- clip placement (anchor → element alignment math)
- episode timeline (order, pause, skip, click-at-press)
- the script answers every question the Core asks in the episode

Video rendering and keying are checked in the browser.

## Out of Scope

Real-time 3D characters; live reactions inside the Maria episode; mobile layout.

## Further Notes

- The shot list and prompts are in `story/SHOTS.md`, the user-facing generation guide.
- Pet placeholder art and Maria's look are decided by the reference images the user generates first.
