import Link from "next/link";
import { ArrowRight, Clock, Eye, GraduationCap, Headphones, MessageCircleQuestion, ShieldAlert, Sparkles, UserRoundPen } from "lucide-react";

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
      <section className="ari-rise mt-10 rounded-3xl border border-white bg-white/85 p-6 shadow-xl shadow-ari-500/10 backdrop-blur [animation-delay:240ms]">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">What this demo shows</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="flex gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white ari-gradient">
              <Sparkles className="h-5 w-5" />
            </span>
            <p className="text-zinc-700">
              <span className="font-semibold text-zinc-900">Ari is our AI.</span> It learns from veteran employees by watching how they work, asking
              &ldquo;why?&rdquo; when it can&rsquo;t work out a choice, and then passes that know-how on to the next new employee.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-coral-500 text-white">
              <UserRoundPen className="h-5 w-5" />
            </span>
            <p className="text-zinc-700">
              <span className="font-semibold text-zinc-900">Maria is a simulated veteran employee:</span> Procurement Manager at Northwind Supply for
              eight years. Her work runs in a simulated company workspace (inbox, vendors, approvals, chat).
            </p>
          </div>
        </div>
      </section>
      <ol className="ari-stagger mt-6 grid gap-5 md:grid-cols-2">
        <li>
          <Link
            href="/teach"
            data-ari="mode-teach"
            className="ari-lift group relative block h-full overflow-hidden rounded-3xl p-7 text-white shadow-xl shadow-ari-500/30 ari-gradient-animated"
          >
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-white/80">
              <Clock className="h-3.5 w-3.5" /> Step 1 · Start here · 3 minutes
            </span>
            <span className="mt-3 flex items-center gap-3 text-2xl font-semibold">
              <Eye className="h-7 w-7" /> Ari learns from Maria
            </span>
            <span className="mt-2 block text-white/90">
              Step into Maria&rsquo;s shoes for one purchase; a guide shows you each click. Watch Ari observe her work, ask why at the right moments,
              and sort what it learns: rules that must be followed, strong advice, personal choices, and the rules nobody wrote down.
            </span>
            <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-semibold text-ari-700">
              Start step 1 <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        </li>
        <li>
          <Link
            href="/learn"
            data-ari="mode-learn"
            className="ari-lift group block h-full rounded-3xl border border-white bg-white/85 p-7 shadow-xl shadow-ari-500/10 backdrop-blur"
          >
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-ari-600">
              <Clock className="h-3.5 w-3.5" /> Step 2 · 2 minutes
            </span>
            <span className="mt-3 flex items-center gap-3 text-2xl font-semibold text-zinc-900">
              <GraduationCap className="h-7 w-7 text-coral-500" /> Ari teaches the new employee
            </span>
            <span className="mt-2 block text-zinc-600">
              Now you&rsquo;re the new hire. Ari teaches you what it learned from Maria by voice: ask why, say &ldquo;show me&rdquo;, switch to
              Spanish, and watch it stop you before you break Maria&rsquo;s unwritten rule.
            </span>
            <span className="mt-6 inline-flex items-center gap-2 rounded-full px-4 py-2 font-semibold text-white ari-gradient">
              Start step 2 <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        </li>
      </ol>
      <p className="mt-8 flex items-center gap-2 text-sm text-zinc-500">
        <Headphones className="h-4 w-4" /> Best in Chrome with sound on. Ari will ask to use your microphone.
      </p>
    </main>
  );
}
