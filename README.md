# Ari — the AI apprentice

**Ari keeps your experts' know-how when they leave.** It sits beside an expert while they work, asks "why?" only when it can't work out the reason (and the reason matters to the next person), sorts every reason into *must follow / strong advice / your choice*, and then teaches a newcomer by voice, including the rules nobody ever wrote down.

Built for the 7th Hack-Nation Global AI Hackathon, Challenge 1: *The AI Apprentice* (ElevenLabs).

## Try it

The demo is a simulation inside an **office simulator** (a made-up company, Northwind Supply). **Ari** is our program, a little learner bot. **Maria** is a simulated veteran Procurement Manager. Open the live demo in Chrome with sound on:

1. **Step 1: Ari learns from Maria** (about 3 minutes). Maria buys 40 laptops for Marketing while Ari watches. Move through it with **Next** / **Next step** (and **Back** / **Back a step**). Maria says what she's doing and her cursor clicks the real workspace. Ari asks to turn on eye tracking, then asks "why?" only when a choice doesn't add up, and uses what she read to ask sharper questions ("You spent a while on Apex's late deliveries: is that why you picked Brightline?"). It files each reason as must follow, strong advice or your choice, and catches two rules nobody wrote down. It ends with what Ari learned, and Maria leaves the office.
2. **Step 2: Ari teaches the new employee** (2 minutes). You're Sam, the new hire, in the same office. Ari starts with your **schedule**, because it shapes the whole job: the fixed meetings, the breaks, and a pattern only visible across Maria's whole week (OfficeHub's discount drops from 50% on Tuesday to 30% by Thursday, so supplies get ordered on Tuesdays). Then it takes you through your first purchase: ask "why?", say "Show me", switch to Spanish, and try approving a $30k order from a new supplier yourself.

Also worth opening: **Week & schedule** (Maria's week, the patterns Ari found, your generated week, day and task guides) and **Files & meetings** (meeting transcripts, uploads, and the rules Ari pulled out of them).

No microphone? Type your answers in the box under Ari.

## What Ari does

| The challenge asks for | Ari |
|---|---|
| Watches experts work | The workspace reports every action; Ari turns them into steps and choices, and notices *how* the expert works (pauses, what they checked, who they contacted, changes of mind). With **eye tracking** (webcam, opt-in, mouse as a fallback) it also knows what the expert read and for how long before each decision. |
| Asks why at the right moments | Ari explains each choice to itself first. It asks only when it isn't confident **and** the reason would change how someone else does the job. It holds questions while the expert is typing or on a call, offers a tap-to-hear mode, and asks at most one follow-up. |
| Maps decisions and guardrails | Each reason gets a level (must follow, strong advice, your choice) and types; anything not in the written procedure gets an **Unwritten** ribbon. Knowledge behind the work (like Finance's 40/60 scoring formula) is tagged with where to find it. At the end of a session, Ari reads back the guesses it's least sure about. |
| Teaches the next generation | A voice tutor in the same workspace: step-by-step explanations, "why?" answers in the expert's own words, "Show me", Spanish, and guardrail warnings before a mistake happens. The session also compiles into a step-by-step procedure for the tutor agent. |
| The big picture | Ari looks beyond one task: the expert's whole **week** (meetings, breaks, recurring tasks) and patterns only visible across days; **meetings** (connected or recorded, transcribed with ElevenLabs Scribe) and **files**, from which it pulls rules and links them to decisions ("said by David in the CFO check-in"). The new employee gets their week, day and task guides straight away. |
| Voice-powered | Ari speaks and listens throughout, with a talking avatar; Maria and Ari have different voices. |

## How it's built

One Next.js app, deployed on Vercel.

- **Apprentice Core** (`src/lib/apprentice/core.ts`): everything Ari does, as a pure reducer `(state, input) → (state, effects)`. Workspace events and speech go in; cards, questions, explanations, cursor moves and warnings come out. All judgment goes through a **Judge** interface.
- **Walkthrough** (`src/lib/walkthrough/`): Maria's session as a script of beats in five parts. Any position is rebuilt by replaying the script through the Core, so Back and Next always match.
- **Big picture** (`src/lib/context/`): the week, sources and observations; pattern detection, the newcomer's plan, and knowledge extraction (Claude, with a rule-based fallback). `/api/transcribe` calls ElevenLabs Speech-to-Text; `/api/extract` pulls knowledge from transcripts and files.
- **Eye tracking** (`src/lib/gaze/`, `src/components/gaze/`): WebGazer.js in the browser; gaze points become dwell times on what's on screen, which go into the Core as evidence.
- **Judge**: Claude (`claude-opus-5-5`, structured outputs) via `/api/judge` when `ANTHROPIC_API_KEY` is set; otherwise a built-in rule Judge that reasons like someone who only knows the written procedure.
- **Voice**: every line Ari says goes through `/api/tts` (ElevenLabs text-to-speech with timestamps): the face plays the real audio and lip-syncs to the exact word timings. Put a real `ELEVENLABS_API_KEY` in the environment and it switches on automatically. Without it, Ari uses the browser's own voice and moves the mouth word by word as each word is spoken. Listening uses the browser's speech recognition: the microphone opens automatically when Ari asks, with a live voice waveform and a typed fallback.
- **Sound**: clean interface sounds synthesized with the Web Audio API (no audio files).
- **Face**: the live HeyGen LiveAvatar is planned via its ElevenLabs integration; today Ari uses the in-browser TalkingHead fallback, with a 5-minute per-visit cap and a demo-key switch already in place (`/avatar-check`).
- **Teaching aids**: driver.js highlights, Ari's own animated cursor, rrweb session recording.
- **Demo content**: a made-up company, Northwind Supply (`src/lib/northwind/seed.ts`). Maria's preloaded session (`src/lib/apprentice/mariaRecorded.json`) was captured from a real guided run.

In a real product, Ari would watch real tools (email, ERP, spreadsheets) by recording the screen (e.g. rrweb, OpenAdapt); the prototype uses its own workspace so every action is known exactly.

## Run it locally

```bash
npm install
cp .env.example .env.local   # optional: ElevenLabs and Anthropic keys
npm run dev
```

Checks:

```bash
npm test && npm run typecheck && npm run lint
```

The main tests replay the demo through the Core: `src/lib/walkthrough/replay.test.ts` (step 1, including Back/Next) and `src/lib/apprentice/demo.test.ts` (expert and newcomer).

Create the ElevenLabs agent once (prompt overrides, 30-minute sessions):

```bash
ELEVENLABS_API_KEY=... node scripts/setup-agent.mjs
```

## Credits

Eye tracking uses [WebGazer.js](https://github.com/brownhci/WebGazer) (Brown University), GPL-3.0, loaded at runtime.

Ari's fallback face is the "brunette" example avatar from [TalkingHead](https://github.com/met4citizen/TalkingHead), created with Ready Player Me, licensed [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) (non-commercial use). TalkingHead itself is MIT.
