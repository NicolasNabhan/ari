"use client";

import { useState } from "react";
import { Play, Sparkles } from "lucide-react";
import { KeyedVideo } from "./KeyedVideo";

// The character layer over the website: plays the story's clips in order.
type Shot = { id: string; caption?: { who: "Maria" | "Ari"; text: string }; rect: { x: number; y: number; w: number; h: number } };

const FULL_LEFT = { x: -60, y: 300, w: 1067, h: 600 };
const WAIST_LEFT = { x: -40, y: 260, w: 1138, h: 640 };

const SHOTS: Shot[] = [
  { id: "M01", rect: FULL_LEFT },
  {
    id: "M02",
    rect: WAIST_LEFT,
    caption: { who: "Maria", text: "Hi! I'm Maria. I've been the procurement manager here at Northwind for eight years… and this is one of my last days." },
  },
];

const sources = (id: string) => [`/story/clips/${id}.mp4`, `/story/clips/placeholder/${id}.mp4`];

export function StoryPlayer() {
  const [index, setIndex] = useState<number | null>(null);
  const shot = index === null ? null : SHOTS[index];

  return (
    <div data-ari="character-layer" className="pointer-events-none absolute inset-0 z-[60]">
      {shot && (
        <>
          <KeyedVideo
            key={shot.id}
            srcs={sources(shot.id)}
            rect={shot.rect}
            autoPlay
            onEnded={() => setIndex((i) => (i !== null && i + 1 < SHOTS.length ? i + 1 : null))}
          />
          {shot.caption && (
            <div className="ari-pop absolute bottom-8 left-1/2 w-[640px] -translate-x-1/2 rounded-2xl bg-white/95 px-5 py-3 text-center text-[17px] text-zinc-800 shadow-xl ring-1 ring-zinc-200">
              <span className={`font-semibold ${shot.caption.who === "Maria" ? "text-coral-500" : "text-ari-600"}`}>{shot.caption.who}: </span>
              {shot.caption.text}
            </div>
          )}
        </>
      )}
      {index === null && (
        <div className="pointer-events-auto absolute inset-0 grid place-items-center bg-[#1d1a2f]/30 backdrop-blur-sm">
          <button
            data-ari="play-story"
            onClick={() => setIndex(0)}
            className="ari-pop ari-lift flex items-center gap-3 rounded-3xl px-8 py-5 text-xl font-semibold text-white shadow-2xl shadow-ari-500/40 ari-gradient-animated"
          >
            <Play className="h-6 w-6" /> Watch Ari learn from Maria <Sparkles className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
