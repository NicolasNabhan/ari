import Link from "next/link";
import { ArrowRight, Clock, GraduationCap, Headphones, MessageCircleQuestion, ShieldAlert, Sparkles, UserRoundPen } from "lucide-react";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-16">
      <div className="ari-rise flex items-center gap-2">
        <span className="grid h-10 w-10 place-items-center rounded-2xl text-white shadow-lg shadow-ari-500/30 ari-gradient-animated">
          <Sparkles className="h-5 w-5" />
        </span>
        <span className="text-2xl font-bold tracking-tight ari-gradient-text">Ari</span>
        <span className="ml-2 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-zinc-500 ring-1 ring-zinc-200">the AI apprentice</span>
      </div>
      <h1 className="ari-rise mt-6 max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight text-zinc-900 [animation-delay:80ms]">
        When your best people leave, <span className="ari-gradient-text">their know-how stays.</span>
      </h1>
      <p className="ari-rise mt-5 max-w-2xl text-lg text-zinc-600 [animation-delay:160ms]">
        Ari sits beside an expert, asks &ldquo;why?&rdquo; only when it can&rsquo;t work out the reason, and teaches the next person by voice, including
        the rules nobody ever wrote down.
      </p>
      <ul className="ari-stagger mt-6 flex flex-wrap gap-2 text-sm">
        {[
          { icon: Headphones, text: "Voice first" },
          { icon: MessageCircleQuestion, text: "Asks why at the right moment" },
          { icon: ShieldAlert, text: "Catches unwritten rules" },
          { icon: GraduationCap, text: "Teaches the next hire" },
        ].map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 font-medium text-zinc-700 shadow-sm ring-1 ring-zinc-200/70">
            <Icon className="h-4 w-4 text-ari-500" /> {text}
          </li>
        ))}
      </ul>
      <div className="ari-stagger mt-10 grid gap-5 md:grid-cols-2">
        <Link
          href="/learn"
          data-ari="mode-learn"
          className="ari-lift group relative overflow-hidden rounded-3xl p-7 text-white shadow-xl shadow-ari-500/30 ari-gradient-animated"
        >
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-white/80">
            <Clock className="h-3.5 w-3.5" /> Start here · 1 minute
          </span>
          <span className="mt-3 flex items-center gap-3 text-2xl font-semibold">
            <GraduationCap className="h-7 w-7" /> Learn from Maria
          </span>
          <span className="mt-2 block text-white/90">
            You&rsquo;re the new hire. Ari teaches you how Maria, Northwind&rsquo;s Procurement Manager, buys things, and stops you before you break
            Maria&rsquo;s unwritten rule.
          </span>
          <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-semibold text-ari-700">
            Start learning <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
        <Link href="/teach" data-ari="mode-teach" className="ari-lift group rounded-3xl border border-white bg-white/85 p-7 shadow-xl shadow-ari-500/10 backdrop-blur">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-ari-600">
            <Clock className="h-3.5 w-3.5" /> Guided · 3 minutes
          </span>
          <span className="mt-3 flex items-center gap-3 text-2xl font-semibold text-zinc-900">
            <UserRoundPen className="h-7 w-7 text-coral-500" /> Teach Ari as Maria
          </span>
          <span className="mt-2 block text-zinc-600">
            Play the expert. A guide shows you what to do; Ari watches, asks why at the right moments, then teaches a newcomer using your own answers.
          </span>
          <span className="mt-6 inline-flex items-center gap-2 rounded-full px-4 py-2 font-semibold text-white ari-gradient">
            Start teaching <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
      </div>
      <p className="mt-8 flex items-center gap-2 text-sm text-zinc-500">
        <Headphones className="h-4 w-4" /> Best in Chrome with sound on. Ari will ask to use your microphone.
      </p>
    </main>
  );
}
