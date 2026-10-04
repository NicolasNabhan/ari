"use client";

import { useState } from "react";
import { Check, Crosshair, Eye } from "lucide-react";

// Nine dots; click each a few times while looking at it. WebGazer learns from
// every click (it pairs where you clicked with what your eyes looked like).
// Kept off the left edge and the bottom-right corner: those belong to the
// characters (Maria on the left, Ari bottom-right).
const POINTS = [12, 50, 78].flatMap((y) => [22, 50, 78].map((x) => ({ x, y })));
const CLICKS = 3;

export function Calibration({ onDone, onSkip }: { onDone: () => void; onSkip: () => void }) {
  const [clicks, setClicks] = useState<number[]>(() => POINTS.map(() => 0));
  const done = clicks.filter((c) => c >= CLICKS).length;
  const finished = done === POINTS.length;
  // One dot at a time, in order: it keeps the eyes moving across the whole screen.
  const current = clicks.findIndex((c) => c < CLICKS);

  function hit(i: number) {
    if (i !== current) return;
    const next = clicks.map((c, j) => (j === i ? c + 1 : c));
    setClicks(next);
    if (next.every((c) => c >= CLICKS)) setTimeout(onDone, 900);
  }

  return (
    <div data-gaze-ignore="" className="fixed inset-0 z-[70] bg-[#f7f5ff]/85 backdrop-blur-sm">
      <style>{WEBGAZER_PREVIEW_CSS}</style>
      <div className="ari-pop absolute left-1/2 top-[28%] w-[min(28rem,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-5 text-center shadow-2xl shadow-ari-500/20 ring-1 ring-ari-100">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl text-white shadow-md shadow-ari-500/30 ari-gradient-animated">
          {finished ? <Check className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </span>
        <h2 className="mt-3 text-lg font-semibold text-zinc-900">{finished ? "Calibrated. Ari can follow your eyes." : "Teach Ari where you look"}</h2>
        <p className="mt-1 text-sm text-zinc-500">
          {finished ? "Your camera stays in this browser; nothing is recorded or uploaded." : `Look at the glowing dot and click it ${CLICKS} times. Keep your head still and your face in the little preview.`}
        </p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-ari-50">
          <div className="h-2 rounded-full ari-gradient transition-all duration-500" style={{ width: `${(done / POINTS.length) * 100}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-zinc-400">
          <span>
            {done} / {POINTS.length} points
          </span>
          {!finished && (
            <button onClick={onSkip} className="font-medium text-zinc-500 underline-offset-2 hover:text-ari-700 hover:underline">
              Skip calibration
            </button>
          )}
        </div>
      </div>
      {POINTS.map((p, i) => {
        const n = clicks[i];
        const complete = n >= CLICKS;
        const isCurrent = i === current;
        return (
          <button
            key={i}
            aria-label={`Calibration point ${i + 1}`}
            onClick={() => hit(i)}
            disabled={!isCurrent}
            className="absolute grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full transition-all duration-300"
            style={{ left: `${p.x}%`, top: `${p.y}%`, transform: `translate(-50%, -50%) scale(${isCurrent ? 1 : 0.7})` }}
          >
            {isCurrent && <span className="ari-ring absolute inset-0 rounded-full bg-ari-400/40" />}
            <svg viewBox="0 0 48 48" className="absolute inset-0 h-12 w-12 -rotate-90">
              <circle cx="24" cy="24" r="20" fill="none" stroke="var(--color-ari-100)" strokeWidth="4" />
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke={complete ? "#10b981" : "url(#ari-cal)"}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 20}
                strokeDashoffset={2 * Math.PI * 20 * (1 - Math.min(n, CLICKS) / CLICKS)}
                className="transition-all duration-300"
              />
              <defs>
                <linearGradient id="ari-cal" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="var(--color-ari-500)" />
                  <stop offset="1" stopColor="var(--color-coral-500)" />
                </linearGradient>
              </defs>
            </svg>
            <span
              className={`relative grid h-6 w-6 place-items-center rounded-full text-white shadow-md ${
                complete ? "bg-emerald-500" : isCurrent ? "ari-gradient shadow-ari-500/40" : "bg-zinc-300"
              }`}
            >
              {complete ? <Check className="h-3.5 w-3.5" /> : <Crosshair className="h-3.5 w-3.5" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// WebGazer's own preview is a 320x240 box pinned top-left; make it a small,
// framed preview at the bottom centre while calibrating.
const WEBGAZER_PREVIEW_CSS = `
#webgazerVideoContainer {
  top: auto !important; left: 50% !important; bottom: 20px !important;
  transform: translateX(-50%);
  border-radius: 18px; overflow: hidden; z-index: 75 !important;
  box-shadow: 0 0 0 3px #fff, 0 0 0 5px var(--color-ari-200), 0 12px 32px rgb(76 50 214 / .25);
}
#webgazerFaceFeedbackBox { border-radius: 12px; }
`;
