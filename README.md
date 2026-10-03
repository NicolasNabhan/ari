# Ari — the AI apprentice

Ari watches an expert work, asks why at the right moments, and teaches the next person. See `written-prototype.md` for the product and `.scratch/ari/` for the spec and tickets.

## Run it

```bash
npm install
cp .env.example .env.local   # fill in the ElevenLabs values
npm run dev
```

Create the ElevenLabs agent once (it allows prompt overrides and 30-minute sessions):

```bash
ELEVENLABS_API_KEY=... node scripts/setup-agent.mjs
```

Then open http://localhost:3000/voice-check.

## Checks

```bash
npm test && npm run typecheck && npm run lint
```
