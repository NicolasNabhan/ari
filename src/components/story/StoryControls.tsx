// Play / pause / skip-to-learning and progress, bottom centre of the story
// stage. Pure presentational: the integrator wires it to the director.
import Link from "next/link";
import { ArrowRight, GraduationCap, Pause, Play, RotateCcw } from "lucide-react";
import s from "./storyUi.module.css";

// The story's last beat ({ kind: "cta" }): a big button on to the learning part.
export function StartLearningButton({
  href,
  label = "Start learning with Ari",
  onClick,
  className = "absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
}: {
  href: string;
  label?: string;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <Link
        href={href}
        onClick={onClick}
        data-ari="start-learning"
        className={`${s.popIn} ari-lift group inline-flex items-center gap-3 rounded-full py-3 pl-3 pr-7 text-lg font-semibold text-white shadow-2xl shadow-ari-500/40 ring-4 ring-white/70 ari-gradient-animated`}
      >
        <span className="grid h-11 w-11 place-items-center rounded-full bg-white/20">
          <GraduationCap className="h-6 w-6" />
        </span>
        {label}
        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
}

export type StoryControlsProps = {
  playing: boolean;
  step: number; // 1-based
  total: number;
  chapter?: string; // e.g. "Pick the vendor"
  done?: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSkip: () => void; // skip to learning
  learnHref?: string; // when set, "Skip to learning" is a link there (usually LEARN_HREF); onSkip still fires
  onRestart?: () => void; // shown instead of play once done
  className?: string; // positioning; defaults to bottom centre of a positioned parent
};

const skipClass =
  "ari-lift inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-ari-700 ring-1 ring-ari-200 hover:bg-ari-50 disabled:opacity-40";

export function StoryControls({
  playing,
  step,
  total,
  chapter,
  done = false,
  onPlay,
  onPause,
  onSkip,
  learnHref,
  onRestart,
  className = "absolute bottom-6 left-1/2 z-50 -translate-x-1/2",
}: StoryControlsProps) {
  const pct = total > 0 ? Math.round((Math.min(step, total) / total) * 100) : 0;
  const toggle = done ? onRestart : playing ? onPause : onPlay;
  const ToggleIcon = done ? RotateCcw : playing ? Pause : Play;
  const toggleLabel = done ? "Watch again" : playing ? "Pause" : "Play";

  return (
    <div className={className} data-ari="story-controls">
      <div className={`${s.barIn} flex w-[520px] items-center gap-4 rounded-full bg-white/90 py-2 pl-2 pr-2 shadow-xl shadow-ari-500/15 ring-1 ring-ari-100 backdrop-blur`}>
        <button
          type="button"
          data-ari="story-toggle"
          onClick={toggle}
          disabled={!toggle}
          aria-label={toggleLabel}
          title={toggleLabel}
          className="ari-lift grid h-12 w-12 shrink-0 place-items-center rounded-full text-white shadow-lg shadow-ari-500/30 ari-gradient disabled:opacity-40"
        >
          <ToggleIcon className={`h-5 w-5 ${!playing && !done ? "translate-x-px" : ""}`} fill={playing || done ? "none" : "currentColor"} />
        </button>

        <div className="min-w-0 flex-1" aria-label={`Step ${step} of ${total}`}>
          <div className="flex items-baseline justify-between gap-2 text-xs">
            <span className="truncate font-semibold text-zinc-800">{done ? "Ari learned it all" : chapter ?? (playing ? "Watching Maria" : "Paused")}</span>
            <span className="shrink-0 tabular-nums text-zinc-500">
              Step <span className="font-semibold text-ari-700">{Math.min(step, total)}</span> of {total}
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ari-50 ring-1 ring-ari-100">
            <div className="h-full rounded-full ari-gradient-animated transition-[width] duration-500 ease-out" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {learnHref ? (
          <Link href={learnHref} data-ari="story-skip" onClick={onSkip} className={skipClass}>
            <GraduationCap className="h-4 w-4" /> Skip to learning
          </Link>
        ) : (
          <button type="button" data-ari="story-skip" onClick={onSkip} disabled={done} className={skipClass}>
            <GraduationCap className="h-4 w-4" /> Skip to learning
          </button>
        )}
      </div>
    </div>
  );
}
