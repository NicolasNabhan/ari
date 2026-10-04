import { ChevronRight, Inbox as InboxIcon, Paperclip } from "lucide-react";
import { person, type PurchaseRequest } from "@/lib/northwind/seed";
import { PageTitle, PersonAvatar } from "./PageTitle";

export function Inbox({ requests, onOpen }: { requests: PurchaseRequest[]; onOpen: (id: string) => void }) {
  return (
    <section>
      <PageTitle icon={InboxIcon} title="Inbox" subtitle={`${requests.length} new purchase request${requests.length === 1 ? "" : "s"}`} />
      <ul className="ari-stagger space-y-3">
        {requests.map((r) => (
          <li key={r.id}>
            <button
              data-ari={`inbox-${r.id}`}
              onClick={() => onOpen(r.id)}
              className="ari-lift group flex w-full items-start gap-3 rounded-2xl border border-zinc-200/70 bg-white p-4 text-left shadow-sm"
            >
              <PersonAvatar name={person(r.from)?.name ?? "?"} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-semibold text-zinc-900">{person(r.from)?.name}</span>
                  <span className="text-xs text-zinc-400">{r.receivedAt}</span>
                </span>
                <span className="mt-0.5 flex items-center gap-1.5 font-medium text-zinc-800">
                  <span className="h-2 w-2 rounded-full bg-coral-500" /> {r.subject}
                </span>
                <span className="mt-1 line-clamp-2 block text-sm text-zinc-500">{r.body}</span>
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-zinc-50 px-2 py-0.5 text-xs text-zinc-500 ring-1 ring-zinc-200">
                  <Paperclip className="h-3 w-3" /> purchase request
                </span>
              </span>
              <ChevronRight className="mt-3 h-5 w-5 text-zinc-300 transition-transform group-hover:translate-x-1 group-hover:text-ari-500" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
