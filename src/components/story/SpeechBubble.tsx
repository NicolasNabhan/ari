"use client";

// A comic speech bubble on the story stage, pointing at the speaker's head,
// that fills in word by word as the line is spoken.
//
//   <SpeechBubble speaker="maria" text={line} anchor={mariaHead} followVoice />
//
// Reveal: pass spokenWords (e.g. from useWordReveal() fed by say()'s onWord),
// or followVoice to follow say() for this speaker and text automatically, or
// neither to show the whole text. Set open={false} to pop it away.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { PawPrint, UserRound } from "lucide-react";
import { BUBBLE_MAX_WIDTH, estimateBubbleSize, layoutBubble, type BubbleSide, type Point, type Size } from "@/lib/story/bubbleLayout";
import { STAGE } from "@/lib/story/stage";
import { getVoiceProgress, subscribeVoice, wordsSaidOf, type Speaker, type WordEvent } from "@/lib/story/storyVoice";
import { tokenizeWords } from "@/lib/story/wordProgress";

const LOOK: Record<Speaker, { name: string; chip: string; border: string; shadow: string; Icon: typeof UserRound }> = {
  maria: { name: "Maria", chip: "bg-coral-500", border: "#ffb6a3", shadow: "rgb(255 111 79 / 0.18)", Icon: UserRound },
  ari: { name: "Ari", chip: "bg-ari-500", border: "#c3b4ff", shadow: "rgb(106 69 245 / 0.18)", Icon: PawPrint },
};

export type SpeechBubbleProps = {
  speaker: Speaker;
  text: string;
  anchor: Point; // the speaker's head, in stage pixels
  open?: boolean;
  variant?: "speech" | "thought";
  spokenWords?: number;
  followVoice?: boolean;
  prefer?: BubbleSide | "auto";
  tipGap?: number; // how far short of the anchor the tail stops
  name?: string;
  stage?: Size;
  className?: string;
};

type Phase = "in" | "out" | "gone";

export function SpeechBubble({
  speaker,
  text,
  anchor,
  open = true,
  variant = "speech",
  spokenWords,
  followVoice = false,
  prefer = "auto",
  tipGap,
  name,
  stage = STAGE,
  className = "",
}: SpeechBubbleProps) {
  // Pop in when opened; when closed, pop out, then unmount.
  const [phase, setPhase] = useState<Phase>(open ? "in" : "gone");
  const [lastOpen, setLastOpen] = useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    setPhase(open ? "in" : phase === "gone" ? "gone" : "out");
  }

  const voiceWords = useVoiceWords(speaker, text);
  const words = tokenizeWords(text);
  const shown = spokenWords ?? (followVoice ? (voiceWords ?? 0) : words.length);

  // Measured size of the bubble (stage px; the stage's CSS scale doesn't affect it).
  const [measured, setMeasured] = useState<Size | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const mounted = phase !== "gone";
  useEffect(() => {
    const el = bubbleRef.current;
    if (!mounted || !el) return;
    const ro = new ResizeObserver(() => setMeasured({ width: el.offsetWidth, height: el.offsetHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [mounted]);

  const size = measured ?? estimateBubbleSize(text);
  // Thought bubbles float further away, to leave room for the trail of puffs.
  const layout = layoutBubble({ anchor, size, stage, prefer, tipGap, ...(variant === "thought" ? { offsetX: 44, gapY: 70 } : {}) });

  // Animations (Web Animations API, so no global CSS is needed).
  useLayoutEffect(() => {
    const el = groupRef.current;
    if (!el) return;
    const calm = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (phase === "in") {
      el.animate(
        calm
          ? [{ opacity: 0 }, { opacity: 1 }]
          : [
              { opacity: 0, transform: "scale(0.35)" },
              { opacity: 1, transform: "scale(1.06)", offset: 0.65 },
              { opacity: 1, transform: "scale(1)" },
            ],
        { duration: calm ? 120 : 340, easing: "cubic-bezier(.2,.8,.2,1)" },
      );
    } else if (phase === "out") {
      const anim = el.animate(
        calm ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(0.6)" }],
        { duration: calm ? 100 : 180, easing: "ease-in", fill: "forwards" },
      );
      anim.finished.then(() => setPhase((p) => (p === "out" ? "gone" : p))).catch(() => {});
      return () => anim.cancel();
    }
  }, [phase]);

  // A small bump when the bubble gets a new line while it is open.
  const firstText = useRef(true);
  useEffect(() => {
    if (firstText.current) {
      firstText.current = false;
      return;
    }
    groupRef.current?.animate([{ transform: "scale(0.96)" }, { transform: "scale(1)" }], { duration: 220, easing: "cubic-bezier(.2,.8,.2,1)" });
  }, [text]);

  if (phase === "gone") return null;

  const look = LOOK[speaker];
  const thought = variant === "thought";
  const { tailBase: b, tailTip: t } = layout;

  return (
    <div
      className={`pointer-events-none absolute left-0 top-0 ${className}`}
      style={{ width: stage.width, height: stage.height }}
      aria-live="polite"
    >
      <div ref={groupRef} className="absolute inset-0" style={{ transformOrigin: `${t.x}px ${t.y}px` }}>
        <div
          ref={bubbleRef}
          className={`absolute w-max px-5 pb-3.5 pt-4 text-[17px] font-medium leading-6 text-[#1d1a2f] ${
            thought ? "rounded-[34px] bg-ari-50 italic" : "rounded-[22px] bg-white"
          }`}
          style={{
            left: layout.left,
            top: layout.top,
            maxWidth: BUBBLE_MAX_WIDTH,
            border: `2px solid ${look.border}`,
            boxShadow: `4px 6px 0 ${look.shadow}, 0 14px 30px rgb(29 26 47 / 0.08)`,
          }}
        >
          <span
            className={`absolute -top-3 left-4 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold not-italic text-white shadow-sm ${look.chip}`}
          >
            <look.Icon className="size-3" strokeWidth={2.5} />
            {name ?? look.name}
          </span>
          {words.length === 0 ? (
            <ThinkingDots />
          ) : (
            words.map((w, i) => (
              <span key={i}>
                {i > 0 && " "}
                <span
                  className="inline-block"
                  style={{
                    opacity: i < shown ? 1 : 0,
                    transform: i < shown ? "none" : "translateY(3px)",
                    transition: "opacity 160ms ease-out, transform 200ms cubic-bezier(.2,.8,.2,1)",
                  }}
                >
                  {w}
                </span>
              </span>
            ))
          )}
        </div>
        {thought ? <ThoughtTrail base={b} tip={t} below={layout.below} border={look.border} /> : <Tail base={b} tip={t} below={layout.below} border={look.border} stage={stage} />}
      </div>
    </div>
  );
}

// The speech tail: a curved wedge from the bubble's edge to the head. Drawn
// over the bubble, so its fill hides the border where they join.
function Tail({ base, tip, below, border, stage }: { base: Point; tip: Point; below: boolean; border: string; stage: Size }) {
  const half = 11;
  const inward = below ? 3 : -3;
  const b1 = { x: base.x - half, y: base.y + inward };
  const b2 = { x: base.x + half, y: base.y + inward };
  // Bend each side a little so the tail looks drawn, not ruled.
  const bend = (from: Point) => ({ x: from.x + (tip.x - from.x) * 0.25, y: from.y + (tip.y - from.y) * 0.75 });
  const c1 = bend(b1);
  const c2 = bend(b2);
  const sides = `M ${b1.x} ${b1.y} Q ${c1.x} ${c1.y} ${tip.x} ${tip.y} Q ${c2.x} ${c2.y} ${b2.x} ${b2.y}`;
  return (
    <svg className="absolute left-0 top-0 overflow-visible" width={stage.width} height={stage.height} aria-hidden>
      <path d={`${sides} Z`} fill="white" />
      <path d={sides} fill="none" stroke={border} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// The thought trail: three shrinking puffs from the bubble to the head.
function ThoughtTrail({ base, tip, below, border }: { base: Point; tip: Point; below: boolean; border: string }) {
  const start = { x: base.x, y: base.y + (below ? -6 : 6) };
  const puffs = [
    { at: 0.18, r: 9 },
    { at: 0.52, r: 6 },
    { at: 0.82, r: 4 },
  ];
  return (
    <>
      {puffs.map((p) => (
        <span
          key={p.at}
          className="absolute rounded-full bg-ari-50"
          style={{
            left: start.x + (tip.x - start.x) * p.at - p.r,
            top: start.y + (tip.y - start.y) * p.at - p.r,
            width: p.r * 2,
            height: p.r * 2,
            border: `2px solid ${border}`,
          }}
        />
      ))}
    </>
  );
}

function ThinkingDots() {
  return (
    <span className="inline-flex h-6 items-center gap-1.5 px-1" aria-label="Thinking">
      {[0, 1, 2].map((i) => (
        <span key={i} className="size-2 animate-bounce rounded-full bg-ari-400" style={{ animationDelay: `${i * 140}ms` }} />
      ))}
    </span>
  );
}

// How many words of this line say() has spoken (null: not started yet).
export function useVoiceWords(speaker: Speaker, text: string): number | null {
  const p = useSyncExternalStore(subscribeVoiceStore, getVoiceProgress, getVoiceProgress);
  return wordsSaidOf(p, speaker, text);
}
const subscribeVoiceStore = (onChange: () => void) => subscribeVoice(() => onChange());

// Wire say() to a bubble by hand: say(speaker, text, { onStart: reveal.reset, onWord: reveal.onWord }).
export function useWordReveal() {
  const [spokenWords, setSpokenWords] = useState(0);
  const onWord = useCallback((e: WordEvent) => setSpokenWords((n) => Math.max(n, e.wordIndex + 1)), []);
  const reset = useCallback(() => setSpokenWords(0), []);
  return { spokenWords, onWord, reset };
}
