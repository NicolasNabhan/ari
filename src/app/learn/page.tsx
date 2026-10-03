import Link from "next/link";

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Learn from Maria</h1>
      <p className="mt-2 text-zinc-500">Coming soon.</p>
      <Link href="/" className="mt-6 inline-block underline">
        Back
      </Link>
    </main>
  );
}
