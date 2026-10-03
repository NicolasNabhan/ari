"use client";

import { AriProvider, useAri } from "@/components/ari/AriProvider";

function Controls() {
  const ari = useAri();
  const btn = "rounded-lg border px-3 py-2 text-sm dark:border-zinc-700";
  return (
    <main className="mx-auto w-full max-w-2xl space-y-4 px-6 py-16">
      <h1 className="text-2xl font-semibold">Avatar check</h1>
      <p className="text-zinc-500">
        Face: <span data-ari="face-choice" className="font-mono">{ari.face}</span> · state: <span className="font-mono">{ari.state}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {(["bubble", "forward", "tutor"] as const).map((s) => (
          <button key={s} data-ari={`state-${s}`} className={btn} onClick={() => ari.setState(s)}>
            {s}
          </button>
        ))}
        <button data-ari="say" className={btn} onClick={() => ari.say("Why did you pick Vendor B over the cheaper Vendor A?")}>
          Say a line
        </button>
        <button data-ari="say-es" className={btn} onClick={() => ari.say("Claro, te lo explico en español.", "es-ES")}>
          Say in Spanish
        </button>
        <button data-ari="fail" className={btn} onClick={ari.simulateStreamFailure}>
          Simulate stream failure
        </button>
      </div>
    </main>
  );
}

export default function AvatarCheck() {
  return (
    <AriProvider>
      <Controls />
    </AriProvider>
  );
}
