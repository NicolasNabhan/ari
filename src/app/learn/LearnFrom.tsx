"use client";

import { useEffect, useState } from "react";
import { Workspace } from "@/components/workspace/Workspace";
import { StoryStage } from "@/components/story/StoryStage";
import { MY_LESSONS_KEY } from "@/components/apprentice/useApprentice";
import { MARIA_RECORDED } from "@/lib/apprentice/mariaSession";
import type { Lessons } from "@/lib/apprentice/types";

// Teach mode, from Maria's preloaded session or from what you just taught Ari.
// With `story`, it plays on the same fixed stage as /story, so it continues it.
export function LearnFrom({ fromYou, story = false }: { fromYou: boolean; story?: boolean }) {
  const [lessons, setLessons] = useState<Lessons | null>(fromYou ? null : MARIA_RECORDED);
  useEffect(() => {
    if (!fromYou) return;
    let mine: Lessons | null = null;
    try {
      const raw = localStorage.getItem(MY_LESSONS_KEY);
      mine = raw ? (JSON.parse(raw) as Lessons) : null;
    } catch {
      mine = null;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLessons(mine ?? MARIA_RECORDED);
  }, [fromYou]);
  if (!lessons) return null;
  if (!story) return <Workspace audience="newcomer" lessons={lessons} />;
  return (
    <StoryStage>
      {/* Keeps the face-in-a-box avatar for now: it carries Ari's caption and
          the mic / typed answer box. Set hideAvatar once the pet does that. */}
      <Workspace audience="newcomer" lessons={lessons} story hideAvatar={false}>
        <PetSlot />
      </Workspace>
    </StoryStage>
  );
}

// ─── PET SLOT ────────────────────────────────────────────────────────────────
// The 3D pet layer (src/components/story/pet/) mounts here. It sits on top of
// the 1440×900 stage, inside AriProvider, so it can use useAri() for Ari's
// caption, speaking state and listening. Replace this placeholder with it.
function PetSlot() {
  return <div data-ari="pet-slot" aria-hidden className="pointer-events-none absolute inset-0 z-40" />;
}
