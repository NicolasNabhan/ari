// Ari's voice with exact word timings (ElevenLabs text-to-speech with
// timestamps), so the face's mouth moves in sync with the audio.
export const dynamic = "force-dynamic";

// Stock ElevenLabs voices; override per speaker with ELEVENLABS_VOICE_ARI / ELEVENLABS_VOICE_MARIA.
const DEFAULT_VOICES: Record<string, string> = {
  ari: "jBpfuIE2acCO8z3wKNLl", // playful
  maria: "EXAVITQu4vr4xnSDxMaL", // younger adult woman
};

export async function POST(request: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey || apiKey === "your_key_here") return Response.json({ error: "ElevenLabs voice not configured" }, { status: 503 });
  const { text, speaker = "ari" } = (await request.json()) as { text: string; lang?: string; speaker?: string };
  const voice =
    (speaker === "maria" ? process.env.ELEVENLABS_VOICE_MARIA : process.env.ELEVENLABS_VOICE_ARI) ||
    DEFAULT_VOICES[speaker] ||
    DEFAULT_VOICES.ari;
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}/with-timestamps`, {
    method: "POST",
    headers: { "xi-api-key": apiKey, "content-type": "application/json" },
    body: JSON.stringify({ text, model_id: "eleven_flash_v2_5" }), // multilingual, low latency
  });
  if (!res.ok) return Response.json({ error: `ElevenLabs failed (${res.status})` }, { status: res.status === 401 ? 503 : 502 });
  const body = (await res.json()) as { audio_base64: string; alignment: unknown };
  return Response.json({ audio: body.audio_base64, alignment: body.alignment });
}
