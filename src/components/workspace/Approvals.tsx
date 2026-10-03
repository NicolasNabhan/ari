import { quoteFor, vendor, type PurchaseRequest } from "@/lib/northwind/seed";
import type { ApprovalRoute } from "@/lib/workspace/events";

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

const ROUTES: { to: ApprovalRoute; label: string; done: string }[] = [
  { to: "self", label: "Approve myself", done: "Approved by you" },
  { to: "manager", label: "Send to my manager (Grace Lin)", done: "Sent to Grace Lin for approval" },
  { to: "cfo", label: "Send to the CFO (David Okafor)", done: "Sent to David Okafor (CFO) for approval" },
];

export function Approvals({
  request,
  vendorId,
  route,
  poIssued,
  onRoute,
  onIssuePo,
}: {
  request: PurchaseRequest | null;
  vendorId: string | null;
  route: ApprovalRoute | null;
  poIssued: boolean;
  onRoute: (to: ApprovalRoute) => void;
  onIssuePo: () => void;
}) {
  if (!request) return <p className="text-zinc-500">Open a purchase request first.</p>;
  if (!vendorId) return <p className="text-zinc-500">Select a vendor first.</p>;
  const amount = quoteFor(vendorId, request.id)!.total;
  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">Approval · {request.subject}</h1>
      <div className="rounded-xl border bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
          <div><dt className="text-zinc-500">Vendor</dt><dd className="font-medium">{vendor(vendorId)?.name}</dd></div>
          <div><dt className="text-zinc-500">Amount</dt><dd className="font-medium">{usd(amount)}</dd></div>
          <div><dt className="text-zinc-500">Due</dt><dd>{request.due}</dd></div>
        </dl>
        {route ? (
          <p className="mt-4 font-medium text-indigo-700 dark:text-indigo-300">{ROUTES.find((r) => r.to === route)!.done}</p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {ROUTES.map((r) => (
              <button key={r.to} data-ari={`route-${r.to}`} onClick={() => onRoute(r.to)} className="rounded-lg border px-3 py-2 text-sm font-medium hover:border-indigo-500 dark:border-zinc-700">
                {r.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {route && (
        <div className="rounded-xl border bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          {poIssued ? (
            <p className="font-medium text-green-700 dark:text-green-400">Purchase order issued.</p>
          ) : (
            <button data-ari="issue-po" onClick={onIssuePo} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white">
              Issue purchase order
            </button>
          )}
        </div>
      )}
    </section>
  );
}
