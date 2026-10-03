"use client";

import { useState } from "react";
import { lateDeliveries, quoteFor, vendorsQuoting, type PurchaseRequest, type Vendor } from "@/lib/northwind/seed";

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

export function Vendors({
  request,
  quoted,
  selectedVendorId,
  onRequestQuotes,
  onSelect,
  onOpenHistory,
}: {
  request: PurchaseRequest | null;
  quoted: string[];
  selectedVendorId: string | null;
  onRequestQuotes: (requestId: string, vendorIds: string[]) => void;
  onSelect: (requestId: string, vendorId: string) => void;
  onOpenHistory: (vendorId: string) => void;
}) {
  const [historyFor, setHistoryFor] = useState<string | null>(null);
  const [ticked, setTicked] = useState<string[]>([]);

  if (!request) {
    return <p className="text-zinc-500">Open a purchase request first.</p>;
  }
  const candidates = vendorsQuoting(request.id);
  const hasQuotes = quoted.length > 0;

  function toggleHistory(v: Vendor) {
    if (historyFor === v.id) return setHistoryFor(null);
    setHistoryFor(v.id);
    onOpenHistory(v.id);
  }

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">Vendors & quotes · {request.subject}</h1>
      {!hasQuotes && (
        <div className="flex items-center gap-3 rounded-xl border border-dashed p-4 text-sm dark:border-zinc-700">
          <span>Tick vendors to ask for a quote:</span>
          <button
            data-ari="request-quotes"
            disabled={ticked.length === 0}
            onClick={() => onRequestQuotes(request.id, ticked)}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 font-medium text-white disabled:opacity-40"
          >
            Request {ticked.length || ""} quote{ticked.length === 1 ? "" : "s"}
          </button>
        </div>
      )}
      <div className="grid gap-3">
        {candidates.map((v) => {
          const q = quoteFor(v.id, request.id)!;
          const late = lateDeliveries(v.id).length;
          const isSelected = selectedVendorId === v.id;
          return (
            <div key={v.id} data-ari={`vendor-${v.id}`} className={`rounded-xl border bg-white p-4 dark:bg-zinc-900 ${isSelected ? "border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-900" : "dark:border-zinc-800"}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  {!hasQuotes && (
                    <input
                      type="checkbox"
                      data-ari={`tick-${v.id}`}
                      className="mr-2"
                      checked={ticked.includes(v.id)}
                      onChange={() => setTicked((t) => (t.includes(v.id) ? t.filter((x) => x !== v.id) : [...t, v.id]))}
                    />
                  )}
                  <span className="font-medium">{v.name}</span> <span className="text-sm text-zinc-500">({v.label})</span>
                  <p className="text-sm text-zinc-500">{v.blurb}</p>
                </div>
                {quoted.includes(v.id) && (
                  <div className="text-right text-sm">
                    <div className="text-lg font-semibold">{usd(q.total)}</div>
                    <div className="text-zinc-500">
                      {usd(q.unitPrice)} each · {q.leadTimeDays} days
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-3 flex gap-2 text-sm">
                <button data-ari={`history-${v.id}`} onClick={() => toggleHistory(v)} className="rounded-lg border px-3 py-1 dark:border-zinc-700">
                  {historyFor === v.id ? "Hide" : "Delivery history"}
                </button>
                {quoted.includes(v.id) && (
                  <button
                    data-ari={`select-${v.id}`}
                    onClick={() => onSelect(request.id, v.id)}
                    className={`rounded-lg px-3 py-1 font-medium ${isSelected ? "bg-indigo-600 text-white" : "border dark:border-zinc-700"}`}
                  >
                    {isSelected ? "Selected" : "Select vendor"}
                  </button>
                )}
              </div>
              {historyFor === v.id && (
                <div className="mt-3 text-sm">
                  {v.deliveryHistory.length === 0 ? (
                    <p className="text-zinc-500">No orders with us yet.</p>
                  ) : (
                    <>
                      <p className="mb-1 text-zinc-500">
                        {v.deliveryHistory.length} orders · {late} late
                      </p>
                      <table className="w-full">
                        <tbody>
                          {v.deliveryHistory.map((d) => (
                            <tr key={d.order} className="border-t dark:border-zinc-800">
                              <td className="py-1">{d.order}</td>
                              <td>{usd(d.amount)}</td>
                              <td>promised {d.promised}</td>
                              <td className={d.delivered > d.promised ? "font-medium text-red-600" : "text-zinc-500"}>
                                delivered {d.delivered}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
