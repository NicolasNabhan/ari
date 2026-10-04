"use client";

import { useState } from "react";
import { Check, ListChecks, PencilLine, Sparkles } from "lucide-react";
import type { DecisionCard } from "@/lib/apprentice/types";

// The decisions Ari explained to itself while staying quiet, least certain
// first. Checking them is optional.
export function ReviewList({
  cards,
  onConfirm,
  onCorrect,
  onDone,
}: {
  cards: DecisionCard[];
  onConfirm: (cardId: string) => void;
  onCorrect: (cardId: string, text: string) => void;
  onDone: () => void;
}) {
  const [fixing, setFixing] = useState<string | null>(null);
  const [text, setText] = useState("");
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#1d1a2f]/40 p-4 backdrop-blur-sm">
      <section data-ari="review-list" className="ari-pop max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-xl text-white ari-gradient">
            <ListChecks className="h-4 w-4" />
          </span>
          Check Ari&rsquo;s guesses <span className="text-sm font-normal text-zinc-400">(optional)</span>
        </h2>
        <p className="mt-1 text-sm text-zinc-500">Ari stayed quiet on these because it thought it understood. Least certain first.</p>
        <ol className="ari-stagger mt-4 space-y-3">
          {cards.length === 0 && <li className="text-sm text-zinc-400">All checked. Thanks!</li>}
          {cards.map((card) => (
            <li key={card.id} data-ari={`review-${card.stepId}`} className="rounded-2xl border border-zinc-200/70 p-3 text-sm">
              <div className="flex justify-between gap-2">
                <span className="font-medium">{card.title}</span>
                <span className="text-xs text-zinc-400">{Math.round((card.reason?.confidence ?? 0) * 100)}% sure</span>
              </div>
              <p className="mt-1 flex gap-1.5 text-zinc-700">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-ari-500" /> {card.reason?.text}
              </p>
              {fixing === card.id ? (
                <form
                  className="mt-2 flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!text.trim()) return;
                    onCorrect(card.id, text.trim());
                    setFixing(null);
                    setText("");
                  }}
                >
                  <input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="The real reason…" className="flex-1 rounded-xl border border-ari-200 px-3 py-1.5 outline-none focus:ring-2 focus:ring-ari-100" />
                  <button className="rounded-xl px-3 font-semibold text-white ari-gradient">Save</button>
                </form>
              ) : (
                <div className="mt-2 flex gap-2">
                  <button data-ari={`confirm-${card.stepId}`} onClick={() => onConfirm(card.id)} className="ari-lift flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    <Check className="h-3.5 w-3.5" /> That&rsquo;s right
                  </button>
                  <button data-ari={`fix-${card.stepId}`} onClick={() => setFixing(card.id)} className="ari-lift flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-600 ring-1 ring-zinc-200">
                    <PencilLine className="h-3.5 w-3.5" /> Not quite
                  </button>
                </div>
              )}
            </li>
          ))}
        </ol>
        <button data-ari="review-done" onClick={onDone} className="ari-lift mt-5 w-full rounded-2xl py-3 font-semibold text-white shadow-lg shadow-ari-500/30 ari-gradient">
          Continue / End session
        </button>
      </section>
    </div>
  );
}
