"use client";

import { useState } from "react";
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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <section data-ari="review-list" className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900">
        <h2 className="text-lg font-semibold">Check Ari&rsquo;s guesses (optional)</h2>
        <p className="mt-1 text-sm text-zinc-500">Ari stayed quiet on these because it thought it understood. Least certain first.</p>
        <ol className="mt-4 space-y-3">
          {cards.length === 0 && <li className="text-sm text-zinc-400">All checked. Thanks!</li>}
          {cards.map((card) => (
            <li key={card.id} data-ari={`review-${card.stepId}`} className="rounded-xl border p-3 text-sm dark:border-zinc-700">
              <div className="flex justify-between gap-2">
                <span className="font-medium">{card.title}</span>
                <span className="text-xs text-zinc-400">{Math.round((card.reason?.confidence ?? 0) * 100)}% sure</span>
              </div>
              <p className="mt-1">🤖 {card.reason?.text}</p>
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
                  <input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="The real reason…" className="flex-1 rounded border px-2 py-1 dark:border-zinc-600 dark:bg-zinc-950" />
                  <button className="rounded bg-indigo-600 px-3 text-white">Save</button>
                </form>
              ) : (
                <div className="mt-2 flex gap-2">
                  <button data-ari={`confirm-${card.stepId}`} onClick={() => onConfirm(card.id)} className="rounded border px-2 py-1 text-xs dark:border-zinc-600">
                    ✓ That&rsquo;s right
                  </button>
                  <button data-ari={`fix-${card.stepId}`} onClick={() => setFixing(card.id)} className="rounded border px-2 py-1 text-xs dark:border-zinc-600">
                    ✗ Not quite
                  </button>
                </div>
              )}
            </li>
          ))}
        </ol>
        <button data-ari="review-done" onClick={onDone} className="mt-5 w-full rounded-lg bg-indigo-600 py-2 font-medium text-white">
          Continue / End session
        </button>
      </section>
    </div>
  );
}
