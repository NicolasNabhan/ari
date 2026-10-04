"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

type Rect = { left: number; top: number; width: number; height: number };
const PAD = 10;
const CARD_W = 340;

// A spotlight on one thing on screen (by its data-ari name), with a short
// written explanation beside it. Everything else dims until it's dismissed.
export function TourCallout({
  target,
  kicker,
  title,
  text,
  button,
  onNext,
}: {
  target: string;
  kicker?: string;
  title: string;
  text: string;
  button: string;
  onNext: () => void;
}) {
  const [rect, setRect] = useState<Rect | null>(null);

  // Follow the target: it may still be appearing, hovering or resizing.
  useEffect(() => {
    const measure = () => {
      const el = document.querySelector<HTMLElement>(`[data-ari="${target}"]`);
      if (!el) return setRect(null);
      const r = el.getBoundingClientRect();
      setRect({ left: r.left - PAD, top: r.top - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 });
    };
    measure();
    const t = setInterval(measure, 150);
    return () => clearInterval(t);
  }, [target]);

  if (!rect) return null;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // Beside the target, on whichever side has room; kept on screen.
  const onRight = rect.left + rect.width / 2 < vw / 2;
  const left = onRight ? Math.min(rect.left + rect.width + 16, vw - CARD_W - 16) : Math.max(16, rect.left - CARD_W - 16);
  // Lower half: line the card's bottom up with the target's, so it never runs off screen.
  const low = rect.top + rect.height / 2 > vh / 2;
  const vertical = low ? { bottom: Math.max(16, vh - rect.top - rect.height) } : { top: Math.max(16, rect.top) };

  return (
    <div className="fixed inset-0 z-[70]" data-ari="tour">
      <div
        aria-hidden
        className="pointer-events-none fixed rounded-3xl ring-2 ring-ari-300 transition-all duration-300"
        style={{ ...rect, boxShadow: "0 0 0 200vmax rgba(29, 26, 47, 0.55)" }}
      />
      <section className="ari-pop fixed rounded-3xl bg-white p-5 shadow-2xl" style={{ left, width: CARD_W, ...vertical }} role="dialog" aria-label={title}>
        {kicker && <p className="text-[11px] font-bold uppercase tracking-widest text-ari-500">{kicker}</p>}
        <h3 className="mt-1 text-lg font-semibold text-zinc-900">{title}</h3>
        <p className="mt-1.5 leading-relaxed text-zinc-600">{text}</p>
        <button
          data-ari="tour-next"
          onClick={onNext}
          className="ari-lift mt-4 inline-flex items-center gap-2 rounded-2xl px-4 py-2 font-semibold text-white shadow-md shadow-ari-500/30 ari-gradient"
        >
          {button} <ArrowRight className="h-4 w-4" />
        </button>
      </section>
    </div>
  );
}
