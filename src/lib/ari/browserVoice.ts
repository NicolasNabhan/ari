"use client";

// Free voice for Ari while ElevenLabs isn't available: the browser's own
// speech synthesis (speaking) and speech recognition (listening, Chrome).

export function browserSpeak(text: string, lang = "en-US"): Promise<void> {
  return new Promise((resolve) => {
    if (typeof speechSynthesis === "undefined") return resolve();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    const voice = speechSynthesis.getVoices().find((v) => v.lang.startsWith(lang.slice(0, 2)) && /female|samantha|google/i.test(v.name));
    if (voice) u.voice = voice;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  });
}

type Recognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

export function canListen(): boolean {
  return typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
}

// Resolves with what the person said, or "" if nothing was heard.
export function browserListenOnce(lang = "en-US"): { result: Promise<string>; stop: () => void } {
  const Ctor = (window as unknown as Record<string, new () => Recognition>).SpeechRecognition ??
    (window as unknown as Record<string, new () => Recognition>).webkitSpeechRecognition;
  if (!Ctor) return { result: Promise.resolve(""), stop: () => {} };
  const rec = new Ctor();
  rec.lang = lang;
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  const result = new Promise<string>((resolve) => {
    let heard = "";
    rec.onresult = (e) => {
      heard = Array.from(e.results).map((r) => r[0].transcript).join(" ").trim();
    };
    rec.onerror = () => resolve(heard);
    rec.onend = () => resolve(heard);
  });
  rec.start();
  return { result, stop: () => rec.stop() };
}
