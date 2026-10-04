import { describe, expect, it } from "vitest";
import { arcPoint, jumpPhase, squash, stepTowards, turnTowards, wrapAngle, yawTowards } from "./petMath";

describe("yawTowards", () => {
  it("is 0 facing +Z, a quarter turn facing +X, a half turn facing -Z", () => {
    const o = { x: 0, z: 0 };
    expect(yawTowards(o, { x: 0, z: 1 })).toBeCloseTo(0);
    expect(yawTowards(o, { x: 1, z: 0 })).toBeCloseTo(Math.PI / 2);
    expect(yawTowards(o, { x: -1, z: 0 })).toBeCloseTo(-Math.PI / 2);
    expect(Math.abs(yawTowards(o, { x: 0, z: -1 }))).toBeCloseTo(Math.PI);
  });

  it("is relative to where Ari stands", () => {
    expect(yawTowards({ x: 2, z: 2 }, { x: 3, z: 2 })).toBeCloseTo(Math.PI / 2);
  });
});

describe("turnTowards", () => {
  it("turns by at most the step", () => {
    expect(turnTowards(0, 1, 0.25)).toBeCloseTo(0.25);
    expect(turnTowards(0, -1, 0.25)).toBeCloseTo(-0.25);
  });

  it("snaps when the target is within one step", () => {
    expect(turnTowards(0.9, 1, 0.25)).toBeCloseTo(1);
  });

  it("goes the short way across the back", () => {
    // From just left of behind to just right of behind: a small turn, not a full spin.
    const next = turnTowards(Math.PI - 0.1, -Math.PI + 0.1, 0.05);
    expect(wrapAngle(next)).toBeCloseTo(Math.PI - 0.05);
    const arrived = turnTowards(Math.PI - 0.1, -Math.PI + 0.1, 1);
    expect(wrapAngle(arrived)).toBeCloseTo(-Math.PI + 0.1);
  });
});

describe("stepTowards", () => {
  it("moves the given distance along the straight line", () => {
    const p = stepTowards({ x: 0, z: 0 }, { x: 3, z: 4 }, 1);
    expect(p.x).toBeCloseTo(0.6);
    expect(p.z).toBeCloseTo(0.8);
    expect(p.arrived).toBe(false);
  });

  it("lands exactly on the target instead of overshooting", () => {
    expect(stepTowards({ x: 0, z: 0 }, { x: 0.1, z: 0 }, 1)).toEqual({ x: 0.1, z: 0, arrived: true });
  });
});

describe("arcPoint", () => {
  const from = { x: 0, y: 0, z: 0 };
  const to = { x: 1, y: 0.55, z: -0.5 };

  it("starts and ends exactly at the endpoints", () => {
    expect(arcPoint(from, to, 0.2, 0)).toEqual(from);
    const end = arcPoint(from, to, 0.2, 1);
    expect(end.x).toBeCloseTo(1);
    expect(end.y).toBeCloseTo(0.55);
    expect(end.z).toBeCloseTo(-0.5);
  });

  it("peaks `height` above the start in the middle of a level hop", () => {
    const mid = arcPoint(from, from, 0.15, 0.5);
    expect(mid.y).toBeCloseTo(0.15);
    expect(arcPoint(from, from, 0.15, 0.25).y).toBeLessThan(0.15);
  });

  it("rises above the straight line on the way to a higher point", () => {
    expect(arcPoint(from, to, 0.2, 0.5).y).toBeGreaterThan(0.55 / 2);
  });
});

describe("squash and stretch", () => {
  it("keeps the volume", () => {
    for (const sy of [0.7, 1, 1.2]) {
      const s = squash(sy);
      expect(s.x * s.y * s.z).toBeCloseTo(1);
    }
  });

  it("crouches before take-off, stretches in the air, squashes on landing, then settles", () => {
    const timing = { crouch: 0.1, air: 0.5, land: 0.2 };
    expect(jumpPhase(0.09, timing).scaleY).toBeLessThan(0.85);
    expect(jumpPhase(0.09, timing).airT).toBe(0);
    const rising = jumpPhase(0.1 + 0.15, timing);
    expect(rising.scaleY).toBeGreaterThan(1);
    expect(rising.airT).toBeGreaterThan(0);
    expect(jumpPhase(0.1 + 0.5 + 0.1, timing).scaleY).toBeLessThan(0.85);
    expect(jumpPhase(0.1 + 0.5 + 0.1, timing).airT).toBe(1);
    expect(jumpPhase(1, timing)).toEqual({ airT: 1, scaleY: 1, done: true });
  });
});
