"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AttentionRecord } from "@/lib/context/types";
import { emptyDwell, flushDwell, hitTarget, smooth, stepDwell, type GazeSample } from "@/lib/gaze/attention";
import { cameraAllowed, loadWebGazer, type WebGazer } from "./webgazer";

// off → starting (camera, model) → calibrating → eyes
// or straight to mouse ("mouse as gaze") when there's no camera, so the demo always works.
export type GazeMode = "off" | "starting" | "calibrating" | "eyes" | "mouse";

const TICK_MS = 50;
const STALE_MS = 600; // no webcam prediction for this long: treat as looking away
const MOUSE_IDLE_MS = 5000; // mouse as gaze: a pointer parked this long (typing, talking) isn't attention

export function useGaze({ screen, enabled, onRecord }: { screen: string; enabled: boolean; onRecord: (r: AttentionRecord) => void }) {
  const [mode, setMode] = useState<GazeMode>("off");
  const [notice, setNotice] = useState<string | null>(null);
  const [showDot, setShowDot] = useState(true);
  const [records, setRecords] = useState<AttentionRecord[]>([]);

  const wg = useRef<WebGazer | null>(null);
  const raw = useRef<GazeSample | null>(null);
  const smoothed = useRef<GazeSample | null>(null);
  const dwell = useRef(emptyDwell());
  const dotRef = useRef<HTMLDivElement | null>(null);
  const screenRef = useRef(screen);
  const onRecordRef = useRef(onRecord);
  useEffect(() => {
    screenRef.current = screen;
    onRecordRef.current = onRecord;
  }, [screen, onRecord]);

  const emit = useCallback((record: AttentionRecord | null) => {
    if (!record) return;
    setRecords((r) => [...r, record]);
    onRecordRef.current(record);
  }, []);

  const active = enabled && (mode === "eyes" || mode === "mouse");
  // A callback ref for the gaze dot, which the loop moves without re-rendering.
  const setDot = useCallback((el: HTMLDivElement | null) => {
    dotRef.current = el;
  }, []);

  // The sampling loop: latest raw point → smoothed → element under it → dwell.
  useEffect(() => {
    if (!active) return;
    const mouse = mode === "mouse";
    const onMove = (e: MouseEvent) => (raw.current = { x: e.clientX, y: e.clientY, t: Date.now() });
    // A click is about to become a decision: close the current fixation first
    // so the decision's card gets what was just being read.
    const onDown = (e: PointerEvent) => {
      if (mouse) onMove(e);
      const out = flushDwell(dwell.current, Date.now());
      dwell.current = out.state;
      emit(out.record);
    };
    if (mouse) window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { capture: true });

    const timer = window.setInterval(() => {
      const now = Date.now();
      const point = raw.current;
      // No sample: the dwell gap logic ends the fixation.
      if (!point || now - point.t > (mouse ? MOUSE_IDLE_MS : STALE_MS)) return;
      const p = smooth(smoothed.current, { x: point.x, y: point.y, t: now }, mouse ? 0.6 : 0.25);
      smoothed.current = p;
      const x = Math.min(Math.max(p.x, 0), window.innerWidth - 1);
      const y = Math.min(Math.max(p.y, 0), window.innerHeight - 1);
      if (dotRef.current) dotRef.current.style.transform = `translate(${x}px, ${y}px)`;
      const out = stepDwell(dwell.current, hitTarget(document.elementFromPoint(x, y), screenRef.current), now);
      dwell.current = out.state;
      emit(out.record);
    }, TICK_MS);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("pointerdown", onDown, { capture: true });
      const out = flushDwell(dwell.current, Date.now());
      dwell.current = emptyDwell();
      smoothed.current = null;
      emit(out.record);
    };
  }, [active, mode, emit]);

  const stopCamera = useCallback(() => {
    const g = wg.current;
    wg.current = null;
    if (!g) return;
    try {
      g.clearGazeListener();
      g.pause();
      g.stopVideo();
      g.end();
    } catch {
      // already stopped
    }
  }, []);

  // Session over (or leaving the page): release the camera.
  useEffect(() => {
    if (!enabled) return;
    return stopCamera;
  }, [enabled, stopCamera]);

  const fallBackToMouse = useCallback(
    (why: string | null = null) => {
      stopCamera();
      raw.current = null;
      setNotice(why);
      setMode("mouse");
    },
    [stopCamera],
  );

  const startCamera = useCallback(async () => {
    setNotice(null);
    setMode("starting");
    if (!(await cameraAllowed())) return fallBackToMouse("No camera, or permission denied. Using your mouse as gaze instead.");
    try {
      const g = await loadWebGazer();
      let failed = false;
      g.saveDataAcrossSessions(false);
      g.setGazeListener((data) => {
        if (data) raw.current = { x: data.x, y: data.y, t: Date.now() };
      });
      await g.begin(() => (failed = true));
      if (failed) return fallBackToMouse("The camera didn't start. Using your mouse as gaze instead.");
      g.showPredictionPoints(false);
      g.applyKalmanFilter(true);
      g.setVideoViewerSize(200, 150);
      g.showVideoPreview(true); // a small framed preview while calibrating
      wg.current = g;
      setMode("calibrating");
    } catch {
      fallBackToMouse("Eye tracking couldn't load (offline?). Using your mouse as gaze instead.");
    }
  }, [fallBackToMouse]);

  const finishCalibration = useCallback(() => {
    wg.current?.showVideoPreview(false);
    setMode("eyes");
  }, []);

  const recalibrate = useCallback(() => {
    if (!wg.current) return;
    wg.current.showVideoPreview(true);
    setMode("calibrating");
  }, []);

  const stop = useCallback(() => {
    stopCamera();
    raw.current = null;
    setNotice(null);
    setMode("off");
  }, [stopCamera]);

  return {
    mode,
    active,
    notice,
    dismissNotice: () => setNotice(null),
    showDot,
    setShowDot,
    records,
    setDot,
    startCamera,
    mouseMode: () => fallBackToMouse(null),
    finishCalibration,
    recalibrate,
    stop,
  };
}

export type Gaze = ReturnType<typeof useGaze>;
