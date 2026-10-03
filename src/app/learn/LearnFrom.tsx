"use client";

import { useEffect, useState } from "react";
import { Workspace } from "@/components/workspace/Workspace";
import { MY_LESSONS_KEY } from "@/components/apprentice/useApprentice";
import { MARIA_RECORDED } from "@/lib/apprentice/mariaSession";
import type { Lessons } from "@/lib/apprentice/types";

// Teach mode, from Maria's preloaded session or from what you just taught Ari.
export function LearnFrom({ fromYou }: { fromYou: boolean }) {
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
  return <Workspace audience="newcomer" lessons={lessons} />;
}
