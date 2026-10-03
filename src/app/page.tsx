import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Ari</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">The apprentice that keeps your experts&rsquo; know-how.</h1>
      <p className="mt-4 text-lg text-zinc-500">
        Ari sits beside an expert, asks &ldquo;why?&rdquo; only when it can&rsquo;t work out the reason, and teaches the next person, including the
        rules nobody wrote down.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link href="/learn" data-ari="mode-learn" className="rounded-xl border-2 border-indigo-500 p-6 hover:bg-indigo-50 dark:hover:bg-indigo-950">
          <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Start here · 1 minute</span>
          <span className="mt-1 block text-lg font-medium">Learn from Maria</span>
          <span className="mt-1 block text-sm text-zinc-500">
            You&rsquo;re the new hire. Ari teaches you how Maria, Northwind&rsquo;s Procurement Manager, buys things, and stops you before you break
            Maria&rsquo;s unwritten rule.
          </span>
        </Link>
        <Link href="/teach" data-ari="mode-teach" className="rounded-xl border p-6 hover:border-indigo-500 dark:border-zinc-700">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Guided · 3 minutes</span>
          <span className="mt-1 block text-lg font-medium">Teach Ari as Maria</span>
          <span className="mt-1 block text-sm text-zinc-500">
            Play the expert. Ari watches, asks why at the right moments, then teaches a newcomer using your own answers.
          </span>
        </Link>
      </div>
      <p className="mt-8 text-sm text-zinc-400">Works best in Chrome with sound on. No microphone? Type your answers under Ari.</p>
    </main>
  );
}
