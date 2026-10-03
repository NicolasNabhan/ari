// Hands the browser a short-lived ElevenLabs conversation token so the API key
// never leaves the server.
export const dynamic = "force-dynamic";

export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  if (!apiKey || !agentId) {
    return Response.json(
      { error: "Voice is not configured: set ELEVENLABS_API_KEY and ELEVENLABS_AGENT_ID." },
      { status: 503 },
    );
  }

  const res = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${encodeURIComponent(agentId)}`,
    { headers: { "xi-api-key": apiKey }, cache: "no-store" },
  );
  if (!res.ok) {
    return Response.json({ error: `ElevenLabs token request failed (${res.status})` }, { status: 502 });
  }
  const { token } = (await res.json()) as { token: string };
  return Response.json({ token });
}
