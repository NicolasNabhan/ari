"use client";

import { useEffect, useRef, useState } from "react";
import { useAri } from "@/components/ari/AriProvider";
import { sounds } from "@/lib/ari/sounds";
import { ChevronDown, ChevronUp, Info, Mic, PartyPopper } from "lucide-react";
import type { DecisionCard, TodayTask } from "@/lib/apprentice/types";
import type { Screen } from "@/lib/workspace/events";

// The guide for the person teaching Ari: what to click next, why, and what to
// say. The next element on screen pulses. Ari reacts for real, so going off
// script works too.
type Progress = { task: TodayTask | null; cards: DecisionCard[]; ended: boolean; screen: Screen };
type Step = {
  title: string;
  todo: React.ReactNode;
  voice?: string; // what Ari says out loud when this step starts
  why: string;
  say?: string;
  targets: string[];
  done: (p: Progress) => boolean;
};

const answered = (cards: DecisionCard[], stepId: string) => cards.some((c) => c.stepId === stepId && c.reason?.source === "expert");

const STEPS: Step[] = [
  {
    title: "Tell Ari what you're working on",
    todo: <>Ari just asked you a question. Answer it out loud; the microphone is already on.</>,
    why: "Ari knows your job from your profile. Now it learns today's task.",
    say: "40 laptops for Marketing, due Friday.",
    targets: ["mic"],
    done: (p) => !!p.task,
  },
  {
    title: "Open the purchase request",
    voice: "Great. Now open Tom's laptop request in the inbox, and click Work on this request.",
    todo: (
      <>
        In the <b>Inbox</b>, click Tom&rsquo;s request for <b>40 laptops</b>, then click <b>Work on this request</b>.
      </>
    ),
    why: "This is the request you'll handle from start to finish.",
    targets: ["inbox-req-laptops", "go-to-vendors", "nav-inbox"],
    done: (p) => p.screen === "vendors" || p.cards.length > 0,
  },
  {
    title: "Ask three vendors for quotes",
    voice: "Tick all three vendors and request the quotes. That's in the procedure, so I'll stay quiet.",
    todo: (
      <>
        Tick <b>all three vendors</b>, then click <b>Request 3 quotes</b>.
      </>
    ),
    why: "The written procedure says 3 quotes for anything over $5,000. Ari knows that, so it stays quiet here. That's the point.",
    targets: ["tick-apex", "tick-brightline", "tick-coreparts", "request-quotes"],
    done: (p) => p.cards.some((c) => c.stepId === "quotes"),
  },
  {
    title: "Choose the pricier vendor, on purpose",
    voice: "Check Apex Tech's delivery history, then pick Brightline, even though it costs more.",
    todo: (
      <>
        Click <b>Delivery history</b> on Apex Tech and look at the late orders. Then click <b>Select vendor</b> on <b>Brightline Systems</b>.
      </>
    ),
    why: "Apex is the cheapest, so picking Brightline looks odd. Ari can't explain it, so it will ask you why.",
    say: "Apex shipped late twice last year, and Friday is a hard deadline.",
    targets: ["history-apex", "select-brightline", "mic"],
    done: (p) => answered(p.cards, "vendor"),
  },
  {
    title: "Score Brightline with Finance's formula",
    voice: "Next, open the scoring sheet and give Brightline an 82.",
    todo: (
      <>
        Open <b>Scoring sheet</b> in the left menu, type <b>82</b> next to Brightline and press <b>Enter</b>.
      </>
    ),
    why: "The score comes from a formula only Finance knows. Ari will ask where the number comes from.",
    say: "40% price, 60% delivery record. It's Finance's formula, nobody wrote it down.",
    targets: ["nav-scoring", "score-brightline", "mic"],
    done: (p) => answered(p.cards, "scoring"),
  },
  {
    title: "Send it to the CFO",
    voice: "Now open Approvals and send it to the CFO.",
    todo: (
      <>
        Open <b>Approvals</b> and click <b>Send to the CFO</b>.
      </>
    ),
    why: "The procedure lets you approve up to $50k yourself. Sending it to the CFO is an unwritten rule, exactly the knowledge Ari is here to catch.",
    say: "New suppliers over $25k always go to the CFO first. It's not written down anywhere.",
    targets: ["nav-approvals", "route-cfo", "mic"],
    done: (p) => answered(p.cards, "approval"),
  },
  {
    title: "Finish the purchase",
    voice: "Last step. Issue the purchase order, then end the session.",
    todo: (
      <>
        Click <b>Issue purchase order</b>, then <b>End session</b> at the top. When Ari offers to check its guesses, say <b>&ldquo;Yes&rdquo;</b>.
      </>
    ),
    why: "Ari stayed quiet on some choices because it thought it understood. This is your chance to confirm them.",
    targets: ["issue-po", "end-session", "mic"],
    done: (p) => p.ended,
  },
];

// Glows on the first target that's on screen and hasn't been used yet.
function useTargetGlow(targets: string[]) {
  useEffect(() => {
    let current: Element | null = null;
    const used = new Set<string>();
    const onClick = (e: MouseEvent) => {
      const hit = (e.target as Element | null)?.closest("[data-ari]")?.getAttribute("data-ari");
      if (hit && targets.includes(hit) && hit !== "mic") used.add(hit);
    };
    document.addEventListener("click", onClick, true);
    const tick = () => {
      const next =
        targets
          .filter((t) => !used.has(t))
          .map((t) => document.querySelector(`[data-ari="${t}"]`))
          .find((el) => el && (el as HTMLElement).offsetParent !== null && !(el instanceof HTMLInputElement && el.type === "checkbox" && el.checked)) ?? null;
      if (next === current) return;
      current?.classList.remove("ari-target");
      next?.classList.add("ari-target");
      current = next;
    };
    tick();
    const t = setInterval(tick, 400);
    return () => {
      clearInterval(t);
      document.removeEventListener("click", onClick, true);
      current?.classList.remove("ari-target");
    };
  }, [targets]);
}

export function CoachBar(progress: Progress) {
  const [open, setOpen] = useState(true);
  const index = STEPS.findIndex((s) => !s.done(progress));
  const step = index === -1 ? null : STEPS[index];
  useTargetGlow(step ? step.targets : ["teach-back"]);

  // A finished step chimes, and Ari briefly says what's next (unless it's
  // in the middle of asking something).
  const ari = useAri();
  const ariRef = useRef(ari);
  useEffect(() => {
    ariRef.current = ari;
  }, [ari]);
  const lastIndex = useRef(index);
  useEffect(() => {
    if (index === lastIndex.current) return;
    const advanced = lastIndex.current !== -1 && (index > lastIndex.current || index === -1);
    lastIndex.current = index;
    if (!advanced) return;
    sounds.success();
    const line = index === -1 ? "That's it. I learned your job. Click Now watch Ari teach it, at the top." : STEPS[index].voice;
    if (!line) return;
    setTimeout(() => {
      const now = ariRef.current;
      if (!now.listening && !now.speaking) now.say(line);
    }, 900);
  }, [index]);

  return (
    <div data-ari="coach" className="pointer-events-none fixed inset-x-0 top-[68px] z-40 flex justify-center px-4">
      <section className="ari-pop pointer-events-auto w-full max-w-3xl overflow-hidden rounded-3xl border border-ari-100 bg-white/95 shadow-xl shadow-ari-500/10 backdrop-blur">
        <header className="flex items-center gap-3 px-5 py-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold text-white ari-gradient">
            {step ? index + 1 : <PartyPopper className="h-4 w-4" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-ari-600">
              {step ? `Step ${index + 1} of ${STEPS.length}` : "All done"}
            </p>
            <h2 data-ari="coach-title" className="truncate font-semibold text-zinc-900">
              {step ? step.title : "Ari learned your job"}
            </h2>
          </div>
          <div className="hidden gap-1 sm:flex" aria-hidden="true">
            {STEPS.map((_, i) => (
              <span key={i} className={`h-1.5 w-6 rounded-full ${i < index || index === -1 ? "bg-ari-500" : i === index ? "bg-coral-500" : "bg-zinc-200"}`} />
            ))}
          </div>
          <button onClick={() => setOpen(!open)} title={open ? "Collapse" : "Expand"} className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100">
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </header>
        {open && (
          <div className="grid gap-3 border-t border-zinc-100 px-5 py-4 sm:grid-cols-[1fr_minmax(0,0.9fr)]">
            <div>
              <p data-ari="coach-todo" className="text-[15px] leading-relaxed text-zinc-800">
                {step ? step.todo : <>Now click <b>Now watch Ari teach it</b> at the top: Ari will teach a new hire using your own answers.</>}
              </p>
              {step && (
                <p className="mt-2 flex gap-2 text-sm text-zinc-500">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-ari-400" />
                  {step.why}
                </p>
              )}
            </div>
            {step?.say && (
              <div className="rounded-2xl bg-gradient-to-br from-ari-50 to-coral-400/10 p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-ari-600">
                  <Mic className="h-3.5 w-3.5" /> When Ari asks, say
                </p>
                <p className="mt-1 text-[15px] font-medium leading-snug text-zinc-900">&ldquo;{step.say}&rdquo;</p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
