"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { browserSpeak, listenForAnswer, MIC_PROBLEM_TEXT } from "@/lib/ari/browserVoice";
import { Sparkles } from "lucide-react";
import { VoicePanel } from "./VoicePanel";
import { sounds } from "@/lib/ari/sounds";
import { chooseFace, type Alignment, type AvatarState, type FaceChoice } from "@/lib/ari/face";
import { TalkingHeadFace, type FaceHandle } from "./TalkingHeadFace";

type Ari = {
  state: AvatarState;
  setState: (s: AvatarState) => void;
  face: FaceChoice;
  caption: string | null;
  speaking: boolean;
  say: (text: string, lang?: string) => Promise<void>;
  // Resolves with what the person said out loud, or typed into the answer box.
  listen: (lang?: string) => Promise<string>;
  listening: boolean;
  simulateStreamFailure: () => void;
};

const AriContext = createContext<Ari | null>(null);

export function useAri(): Ari {
  const ari = useContext(AriContext);
  if (!ari) throw new Error("useAri must be used inside AriProvider");
  return ari;
}

// The live LiveAvatar face isn't wired yet (needs HeyGen credits), so it's
// always unconfigured and Ari uses the TalkingHead fallback.
const LIVE_CONFIGURED = process.env.NEXT_PUBLIC_LIVEAVATAR_ENABLED === "1";
const DEMO_KEY_ON = process.env.NEXT_PUBLIC_DEMO_KEY_ON !== "0";

export function AriProvider({ children, initialState = "bubble" }: React.PropsWithChildren<{ initialState?: AvatarState }>) {
  const [state, setState] = useState<AvatarState>(initialState);
  const [caption, setCaption] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [streamFailed, setStreamFailed] = useState(false);
  const faceRef = useRef<FaceHandle>(null);
  const liveSecondsUsed = useLiveSeconds(LIVE_CONFIGURED && DEMO_KEY_ON && !streamFailed);
  const face = chooseFace({ liveConfigured: LIVE_CONFIGURED, demoKeyOn: DEMO_KEY_ON, liveSecondsUsed, streamFailed });

  const latest = useRef(0);
  const say = useCallback(async (text: string, lang = "en-US") => {
    const id = ++latest.current;
    setCaption(text);
    setSpeaking(true);
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
    faceRef.current?.stop();
    const face = faceRef.current;

    // 1. ElevenLabs voice: real audio with exact word timings → precise lip-sync.
    const voiced = face?.ready() ? await elevenLabsSpeech(text, lang) : null;
    if (id !== latest.current) return; // a newer line started meanwhile
    if (voiced && face) {
      try {
        await face.speakAudio(voiced.audio, voiced.alignment);
      } catch {
        await speakWithBrowser(text, lang, face);
      }
    } else {
      // 2. Browser voice: move the mouth word by word, as each word is spoken.
      await speakWithBrowser(text, lang, face);
    }
    // A newer line may have cut this one off; only the newest one stops the face.
    if (id !== latest.current) return;
    faceRef.current?.stop();
    setSpeaking(false);
  }, []);

  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [micProblem, setMicProblem] = useState<string | null>(null);
  const answer = useRef<{ resolve: (text: string) => void; stopMic: () => void; lang: string } | null>(null);

  const finish = useCallback((text: string) => {
    const pending = answer.current;
    if (!pending || !text.trim()) return;
    answer.current = null;
    pending.stopMic();
    sounds.micOff();
    setListening(false);
    setHeard("");
    pending.resolve(text.trim());
  }, []);

  // The microphone opens by itself as soon as Ari has asked.
  const startMic = useCallback(() => {
    const pending = answer.current;
    if (!pending) return;
    pending.stopMic();
    setMicProblem(null);
    setHeard("");
    const mic = listenForAnswer(pending.lang, {
      interim: (text) => answer.current === pending && setHeard(text),
      final: (text) => answer.current === pending && finish(text),
      problem: (p) => answer.current === pending && setMicProblem(MIC_PROBLEM_TEXT[p]),
    });
    pending.stopMic = mic.stop;
  }, [finish]);

  const listen = useCallback(
    (lang = "en-US") =>
      new Promise<string>((resolve) => {
        answer.current?.stopMic();
        answer.current = { resolve, stopMic: () => {}, lang };
        sounds.micOn();
        setListening(true);
        startMic();
      }),
    [startMic],
  );

  const value = useMemo<Ari>(
    () => ({ state, setState, face, caption, speaking, say, listen, listening, simulateStreamFailure: () => setStreamFailed(true) }),
    [state, face, caption, speaking, say, listen, listening],
  );

  return (
    <AriContext.Provider value={value}>
      {children}
      <AriAvatar
        state={state}
        caption={caption}
        speaking={speaking}
        face={face}
        faceRef={faceRef}
        listening={listening}
        heard={heard}
        micProblem={micProblem}
        onAnswer={finish}
        onRetryMic={startMic}
      />
    </AriContext.Provider>
  );
}

// Seconds of live face used in this visit (tab), so the cap survives reloads.
function useLiveSeconds(counting: boolean) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSeconds(Number(safeSession("get") ?? 0));
  }, []);
  useEffect(() => {
    if (!counting) return;
    const t = setInterval(() => {
      setSeconds((s) => {
        safeSession("set", String(s + 1));
        return s + 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [counting]);
  return seconds;
}

function safeSession(op: "get" | "set", value?: string): string | null {
  try {
    if (op === "set") sessionStorage.setItem("ari.liveSeconds", value!);
    return sessionStorage.getItem("ari.liveSeconds");
  } catch {
    return null;
  }
}

let elevenLabsAvailable = true;
async function elevenLabsSpeech(text: string, lang: string) {
  if (!elevenLabsAvailable) return null;
  try {
    const res = await fetch("/api/tts", { method: "POST", body: JSON.stringify({ text, lang }) });
    if (res.status === 503) elevenLabsAvailable = false;
    if (!res.ok) return null;
    return (await res.json()) as { audio: string; alignment: Alignment };
  } catch {
    return null;
  }
}

async function speakWithBrowser(text: string, lang: string, face: FaceHandle | null) {
  let gotWords = false;
  // If this voice doesn't report word boundaries, fall back to estimated timings.
  const fallback = setTimeout(() => {
    if (!gotWords) face?.mouth(text, 1, lang.slice(0, 2));
  }, 350);
  await browserSpeak(text, lang, (word) => {
    if (!gotWords) face?.stop();
    gotWords = true;
    face?.mouthWord(word);
  });
  clearTimeout(fallback);
}

const FRAME: Record<AvatarState, string> = {
  bubble: "h-24 w-24 rounded-full",
  forward: "h-64 w-64 rounded-3xl",
  tutor: "h-56 w-56 rounded-3xl",
};

function AriAvatar({
  state,
  caption,
  speaking,
  face,
  faceRef,
  listening,
  heard,
  micProblem,
  onAnswer,
  onRetryMic,
}: {
  state: AvatarState;
  caption: string | null;
  speaking: boolean;
  face: FaceChoice;
  faceRef: React.RefObject<FaceHandle | null>;
  listening: boolean;
  heard: string;
  micProblem: string | null;
  onAnswer: (text: string) => void;
  onRetryMic: () => void;
}) {
  // TalkingHead sizes its canvas on window resize.
  useEffect(() => {
    const t = setTimeout(() => window.dispatchEvent(new Event("resize")), 320);
    return () => clearTimeout(t);
  }, [state]);

  return (
    <div data-ari="avatar" data-state={state} data-face={face} className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {state !== "bubble" && caption && (
        <div className="ari-pop pointer-events-auto w-80 rounded-3xl border border-white/70 bg-white/95 p-4 text-sm shadow-xl shadow-ari-500/10 backdrop-blur">
          <div className="mb-1 flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full text-white ari-gradient">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <span className="font-semibold text-ari-700">Ari</span>
            {speaking && <SpeakingDots />}
          </div>
          <p className="leading-relaxed text-zinc-700">{caption}</p>
          <VoicePanel listening={listening} heard={heard} problem={micProblem} onAnswer={onAnswer} onRetry={onRetryMic} />
        </div>
      )}
      <div className="pointer-events-auto relative">
        <div
          className={`overflow-hidden bg-gradient-to-b from-ari-100 to-coral-400/30 shadow-2xl shadow-ari-500/25 transition-all duration-300 ${FRAME[state]} ${
            speaking ? "ring-4 ring-ari-400" : "ring-4 ring-white"
          }`}
        >
          <TalkingHeadFace ref={faceRef} />
        </div>
      </div>
    </div>
  );
}

function SpeakingDots() {
  return (
    <span className="flex items-end gap-0.5" aria-label="speaking">
      {[0, 1, 2].map((i) => (
        <span key={i} className="h-2 w-1 animate-pulse rounded-full bg-coral-500" style={{ animationDelay: `${i * 150}ms` }} />
      ))}
    </span>
  );
}
