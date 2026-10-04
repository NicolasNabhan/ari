"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { estimateWordTimings, wordsFromAlignment, type Alignment } from "@/lib/ari/face";

type TalkingHead = {
  showAvatar: (avatar: Record<string, unknown>) => Promise<void>;
  speakAudio: (r: { audio?: AudioBuffer; words: string[]; wtimes: number[]; wdurations: number[] }, opt?: Record<string, unknown>) => void;
  audioCtx: AudioContext;
  stopSpeaking: () => void;
  lookAtCamera: (ms: number) => void;
  setMood: (mood: string) => void;
};

export type FaceHandle = {
  ready: () => boolean;
  // Best quality: the face plays the real audio and lip-syncs to exact word timings.
  speakAudio: (audioBase64: string, alignment: Alignment) => Promise<void>;
  // Browser voice: mouth one word as it is spoken.
  mouthWord: (word: string) => void;
  // Last resort: estimated timings for a whole line.
  mouth: (text: string, rate?: number, lang?: string) => void;
  stop: () => void;
};

const MS_PER_CHAR = 62;

// Ari's free fallback face: a 3D avatar rendered in the browser by TalkingHead.
export const TalkingHeadFace = forwardRef<FaceHandle, { onReady?: () => void; onError?: () => void }>(function TalkingHeadFace(
  { onReady, onError },
  ref,
) {
  const node = useRef<HTMLDivElement>(null);
  const head = useRef<TalkingHead | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useImperativeHandle(ref, () => ({
    ready: () => !!head.current,
    async speakAudio(audioBase64, alignment) {
      const h = head.current;
      if (!h) throw new Error("face not ready");
      const bytes = Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0));
      if (h.audioCtx.state === "suspended") await h.audioCtx.resume();
      const audio = await h.audioCtx.decodeAudioData(bytes.buffer);
      h.lookAtCamera(500);
      h.speakAudio({ audio, ...wordsFromAlignment(alignment) }, { lipsyncLang: "en" });
      await new Promise((r) => setTimeout(r, audio.duration * 1000 + 250));
    },
    mouthWord(word) {
      const h = head.current;
      if (!h) return;
      const d = Math.max(140, word.replace(/[^\p{L}\p{N}]/gu, "").length * MS_PER_CHAR);
      h.speakAudio({ words: [word], wtimes: [0], wdurations: [d] }, { lipsyncLang: "en" });
    },
    mouth(text, rate = 1, lang = "en") {
      const h = head.current;
      if (!h) return;
      const { words, wtimes, wdurations } = estimateWordTimings(text, rate);
      h.lookAtCamera(500);
      // Only the English lip-sync rules are loaded; they look fine for Spanish too.
      void lang;
      h.speakAudio({ words, wtimes, wdurations }, { lipsyncLang: "en" });
    },
    stop() {
      head.current?.stopSpeaking();
    },
  }));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mod = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ "talkinghead" as string);
        if (cancelled || !node.current) return;
        const h: TalkingHead = new mod.TalkingHead(node.current, {
          ttsEndpoint: null,
          lipsyncModules: ["en"],
          cameraView: "head",
          cameraRotateEnable: false,
          cameraZoomEnable: false,
          cameraPanEnable: false,
        });
        await h.showAvatar({ url: "/avatars/ari.glb", body: "F", avatarMood: "happy", lipsyncLang: "en" });
        if (cancelled) return;
        head.current = h;
        setStatus("ready");
        onReady?.();
      } catch {
        if (!cancelled) {
          setStatus("error");
          onError?.();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [onReady, onError]);

  return (
    <div className="relative h-full w-full">
      <div ref={node} className="h-full w-full" />
      {status !== "ready" && (
        <div className="absolute inset-0 flex items-center justify-center bg-indigo-100 text-2xl font-semibold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
          {status === "loading" ? "…" : "Ari"}
        </div>
      )}
    </div>
  );
});
