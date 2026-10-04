# Ari — the AI apprentice

**Ari keeps your experts' know-how when they leave.** It sits beside an expert while they work, asks "why?" only when it can't work out the reason (and the reason matters to the next person), sorts every reason into *must follow / strong advice / your choice*, and then teaches a newcomer by voice, including the rules nobody ever wrote down.

Built for the 7th Hack-Nation Global AI Hackathon, Challenge 1: *The AI Apprentice* (ElevenLabs).

## Try it

Open the live demo and pick a mode (Chrome, sound on):

1. **Learn from Maria** (1 minute). You're a new hire at Northwind Supply. Ari teaches you how Maria, the Procurement Manager, handles a purchase request: it explains each step out loud, answers "why?", does a step for you with its own cursor ("Show me"), switches to Spanish if you ask in Spanish, and stops you before you approve a $30k order from a new supplier, because of a rule Maria never wrote down.
2. **Teach Ari as Maria** (3 minutes, guided). You play the expert. Script cards suggest what to do and say, but Ari reacts for real. At the end, Ari teaches a newcomer **using your own answers**.

No microphone? Type your answers in the box under Ari.

## What Ari does

| The challenge asks for | Ari |
|---|---|
| Watches experts work | The workspace reports every action; Ari turns them into steps and choices, and notices *how* the expert works (pauses, what they checked, who they contacted, changes of mind). |
| Asks why at the right moments | Ari explains each choice to itself first. It asks only when it isn't confident **and** the reason would change how someone else does the job. It holds questions while the expert is typing or on a call, offers a tap-to-hear mode, and asks at most one follow-up. |
| Maps decisions and guardrails | Each reason gets a level (🔴 must follow, 🟡 strong advice, 🟢 your choice) and types; anything not in the written procedure gets an **Unwritten** ribbon. Knowledge behind the work (like Finance's 40/60 scoring formula) is tagged with where to find it. At the end of a session, Ari reads back the guesses it's least sure about. |
| Teaches the next generation | A voice tutor in the same workspace: step-by-step explanations, "why?" answers in the expert's own words, "Show me", Spanish, and guardrail warnings before a mistake happens. The session also compiles into a step-by-step procedure for the tutor agent. |
| Voice-powered | Ari speaks and listens throughout, with a talking avatar. |

## How it's built

One Next.js app, deployed on Vercel.

- **Apprentice Core** (`src/lib/apprentice/core.ts`): everything Ari does, as a pure reducer `(state, input) → (state, effects)`. Workspace events and speech go in; cards, questions, explanations, cursor moves and warnings come out. All judgment goes through a **Judge** interface.
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

The main test (`src/lib/apprentice/demo.test.ts`) replays the whole demo script through the Core.

Create the ElevenLabs agent once (prompt overrides, 30-minute sessions):

```bash
ELEVENLABS_API_KEY=... node scripts/setup-agent.mjs
```

## Credits

Ari's fallback face is the "brunette" example avatar from [TalkingHead](https://github.com/met4citizen/TalkingHead), created with Ready Player Me, licensed [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) (non-commercial use). TalkingHead itself is MIT.
