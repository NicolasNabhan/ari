import { ArrowRight, CalendarClock, ClipboardList, Hash, Package, Wallet } from "lucide-react";
import { person, vendor, type PurchaseRequest } from "@/lib/northwind/seed";
import { PageTitle, PersonAvatar } from "./PageTitle";

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

function Status({ text }: { text: string }) {
  const tone = text === "New" ? "bg-coral-400/15 text-coral-500" : text.startsWith("Vendor") ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700";
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone}`}>{text}</span>;
}

export function RequestQueue({
  requests,
  openRequestId,
  onOpen,
  quoted,
  selected,
  onGoToVendors,
}: {
  requests: PurchaseRequest[];
  openRequestId: string | null;
  onOpen: (id: string) => void;
  quoted: Record<string, string[]>;
  selected: Record<string, string>;
  onGoToVendors: () => void;
}) {
  const open = requests.find((r) => r.id === openRequestId);
  const facts = open
    ? [
        { icon: Package, label: "Item", value: open.item },
        { icon: Hash, label: "Quantity", value: String(open.quantity) },
        { icon: Wallet, label: "Budget", value: usd(open.budget) },
        { icon: CalendarClock, label: "Due", value: open.due },
      ]
    : [];
  return (
    <section className="space-y-6">
      <PageTitle icon={ClipboardList} title="Purchase requests" subtitle="Everything waiting for procurement" tone="amber" />
      {open && (
        <div className="ari-rise overflow-hidden rounded-3xl border border-zinc-200/70 bg-white shadow-sm">
          <div className="flex items-start gap-3 bg-gradient-to-r from-amber-50 to-coral-400/10 p-5">
            <PersonAvatar name={person(open.from)?.name ?? "?"} />
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">{open.subject}</h2>
              <p className="text-sm text-zinc-500">
                From {person(open.from)?.name}, {person(open.from)?.role}
              </p>
            </div>
          </div>
          <div className="p-5">
            <p className="text-zinc-700">{open.body}</p>
            <dl className="ari-stagger mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {facts.map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-2xl bg-zinc-50 p-3">
                  <dt className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                    <Icon className="h-3.5 w-3.5" /> {label}
                  </dt>
                  <dd className="mt-0.5 font-semibold text-zinc-900">{value}</dd>
                </div>
              ))}
            </dl>
            <button
              data-ari="go-to-vendors"
              onClick={onGoToVendors}
              className="ari-lift mt-5 inline-flex items-center gap-2 rounded-2xl px-5 py-3 font-semibold text-white shadow-lg shadow-ari-500/30 ari-gradient"
            >
              Work on this request <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      <div className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-4 py-3">Request</th>
              <th className="px-4 py-3">From</th>
              <th className="px-4 py-3">Budget</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr
                key={r.id}
                data-ari={`request-${r.id}`}
                onClick={() => onOpen(r.id)}
                className={`cursor-pointer border-t border-zinc-100 transition-colors hover:bg-ari-50/50 ${r.id === openRequestId ? "bg-ari-50" : ""}`}
              >
                <td className="px-4 py-3 font-medium text-zinc-900">{r.subject}</td>
                <td className="px-4 py-3 text-zinc-600">{person(r.from)?.name}</td>
                <td className="px-4 py-3 text-zinc-600">{usd(r.budget)}</td>
                <td className="px-4 py-3 text-zinc-600">{r.due}</td>
                <td className="px-4 py-3">
                  <Status text={selected[r.id] ? `Vendor: ${vendor(selected[r.id])?.name}` : quoted[r.id] ? "Quotes requested" : "New"} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
