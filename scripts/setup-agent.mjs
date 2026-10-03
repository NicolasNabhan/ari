// Creates (or updates) the ElevenLabs agent Ari runs on.
// Usage: ELEVENLABS_API_KEY=... node scripts/setup-agent.mjs [existing-agent-id]
// Prints the agent id to put in ELEVENLABS_AGENT_ID.

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) {
  console.error("Set ELEVENLABS_API_KEY first.");
  process.exit(1);
}
const existingId = process.argv[2];

const body = {
  name: "Ari",
  conversation_config: {
    agent: {
      // The real prompt is sent as an override by the app; this is the fallback.
      prompt: { prompt: "You are Ari. Stay silent unless told exactly what to say." },
      first_message: "",
      language: "en",
    },
    // Expert sessions run longer than the 10-minute default.
    conversation: { max_duration_seconds: 1800 },
  },
  platform_settings: {
    overrides: {
      conversation_config_override: {
        agent: { prompt: { prompt: true }, first_message: true, language: true },
        tts: { voice_id: true },
      },
    },
  },
};

const url = existingId
  ? `https://api.elevenlabs.io/v1/convai/agents/${existingId}`
  : "https://api.elevenlabs.io/v1/convai/agents/create";
const res = await fetch(url, {
  method: existingId ? "PATCH" : "POST",
  headers: { "xi-api-key": apiKey, "content-type": "application/json" },
  body: JSON.stringify(body),
});
const json = await res.json();
if (!res.ok) {
  console.error(`Failed (${res.status}):`, JSON.stringify(json, null, 2));
  process.exit(1);
}
console.log(`ELEVENLABS_AGENT_ID=${json.agent_id ?? existingId}`);
