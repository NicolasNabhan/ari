"use client";

import { useEffect, useState } from "react";
import { fitStage, STAGE } from "@/lib/story/stage";

// Renders its children on a fixed 1440×900 stage, scaled to fit the window.
// Fixed-position children are positioned relative to the stage.
export function StoryStage({ children }: React.PropsWithChildren) {
  const [fit, setFit] = useState<{ scale: number; offsetX: number; offsetY: number } | null>(null);
  useEffect(() => {
    const update = () => setFit(fitStage({ width: window.innerWidth, height: window.innerHeight }));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return (
    <div className="fixed inset-0 overflow-hidden bg-[#ece8fb]">
      {fit && (
        <div
          data-ari="story-stage"
          className="absolute left-0 top-0 overflow-hidden bg-[var(--background)] shadow-2xl"
          style={{
            width: STAGE.width,
            height: STAGE.height,
            transform: `translate(${fit.offsetX}px, ${fit.offsetY}px) scale(${fit.scale})`,
            transformOrigin: "0 0",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
