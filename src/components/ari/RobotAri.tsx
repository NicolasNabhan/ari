"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { FaceHandle } from "./TalkingHeadFace";

// Ari: a little glossy white robot with a dark visor and glowing eyes. It
// hovers, blinks, sometimes smiles with its eyes, waves now and then, and a
// light bar on its visor flickers while it talks. No frame: it floats on the
// page as a cut-out. Its voice plays through Web Audio so it can be boosted.

const GAIN = 2.2; // Ari's voice is recorded quieter than Maria's

export const RobotAri = forwardRef<FaceHandle, { size: number; speaking: boolean; listening: boolean }>(function RobotAri(
  { size, speaking, listening },
  ref,
) {
  const ctx = useRef<AudioContext | null>(null);
  const source = useRef<AudioBufferSourceNode | null>(null);
  const generation = useRef(0); // bumps on stop(), so a line still loading never starts late
  const [happy, setHappy] = useState(false);
  const [pulse, setPulse] = useState(0); // bumps on each spoken word (browser voice)

  useImperativeHandle(ref, () => ({
    ready: () => true,
    async speakAudio(audioBase64) {
      const gen = generation.current;
      ctx.current ??= new AudioContext();
      const ac = ctx.current;
      if (ac.state === "suspended") await ac.resume();
      const bytes = Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0));
      const buffer = await ac.decodeAudioData(bytes.buffer);
      if (gen !== generation.current) return;
      source.current?.stop();
      const src = ac.createBufferSource();
      const gain = ac.createGain();
      gain.gain.value = GAIN;
      src.buffer = buffer;
      src.connect(gain).connect(ac.destination);
      source.current = src;
      await new Promise<void>((resolve) => {
        src.onended = () => resolve();
        src.start();
      });
    },
    mouthWord: () => setPulse((p) => p + 1),
    mouth: () => setPulse((p) => p + 1),
    stop: () => {
      generation.current++;
      try {
        source.current?.stop();
      } catch {
        // already stopped
      }
      source.current = null;
    },
  }));

  // Every so often, happy eyes for a moment.
  useEffect(() => {
    let off: ReturnType<typeof setTimeout>;
    const t = setInterval(() => {
      setHappy(true);
      off = setTimeout(() => setHappy(false), 1800);
    }, 7000);
    return () => {
      clearInterval(t);
      clearTimeout(off);
    };
  }, []);

  const eyesHappy = happy && !listening;
  return (
    <div className="robot-ari pointer-events-none select-none" style={{ width: size, height: size * 1.2 }} data-speaking={speaking} data-listening={listening}>
      <div className="robot-hover h-full w-full">
        <svg viewBox="0 0 200 240" className="h-full w-full overflow-visible" aria-label="Ari">
          <defs>
            <radialGradient id="ra-white" cx="38%" cy="28%" r="80%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="60%" stopColor="#eef0f6" />
              <stop offset="100%" stopColor="#c9cedb" />
            </radialGradient>
            <linearGradient id="ra-visor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1c2233" />
              <stop offset="100%" stopColor="#05070c" />
            </linearGradient>
            <linearGradient id="ra-joint" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#3a3f4d" />
              <stop offset="100%" stopColor="#0b0d12" />
            </linearGradient>
            <filter id="ra-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.4" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* arms */}
          <g className="robot-arm-left" style={{ transformOrigin: "62px 150px" }}>
            <rect x="34" y="138" width="34" height="16" rx="8" fill="url(#ra-joint)" transform="rotate(-35 62 150)" />
            <rect x="22" y="112" width="18" height="30" rx="9" fill="url(#ra-white)" transform="rotate(-20 31 127)" />
            <circle cx="27" cy="108" r="8" fill="url(#ra-joint)" />
          </g>
          <g className="robot-arm-right" style={{ transformOrigin: "138px 150px" }}>
            <rect x="132" y="138" width="34" height="16" rx="8" fill="url(#ra-joint)" transform="rotate(35 138 150)" />
            <rect x="160" y="112" width="18" height="30" rx="9" fill="url(#ra-white)" transform="rotate(20 169 127)" />
            <circle cx="173" cy="108" r="8" fill="url(#ra-joint)" />
          </g>

          {/* body */}
          <ellipse cx="100" cy="168" rx="40" ry="38" fill="url(#ra-white)" />
          <path d="M62 178 Q100 196 138 178 L136 188 Q100 206 64 188 Z" fill="url(#ra-joint)" />
          <circle cx="100" cy="186" r="3.2" fill="#dff8ff" filter="url(#ra-glow)" />

          {/* legs */}
          <rect x="72" y="198" width="22" height="26" rx="10" fill="url(#ra-white)" />
          <rect x="106" y="198" width="22" height="26" rx="10" fill="url(#ra-white)" />
          <rect x="70" y="219" width="26" height="8" rx="4" fill="url(#ra-joint)" />
          <rect x="104" y="219" width="26" height="8" rx="4" fill="url(#ra-joint)" />

          {/* head */}
          <g className="robot-head" style={{ transformOrigin: "100px 128px" }}>
            <rect x="96" y="2" width="8" height="16" rx="4" fill="url(#ra-joint)" />
            <circle cx="100" cy="4" r="5" fill="#7dd3fc" filter="url(#ra-glow)" className="robot-antenna" />
            <ellipse cx="26" cy="72" rx="9" ry="20" fill="url(#ra-joint)" />
            <ellipse cx="174" cy="72" rx="9" ry="20" fill="url(#ra-joint)" />
            <rect x="24" y="14" width="152" height="118" rx="58" fill="url(#ra-white)" />
            <rect x="40" y="36" width="120" height="76" rx="36" fill="url(#ra-visor)" />
            <path d="M54 46 Q100 34 146 46" stroke="white" strokeOpacity="0.18" strokeWidth="5" fill="none" strokeLinecap="round" />

            {/* eyes */}
            <g filter="url(#ra-glow)" className={`robot-eyes ${listening ? "robot-eyes-up" : ""}`}>
              {eyesHappy ? (
                <>
                  <path d="M66 78 Q78 62 90 78" stroke="#a5f3fc" strokeWidth="7" strokeLinecap="round" fill="none" />
                  <path d="M110 78 Q122 62 134 78" stroke="#a5f3fc" strokeWidth="7" strokeLinecap="round" fill="none" />
                </>
              ) : (
                <g className="robot-blink" style={{ transformOrigin: "100px 72px" }}>
                  <rect x="69" y="60" width="18" height="24" rx="9" fill="#a5f3fc" />
                  <rect x="113" y="60" width="18" height="24" rx="9" fill="#a5f3fc" />
                </g>
              )}
            </g>

            {/* voice light: flickers while Ari talks */}
            <g filter="url(#ra-glow)" opacity={speaking ? 1 : 0} style={{ transition: "opacity .2s" }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <rect
                  key={`${i}-${pulse % 2}`}
                  x={86 + i * 6}
                  y={94}
                  width="3.5"
                  height="8"
                  rx="1.75"
                  fill="#67e8f9"
                  className="robot-voicebar"
                  style={{ transformOrigin: `${87.75 + i * 6}px 98px`, animationDelay: `${(i * 97) % 300}ms` }}
                />
              ))}
            </g>
          </g>
        </svg>
      </div>
      <div className="robot-shadow mx-auto -mt-2 h-3 w-1/2 rounded-full bg-zinc-900/20 blur-sm" />
    </div>
  );
});
