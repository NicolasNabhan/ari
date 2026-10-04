// Ari's voice with exact word timings (ElevenLabs text-to-speech with
// timestamps), so the face's mouth moves in sync with the audio.
export const dynamic = "force-dynamic";

const DEFAULT_VOICE = "21m00Tcm4TlvDq8ikWAM"; // a stock ElevenLabs voice

export async function POST(request: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey || apiKey === "your_key_here") return Response.json({ error: "ElevenLabs voice not configured" }, { status: 503 });
  const { text } = (await request.json()) as { text: string; lang?: string };
  const voice = process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE;
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}/with-timestamps`, {
    method: "POST",
    headers: { "xi-api-key": apiKey, "content-type": "application/json" },
    body: JSON.stringify({ text, model_id: "eleven_flash_v2_5" }), // multilingual, low latency
  });
  if (!res.ok) return Response.json({ error: `ElevenLabs failed (${res.status})` }, { status: res.status === 401 ? 503 : 502 });
  const body = (await res.json()) as { audio_base64: string; alignment: unknown };
  return Response.json({ audio: body.audio_base64, alignment: body.alignment });
}
