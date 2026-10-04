# Spec: the Ari walkthrough (step 1 plays itself, step 2 starts from the schedule)

Status: open
Label: ready-for-agent

Decided in the grilling session on 2026-10-04, before the 9 AM submission. This replaces the "judge plays Maria" guided mode and the 3D story.

## Problem Statement

Judges open the site without knowing who Ari or Maria is. In step 1 they had to act out Maria's clicks themselves. That hides the point, which is to *watch* Ari analyse an expert. The new big-picture features (eye tracking, the week and its patterns, files and meetings) are easy to miss. Step 2 jumps straight into a single purchase, without showing that Ari passes down the whole job, starting with the schedule.

## Solution

The demo is framed as a simulation inside an **office simulator**. **Ari** is our learner bot (later a little robot, bottom-right). **Maria** is a simulated expert (left side).

**Step 1, "Ari learns from Maria":** Maria's session plays by itself, but it feels like a live website, not a video. The judge moves through it with four buttons:
- left side: **Back** (one question or action) and **Back a step** (one part);
- right side: **Next** (one question or action) and **Next step** (one part).

There is no play/pause and no skip link. The flow:
1. Ari asks what Maria is working on. She answers.
2. Ari asks to turn on eye tracking "to see exactly what you're reading". She says yes. No real eyes are tracked. From then on, what Maria read appears on the decision cards and sharpens Ari's questions.
3. Before each click, Maria says what she's about to do. Her labelled cursor moves to the button. The strip around that button stays bright while the rest of the screen dims (a slight zoom is optional). She clicks, and the next screen returns to normal.
4. Lines show as bubbles over the speaker: Maria on the left, Ari at the bottom right. Each speaker has its own voice; Ari's is a robot voice.
5. Week & schedule and Files & meetings carry a small "New" dot. They open as a panel over the workspace, and closing it returns exactly to where Maria was. Near the end, Ari says it also learned from her calendar, files and meetings.
6. It ends with Ari reading back its least-certain guess and Maria confirming it. Then comes a short "What Ari learned" summary, then "Maria has left the office…".

**Step 2, "Ari teaches the new employee":**
1. It opens with: "Now you're going to test whether Ari learned well and whether it can teach. You'll learn from Ari."
2. Ari says the first thing to check is the schedule, because it shapes the whole workflow. The Week menu item glows and the judge opens it.
3. Ari reads today's plan and points out the Tuesday discount pattern.
4. Then: "Now let's do your first purchase." The chair lesson continues as it works today.

## User Stories

1. As a judge, I want the start page to explain Ari, the office simulator, Maria and the new employee, so that I know what I'm about to see.
2. As a judge, I want step 1 to play Maria's session for me, so that I can watch Ari analyse an expert instead of acting.
3. As a judge, I want to advance one question or action at a time, so that I can take in each moment.
4. As a judge, I want to jump a whole part forward, so that I can move quickly through parts I understand.
5. As a judge, I want to go back one action or one part, so that I can re-watch something I missed.
6. As a judge, I want the screen, the cards and Ari's state to always match my position, even after going back.
7. As a judge, I want Ari to ask Maria what she's working on, so that I see how a session starts.
8. As a judge, I want Ari to ask to turn on eye tracking and Maria to agree, so that I learn Ari can see what an expert reads.
9. As a judge, I want the decision cards to show what Maria looked at and for how long, so that I see the eye tracking matters.
10. As a judge, I want Ari's question to use what Maria read ("You spent a while on Apex's late deliveries…"), so that I see Ari being precise.
11. As a judge, I want Maria to say what she's about to do before she clicks, so that I can follow her work.
12. As a judge, I want to see Maria's cursor move to the button she clicks, so that it feels like a real person on the website.
13. As a judge, I want the area around the clicked button to stay bright while the rest dims, so that my eye goes to the action.
14. As a judge, I want each line to appear as a bubble over the speaker, so that I can follow the conversation even with the sound off.
15. As a judge, I want Maria and Ari to have clearly different voices, so that I can tell them apart.
16. As a judge, I want to see when Ari files a reason as a must-follow rule, strong advice, a personal choice or an unwritten rule, so that I see what Ari learned.
17. As a judge, I want a hint that Ari also learns from Maria's calendar, files and meetings, so that I know those features exist.
18. As a judge, I want to open Week & schedule or Files & meetings during step 1 without losing my place.
19. As a judge, I want step 1 to end with Ari checking its least-certain guess with Maria, so that I see Ari confirm what it wasn't sure of.
20. As a judge, I want a short summary of what Ari learned, so that I have proof before moving on.
21. As a judge, I want a clear "Maria has left the office" moment, so that I understand the handover.
22. As a judge in step 2, I want to be told I'm now testing whether Ari learned well and can teach.
23. As a new employee, I want Ari to start with the schedule, because it shapes the whole workflow.
24. As a new employee, I want the Week menu item to glow so I know where to click.
25. As a new employee, I want Ari to read today's plan and point out the weekly discount pattern, so that I know when to do things.
26. As a new employee, I want Ari to then take me through my first purchase, as before.
27. As the team, I want Maria's whole session to be one script, so that the wording can change without touching code.
28. As the team, I want the real voices to drop in later without rework.

## Implementation Decisions

- **Walkthrough module (new, pure):**
  - Maria's scripted session is a list of **beats** grouped into **parts**: opening and eye tracker; choosing a vendor; scoring; approval; review and transition.
  - Each beat is one of: a line (speaker + text), a click (target + the workspace event it produces + Maria's pre-click line), what she looked at (attention records), or a Core input (her spoken answers).
  - A small reducer holds the position and handles next, back, nextStep and backStep.
  - The view at any position is rebuilt by replaying the beats up to it through the Apprentice Core. Going back replays instantly, with no animation.
- **Eye tracking in the walkthrough:** the scripted attention records go through the Core's existing attention input. The real webcam tracker stays as an optional side feature; it's not used in the walkthrough.
- **Presenter (UI):**
  - It plays the beat at the current position: bubble, voice, cursor glide, spotlight, then the real click on the workspace.
  - It reuses the workspace components and their data-ari targets, the existing cursor-driving helper, and the per-speaker speech helper.
  - Maria's bubble anchors to the left edge, Ari's to the bottom-right.
- **Spotlight:** a dimming overlay with a cut-out around the strip holding the target button. It clears after the click.
- **Side screens in step 1:** they open as an overlay panel and don't advance the walkthrough.
- **Step 2 opening:** a new teach-mode opening in the Core/teach phrases. Ari first explains it's a test and points to the schedule, and the Week menu item glows. Once the Week screen is opened, Ari reads today's plan (from the existing plan builder) and the top pattern, then continues to the purchase lesson.
- **The "play Maria yourself" guided mode is removed** from navigation.
- **Voices:** keep the per-speaker voice setting. Ari's voice will be a robot voice; voice tuning is deferred.

## Testing Decisions

- Test external behaviour at the highest seam.
- **Walkthrough tests:** replay the script through the Core with the rule Judge, as the existing demo replay test does. Check:
  - which cards, asks and levels exist after each part;
  - that Next, Back, Next step and Back a step land on the right beat;
  - that back-then-forward gives the same state;
  - that the bubble speaker and text, and the spotlight target, at a position are right;
  - that every click target exists in the workspace.
- **Step 2 opening:** one or two tests next to the existing teach tests. The first explanation points to the schedule; opening the Week screen leads to the plan and then the purchase.
- **Checked in the browser, not by tests:** the cursor, the spotlight, the bubbles and the voices.

## Out of Scope

- Character art and animation, and voice quality (deferred).
- Real eye tracking in the walkthrough.
- A judge-controlled Maria mode.
- Real Zoom/Google sign-in.
