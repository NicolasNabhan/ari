import { person, vendor, type PurchaseRequest } from "@/lib/northwind/seed";

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

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
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Purchase requests</h1>
        <table className="mt-4 w-full overflow-hidden rounded-xl border bg-white text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <thead className="bg-zinc-50 text-left text-zinc-500 dark:bg-zinc-800">
            <tr>
              <th className="px-4 py-2">Request</th>
              <th className="px-4 py-2">From</th>
              <th className="px-4 py-2">Budget</th>
              <th className="px-4 py-2">Due</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id} data-ari={`request-${r.id}`} onClick={() => onOpen(r.id)} className={`cursor-pointer border-t dark:border-zinc-800 ${r.id === openRequestId ? "bg-indigo-50 dark:bg-indigo-950" : ""}`}>
                <td className="px-4 py-2 font-medium">{r.subject}</td>
                <td className="px-4 py-2">{person(r.from)?.name}</td>
                <td className="px-4 py-2">{usd(r.budget)}</td>
                <td className="px-4 py-2">{r.due}</td>
                <td className="px-4 py-2 text-zinc-500">
                  {selected[r.id] ? `Vendor chosen: ${vendor(selected[r.id])?.name}` : quoted[r.id] ? "Quotes requested" : "New"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {open && (
        <div className="rounded-xl border bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="font-semibold">{open.subject}</h2>
          <p className="mt-2 text-zinc-600 dark:text-zinc-300">{open.body}</p>
          <dl className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <div><dt className="text-zinc-500">Item</dt><dd>{open.item}</dd></div>
            <div><dt className="text-zinc-500">Quantity</dt><dd>{open.quantity}</dd></div>
            <div><dt className="text-zinc-500">Budget</dt><dd>{usd(open.budget)}</dd></div>
            <div><dt className="text-zinc-500">Due</dt><dd>{open.due}</dd></div>
          </dl>
          <button data-ari="go-to-vendors" onClick={onGoToVendors} className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white">
            Work on this request
          </button>
        </div>
      )}
    </section>
  );
}
