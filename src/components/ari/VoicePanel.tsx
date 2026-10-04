"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, RotateCcw, SendHorizontal } from "lucide-react";

// The live voice waveform: real microphone levels, drawn as rounded bars.
function Waveform({ active }: { active: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!active) return;
    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;
    let frame = 0;
    let cancelled = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        return; // the panel shows the problem from speech recognition
      }
      if (cancelled) return stream.getTracks().forEach((t) => t.stop());
      ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const draw = () => {
        const c = canvas.current;
        const g = c?.getContext("2d");
        if (c && g) {
          analyser.getByteFrequencyData(data);
          const { width, height } = c;
          g.clearRect(0, 0, width, height);
          const bars = 36;
          const gap = 3;
          const w = (width - gap * (bars - 1)) / bars;
          const grad = g.createLinearGradient(0, 0, width, 0);
          grad.addColorStop(0, "#7c5cff");
          grad.addColorStop(1, "#ff6f4f");
          g.fillStyle = grad;
          for (let i = 0; i < bars; i++) {
            // Mirror around the centre so the wave looks like a voice, not an EQ.
            const bin = Math.abs(i - bars / 2) * 2;
            const v = data[Math.min(data.length - 1, 2 + bin)] / 255;
            const h = Math.max(4, v * height);
            const x = i * (w + gap);
            g.beginPath();
            g.roundRect(x, (height - h) / 2, w, h, w / 2);
            g.fill();
          }
        }
        frame = requestAnimationFrame(draw);
      };
      draw();
    })();
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((t) => t.stop());
      ctx?.close();
    };
  }, [active]);
  return <canvas ref={canvas} width={260} height={44} className="h-11 w-full" aria-hidden="true" />;
}

export function VoicePanel({
  listening,
  heard,
  problem,
  onAnswer,
  onRetry,
}: {
  listening: boolean;
  heard: string;
  problem: string | null;
  onAnswer: (text: string) => void;
  onRetry: () => void;
}) {
  const [typed, setTyped] = useState("");
  const [typing, setTyping] = useState(false);
  if (!listening) return null;
  return (
    <div data-ari="voice-panel" className="ari-pop mt-3 rounded-2xl border border-ari-100 bg-gradient-to-b from-ari-50 to-white p-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          data-ari="mic"
          onClick={onRetry}
          title={problem ? "Try the microphone again" : "Listening"}
          className="relative grid h-14 w-14 shrink-0 place-items-center rounded-full text-white shadow-lg shadow-ari-500/30 ari-gradient"
        >
          {!problem && (
            <>
              <span className="ari-ring absolute inset-0 rounded-full bg-ari-400" />
              <span className="ari-ring ari-ring-delay absolute inset-0 rounded-full bg-coral-400" />
            </>
          )}
          {problem ? <MicOff className="relative h-6 w-6" /> : <Mic className="relative h-6 w-6" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-ari-600">{problem ? "Microphone off" : "Listening…"}</p>
          {problem ? <p className="text-xs text-zinc-600">{problem}</p> : <Waveform active={listening && !problem} />}
        </div>
        {problem && (
          <button type="button" onClick={onRetry} title="Try again" className="rounded-full p-2 text-ari-600 hover:bg-ari-100">
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
      </div>
      <p data-ari="heard" className={`mt-2 min-h-5 text-sm ${heard ? "text-zinc-800" : "italic text-zinc-400"}`}>
        {heard ? `“${heard}”` : problem ? "" : "Speak your answer…"}
      </p>
      {typing || problem ? (
        <form
          className="mt-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!typed.trim()) return;
            onAnswer(typed);
            setTyped("");
          }}
        >
          <input
            data-ari="answer-input"
            autoFocus
            className="min-w-0 flex-1 rounded-xl border border-ari-200 bg-white px-3 py-2 text-sm outline-none focus:border-ari-500 focus:ring-2 focus:ring-ari-100"
            placeholder="Type your answer…"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
          />
          <button data-ari="answer-send" title="Send" className="grid w-10 place-items-center rounded-xl text-white ari-gradient">
            <SendHorizontal className="h-4 w-4" />
          </button>
        </form>
      ) : (
        <button type="button" data-ari="type-instead" onClick={() => setTyping(true)} className="mt-1 text-xs text-zinc-500 underline-offset-2 hover:underline">
          Prefer to type?
        </button>
      )}
    </div>
  );
}
