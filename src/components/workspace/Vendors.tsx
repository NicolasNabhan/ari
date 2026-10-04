"use client";

import { useState } from "react";
import { BadgeCheck, CircleCheck, History, MailQuestion, Send, Sprout, Store, Tag, TriangleAlert, Truck, type LucideIcon } from "lucide-react";
import { lateDeliveries, quoteFor, vendorsQuoting, type PurchaseRequest, type Vendor } from "@/lib/northwind/seed";
import { PageTitle } from "./PageTitle";

function Badge({ tone, icon: Icon, text }: { tone: "sky" | "rose" | "emerald" | "amber"; icon: LucideIcon; text: string }) {
  const tones = { sky: "bg-sky-50 text-sky-700", rose: "bg-rose-50 text-rose-700", emerald: "bg-emerald-50 text-emerald-700", amber: "bg-amber-50 text-amber-800" };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${tones[tone]}`}>
      <Icon className="h-3 w-3" /> {text}
    </span>
  );
}

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
    return <EmptyState text="Open a purchase request first: Inbox, then Work on this request." />;
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
      <PageTitle icon={Store} title="Vendors & quotes" subtitle={request.subject} tone="emerald" />
      {!hasQuotes && (
        <div className="ari-rise flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-ari-200 bg-ari-50/60 p-4 text-sm">
          <span className="flex items-center gap-2 text-zinc-700">
            <MailQuestion className="h-4 w-4 text-ari-500" /> Tick the vendors you want a quote from.
          </span>
          <button
            data-ari="request-quotes"
            disabled={ticked.length === 0}
            onClick={() => onRequestQuotes(request.id, ticked)}
            className="ari-lift inline-flex items-center gap-2 rounded-xl px-4 py-2 font-semibold text-white shadow-md shadow-ari-500/30 ari-gradient disabled:opacity-40"
          >
            <Send className="h-4 w-4" /> Request {ticked.length || ""} quote{ticked.length === 1 ? "" : "s"}
          </button>
        </div>
      )}
      <div className="ari-stagger grid gap-3">
        {candidates.map((v) => {
          const q = quoteFor(v.id, request.id)!;
          const late = lateDeliveries(v.id).length;
          const isSelected = selectedVendorId === v.id;
          const isCheapest = quoted.includes(v.id) && quoted.every((id) => (quoteFor(id, request.id)?.total ?? Infinity) >= q.total);
          const ticking = !hasQuotes;
          return (
            <div
              key={v.id}
              data-ari={`vendor-${v.id}`}
              className={`rounded-2xl border bg-white p-4 shadow-sm transition-all ${isSelected ? "border-ari-400 ring-4 ring-ari-100" : "border-zinc-200/70"}`}
            >
              <div className="flex items-start gap-3">
                {ticking && (
                  <input
                    type="checkbox"
                    data-ari={`tick-${v.id}`}
                    className="mt-3 h-5 w-5 cursor-pointer accent-[var(--color-ari-600)]"
                    checked={ticked.includes(v.id)}
                    onChange={() => setTicked((t) => (t.includes(v.id) ? t.filter((x) => x !== v.id) : [...t, v.id]))}
                  />
                )}
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-900 text-sm font-bold text-white">
                  {v.name.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-zinc-900">{v.name}</span>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">{v.label}</span>
                    {v.deliveryHistory.length === 0 ? (
                      <Badge tone="sky" icon={Sprout} text="New supplier" />
                    ) : late > 0 ? (
                      <Badge tone="rose" icon={TriangleAlert} text={`${late} late deliver${late === 1 ? "y" : "ies"}`} />
                    ) : (
                      <Badge tone="emerald" icon={BadgeCheck} text="Always on time" />
                    )}
                    {isCheapest && <Badge tone="amber" icon={Tag} text="Cheapest" />}
                  </div>
                  <p className="mt-0.5 text-sm text-zinc-500">{v.blurb}</p>
                </div>
                {quoted.includes(v.id) && (
                  <div className="ari-rise text-right">
                    <div className="text-xl font-bold tracking-tight text-zinc-900">{usd(q.total)}</div>
                    <div className="flex items-center justify-end gap-1 text-xs text-zinc-500">
                      {usd(q.unitPrice)} each · <Truck className="h-3.5 w-3.5" /> {q.leadTimeDays} days
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <button
                  data-ari={`history-${v.id}`}
                  onClick={() => toggleHistory(v)}
                  className="ari-lift inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 font-medium text-zinc-700 ring-1 ring-zinc-200"
                >
                  <History className="h-4 w-4" /> {historyFor === v.id ? "Hide history" : "Delivery history"}
                </button>
                {quoted.includes(v.id) && (
                  <button
                    data-ari={`select-${v.id}`}
                    onClick={() => onSelect(request.id, v.id)}
                    className={`ari-lift inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-semibold ${
                      isSelected ? "text-white shadow-md shadow-ari-500/30 ari-gradient" : "bg-white text-ari-700 ring-1 ring-ari-200"
                    }`}
                  >
                    <CircleCheck className="h-4 w-4" /> {isSelected ? "Selected" : "Select vendor"}
                  </button>
                )}
              </div>
              {historyFor === v.id && (
                <div className="ari-rise mt-3 rounded-xl bg-zinc-50 p-3 text-sm">
                  {v.deliveryHistory.length === 0 ? (
                    <p className="flex items-center gap-2 text-zinc-500">
                      <Sprout className="h-4 w-4" /> No orders with us yet.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {v.deliveryHistory.map((d) => {
                        const wasLate = d.delivered > d.promised;
                        return (
                          <li key={d.order} className="flex items-center gap-3">
                            {wasLate ? <TriangleAlert className="h-4 w-4 text-rose-500" /> : <BadgeCheck className="h-4 w-4 text-emerald-500" />}
                            <span className="w-20 font-medium text-zinc-700">{d.order}</span>
                            <span className="w-20 text-zinc-500">{usd(d.amount)}</span>
                            <span className={wasLate ? "font-semibold text-rose-600" : "text-zinc-500"}>
                              {wasLate ? `late: promised ${d.promised}, arrived ${d.delivered}` : `on time, ${d.delivered}`}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
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

function EmptyState({ text }: { text: string }) {
  return (
    <div className="ari-rise mx-auto mt-10 flex max-w-sm flex-col items-center gap-3 text-center text-zinc-500">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ari-50 text-ari-500">
        <Store className="h-6 w-6" />
      </span>
      {text}
    </div>
  );
}
