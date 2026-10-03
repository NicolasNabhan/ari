import { person, type PurchaseRequest } from "@/lib/northwind/seed";

export function Inbox({ requests, onOpen }: { requests: PurchaseRequest[]; onOpen: (id: string) => void }) {
  return (
    <section>
      <h1 className="text-xl font-semibold">Inbox</h1>
      <ul className="mt-4 divide-y rounded-xl border bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {requests.map((r) => (
          <li key={r.id}>
            <button data-ari={`inbox-${r.id}`} onClick={() => onOpen(r.id)} className="block w-full px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{person(r.from)?.name}</span>
                <span className="text-zinc-400">{r.receivedAt}</span>
              </div>
              <div className="font-medium">{r.subject}</div>
              <div className="truncate text-sm text-zinc-500">{r.body}</div>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
