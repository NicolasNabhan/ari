// Turning a speech-to-text result (ElevenLabs Scribe, with diarization) into
// a transcript with one line per turn: "Speaker 1: …". Pure.

export type SttWord = { text: string; type?: "word" | "spacing" | "audio_event" | string; speaker_id?: string };

export function transcriptFromWords(words: SttWord[], fallbackText = ""): { text: string; speakers: number } {
  const names = new Map<string, string>();
  const lines: { speaker: string; text: string }[] = [];
  for (const w of words) {
    if (w.type === "audio_event") continue;
    const id = w.speaker_id ?? "speaker_0";
    if (!names.has(id)) names.set(id, `Speaker ${names.size + 1}`);
    const speaker = names.get(id)!;
    const last = lines[lines.length - 1];
    if (last && last.speaker === speaker) last.text += w.text;
    else if (w.type !== "spacing") lines.push({ speaker, text: w.text });
  }
  const text = lines
    .map((l) => ({ ...l, text: l.text.replace(/\s+/g, " ").trim() }))
    .filter((l) => l.text)
    .map((l) => `${l.speaker}: ${l.text}`)
    .join("\n");
  if (!text && fallbackText.trim()) return { text: `Speaker 1: ${fallbackText.trim()}`, speakers: 1 };
  return { text, speakers: names.size };
}
