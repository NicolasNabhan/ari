# 01: Deployed skeleton: Ari speaks

**What to build:** A new public GitHub repo holds a Next.js app started from the ElevenLabs `agents/nextjs/quickstart` example, deployed on Vercel. Opening the link shows a placeholder start page. Pressing a button makes a muted ElevenLabs agent speak a line that *our code* triggers (not the agent on its own), and the user's spoken reply appears as a Scribe transcript. This proves the riskiest voice pattern (muted agent, code-triggered speech) on day one. Prototype-grade: no auth, no hardening.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] New dedicated public GitHub repo created; app runs locally and on a Vercel URL
- [ ] A server route hands out a short-lived ElevenLabs session token; no API key reaches the browser
- [ ] The agent stays silent until our code tells it to speak, then says the given line
- [ ] The user's spoken reply is transcribed and shown on screen
- [ ] The agent session limit is raised above the 10-minute default
- [ ] Placeholder start page has two buttons: "Learn from Maria" and "Teach Ari as Maria"
