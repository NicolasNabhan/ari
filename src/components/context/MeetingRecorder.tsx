"use client";

import { useEffect, useRef, useState } from "react";
import { AudioLines, FileAudio, Info, LoaderCircle, Mic, Square, TriangleAlert } from "lucide-react";
import { workdayOf } from "@/lib/context/knowledge";
import type { ContextSource } from "@/lib/context/types";
import { ingest } from "./ingest";

type Phase = "idle" | "recording" | "transcribing";

// The browser's speech recognition, used as the fallback transcript.
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};
function recognitionCtor(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, new () => Recognition>;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

// Record a meeting with the mic (or upload its audio), transcribe it with
// ElevenLabs Scribe (speaker labels), and hand it to Ari to learn from.
export function MeetingRecorder({ onAdded }: { onAdded: (sourceId: string, note?: string) => void }) {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [title, setTitle] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [caption, setCaption] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const recognition = useRef<{ rec: Recognition; stop: () => void; text: () => string } | null>(null);
  const upload = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/transcribe")
      .then((r) => r.json())
      .then((r: { configured: boolean }) => setConfigured(r.configured))
      .catch(() => setConfigured(false));
  }, []);

  useEffect(() => {
    if (phase !== "recording") return;
    const started = Date.now();
    const t = setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 250);
    return () => clearInterval(t);
  }, [phase]);

  async function add(text: string, origin: ContextSource["origin"], fallbackTitle: string, note?: string) {
    const now = new Date();
    const source: ContextSource = {
      id: `${origin === "recorded" ? "rec" : "upl"}-${now.getTime().toString(36)}`,
      kind: "meeting",
      title: title.trim() || fallbackTitle,
      day: workdayOf(now),
      time: hhmm(now),
      from: "Maria",
      origin,
      text,
    };
    const r = await ingest(source);
    setTitle("");
    onAdded(source.id, [note, r.note].filter(Boolean).join(" ") || undefined);
  }

  // Captions from the browser while recording: shown live, and the fallback transcript.
  function startCaptions() {
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    let done = "";
    let live = "";
    let on = true;
    const begin = () => {
      const rec = new Ctor();
      rec.lang = "en-US";
      rec.interimResults = true;
      rec.continuous = true;
      rec.onresult = (e) => {
        let fin = "";
        let interim = "";
        for (let i = 0; i < e.results.length; i++) {
          if (e.results[i].isFinal) fin += e.results[i][0].transcript;
          else interim += e.results[i][0].transcript;
        }
        live = `${fin} ${interim}`.trim();
        setCaption(`${done} ${live}`.trim());
      };
      rec.onerror = () => {};
      rec.onend = () => {
        // Chrome stops after a pause: keep the words and listen again.
        done = `${done} ${live}`.trim();
        live = "";
        if (on) begin();
      };
      rec.start();
      recognition.current = { rec, stop: () => ((on = false), rec.stop()), text: () => `${done} ${live}`.trim() };
    };
    try {
      begin();
    } catch {
      // captions are a nice-to-have
    }
  }

  async function start() {
    setProblem(null);
    setCaption("");
    setSeconds(0);
    let media: MediaStream;
    try {
      media = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setProblem("The microphone is blocked or missing. Allow it from the address bar and try again.");
      return;
    }
    const type = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((t) => MediaRecorder.isTypeSupported(t));
    const rec = new MediaRecorder(media, type ? { mimeType: type } : undefined);
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      media.getTracks().forEach((t) => t.stop());
      setStream(null);
      void finish(new Blob(chunks, { type: rec.mimeType || "audio/webm" }));
    };
    rec.start(1000);
    recorder.current = rec;
    setStream(media);
    setPhase("recording");
    startCaptions();
  }

  function stop() {
    recognition.current?.stop();
    recorder.current?.stop();
    setPhase("transcribing");
  }

  async function finish(audio: Blob) {
    const browserText = recognition.current?.text() ?? "";
    recognition.current = null;
    const ext = audio.type.includes("mp4") ? "m4a" : "webm";
    const result = configured === false ? null : await transcribe(new File([audio], `meeting.${ext}`, { type: audio.type }));
    if (result && "text" in result && result.text) {
      await add(result.text, "recorded", "Live meeting");
    } else if (browserText) {
      await add(`Speaker 1: ${browserText}`, "recorded", "Live meeting", "Transcribed by your browser, so there are no speaker labels.");
    } else {
      setProblem(result && "error" in result ? result.error : "No speech was heard. Try again, closer to the mic.");
    }
    setPhase("idle");
  }

  async function onUpload(file: File) {
    setProblem(null);
    setPhase("transcribing");
    const result = await transcribe(file);
    if ("text" in result && result.text) await add(result.text, "uploaded", file.name.replace(/\.[^.]+$/, ""));
    else setProblem("error" in result ? result.error : "No speech found in that file.");
    setPhase("idle");
  }

  return (
    <div className="rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-rose-400 to-coral-500 text-white">
          <Mic className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-zinc-900">Record a meeting</p>
          <p className="text-xs text-zinc-500">Ari transcribes it with speaker labels (ElevenLabs Scribe) and learns from it.</p>
        </div>
      </div>

      {configured === false && (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          ElevenLabs speech-to-text isn&apos;t set up on this server (no ELEVENLABS_API_KEY). Recording still works: your browser transcribes it live, without
          speaker labels. Uploading audio files needs the key.
        </p>
      )}

      {phase === "recording" ? (
        <div className="ari-rise mt-3 space-y-2">
          <div className="flex items-center gap-3 rounded-xl bg-zinc-50 px-3 py-2">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-rose-500" />
            </span>
            <span className="w-12 font-mono text-sm font-semibold text-zinc-700">{clock(seconds)}</span>
            {stream && <Waveform stream={stream} />}
            <button onClick={stop} className="ari-lift inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-1.5 text-sm font-semibold text-white">
              <Square className="h-3.5 w-3.5 fill-current" /> Stop
            </button>
          </div>
          {caption && <p className="line-clamp-3 rounded-xl bg-ari-50/60 px-3 py-2 text-xs text-zinc-600">{caption}</p>}
        </div>
      ) : phase === "transcribing" ? (
        <p className="mt-3 flex items-center gap-2 rounded-xl bg-ari-50 px-3 py-2.5 text-sm text-ari-700">
          <LoaderCircle className="h-4 w-4 animate-spin" /> Transcribing and working out who said what…
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Meeting name"
            className="min-w-0 flex-1 rounded-xl border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-ari-400"
          />
          <button onClick={start} data-ari="record-meeting" className="ari-lift inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold text-white shadow-md shadow-ari-500/30 ari-gradient">
            <AudioLines className="h-4 w-4" /> Record live
          </button>
          <button
            onClick={() => upload.current?.click()}
            className="ari-lift inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 ring-1 ring-zinc-200"
          >
            <FileAudio className="h-4 w-4" /> Upload audio
          </button>
          <input
            ref={upload}
            type="file"
            accept=".mp3,.m4a,.wav,.mp4,.webm,audio/*,video/mp4,video/webm"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void onUpload(f);
            }}
          />
        </div>
      )}
      {problem && (
        <p className="ari-rise mt-2 flex items-start gap-2 text-xs text-rose-700">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {problem}
        </p>
      )}
    </div>
  );
}

async function transcribe(file: File): Promise<{ text: string } | { error: string }> {
  const form = new FormData();
  form.append("file", file);
  try {
    const res = await fetch("/api/transcribe", { method: "POST", body: form });
    const r = (await res.json()) as { text?: string; error?: string };
    if (res.ok && r.text !== undefined) return { text: r.text };
    return { error: r.error ?? `Transcription failed (${res.status})` };
  } catch {
    return { error: "Couldn't reach the transcription service." };
  }
}

// Live microphone levels, drawn as rounded bars in Ari's colours.
function Waveform({ stream }: { stream: MediaStream }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    ctx.createMediaStreamSource(stream).connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    let frame = 0;
    const draw = () => {
      const c = canvas.current;
      const g = c?.getContext("2d");
      if (c && g) {
        analyser.getByteFrequencyData(data);
        const { width, height } = c;
        g.clearRect(0, 0, width, height);
        const bars = 40;
        const gap = 3;
        const w = (width - gap * (bars - 1)) / bars;
        const grad = g.createLinearGradient(0, 0, width, 0);
        grad.addColorStop(0, "#7c5cff");
        grad.addColorStop(1, "#ff6f4f");
        g.fillStyle = grad;
        for (let i = 0; i < bars; i++) {
          const v = data[Math.min(data.length - 1, 2 + Math.abs(i - bars / 2) * 2)] / 255;
          const h = Math.max(3, v * height);
          g.beginPath();
          g.roundRect(i * (w + gap), (height - h) / 2, w, h, w / 2);
          g.fill();
        }
      }
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(frame);
      void ctx.close();
    };
  }, [stream]);
  return <canvas ref={canvas} width={320} height={36} className="h-9 min-w-0 flex-1" aria-hidden="true" />;
}
