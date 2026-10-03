import { northwind } from "@/lib/northwind/seed";

export function Procedure() {
  return (
    <section className="max-w-2xl">
      <h1 className="text-xl font-semibold">{northwind.company.name} procurement procedure</h1>
      <p className="mt-1 text-sm text-zinc-500">The official, written process.</p>
      <ol className="mt-4 space-y-3">
        {northwind.procedure.map((r) => (
          <li key={r.id} className="rounded-xl border bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="font-medium">
              {r.id} {r.title}
            </div>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{r.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
