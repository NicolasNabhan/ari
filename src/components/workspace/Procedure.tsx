import { BookText } from "lucide-react";
import { northwind } from "@/lib/northwind/seed";
import { PageTitle } from "./PageTitle";

export function Procedure() {
  return (
    <section className="max-w-2xl">
      <PageTitle icon={BookText} title="Procurement procedure" subtitle={`${northwind.company.name} · the official, written process`} tone="amber" />
      <ol className="ari-stagger space-y-3">
        {northwind.procedure.map((r) => (
          <li key={r.id} className="rounded-2xl border border-zinc-200/70 bg-white shadow-sm p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-2 font-semibold text-zinc-900">
              <span className="rounded-lg bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">{r.id}</span> {r.title}
            </div>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{r.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
