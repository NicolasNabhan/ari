"use client";

import type { RefObject } from "react";
import { TalkingHeadFace, type FaceHandle } from "@/components/ari/TalkingHeadFace";

// Maria, the expert, on the left in step 1: her face lip-syncs to her voice.
export function MariaPortrait({ faceRef, speaking, leaving }: { faceRef: RefObject<FaceHandle | null>; speaking: boolean; leaving: boolean }) {
  return (
    <div
      data-ari="maria-portrait"
      className={`pointer-events-none fixed bottom-4 left-4 z-50 transition-all duration-700 ${leaving ? "-translate-x-8 opacity-0" : "opacity-100"}`}
    >
      <div
        className={`h-44 w-44 overflow-hidden rounded-3xl bg-gradient-to-b from-amber-100 to-coral-400/40 shadow-2xl shadow-coral-500/25 transition-all ${
          speaking ? "ring-4 ring-coral-400" : "ring-4 ring-white"
        }`}
      >
        <TalkingHeadFace ref={faceRef} gain={1.6} />
      </div>
      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-coral-500 px-3 py-1 text-xs font-semibold text-white shadow">
        Maria · the expert
      </span>
    </div>
  );
}
