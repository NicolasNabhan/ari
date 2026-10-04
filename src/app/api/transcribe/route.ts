// Meeting audio to a transcript with speaker labels, via ElevenLabs
// Speech-to-Text (Scribe) with diarization.
//
// GET  -> { configured: boolean }
// POST multipart file=<audio or video> (+ optional language)
//      -> { text: "Speaker 1: …\nSpeaker 2: …", speakers, language?, durationSecs?, model }
// Without ELEVENLABS_API_KEY: 503 { error, fallback: "browser" } so the page
// can use the browser's own speech recognition instead.
import { transcriptFromWords, type SttWord } from "@/lib/context/transcript";

export const dynamic = "force-dynamic";

const key = () => {
  const k = process.env.ELEVENLABS_API_KEY;
  return k && k !== "your_key_here" ? k : null;
};

// Newest Scribe first; older accounts may only have v1.
const MODELS = [process.env.ELEVENLABS_STT_MODEL, "scribe_v2", "scribe_v1"].filter(Boolean) as string[];

export async function GET() {
  return Response.json({ configured: !!key() });
}

export async function POST(request: Request) {
  const apiKey = key();
  if (!apiKey) {
    return Response.json(
      { error: "ElevenLabs speech-to-text isn't configured (ELEVENLABS_API_KEY is missing).", fallback: "browser" },
      { status: 503 },
    );
  }
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof Blob) || file.size === 0) return Response.json({ error: "Send the audio in the 'file' field." }, { status: 400 });
  const language = form?.get("language");

  let lastError = "";
  for (const model of [...new Set(MODELS)]) {
    const body = new FormData();
    body.append("file", file, file instanceof File ? file.name : "meeting.webm");
    body.append("model_id", model);
    body.append("diarize", "true");
    body.append("tag_audio_events", "false");
    if (typeof language === "string" && language) body.append("language_code", language);
    const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", { method: "POST", headers: { "xi-api-key": apiKey }, body });
    if (res.ok) {
      const r = (await res.json()) as { text?: string; words?: SttWord[]; language_code?: string; audio_duration_secs?: number };
      const { text, speakers } = transcriptFromWords(r.words ?? [], r.text ?? "");
      return Response.json({ text, speakers, language: r.language_code, durationSecs: r.audio_duration_secs, model });
    }
    lastError = `ElevenLabs speech-to-text failed (${res.status})`;
    if (res.status === 401) return Response.json({ error: `${lastError}: check ELEVENLABS_API_KEY.`, fallback: "browser" }, { status: 503 });
    // Only retry with another model when the model itself may be the problem.
    if (res.status !== 400 && res.status !== 422) break;
  }
  return Response.json({ error: lastError, fallback: "browser" }, { status: 502 });
}
