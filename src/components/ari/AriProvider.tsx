"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { browserListenOnce, browserSpeak, canListen } from "@/lib/ari/browserVoice";
import { chooseFace, type AvatarState, type FaceChoice } from "@/lib/ari/face";
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

  const say = useCallback(async (text: string, lang = "en-US") => {
    setCaption(text);
    setSpeaking(true);
    faceRef.current?.mouth(text, 1, lang.slice(0, 2));
    await browserSpeak(text, lang);
    faceRef.current?.stop();
    setSpeaking(false);
  }, []);

  const [listening, setListening] = useState(false);
  const answer = useRef<{ resolve: (text: string) => void; stopMic: () => void; lang: string } | null>(null);

  const finish = useCallback((text: string) => {
    const pending = answer.current;
    if (!pending || !text.trim()) return;
    answer.current = null;
    pending.stopMic();
    setListening(false);
    pending.resolve(text.trim());
  }, []);

  const startMic = useCallback(() => {
    const pending = answer.current;
    if (!pending || !canListen()) return;
    const mic = browserListenOnce(pending.lang);
    pending.stopMic = mic.stop;
    mic.result.then((heard) => {
      if (answer.current === pending) finish(heard);
    });
  }, [finish]);

  const listen = useCallback(
    (lang = "en-US") =>
      new Promise<string>((resolve) => {
        answer.current = { resolve, stopMic: () => {}, lang };
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

const FRAME: Record<AvatarState, string> = {
  bubble: "h-24 w-24 rounded-full",
  forward: "h-72 w-72 rounded-3xl shadow-2xl ring-4 ring-indigo-400/60",
  tutor: "h-64 w-64 rounded-3xl shadow-xl",
};

function AriAvatar({
  state,
  caption,
  speaking,
  face,
  faceRef,
  listening,
  onAnswer,
  onRetryMic,
}: {
  state: AvatarState;
  caption: string | null;
  speaking: boolean;
  face: FaceChoice;
  faceRef: React.RefObject<FaceHandle | null>;
  listening: boolean;
  onAnswer: (text: string) => void;
  onRetryMic: () => void;
}) {
  const [typed, setTyped] = useState("");
  // TalkingHead sizes its canvas on window resize.
  useEffect(() => {
    const t = setTimeout(() => window.dispatchEvent(new Event("resize")), 320);
    return () => clearTimeout(t);
  }, [state]);

  return (
    <div data-ari="avatar" data-state={state} data-face={face} className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {state !== "bubble" && caption && (
        <div className="pointer-events-auto max-w-xs rounded-2xl bg-white px-4 py-3 text-sm shadow-lg dark:bg-zinc-800">
          <span className="font-semibold text-indigo-600 dark:text-indigo-300">Ari: </span>
          {caption}
          {listening && (
            <form
              className="mt-2 flex gap-1"
              onSubmit={(e) => {
                e.preventDefault();
                onAnswer(typed);
                setTyped("");
              }}
            >
              <input
                data-ari="answer-input"
                autoFocus
                className="min-w-0 flex-1 rounded border px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-900"
                placeholder="Answer out loud, or type…"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
              />
              <button type="button" title="Listen again" onClick={onRetryMic} className="rounded border px-2 dark:border-zinc-600">
                🎤
              </button>
              <button data-ari="answer-send" className="rounded bg-indigo-600 px-2 text-white">
                ↵
              </button>
            </form>
          )}
        </div>
      )}
      <div className={`pointer-events-auto overflow-hidden bg-indigo-50 transition-all duration-300 dark:bg-indigo-950 ${FRAME[state]} ${speaking ? "ring-4 ring-indigo-500" : ""}`}>
        <TalkingHeadFace ref={faceRef} />
      </div>
    </div>
  );
}
