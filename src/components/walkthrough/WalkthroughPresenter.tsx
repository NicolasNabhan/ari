"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useAri } from "@/components/ari/AriProvider";
import { speak, voiceOnly } from "@/lib/ari/speech";
import { sounds } from "@/lib/ari/sounds";
import { SCRIPT } from "@/lib/walkthrough/script";
import { flatten, type NavAction, type WalkthroughView } from "@/lib/walkthrough/replay";

const BEATS = flatten(SCRIPT);
const LAST = BEATS.length - 1;

// Step 1 on screen: who's speaking, and the four buttons. Maria's lines show
// on the left (her spot); Ari's in its own corner, bottom-right.
export function WalkthroughPresenter({ view, onNavigate }: { view: WalkthroughView; onNavigate: (action: NavAction) => void }) {
  const ari = useAri();
  const ariRef = useRef(ari);
  useEffect(() => {
    ariRef.current = ari;
  }, [ari]);
  const maria = useRef(voiceOnly());
  const bubble = view.bubble;

  // Speak the line at this position, cutting off whatever was still playing.
  useEffect(() => {
    maria.current.stop();
    if (!bubble) {
      ariRef.current.setState("bubble");
      return;
    }
    if (bubble.speaker === "ari") {
      if (view.beat.kind === "ari-asks") sounds.question();
      ariRef.current.setState("forward");
      void ariRef.current.say(bubble.text);
    } else {
      ariRef.current.setState("bubble");
      void speak(maria.current, bubble.text, { speaker: "maria" });
    }
  }, [view.position, bubble, view.beat.kind]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight") onNavigate(e.shiftKey ? "nextStep" : "next");
      if (e.key === "ArrowLeft") onNavigate(e.shiftKey ? "backStep" : "back");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onNavigate]);

  const atStart = view.position === 0;
  const atEnd = view.position === LAST;
  const part = SCRIPT[view.part];

  return (
    <>
      {bubble?.speaker === "maria" && (
        <div key={view.position} data-ari="maria-bubble" className="ari-pop fixed bottom-28 left-4 z-50 w-[22rem] max-w-[calc(100vw-2rem)]">
          <div className="relative rounded-3xl rounded-bl-md bg-white p-4 shadow-xl shadow-coral-500/15 ring-1 ring-coral-200">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-coral-500">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-amber-300 to-coral-500 text-[11px] text-white">M</span>
              Maria · the expert
            </span>
            <p className="mt-2 leading-relaxed text-zinc-800">{bubble.text}</p>
          </div>
        </div>
      )}

      <div data-gaze-ignore="" className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/95 p-1.5 shadow-xl shadow-ari-500/15 ring-1 ring-zinc-200 backdrop-blur">
        <NavButton label="Back a step" onClick={() => onNavigate("backStep")} disabled={atStart} icon={<ChevronsLeft className="h-4 w-4" />} />
        <NavButton label="Back" onClick={() => onNavigate("back")} disabled={atStart} icon={<ChevronLeft className="h-4 w-4" />} />
        <div className="min-w-44 px-3 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
            Part {view.part + 1} of {SCRIPT.length}
          </p>
          <p className="text-sm font-semibold text-zinc-800">{part.title}</p>
          <div className="mt-1 flex justify-center gap-1">
            {SCRIPT.map((p, i) => (
              <span key={p.id} className={`h-1.5 rounded-full transition-all ${i === view.part ? "w-5 ari-gradient" : i < view.part ? "w-1.5 bg-ari-300" : "w-1.5 bg-zinc-200"}`} />
            ))}
          </div>
        </div>
        {atEnd ? (
          <Link href="/learn" data-ari="walkthrough-to-step2" className="ari-lift flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-md shadow-ari-500/30 ari-gradient">
            Step 2: Ari teaches <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <>
            <NavButton label="Next" primary onClick={() => onNavigate("next")} icon={<ChevronRight className="h-4 w-4" />} />
            <NavButton label="Next step" onClick={() => onNavigate("nextStep")} icon={<ChevronsRight className="h-4 w-4" />} />
          </>
        )}
      </div>
    </>
  );
}

function NavButton({ label, onClick, disabled, primary, icon }: { label: string; onClick: () => void; disabled?: boolean; primary?: boolean; icon: React.ReactNode }) {
  const iconFirst = label.startsWith("Back");
  return (
    <button
      data-ari={`walkthrough-${label.toLowerCase().replace(/ /g, "-")}`}
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-semibold transition-all disabled:opacity-30 ${
        primary ? "text-white shadow-md shadow-ari-500/30 ari-gradient ari-lift" : "text-zinc-700 hover:bg-zinc-100"
      }`}
    >
      {iconFirst && icon}
      {label}
      {!iconFirst && icon}
    </button>
  );
}
