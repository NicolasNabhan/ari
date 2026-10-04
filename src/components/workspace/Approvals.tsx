import { Briefcase, Crown, FileCheck2, ShieldAlert, Stamp, UserCheck } from "lucide-react";
import { quoteFor, vendor, type PurchaseRequest } from "@/lib/northwind/seed";
import { PageTitle } from "./PageTitle";
import type { ApprovalRoute } from "@/lib/workspace/events";

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

const ROUTES: { to: ApprovalRoute; label: string; who: string; done: string; icon: typeof UserCheck }[] = [
  { to: "self", label: "Approve myself", who: "You can approve up to $50k", done: "Approved by you", icon: UserCheck },
  { to: "manager", label: "Send to my manager", who: "Grace Lin, Director of Operations", done: "Sent to Grace Lin for approval", icon: Briefcase },
  { to: "cfo", label: "Send to the CFO", who: "David Okafor, CFO", done: "Sent to David Okafor (CFO) for approval", icon: Crown },
];

export function Approvals({
  request,
  vendorId,
  route,
  poIssued,
  onRoute,
  onIssuePo,
  warning = null,
}: {
  request: PurchaseRequest | null;
  vendorId: string | null;
  route: ApprovalRoute | null;
  poIssued: boolean;
  onRoute: (to: ApprovalRoute) => void;
  onIssuePo: () => void;
  warning?: string | null; // Ari stopped the last choice; shown until a route goes through
}) {
  if (!request) return <p className="text-zinc-500">Open a purchase request first.</p>;
  if (!vendorId) return <p className="text-zinc-500">Select a vendor first.</p>;
  const amount = quoteFor(vendorId, request.id)!.total;
  return (
    <section className="space-y-4">
      <PageTitle icon={Stamp} title="Approval" subtitle={request.subject} tone="rose" />
      <div className="rounded-2xl border border-zinc-200/70 bg-white shadow-sm p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <dl data-ari="approval-summary" data-gaze-label="Approval amount and vendor" className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-xl bg-zinc-50 p-3"><dt className="text-xs text-zinc-500">Vendor</dt><dd className="font-semibold">{vendor(vendorId)?.name}</dd></div>
          <div className="rounded-xl bg-zinc-50 p-3"><dt className="text-xs text-zinc-500">Amount</dt><dd className="text-lg font-bold">{usd(amount)}</dd></div>
          <div className="rounded-xl bg-zinc-50 p-3"><dt className="text-xs text-zinc-500">Due</dt><dd className="font-semibold">{request.due}</dd></div>
        </dl>
        {!route && warning && (
          <div data-ari="approval-warning" role="alert" className="ari-pop mt-4 flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-rose-500 text-white">
              <ShieldAlert className="h-5 w-5" />
            </span>
            <div className="text-sm">
              <p className="font-semibold text-rose-800">Ari stopped this</p>
              <p className="mt-0.5 text-rose-900">{warning}</p>
              <p className="mt-1 text-rose-700/80">Send it to the CFO, or click your choice again if you really mean it.</p>
            </div>
          </div>
        )}
        {route ? (
          <p className="ari-rise mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 font-semibold text-emerald-700">
            <FileCheck2 className="h-5 w-5" /> {ROUTES.find((r) => r.to === route)!.done}
          </p>
        ) : (
          <div className="ari-stagger mt-4 grid gap-2 sm:grid-cols-3">
            {ROUTES.map((r) => (
              <button
                key={r.to}
                data-ari={`route-${r.to}`}
                data-gaze-label={`Approval route: ${r.label}`}
                onClick={() => onRoute(r.to)}
                className="ari-lift flex flex-col items-start gap-1 rounded-2xl border border-zinc-200 bg-white p-3 text-left hover:border-ari-400"
              >
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-ari-50 text-ari-600">
                  <r.icon className="h-4 w-4" />
                </span>
                <span className="text-sm font-semibold text-zinc-900">{r.label}</span>
                <span className="text-xs text-zinc-500">{r.who}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {route && (
        <div className="rounded-2xl border border-zinc-200/70 bg-white shadow-sm p-5 dark:border-zinc-800 dark:bg-zinc-900">
          {poIssued ? (
            <p className="ari-rise flex items-center gap-2 font-semibold text-emerald-700">
              <FileCheck2 className="h-5 w-5" /> Purchase order issued.
            </p>
          ) : (
            <button data-ari="issue-po" onClick={onIssuePo} className="ari-lift inline-flex items-center gap-2 rounded-2xl px-5 py-3 font-semibold text-white shadow-lg shadow-ari-500/30 ari-gradient">
              <FileCheck2 className="h-4 w-4" /> Issue purchase order
            </button>
          )}
        </div>
      )}
    </section>
  );
}
