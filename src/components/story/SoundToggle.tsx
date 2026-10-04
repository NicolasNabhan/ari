"use client";

// Sound on/off for the story controls. Mutes the effects and the story voice
// (from its next line; words still appear in the bubbles).
import { useSyncExternalStore } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { onSoundsMutedChange, setSoundsMuted, sounds, soundsMuted } from "@/lib/ari/sounds";

const subscribe = (onChange: () => void) => onSoundsMutedChange(() => onChange());

export function SoundToggle({ className = "" }: { className?: string }) {
  const muted = useSyncExternalStore(subscribe, soundsMuted, () => false);
  const Icon = muted ? VolumeX : Volume2;
  return (
    <button
      type="button"
      onClick={() => {
        setSoundsMuted(!muted);
        if (muted) sounds.tap(); // just unmuted: a tiny confirmation
      }}
      aria-pressed={muted}
      aria-label={muted ? "Turn sound on" : "Mute sound"}
      title={muted ? "Turn sound on" : "Mute sound"}
      className={`ari-lift inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-ari-200 bg-white/90 shadow-sm backdrop-blur hover:bg-ari-50 ${
        muted ? "text-zinc-400" : "text-ari-600"
      } ${className}`}
    >
      <Icon className="size-5" strokeWidth={2.2} />
    </button>
  );
}
