import { describe, expect, it } from "vitest";
import { fitStage, STAGE } from "./stage";

describe("fitStage", () => {
  it("fills a window with the same aspect ratio exactly", () => {
    expect(fitStage({ width: 1440, height: 900 })).toEqual({ scale: 1, offsetX: 0, offsetY: 0 });
    expect(fitStage({ width: 2880, height: 1800 })).toEqual({ scale: 2, offsetX: 0, offsetY: 0 });
  });

  it("letterboxes a taller window, centred vertically", () => {
    const f = fitStage({ width: 1440, height: 1100 });
    expect(f.scale).toBe(1);
    expect(f.offsetX).toBe(0);
    expect(f.offsetY).toBe(100);
  });

  it("pillarboxes a wider window, centred horizontally", () => {
    const f = fitStage({ width: 1800, height: 900 });
    expect(f.scale).toBe(1);
    expect(f.offsetX).toBe(180);
    expect(f.offsetY).toBe(0);
  });

  it("shrinks for a small window", () => {
    const f = fitStage({ width: 720, height: 600 });
    expect(f.scale).toBeCloseTo(0.5);
    expect(f.offsetY).toBeCloseTo((600 - STAGE.height * 0.5) / 2);
  });
});
