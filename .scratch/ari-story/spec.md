# Spec: Ari, the story version (real-time 3D characters)

Status: closed (abandoned 2026-10-04)
Label: ready-for-agent

Re-prototype of the judge experience. First decided 2026-10-03 as AI-video clips. Changed the same day to **real-time 3D characters** rendered with three.js on top of the real website, because the clips couldn't line up with real buttons and weren't interactive. Reuses the workspace, the Apprentice Core, teach mode and the voice stack.

## Problem Statement

The current site doesn't make it clear who is teaching and who is learning. The judge plays Maria, Ari is a face in a box, and the story of knowledge passing from an expert to a newcomer has to be pieced together from cards and banners.

## Solution

A short story played live over the real website:

- **Maria** is a young, cartoonish, high-quality 3D woman. She is a Tripo-generated model with a Mixamo skeleton, framed from the knees up, and she walks with depth: smaller far away, bigger up close. She talks to the viewer: it's one of her last days, so they gave her a pet to learn how she works. **Ari, the corgi pet** (the learner; a placeholder now, a generated model later), jumps into her arms.
- Maria does the laptop purchase on the website. She walks to each button, raises her arm (inverse kinematics), and her fingertip lands on the real button, which really gets clicked. For a high button she extends a telescoping pointer, and its tip lands on the button.
- Ari interrupts at the key moments ("Wait, why Brightline? It's more expensive!"), and Maria answers. An animated pop-up shows the knowledge type: must follow, strong advice, your choice, or unwritten rule. The pop-up is driven by the real Core.
- Speech: ElevenLabs voices (or the browser fallback) with a lip-synced cartoon mouth, comic speech bubbles that reveal word by word, and soft sound effects.
- The judge watches, with play / pause / skip.
- **Learning:** Maria waves goodbye. The judge is the new hire. Ari teaches the chair request on the same stage with a live voice: "why?", "show me", Spanish, and the guardrail warning.

## User Stories

1. As a judge, I want to understand within seconds who the expert is and who the learner is.
2. As a judge, I want Maria to look like a high-quality, young, cartoonish 3D character whose mouth moves with her speech.
3. As a judge, I want Maria to explain why the pet is there, and the pet to jump into her arms.
4. As a judge, I want Maria to click the real website, with her fingertip exactly on each button, and the website to react.
5. As a judge, I want her to use an extendable pointer for a high button, with its tip exactly on the button.
6. As a judge, I want the pet to ask "why?" only at the moments that matter, and Maria to answer.
7. As a judge, I want a pop-up showing what type of knowledge each answer was.
8. As a judge, I want to pause, resume and skip to the learning part.
9. As a new hire, I want the pet to teach me step by step, answer "why?", show me, speak Spanish, and stop me before I break Maria's rule.

## Implementation Decisions

- **Fixed stage:** in story mode the website renders on a fixed 1440×900 stage, scaled uniformly to fit the window, so 3D positions and button positions never drift relative to each other.
- **3D layer:** a transparent three.js canvas over the stage. Perspective camera at (0, 0.97, 3.6), fov 22; z < 0 is farther away.
- **Maria:** `public/avatars/maria.glb`, a Mixamo-named skeleton, no morph targets. Mixamo clips are retargeted using both rest poses. Raw Mixamo FBX files stay out of the public repo.
- **MariaActor:** `walkTo`, `face`, `wave`, `point`, `pressAt(stageX, stageY, {high})`.
- **Reach maths:** a pure module turns stage pixels into a world target, solves a 2-bone IK with an aimed index finger, and reports when a target is unreachable so the pointer is used.
- **Mouth:** a cartoon mouth parented to the head bone, driven by visemes from word timings (ElevenLabs alignment, browser boundary events, or an estimate).
- **Director:** a timeline of beats (say, walk, press, ask, pop-up). Maria's actions are real workspace events, so the Core runs underneath and produces the real decision cards and classifications.

## Testing Decisions

Pure, tested modules:
- stage fit
- retarget sanity (head above neck, no flips)
- reach/IK (projected fingertip error under 6 px)
- text → visemes
- word-progress events
- the director timeline (order, pause, skip, and every Core question answered)

Rendering is checked in the browser and on dev pages (/dev-maria, /dev-mouth, /dev-voice).

## Out of Scope

Mobile layout; free camera; the judge playing Maria in the story (the classic /teach mode still exists).
