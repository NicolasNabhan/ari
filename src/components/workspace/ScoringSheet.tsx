"use client";

import { useState } from "react";
import { Calculator, FileSpreadsheet } from "lucide-react";
import { quoteFor, vendor, type PurchaseRequest } from "@/lib/northwind/seed";
import { PageTitle } from "./PageTitle";

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
  if (!request) return <p className="mt-10 text-center text-zinc-500">Open a purchase request first.</p>;
  if (quoted.length === 0) return <p className="mt-10 text-center text-zinc-500">Request quotes first; vendors appear here once they&rsquo;ve quoted.</p>;

  function commit(vendorId: string) {
    const value = Number(draft[vendorId]);
    if (draft[vendorId] === undefined || draft[vendorId] === "" || Number.isNaN(value)) return;
    if (scores[vendorId] === value) return;
    onScore(vendorId, value);
  }

  return (
    <section>
      <PageTitle icon={Calculator} title="Vendor scoring" subtitle="Shared sheet with Finance · score each vendor from 0 to 100" tone="sky" />
      <div className="mb-3 flex items-center gap-2 text-sm text-zinc-500">
        <FileSpreadsheet className="h-4 w-4 text-sky-500" /> {request.subject}
      </div>
      <table className="ari-rise w-full overflow-hidden rounded-2xl border border-zinc-200/70 bg-white text-sm shadow-sm">
        <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wider text-zinc-500">
          <tr>
            <th className="px-4 py-3">Vendor</th>
            <th className="px-4 py-3">Quote</th>
            <th className="px-4 py-3">Lead time</th>
            <th className="px-4 py-3">Score</th>
          </tr>
        </thead>
        <tbody>
          {quoted.map((id) => {
            const q = quoteFor(id, request.id)!;
            return (
              <tr key={id} className="border-t dark:border-zinc-800">
                <td className="px-4 py-3 font-medium">{vendor(id)?.name}</td>
                <td className="px-4 py-3">{usd(q.total)}</td>
                <td className="px-4 py-3">{q.leadTimeDays} days</td>
                <td className="px-4 py-3">
                  <input
                    data-ari={`score-${id}`}
                    inputMode="numeric"
                    className="w-24 rounded-xl border border-sky-200 bg-sky-50/50 px-3 py-1.5 text-center font-semibold text-sky-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
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
