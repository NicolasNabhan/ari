"use client";

import { useState } from "react";
import type { DecisionCard, TodayTask } from "@/lib/apprentice/types";

// Guided mode for judges: what to do next and what to say. Ari reacts for
// real, so going off script works too.
type Step = { do: React.ReactNode; say?: string; done: (s: Progress) => boolean };
type Progress = { started: boolean; task: TodayTask | null; cards: DecisionCard[]; ended: boolean };

const answered = (cards: DecisionCard[], stepId: string) => cards.some((c) => c.stepId === stepId && c.reason?.source === "expert");

const STEPS: Step[] = [
  { do: <>Click <b>Start session with Ari</b>.</>, done: (s) => s.started },
  { do: <>Ari asks what you&rsquo;re working on. Answer:</>, say: "40 laptops for Marketing, due Friday.", done: (s) => !!s.task },
  {
    do: <>Open the laptop request in the <b>Inbox</b>, click <b>Work on this request</b>, tick all 3 vendors and <b>Request 3 quotes</b>. Ari stays quiet: that&rsquo;s the procedure.</>,
    done: (s) => s.cards.some((c) => c.stepId === "quotes"),
  },
  {
    do: <>Open Apex Tech&rsquo;s <b>delivery history</b>, then <b>select Brightline</b>, the pricier one. When Ari asks why, say:</>,
    say: "Apex shipped late twice last year, and Friday is a hard deadline.",
    done: (s) => answered(s.cards, "vendor"),
  },
  {
    do: <>Open the <b>Scoring sheet</b> and give Brightline <b>82</b> (press Enter). When Ari asks, say:</>,
    say: "40% price, 60% delivery record. It's Finance's formula, nobody wrote it down.",
    done: (s) => answered(s.cards, "scoring"),
  },
  {
    do: <>Go to <b>Approvals</b> and <b>send it to the CFO</b>. When Ari asks, say:</>,
    say: "New suppliers over $25k always go to the CFO first. It's not written down anywhere.",
    done: (s) => answered(s.cards, "approval"),
  },
  { do: <><b>Issue the purchase order</b>, then click <b>End session</b>. When Ari offers to check its guesses, say &ldquo;Yes&rdquo;.</>, done: (s) => s.ended },
];

export function ScriptCard(progress: Progress) {
  const [hidden, setHidden] = useState(false);
  const index = STEPS.findIndex((s) => !s.done(progress));
  if (hidden) {
    return (
      <button onClick={() => setHidden(false)} className="fixed bottom-6 left-6 z-30 rounded-full bg-zinc-900 px-3 py-2 text-xs font-medium text-white shadow-lg dark:bg-white dark:text-zinc-900">
        Show script
      </button>
    );
  }
  return (
    <aside data-ari="script-card" className="fixed bottom-6 left-6 z-30 w-80 rounded-2xl border bg-white p-4 text-sm shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
          {index === -1 ? "Done" : `Step ${index + 1} of ${STEPS.length}`}
        </span>
        <button onClick={() => setHidden(true)} className="text-xs text-zinc-400 underline">
          hide
        </button>
      </div>
      {index === -1 ? (
        <p className="mt-2">
          Ari learned your job. Now <b>watch Ari teach it</b> to a newcomer, using your own answers: click the green button at the top.
        </p>
      ) : (
        <>
          <p data-ari="script-step" className="mt-2">{STEPS[index].do}</p>
          {STEPS[index].say && <p className="mt-2 rounded-lg bg-indigo-50 px-3 py-2 italic text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200">&ldquo;{STEPS[index].say}&rdquo;</p>}
          <p className="mt-2 text-xs text-zinc-400">Say it out loud, or type it under Ari. Going off script works too: Ari reacts for real.</p>
        </>
      )}
    </aside>
  );
}
