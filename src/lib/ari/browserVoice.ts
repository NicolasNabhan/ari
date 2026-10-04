"use client";

// Free voice for Ari while ElevenLabs isn't available: the browser's own
// speech synthesis (speaking) and speech recognition (listening, Chrome).

// onWord fires as each word is actually spoken, so the face can move with it.
// Local (on-device) voices report word boundaries; network voices often don't.
export type BrowserVoiceStyle = { prefer?: RegExp; pitch?: number; rate?: number };

export function browserSpeak(text: string, lang = "en-US", onWord?: (word: string) => void, style: BrowserVoiceStyle = {}): Promise<void> {
  return new Promise((resolve) => {
    if (typeof speechSynthesis === "undefined") return resolve();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.pitch = style.pitch ?? 1;
    u.rate = style.rate ?? 1;
    const voices = speechSynthesis.getVoices().filter((v) => v.lang.startsWith(lang.slice(0, 2)));
    const voice =
      (style.prefer && voices.find((v) => v.localService && style.prefer!.test(v.name))) ||
      voices.find((v) => v.localService && /premium|enhanced/i.test(v.name)) ||
      voices.find((v) => v.localService && /samantha|ava|allison|susan|zoe|m[oó]nica|paulina|female/i.test(v.name)) ||
      voices.find((v) => v.localService) ||
      voices[0];
    if (voice) u.voice = voice;
    if (onWord) {
      u.onboundary = (e) => {
        if (e.name && e.name !== "word") return;
        const word = text.slice(e.charIndex, e.charIndex + (e.charLength || text.slice(e.charIndex).search(/\s|$/)));
        if (word.trim()) onWord(word);
      };
    }
    u.onend = () => resolve();
    u.onerror = () => resolve();
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  });
}

type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

export function canListen(): boolean {
  return typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
}

export type MicProblem = "unsupported" | "blocked" | "no-microphone" | "network";

export const MIC_PROBLEM_TEXT: Record<MicProblem, string> = {
  unsupported: "This browser can't listen. Use Chrome, or type your answer.",
  blocked: "The microphone is blocked. Allow it from the icon in the address bar, then press the mic again.",
  "no-microphone": "No microphone found. Plug one in, or type your answer.",
  network: "Speech recognition needs an internet connection. Type your answer instead.",
};

// Listens until the person finishes a sentence. Keeps listening through
// silence, reports the words live, and explains what went wrong if it can't.
export function listenForAnswer(
  lang: string,
  on: { interim: (text: string) => void; final: (text: string) => void; problem: (p: MicProblem) => void },
): { stop: () => void } {
  const Ctor =
    (window as unknown as Record<string, new () => Recognition>).SpeechRecognition ??
    (window as unknown as Record<string, new () => Recognition>).webkitSpeechRecognition;
  if (!Ctor) {
    on.problem("unsupported");
    return { stop: () => {} };
  }
  let stopped = false;
  let heard = "";
  let rec: Recognition | null = null;
  const startedAt = Date.now();

  const begin = () => {
    rec = new Ctor();
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = true;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      let finalText = "";
      let interim = "";
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      heard = (finalText + interim).trim();
      on.interim(heard);
      // A finished sentence ends the answer.
      if (finalText.trim() && !interim.trim()) {
        stopped = true;
        rec?.stop();
        on.final(finalText.trim());
      }
    };
    const PROBLEMS: Record<string, MicProblem> = {
      "not-allowed": "blocked",
      "service-not-allowed": "blocked",
      "audio-capture": "no-microphone",
      network: "network",
    };
    rec.onerror = (e) => {
      // "no-speech" and "aborted" aren't problems: onend starts listening again.
      const problem = PROBLEMS[e.error];
      if (!problem) return;
      stopped = true;
      on.problem(problem);
    };
    rec.onend = () => {
      // Chrome ends recognition after a pause; keep going for up to two minutes.
      if (!stopped && Date.now() - startedAt < 120_000) begin();
      else if (!stopped && heard) on.final(heard);
    };
    rec.start();
  };
  begin();
  return {
    stop: () => {
      stopped = true;
      rec?.abort();
    },
  };
}
