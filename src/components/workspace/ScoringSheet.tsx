"use client";

import { useState } from "react";
import { quoteFor, vendor, type PurchaseRequest } from "@/lib/northwind/seed";

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

export function ScoringSheet({
  request,
  quoted,
  scores,
  onScore,
}: {
  request: PurchaseRequest | null;
  quoted: string[];
  scores: Record<string, number>;
  onScore: (vendorId: string, score: number) => void;
}) {
  const [draft, setDraft] = useState<Record<string, string>>({});
  if (!request) return <p className="text-zinc-500">Open a purchase request first.</p>;
  if (quoted.length === 0) return <p className="text-zinc-500">Request quotes first; vendors appear here once they&rsquo;ve quoted.</p>;

  function commit(vendorId: string) {
    const value = Number(draft[vendorId]);
    if (draft[vendorId] === undefined || draft[vendorId] === "" || Number.isNaN(value)) return;
    if (scores[vendorId] === value) return;
    onScore(vendorId, value);
  }

  return (
    <section>
      <h1 className="text-xl font-semibold">Vendor scoring · {request.subject}</h1>
      <p className="mt-1 text-sm text-zinc-500">Shared sheet with Finance. Score each vendor 0–100.</p>
      <table className="mt-4 w-full rounded-xl border bg-white text-sm dark:border-zinc-800 dark:bg-zinc-900">
        <thead className="bg-zinc-50 text-left text-zinc-500 dark:bg-zinc-800">
          <tr>
            <th className="px-4 py-2">Vendor</th>
            <th className="px-4 py-2">Quote</th>
            <th className="px-4 py-2">Lead time</th>
            <th className="px-4 py-2">Score</th>
          </tr>
        </thead>
        <tbody>
          {quoted.map((id) => {
            const q = quoteFor(id, request.id)!;
            return (
              <tr key={id} className="border-t dark:border-zinc-800">
                <td className="px-4 py-2 font-medium">{vendor(id)?.name}</td>
                <td className="px-4 py-2">{usd(q.total)}</td>
                <td className="px-4 py-2">{q.leadTimeDays} days</td>
                <td className="px-4 py-2">
                  <input
                    data-ari={`score-${id}`}
                    inputMode="numeric"
                    className="w-20 rounded border px-2 py-1 dark:border-zinc-700 dark:bg-zinc-950"
                    value={draft[id] ?? scores[id]?.toString() ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, [id]: e.target.value }))}
                    onBlur={() => commit(id)}
                    onKeyDown={(e) => e.key === "Enter" && commit(id)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
