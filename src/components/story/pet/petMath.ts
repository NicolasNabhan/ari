// Pure motion maths for Ari. Yaw 0 faces +Z (towards the camera); yaw grows
// turning towards +X.

export type Vec2 = { x: number; z: number };
export type Vec3 = { x: number; y: number; z: number };

/** Wrap an angle into (-PI, PI]. */
export function wrapAngle(a: number) {
  const w = Math.atan2(Math.sin(a), Math.cos(a));
  return w === -Math.PI ? Math.PI : w;
}

/** The yaw that makes something at `from` face `to`. */
export function yawTowards(from: Vec2, to: Vec2) {
  return Math.atan2(to.x - from.x, to.z - from.z);
}

/** Turn `current` towards `target` the short way round, by at most `maxStep` radians. */
export function turnTowards(current: number, target: number, maxStep: number) {
  const delta = wrapAngle(target - current);
  if (Math.abs(delta) <= maxStep) return current + delta;
  return current + Math.sign(delta) * maxStep;
}

/** Move from `pos` towards `target` by at most `maxDist`. */
export function stepTowards(pos: Vec2, target: Vec2, maxDist: number) {
  const dx = target.x - pos.x;
  const dz = target.z - pos.z;
  const dist = Math.hypot(dx, dz);
  if (dist <= maxDist) return { x: target.x, z: target.z, arrived: true };
  return { x: pos.x + (dx / dist) * maxDist, z: pos.z + (dz / dist) * maxDist, arrived: false };
}

/** A point along a jump arc at t in [0, 1]: straight line plus a parabola `height` tall at the middle. */
export function arcPoint(from: Vec3, to: Vec3, height: number, t: number): Vec3 {
  const u = Math.min(1, Math.max(0, t));
  return {
    x: from.x + (to.x - from.x) * u,
    y: from.y + (to.y - from.y) * u + 4 * height * u * (1 - u),
    z: from.z + (to.z - from.z) * u,
  };
}

/** Scale that squashes (sy < 1) or stretches (sy > 1) while keeping the volume. */
export function squash(sy: number) {
  const sxz = 1 / Math.sqrt(sy);
  return { x: sxz, y: sy, z: sxz };
}

export type JumpTiming = { crouch: number; air: number; land: number };

/**
 * Where a jump is at `elapsed` seconds: crouch (squash down), air (move
 * along the arc, stretched), land (squash and recover). `airT` is the
 * progress along the arc, `scaleY` the vertical squash/stretch.
 */
export function jumpPhase(elapsed: number, timing: JumpTiming) {
  const { crouch, air, land } = timing;
  if (elapsed < crouch) {
    const p = elapsed / crouch;
    return { airT: 0, scaleY: 1 - 0.22 * Math.sin((p * Math.PI) / 2), done: false };
  }
  if (elapsed < crouch + air) {
    const p = (elapsed - crouch) / air;
    // Starts from the crouch, stretches on the way up, back to normal at the top.
    const scaleY = p < 0.15 ? 0.78 + (1.14 - 0.78) * (p / 0.15) : 1 + 0.14 * Math.cos(((p - 0.15) / 0.85) * Math.PI * 0.5);
    return { airT: p, scaleY, done: false };
  }
  if (elapsed < crouch + air + land) {
    const p = (elapsed - crouch - air) / land;
    return { airT: 1, scaleY: 1 - 0.2 * Math.sin(p * Math.PI), done: false };
  }
  return { airT: 1, scaleY: 1, done: true };
}

/** 0..1 pulse at `hz`, starting closed: the beat of procedural talking. */
export function talkPulse(t: number, hz: number) {
  return 0.5 - 0.5 * Math.cos(2 * Math.PI * hz * t);
}
