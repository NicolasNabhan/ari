import { AnimationUtils, type AnimationClip } from "three";
import type { ClipSpec } from "./petConfig";

/**
 * One clip per action, from whatever the model ships with: a clip matched by
 * name, else a frame range sliced from the first clip (the Gobkit
 * "everything on one timeline" convention). Actions with neither are left
 * out, and the actor animates them procedurally.
 */
export function resolveClips<A extends string>(
  animations: AnimationClip[],
  specs: Record<A, ClipSpec>,
  fps: number,
): Partial<Record<A, AnimationClip>> {
  const out: Partial<Record<A, AnimationClip>> = {};
  for (const action of Object.keys(specs) as A[]) {
    const { names = [], frames } = specs[action];
    const wanted = names.map((n) => n.toLowerCase());
    const named = animations.find((a) => wanted.some((n) => a.name.toLowerCase().includes(n)));
    if (named) out[action] = named;
    else if (frames && animations[0] && animations[0].duration * fps >= frames.to) {
      // +1 keeps the last frame: subclip's end frame is exclusive.
      out[action] = AnimationUtils.subclip(animations[0], action, frames.from, frames.to + 1, fps);
    }
  }
  return out;
}
