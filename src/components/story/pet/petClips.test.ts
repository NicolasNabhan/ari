import { describe, expect, it } from "vitest";
import { AnimationClip, NumberKeyframeTrack } from "three";
import { resolveClips } from "./petClips";
import { PET_CONFIG } from "./petConfig";

const FPS = 24;
const specs = PET_CONFIG.clips;

// A master timeline with one key per frame whose value is the frame number.
function masterTimeline(frames: number) {
  const times = Array.from({ length: frames }, (_, i) => i / FPS);
  const values = Array.from({ length: frames }, (_, i) => i);
  return new AnimationClip("Take 001", -1, [new NumberKeyframeTrack(".morphTargetInfluences[0]", times, values)]);
}

describe("resolveClips", () => {
  it("slices a single master timeline by frame range, keeping the last frame", () => {
    const clips = resolveClips([masterTimeline(120)], specs, FPS);

    const walk = clips.walk!.tracks[0];
    expect(walk.values[0]).toBe(90);
    expect(walk.values[walk.values.length - 1]).toBe(119);
    expect(walk.times[0]).toBe(0); // shifted to start at zero
    expect(clips.walk!.duration).toBeCloseTo(29 / FPS);

    const idle = clips.idle!.tracks[0];
    expect(Array.from(idle.values)).toEqual(Array.from({ length: 30 }, (_, i) => i));
  });

  it("prefers clips matched by name, case-insensitively (e.g. a Tripo export)", () => {
    const own = ["Armature|Idle_Loop", "Armature|Walk", "Run_Fast", "Sit_Down"].map((n) => new AnimationClip(n, 1, []));
    const clips = resolveClips(own, specs, FPS);
    expect(clips.idle?.name).toBe("Armature|Idle_Loop");
    expect(clips.walk?.name).toBe("Armature|Walk");
    expect(clips.run?.name).toBe("Run_Fast");
    expect(clips.sit?.name).toBe("Sit_Down");
  });

  it("leaves out actions the model can't play, so they fall back to procedural motion", () => {
    const clips = resolveClips([new AnimationClip("idle", 1, []), new AnimationClip("walk", 1, [])], specs, FPS);
    expect(Object.keys(clips).sort()).toEqual(["idle", "walk"]);
  });

  it("doesn't slice a timeline too short for the frame range", () => {
    expect(resolveClips([masterTimeline(30)], specs, FPS).walk).toBeUndefined();
  });

  it("returns nothing for an unanimated model", () => {
    expect(resolveClips([], specs, FPS)).toEqual({});
  });
});
