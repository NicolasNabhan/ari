"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import type { FaceHandle } from "./TalkingHeadFace";

// Ari: a little glossy white robot with a dark visor and glowing eyes. It
// hovers, blinks, waves now and then (smiling with its eyes as it does), and a
// light bar on its visor flickers while it talks. No frame: it floats on the
// page as a cut-out. Its voice plays through Web Audio so it can be boosted.

const GAIN = 0.9; // a touch under Maria, who plays through her animated face

export const RobotAri = forwardRef<FaceHandle, { size: number; speaking: boolean; listening: boolean }>(function RobotAri(
  { size, speaking, listening },
  ref,
) {
  const ctx = useRef<AudioContext | null>(null);
  const source = useRef<AudioBufferSourceNode | null>(null);
  const generation = useRef(0); // bumps on stop(), so a line still loading never starts late
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

  return (
    <div data-ari="ari-robot" className="robot-ari pointer-events-none select-none" style={{ width: size, height: size * 1.2 }} data-speaking={speaking} data-listening={listening}>
      <div className="robot-hover h-full w-full">
        <svg viewBox="0 0 200 240" className="h-full w-full overflow-visible" aria-label="Ari">
          <RobotDefs />

          {/* arms, behind the body so they grow out of it; the right one waves */}
          <g className="ra-arm-l-up">
            <rect x="57" y="144" width="14" height="38" rx="7" fill="url(#ra-shell)" stroke="#d3d7e2" strokeWidth="1" />
            <g className="ra-arm-l-fore">
              <rect x="58" y="176" width="12" height="30" rx="6" fill="url(#ra-shell)" stroke="#d3d7e2" strokeWidth="1" />
              <ellipse cx="64" cy="208" rx="8.5" ry="8" fill="url(#ra-dark)" />
            </g>
          </g>
          <g className="ra-arm-r-up">
            <rect x="129" y="144" width="14" height="38" rx="7" fill="url(#ra-shell)" stroke="#d3d7e2" strokeWidth="1" />
            <g className="ra-arm-r-fore">
              <rect x="130" y="176" width="12" height="30" rx="6" fill="url(#ra-shell)" stroke="#d3d7e2" strokeWidth="1" />
              <ellipse cx="136" cy="208" rx="8.5" ry="8" fill="url(#ra-dark)" />
            </g>
          </g>

          {/* hover glow */}
          <ellipse className="ra-thruster" cx="100" cy="224" rx="16" ry="4" fill="#67e8f9" filter="url(#ra-soft)" />

          {/* body: a smooth bean */}
          <path d="M100 132 C140 132 147 166 137 191 C129 210 113 216 100 216 C87 216 71 210 63 191 C53 166 60 132 100 132 Z" fill="url(#ra-shell)" />
          <path d="M100 132 C140 132 147 166 137 191 C129 210 113 216 100 216 C87 216 71 210 63 191 C53 166 60 132 100 132 Z" fill="url(#ra-shade)" />
          <path d="M70 186 Q100 200 130 186" stroke="#c4c9d6" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <ellipse cx="84" cy="150" rx="12" ry="7" fill="#fff" opacity="0.7" transform="rotate(-20 84 150)" />
          <circle cx="100" cy="170" r="3.4" fill="#cffafe" filter="url(#ra-glow)" className="robot-antenna" />

          {/* neck: the head floats just above the body */}
          <ellipse cx="100" cy="130" rx="22" ry="5" fill="url(#ra-dark)" />

          {/* head */}
          <g className="robot-head" style={{ transformOrigin: "100px 128px" }}>
            <rect x="97" y="6" width="6" height="16" rx="3" fill="url(#ra-dark)" />
            <circle cx="100" cy="6" r="5" fill="#7dd3fc" filter="url(#ra-glow)" className="robot-antenna" />
            <ellipse cx="30" cy="74" rx="7" ry="17" fill="url(#ra-dark)" />
            <ellipse cx="170" cy="74" rx="7" ry="17" fill="url(#ra-dark)" />
            <rect x="30" y="18" width="140" height="108" rx="54" fill="url(#ra-shell)" />
            <rect x="30" y="18" width="140" height="108" rx="54" fill="url(#ra-shade)" />
            <ellipse cx="66" cy="34" rx="22" ry="8" fill="#fff" opacity="0.8" transform="rotate(-14 66 34)" />
            <rect x="44" y="42" width="112" height="62" rx="31" fill="url(#ra-visor)" />
            <path d="M58 52 Q100 42 142 52" stroke="#fff" strokeOpacity="0.16" strokeWidth="4" fill="none" strokeLinecap="round" />

            {/* eyes: open (blinking) most of the time, happy while waving */}
            <g filter="url(#ra-glow)" className={`robot-eyes ${listening ? "robot-eyes-up" : ""}`}>
              <g className="ra-eyes-open">
                <g className="robot-blink" style={{ transformOrigin: "100px 72px" }}>
                  <rect x="69" y="59" width="18" height="26" rx="9" fill="#a5f3fc" />
                  <rect x="113" y="59" width="18" height="26" rx="9" fill="#a5f3fc" />
                </g>
              </g>
              <g className="ra-eyes-happy">
                <path d="M67 80 Q78 64 89 80" stroke="#a5f3fc" strokeWidth="6.5" strokeLinecap="round" fill="none" />
                <path d="M111 80 Q122 64 133 80" stroke="#a5f3fc" strokeWidth="6.5" strokeLinecap="round" fill="none" />
              </g>
            </g>

            {/* voice light: flickers while Ari talks */}
            <g filter="url(#ra-glow)" opacity={speaking ? 1 : 0} style={{ transition: "opacity .2s" }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <rect
                  key={`${i}-${pulse % 2}`}
                  x={86 + i * 6}
                  y={92}
                  width="3.5"
                  height="7"
                  rx="1.75"
                  fill="#67e8f9"
                  className="robot-voicebar"
                  style={{ transformOrigin: `${87.75 + i * 6}px 95.5px`, animationDelay: `${(i * 97) % 300}ms` }}
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

function RobotDefs() {
  return (
    <defs>
      <radialGradient id="ra-shell" cx="35%" cy="25%" r="85%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="50%" stopColor="#f3f4f8" />
        <stop offset="100%" stopColor="#d3d7e1" />
      </radialGradient>
      <linearGradient id="ra-shade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="55%" stopColor="#5a6380" stopOpacity="0" />
        <stop offset="100%" stopColor="#5a6380" stopOpacity="0.16" />
      </linearGradient>
      <linearGradient id="ra-visor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#222a3d" />
        <stop offset="100%" stopColor="#04060b" />
      </linearGradient>
      <linearGradient id="ra-dark" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#3b4152" />
        <stop offset="100%" stopColor="#0c0e14" />
      </linearGradient>
      <filter id="ra-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2.2" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="ra-soft" x="-100%" y="-300%" width="300%" height="700%">
        <feGaussianBlur stdDeviation="4" />
      </filter>
    </defs>
  );
}
