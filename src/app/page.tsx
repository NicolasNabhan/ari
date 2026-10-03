import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Ari</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">The apprentice that keeps your experts&rsquo; know-how.</h1>
      <p className="mt-4 text-lg text-zinc-500">
        Ari watches Maria, Northwind&rsquo;s Procurement Manager, asks why at the right moments, and teaches the next person.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link href="/learn" className="rounded-xl border p-6 hover:border-indigo-500">
          <span className="text-lg font-medium">Learn from Maria</span>
          <span className="mt-1 block text-sm text-zinc-500">Be the newcomer. Ari teaches you Maria&rsquo;s job.</span>
        </Link>
        <Link href="/teach" className="rounded-xl border p-6 hover:border-indigo-500">
          <span className="text-lg font-medium">Teach Ari as Maria</span>
          <span className="mt-1 block text-sm text-zinc-500">Play the expert. Ari watches and asks why.</span>
        </Link>
      </div>
      <Link href="/voice-check" className="mt-10 text-sm text-zinc-400 underline">
        Voice check
      </Link>
    </main>
  );
}
