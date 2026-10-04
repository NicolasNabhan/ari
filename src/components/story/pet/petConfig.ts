// Everything model-specific about Ari the pet lives here, so the placeholder
// corgi can be swapped for the real model (e.g. a Tripo export) by editing
// this file only: point modelUrl at the new GLB and adjust size/offset/clips.
//
// Placeholder: "Corgi" from the Gobkit Free Animal Pack
// (https://gobkit.com/freebies/animal/Corgi.glb), CC0 1.0 public domain,
// no attribution required.

export type FrameRange = { from: number; to: number };

/** The actions Ari plays. Any without a clip in the model falls back to procedural motion. */
export type PetAction = "idle" | "walk" | "run" | "sit";

/**
 * How to find an action's clip: the first clip whose name contains one of
 * `names` (case-insensitive); failing that, `frames` sliced from the first
 * clip (for files that bake every action onto one timeline).
 */
export type ClipSpec = { names?: string[]; frames?: FrameRange };

export type PetConfig = {
  modelUrl: string;
  /** World height the model is scaled to on load (Maria is ~0.98 tall). Ignored if `scale` is set. */
  height: number;
  /** Fixed uniform scale instead of normalising to `height`. */
  scale?: number;
  /** Nudge after centring (feet on the floor, centred on Ari's position), in world units. */
  offset: { x: number; y: number; z: number };
  /** Radians added so the model's nose points along +Z at yaw 0. Gobkit and most GLBs face +Z already. */
  facingOffset: number;
  /** Frame rate used to slice `frames`. */
  fps: number;
  clips: Record<PetAction, ClipSpec>;
  /** Ground speed (units/s) at which the walk clip plays at 1x; also the default walk speed. */
  walkClipSpeed: number;
  /** Bone names for the procedural layers (talking, head tilt, tail wag). Missing bones are skipped. */
  bones: { head?: string; mouth?: string; tail?: string; ears?: string[] };
};

export const PET_CONFIG: PetConfig = {
  modelUrl: "/avatars/ari-pet.glb",
  height: 0.28,
  offset: { x: 0, y: 0, z: 0 },
  facingOffset: 0,
  fps: 24,
  clips: {
    idle: { names: ["idle", "breath", "stand"], frames: { from: 0, to: 29 } },
    walk: { names: ["walk"], frames: { from: 90, to: 119 } },
    run: { names: ["run", "trot", "gallop"] },
    sit: { names: ["sit"] },
  },
  walkClipSpeed: 0.3,
  // The placeholder corgi's head and body are one block skinned to "Spine"; the snout is "Mouth".
  bones: { head: "Spine", mouth: "Mouth", tail: "Tail", ears: ["LeftEar", "RightEar"] },
};

export type PetMode = "story" | "teacher";
export type PetSpot = { x: number; z: number; y?: number };

/** Where Ari stands in each mode. */
export const PET_HOMES: Record<PetMode, PetSpot> = {
  // Next to Maria (her feet are around x = -0.85, z = 0).
  story: { x: -0.35, z: 0.2 },
  // Bottom-right of the stage, where the face-in-a-box avatar sits.
  teacher: { x: 0.55, z: 0 },
};

/**
 * Story: MariaStage's camera, so Ari shares Maria's 3D space (its bottom edge
 * cuts at her knees, so Ari is only in view when farther back or off the floor).
 * Teacher: Ari alone, framed low so he stands on the bottom of the stage.
 */
export const PET_CAMERAS: Record<PetMode, { fov: number; position: [number, number, number]; target: [number, number, number] }> = {
  story: { fov: 22, position: [0, 0.97, 3.6], target: [0, 0.97, 0] },
  teacher: { fov: 22, position: [0, 0.3, 2.4], target: [0, 0.3, 0] },
};
