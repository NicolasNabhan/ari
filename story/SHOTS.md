# Ari story: clips to generate (Kling + Veo)

This is everything to generate for the story. Drop each finished file into `public/story/clips/` named exactly as the clip ID (for example `M01.mp4`). I'll mark where the finger presses, and the player handles the rest: removing the green background, lining the fingertip up with the button, and firing the real click.

**Use Veo** for clips where someone talks: it makes the voice and the lip-sync together. **Use Kling** for action clips with no speech (walking, jumping, pressing): its motion is great, and its image reference keeps the characters consistent. Either tool is fine for the rest.

---

## Step 0: lock the look first (2 reference images)

Generate these as **images** first (Kling's image generator or Gemini/Imagen). Pick the best one of each, then attach it as the reference image ("image-to-video" / "elements") in **every** clip below. This is what keeps Maria and Ari looking the same across all clips.

**REF-MARIA**
> High-quality stylised 3D animated-film character, full body, standing, facing the camera, friendly smile. A young woman in her early twenties, slim, warm light-brown skin, big expressive brown eyes, shoulder-length wavy dark-brown hair with a few loose strands. She wears a soft cream cable-knit sweater over a white collared shirt, slim navy trousers and clean white sneakers, with a small gold "Northwind" badge on a lanyard. Soft, even studio lighting from the front-left, subtle rim light. Solid flat chroma-key green background (#00B140), no floor, no shadows on the background, no text. Ultra-detailed, polished, cinematic animated-movie quality.

**REF-ARI**
> High-quality stylised 3D animated-film character: an adorable corgi puppy, full body, sitting, facing the camera, head slightly tilted with curiosity. Fluffy orange-and-white fur, big shiny expressive eyes, perky ears, a short fluffy tail. A slim glowing teal collar with a small round glowing tag, a hint that it's a smart little learner. Soft, even studio lighting from the front-left. Solid flat chroma-key green background (#00B140), no floor, no shadows, no text. Ultra-detailed, polished, cinematic animated-movie quality.

---

## Rules for every clip (paste these at the end of every prompt)

> Locked-off static camera, no camera movement, no zoom, no cuts. 16:9, 1080p. Solid flat chroma-key green background (#00B140) filling the whole frame, evenly lit, no floor, no shadows on the background, no props, no text, no logos. Same character design as the reference image. Stylised 3D animated-film look, soft studio lighting from the front-left.

- **Full-body clips:** the character is head-to-toe, filling about 80% of the frame height.
- **Waist-up clips:** framed from the waist up, the head about one fifth from the top of the frame.
- **Press clips:** the finger (or pointer) must **pause for at least half a second at full extension**, so I can mark the exact frame.
- If Veo adds music, regenerate or ask for "no music, only her voice and soft room sound".

**Voices (Veo):** Maria is *"a bright, warm young woman's voice, American accent, friendly and natural"*. Ari is *"a small, cheerful, slightly squeaky cartoon puppy voice, curious and playful"*. Use the same wording every time so the voices stay consistent.

---

## Must-have clips (the demo needs these)

| ID | Tool | Length | Framing | What happens / what's said |
|---|---|---|---|---|
| **M01** | Kling | 5–8 s | Full body | Maria walks in from the left edge of the frame, coming slightly toward the camera, stops in the centre, smiles and gives a small wave. No speech. |
| **M02** | Veo | 8 s | Waist-up | Maria, to camera: *"Hi! I'm Maria. I've been the procurement manager here at Northwind for eight years… and this is one of my last days."* |
| **M03** | Kling | 5–8 s | Full body, both | Ari runs in from the right, jumps up into Maria's arms; she catches the puppy, laughs and hugs it. No speech. |
| **M04** | Veo | 8 s | Waist-up, both | Maria holds Ari. Maria: *"So they gave me this little one to learn the way I do things."* Ari, wagging, looking at the camera: *"And I'll pass it all on to the next person!"* |
| **P1** | Kling | 5 s | Full body | **Press, chest height.** Maria, standing to the right of frame centre, turns slightly to the left, reaches out with her right index finger and taps an invisible button in the air at chest height on the left side of the frame, **holds half a second**, smiles, lowers her arm. No speech. *(Reused for most clicks.)* |
| **P2** | Kling | 5 s | Full body | **Press, low.** Same as P1, but the invisible button is at waist height, a little lower. |
| **P3** | Kling | 8 s | Full body | **Telescoping pointer.** Maria pulls a small silver telescoping pointer out of her sweater pocket, extends it with a quick satisfying flick, reaches up and taps an invisible button high above her on the left with the tip, **holds half a second**, retracts it and puts it away. No speech. |
| **A01** | Veo | 6 s | Full body, Ari | Ari sits on the left of frame, ears up, head tilted, looking up to the right (at Maria): *"Wait a second… why Brightline? It's more expensive!"* |
| **M10** | Veo | 8 s | Waist-up | Maria looks down to her left (at Ari), then smiles: *"Apex shipped late twice last year, and Friday is a hard deadline."* |
| **A02** | Veo | 5 s | Full body, Ari | Ari, excited, little hop: *"Ooh, where does that number come from?"* |
| **M11** | Veo | 8 s | Waist-up | Maria, to Ari: *"Forty percent price, sixty percent delivery record. It's Finance's formula — nobody ever wrote it down."* |
| **A03** | Veo | 6 s | Full body, Ari | Ari, puzzled: *"Hmm, the procedure says you can approve that yourself. Why the CFO?"* |
| **M12** | Veo | 8 s | Waist-up | Maria, serious then warm: *"New suppliers over twenty-five thousand always go to the CFO first. It's not written down anywhere."* |
| **M15** | Veo | 8 s | Full body | Maria, to camera: *"That's everything. Take good care of the next person, Ari!"* She waves, turns and walks away toward the back right, getting smaller. |

## Ari's learning loops (for the interactive part)

Each one should **start and end in the same pose**, so it loops smoothly. No speech; Ari's lines are spoken live over them.

| ID | Tool | Length | What happens |
|---|---|---|---|
| **L1** | Kling | 5 s | Idle: Ari sits, breathes, blinks, small tail wag, looks at the camera. |
| **L2** | Kling | 5 s | Talking: Ari sits and "talks" to the camera, mouth opening and closing, expressive head tilts. |
| **L3** | Kling | 5 s | Happy: Ari does a little happy hop and spin, then sits again. |
| **L4** | Kling | 5 s | Alarmed: Ari jumps up, ears up, one paw raised as if saying "Wait!", then settles. |
| **L5** | Kling | 5 s | Pointing: Ari raises a front paw and points to the left of frame, then puts it down. |
| **L6** | Kling | 5 s | Trot in: Ari trots in from the right edge and sits facing the camera. |

## Nice-to-have

| ID | Tool | Length | What happens |
|---|---|---|---|
| **M20** | Veo | 6 s | Waist-up, Maria to camera: *"Okay! Let's get Marketing their laptops."* |
| **M21** | Kling | 5 s | Full body: Maria side-steps from left to right with a light, natural walk. |

---

## When a clip is done

1. Save it as `public/story/clips/<ID>.mp4` (for example `public/story/clips/P1.mp4`).
2. Tell me which ones are in. I'll mark the press frames and the fingertip, and check the green removal.

**Tips if a result looks off:** if the background isn't flat green, add *"pure flat green screen, studio chroma key"*. If the camera moves, add *"tripod shot, static frame"*. If the hand is blurry at the press, add *"clear, steady hand, finger fully extended, holds still for half a second"*.
