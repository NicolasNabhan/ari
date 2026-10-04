"use client";

// Dev preview of the story's voice layer: speech and thought bubbles for both
// speakers, say() with live word reveal and its word events, and every sound.
import { useEffect, useRef, useState } from "react";
import { Cloud, Footprints, MessageCircle, MessageCircleMore, Mic, PawPrint, Play, Square, UserRound } from "lucide-react";
import { SoundToggle } from "@/components/story/SoundToggle";
import { SpeechBubble } from "@/components/story/SpeechBubble";
import { sounds, type SoundName } from "@/lib/ari/sounds";
import type { Point } from "@/lib/story/bubbleLayout";
import { STAGE } from "@/lib/story/stage";
import { say, stopSaying, subscribeVoice, type Speaker, type VoiceEvent } from "@/lib/story/storyVoice";

const SAMPLE: Record<Speaker, string> = {
  maria: "Before I approve anything over five thousand euros, I always check the supplier's last three invoices.",
  ari: "Ooh, why three invoices? Is it to spot a price jump?",
};

type BubbleState = { open: boolean; text: string; variant: "speech" | "thought" };

const SOUND_NOTES: Partial<Record<SoundName, string>> = {
  footstep: "alternates feet",
  boop: "Ari hops",
  curious: "Ari is about to ask",
  press: "button press, tiny room",
  captured: "knowledge captured",
  transition: "between scenes",
};

export default function DevVoicePage() {
  const [heads, setHeads] = useState<Record<Speaker, Point>>({ maria: { x: 380, y: 420 }, ari: { x: 1180, y: 640 } });
  const [bubbles, setBubbles] = useState<Record<Speaker, BubbleState>>({
    maria: { open: true, text: SAMPLE.maria, variant: "speech" },
    ari: { open: false, text: "Hmm…", variant: "thought" },
  });
  const [speaker, setSpeaker] = useState<Speaker>("maria");
  const [draft, setDraft] = useState(SAMPLE.maria);
  const [log, setLog] = useState<string[]>([]);
  const [lang, setLang] = useState("en-US");

  // Fit the 1440x900 stage into the preview's width.
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(el.clientWidth / STAGE.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Every voice event, as a lip-sync module would hear it.
  useEffect(
    () =>
      subscribeVoice((e: VoiceEvent) => {
        const line =
          e.type === "start"
            ? `start  ${e.speaker}  source=${e.source}  words=${e.words.length}  planned=${e.totalMs}ms`
            : e.type === "word"
              ? `word   #${e.event.wordIndex} "${e.event.word}"  start=${e.event.startMs}ms  dur=${e.event.durationMs}ms  (${e.event.source})`
              : `end    ${e.speaker}${e.cancelled ? "  (cancelled)" : ""}`;
        setLog((l) => [line, ...l].slice(0, 60));
      }),
    [],
  );

  const setBubble = (who: Speaker, patch: Partial<BubbleState>) => setBubbles((b) => ({ ...b, [who]: { ...b[who], ...patch } }));

  const sayIt = () => {
    setBubble(speaker, { open: true, text: draft, variant: "speech" });
    void say(speaker, draft, { lang });
  };

  const hmm = () => {
    sounds.curious();
    setBubble("ari", { open: true, text: "Hmm…", variant: "thought" });
  };

  const walk = () => [0, 1, 2, 3, 4, 5].forEach((i) => setTimeout(sounds.footstep, i * 300));

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="ari-gradient-text text-3xl font-bold">Story voice layer</h1>
          <p className="mt-1 text-zinc-500">Speech bubbles, say() with live word reveal, and the story sounds. Click the stage to move the selected speaker.</p>
        </div>
        <SoundToggle />
      </div>

      <div
        ref={frameRef}
        className="relative mt-6 w-full overflow-hidden rounded-2xl border border-ari-200 shadow-lg"
        style={{ aspectRatio: `${STAGE.width} / ${STAGE.height}` }}
      >
        <div
          className="absolute left-0 top-0 cursor-crosshair bg-[var(--background)]"
          style={{ width: STAGE.width, height: STAGE.height, transform: `scale(${scale})`, transformOrigin: "0 0" }}
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const p = { x: Math.round((e.clientX - r.left) / scale), y: Math.round((e.clientY - r.top) / scale) };
            setHeads((h) => ({ ...h, [speaker]: p }));
          }}
        >
          <FakeSite />
          {(["maria", "ari"] as const).map((who) => (
            <Head key={who} who={who} at={heads[who]} />
          ))}
          {(["maria", "ari"] as const).map((who) => (
            <SpeechBubble
              key={who}
              speaker={who}
              anchor={heads[who]}
              open={bubbles[who].open}
              text={bubbles[who].text}
              variant={bubbles[who].variant}
              followVoice={bubbles[who].variant === "speech"}
              className="z-10"
            />
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="rounded-2xl border border-ari-100 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 font-semibold text-ari-700">
            <Mic className="size-4" /> say()
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["maria", "ari"] as const).map((who) => (
              <button
                key={who}
                type="button"
                onClick={() => {
                  setSpeaker(who);
                  setDraft(SAMPLE[who]);
                }}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${
                  speaker === who ? (who === "maria" ? "bg-coral-500 text-white" : "bg-ari-500 text-white") : "bg-ari-50 text-ari-700"
                }`}
              >
                {who === "maria" ? <UserRound className="size-4" /> : <PawPrint className="size-4" />}
                {who === "maria" ? "Maria" : "Ari"}
              </button>
            ))}
            <select value={lang} onChange={(e) => setLang(e.target.value)} className="ml-auto rounded-full border border-ari-200 px-3 text-sm">
              <option value="en-US">English</option>
              <option value="es-ES">Español</option>
            </select>
          </div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            className="mt-3 w-full rounded-xl border border-ari-200 p-3 text-sm outline-none focus:border-ari-400"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Action onClick={sayIt} icon={<Play className="size-4" />} primary>
              Say it
            </Action>
            <Action onClick={stopSaying} icon={<Square className="size-4" />}>
              Stop
            </Action>
            <Action onClick={hmm} icon={<Cloud className="size-4" />}>
              Ari: Hmm…
            </Action>
            <Action onClick={() => setBubble("ari", { open: true, text: "", variant: "thought" })} icon={<MessageCircleMore className="size-4" />}>
              Ari thinking
            </Action>
            {(["maria", "ari"] as const).map((who) => (
              <Action key={who} onClick={() => setBubble(who, { open: !bubbles[who].open })} icon={<MessageCircle className="size-4" />}>
                {bubbles[who].open ? "Hide" : "Show"} {who === "maria" ? "Maria" : "Ari"}
              </Action>
            ))}
          </div>
          <pre className="mt-4 h-64 overflow-auto rounded-xl bg-[#1d1a2f] p-3 font-mono text-[11px] leading-5 text-ari-100">
            {log.length ? log.join("\n") : "Voice events appear here."}
          </pre>
        </section>

        <section className="rounded-2xl border border-ari-100 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 font-semibold text-ari-700">
            <Footprints className="size-4" /> Sounds
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(Object.keys(sounds) as SoundName[]).map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => sounds[name]()}
                className="ari-lift rounded-xl border border-ari-100 bg-ari-50/60 px-3 py-2 text-left text-sm"
              >
                <span className="font-semibold text-ari-700">{name}</span>
                {SOUND_NOTES[name] && <span className="block text-xs text-zinc-500">{SOUND_NOTES[name]}</span>}
              </button>
            ))}
            <button type="button" onClick={walk} className="ari-lift rounded-xl border border-coral-400/40 bg-coral-400/10 px-3 py-2 text-left text-sm">
              <span className="font-semibold text-coral-500">walk</span>
              <span className="block text-xs text-zinc-500">six footsteps</span>
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

function Action({ onClick, icon, children, primary = false }: { onClick: () => void; icon: React.ReactNode; children: React.ReactNode; primary?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`ari-lift inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold ${
        primary ? "ari-gradient text-white" : "border border-ari-200 bg-white text-ari-700"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function Head({ who, at }: { who: Speaker; at: Point }) {
  const Icon = who === "maria" ? UserRound : PawPrint;
  return (
    <div
      className={`absolute flex size-20 items-center justify-center rounded-full text-white shadow-lg ${who === "maria" ? "bg-coral-400" : "bg-ari-400"}`}
      style={{ left: at.x - 40, top: at.y - 40 }}
    >
      <Icon className="size-9" />
    </div>
  );
}

// A stand-in for the website behind the story.
function FakeSite() {
  return (
    <div className="absolute inset-0 p-10 opacity-70">
      <div className="h-14 rounded-2xl bg-white shadow-sm" />
      <div className="mt-6 grid grid-cols-3 gap-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-48 rounded-2xl border border-ari-100 bg-white" />
        ))}
      </div>
    </div>
  );
}
