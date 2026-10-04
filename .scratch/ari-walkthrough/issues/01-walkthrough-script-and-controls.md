# 01: Walkthrough script and controls, part 1 on screen

**What to build:**
- Step 1 opens Maria's walkthrough instead of the "play Maria yourself" mode.
- Her whole session is written as one script of beats, grouped into parts: opening and eye tracker; choosing a vendor; scoring; approval; review and transition.
- The judge moves through it with Back / Back a step (left) and Next / Next step (right). The screen and Ari's state always match the position, because the position is rebuilt by replaying the script through the Apprentice Core.
- Part 1 plays on screen:
  - Ari asks what Maria is working on, and she answers.
  - Ari asks to turn on eye tracking to see exactly what she's reading, and she says yes.
  - Each line shows as a bubble over the speaker (Maria on the left, Ari bottom-right) and is spoken in that speaker's voice.
- The start page wording says the judge *watches* Maria. It no longer says "step into Maria's shoes".

**Blocked by:** None (can start immediately).

**Status:** done

- [x] The script covers all five parts as beats (lines, clicks with Maria's pre-click line, what she looked at, her spoken answers)
- [x] The walkthrough reducer handles next, back, nextStep and backStep (tested)
- [x] Replaying to any position gives the same Core state as stepping forward to it; back-then-forward is identical (tested)
- [x] Replaying the whole script through the Core with the rule Judge gives the expected cards, levels, unwritten rules and asks (tested)
- [x] Every click target in the script exists in the workspace (tested)
- [x] /teach shows the walkthrough with the four buttons. There is no play/pause and no skip link, and the guided "play Maria yourself" mode is gone.
- [x] Part 1 plays on screen with bubbles (Maria left, Ari bottom-right) and per-speaker voices
- [x] Start page wording updated
