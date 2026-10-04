"use client";

// Dev-only look at the story overlays: the director walks the Maria episode
// with fake timings, the pop-up shows the real cards the Core builds.
import { useEffect, useMemo, useReducer, useState } from "react";
import { run, startAsMaria } from "@/lib/apprentice/harness";
import { ruleJudge } from "@/lib/apprentice/ruleJudge";
import { chapterAt, directorReducer, episodeCoreInputs, initDirector, LEARN_HREF, MARIA_CHAPTERS, MARIA_EPISODE, viewOf } from "@/lib/story/episode";
import { StoryStage } from "@/components/story/StoryStage";
import { KnowledgePopup } from "@/components/story/KnowledgePopup";
import { StartLearningButton, StoryControls } from "@/components/story/StoryControls";

const BEAT_MS = 700;

export default function DevStoryPage() {
  const cards = useMemo(() => run([startAsMaria, ...episodeCoreInputs(MARIA_EPISODE)], ruleJudge).cards, []);
  const [director, dispatch] = useReducer(directorReducer, MARIA_EPISODE, (beats) => initDirector(beats, { paused: true }));
  const view = viewOf(director);
  const [popupStep, setPopupStep] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);

  // Fake runner: every beat takes BEAT_MS; a question is "asked" by the Core right away.
  useEffect(() => {
    const beat = view.beat;
    if (!beat || beat.kind === "cta") return; // the last beat stays up
    if (beat.kind === "await-question") {
      const t = setTimeout(() => dispatch({ kind: "core-asked", text: beat.expect ?? "Why?" }), BEAT_MS);
      return () => clearTimeout(t);
    }
    const show = beat.kind === "popup" ? setTimeout(() => (setLeaving(false), setPopupStep(beat.step)), 0) : undefined;
    const t = setTimeout(() => dispatch({ kind: "beat-done", seq: view.seq }), beat.kind === "popup" ? 400 : BEAT_MS);
    return () => (clearTimeout(t), clearTimeout(show));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.seq]);

  const card = cards.find((c) => c.stepId === popupStep);
  const { chapter } = chapterAt(MARIA_CHAPTERS, view.step - 1);
  const b = view.beat;
  const line = !b ? "" : b.kind === "say" ? `${b.who}: ${b.text}` : b.kind === "answer" ? `maria: ${b.text}` : JSON.stringify(b);

  return (
    <StoryStage>
      <div className="absolute inset-0 bg-gradient-to-br from-ari-50 via-white to-coral-400/10" />
      <div className="absolute left-8 top-1/2 w-[900px] -translate-y-1/2 space-y-3 font-mono text-sm text-zinc-500">
        <p className="text-xs uppercase tracking-widest text-zinc-400">Current beat (seq {view.seq})</p>
        <p className="text-zinc-800">{line || (view.done ? "done" : "paused")}</p>
        <div className="flex gap-2 pt-4 font-sans">
          {cards.filter((c) => c.reason?.source === "expert").map((c) => (
            <button key={c.id} onClick={() => { setLeaving(false); setPopupStep(c.stepId); }} className="rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-ari-700 ring-1 ring-ari-200">
              Show {c.stepId}
            </button>
          ))}
        </div>
      </div>
      {card && (
        <KnowledgePopup
          card={card}
          leaving={leaving}
          onDone={() => {
            setLeaving(true);
            setTimeout(() => setPopupStep(null), 320);
          }}
        />
      )}
      {b?.kind === "cta" && <StartLearningButton href={b.href} label={b.label} />}
      <StoryControls
        learnHref={LEARN_HREF}
        playing={!view.paused && !view.done}
        step={view.step}
        total={view.total}
        chapter={chapter.title}
        done={view.done}
        onPlay={() => dispatch({ kind: "resume" })}
        onPause={() => dispatch({ kind: "pause" })}
        onSkip={() => dispatch({ kind: "skip" })}
        onRestart={() => location.reload()}
      />
    </StoryStage>
  );
}
