"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, Crosshair, Eye, EyeOff, Loader2, MousePointer2, Power, ScanEye, ShieldCheck, X } from "lucide-react";
import { Calibration } from "./Calibration";
import type { Gaze } from "./useGaze";

// The opt-in "Eye tracking" control in the workspace header (expert only),
// plus everything it opens: the setup card, calibration, the gaze dot and
// the fallback notice.
export function GazeControl({ gaze }: { gaze: Gaze }) {
  const [setup, setSetup] = useState(false);
  const [menu, setMenu] = useState(false);
  const { mode } = gaze;

  return (
    <div data-gaze-ignore="" className="relative">
      {mode === "off" && (
        <button
          data-ari="eye-tracking"
          onClick={() => setSetup(true)}
          title="Let Ari see what you read before each decision"
          className="ari-lift flex items-center gap-1.5 rounded-full border border-ari-200 bg-white px-3 py-1.5 font-medium text-ari-700"
        >
          <ScanEye className="h-4 w-4" /> Eye tracking
        </button>
      )}
      {mode === "starting" && (
        <span className="flex items-center gap-1.5 rounded-full bg-ari-50 px-3 py-1.5 font-medium text-ari-700">
          <Loader2 className="h-4 w-4 animate-spin" /> Starting camera…
        </span>
      )}
      {(mode === "eyes" || mode === "mouse" || mode === "calibrating") && (
        <button
          data-ari="eye-tracking"
          onClick={() => setMenu(!menu)}
          className={`ari-rise flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold ring-1 ${
            mode === "mouse" ? "bg-amber-50 text-amber-800 ring-amber-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200"
          }`}
          title={mode === "mouse" ? "Your mouse pointer stands in for your eyes" : "Ari can see what you read"}
        >
          <span className="relative flex h-2 w-2">
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${mode === "mouse" ? "bg-amber-400" : "bg-emerald-400"}`} />
            <span className={`relative inline-flex h-2 w-2 rounded-full ${mode === "mouse" ? "bg-amber-500" : "bg-emerald-500"}`} />
          </span>
          {mode === "mouse" ? (
            <>
              <MousePointer2 className="h-4 w-4" /> Mouse as gaze
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" /> Eyes on
            </>
          )}
        </button>
      )}

      {menu && (mode === "eyes" || mode === "mouse") && (
        <div className="ari-pop absolute right-0 top-11 z-50 w-56 rounded-2xl bg-white p-1.5 text-sm shadow-xl shadow-ari-500/15 ring-1 ring-zinc-200/70">
          <MenuItem icon={gaze.showDot ? EyeOff : Crosshair} onClick={() => gaze.setShowDot(!gaze.showDot)}>
            {gaze.showDot ? "Hide gaze dot" : "Show gaze dot"}
          </MenuItem>
          {mode === "eyes" ? (
            <MenuItem icon={ScanEye} onClick={() => (setMenu(false), gaze.recalibrate())}>
              Recalibrate
            </MenuItem>
          ) : (
            <MenuItem icon={Camera} onClick={() => (setMenu(false), gaze.startCamera())}>
              Try the camera
            </MenuItem>
          )}
          <MenuItem icon={Power} onClick={() => (setMenu(false), gaze.stop())}>
            Turn off
          </MenuItem>
        </div>
      )}

      {/* The header's backdrop blur would trap fixed overlays: render them on <body>. */}
      {createPortal(
        <>
          {setup && <SetupCard onClose={() => setSetup(false)} onCamera={() => (setSetup(false), gaze.startCamera())} onMouse={() => (setSetup(false), gaze.mouseMode())} />}
          {mode === "calibrating" && <Calibration onDone={gaze.finishCalibration} onSkip={gaze.finishCalibration} />}
          {gaze.notice && <Notice text={gaze.notice} onClose={gaze.dismissNotice} />}
        </>,
        document.body,
      )}
    </div>
  );
}

function MenuItem({ icon: Icon, onClick, children }: { icon: typeof Eye; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-zinc-700 hover:bg-ari-50 hover:text-ari-700">
      <Icon className="h-4 w-4" /> {children}
    </button>
  );
}

function SetupCard({ onClose, onCamera, onMouse }: { onClose: () => void; onCamera: () => void; onMouse: () => void }) {
  return (
    <div data-gaze-ignore="" className="fixed inset-0 z-[70] flex items-center justify-center bg-[#1d1a2f]/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <section onClick={(e) => e.stopPropagation()} className="ari-pop relative w-full max-w-md rounded-3xl bg-white p-6 text-left shadow-2xl">
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600">
          <X className="h-4 w-4" />
        </button>
        <span className="grid h-12 w-12 place-items-center rounded-2xl text-white shadow-md shadow-ari-500/30 ari-gradient-animated">
          <ScanEye className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-xl font-semibold text-zinc-900">Let Ari see what you read</h2>
        <p className="mt-1.5 text-sm text-zinc-600">
          Experts decide from what they read: a late delivery, a line in the procedure. With eye tracking, Ari notes what you looked at before each decision, so it asks sharper questions and
          shows the next person where to look.
        </p>
        <p className="mt-3 flex items-start gap-2 rounded-2xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /> The camera stays in this browser. No video is recorded or uploaded; only &ldquo;what, for how long&rdquo;.
        </p>
        <div className="mt-5 grid gap-2">
          <button onClick={onCamera} className="ari-lift flex items-center justify-center gap-2 rounded-2xl py-3 font-semibold text-white shadow-lg shadow-ari-500/30 ari-gradient">
            <Camera className="h-4 w-4" /> Use my camera
          </button>
          <button onClick={onMouse} className="ari-lift flex items-center justify-center gap-2 rounded-2xl bg-white py-3 font-semibold text-zinc-700 ring-1 ring-zinc-200">
            <MousePointer2 className="h-4 w-4" /> No camera: use my mouse as gaze
          </button>
        </div>
        <p className="mt-3 text-center text-[11px] text-zinc-400">Webcam eye tracking by WebGazer.js (Brown University, GPLv3). Takes a quick 9-point calibration.</p>
      </section>
    </div>
  );
}

function Notice({ text, onClose }: { text: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 7000);
    return () => clearTimeout(t);
  }, [text, onClose]);
  return (
    <div data-gaze-ignore="" className="ari-rise fixed left-1/2 top-[72px] z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 shadow-lg ring-1 ring-amber-200">
      <MousePointer2 className="h-4 w-4 shrink-0" /> {text}
      <button onClick={onClose} aria-label="Dismiss" className="rounded-full p-0.5 text-amber-700 hover:bg-amber-100">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// The live, smoothed gaze point. Moved by the sampling loop, not by React.
export function GazeDot({ on, mouse, dot }: { on: boolean; mouse: boolean; dot: (el: HTMLDivElement | null) => void }) {
  if (!on) return null;
  return (
    <div ref={dot} aria-hidden className="pointer-events-none fixed left-0 top-0 z-[65]" style={{ transform: "translate(-100px, -100px)" }}>
      <span
        className={`block h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${mouse ? "border-amber-400/80 bg-amber-300/15" : "border-ari-500/80 bg-ari-400/20"} shadow-[0_0_24px_rgb(124_92_255/0.35)]`}
      />
    </div>
  );
}
