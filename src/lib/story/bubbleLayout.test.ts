import { describe, expect, it } from "vitest";
import { estimateBubbleSize, layoutBubble } from "./bubbleLayout";

const size = { width: 300, height: 100 };

describe("layoutBubble", () => {
  it("sits above and to the right of the head by default, tail pointing at the head", () => {
    const l = layoutBubble({ anchor: { x: 400, y: 500 }, size });
    expect(l.side).toBe("right");
    expect(l.below).toBe(false);
    expect(l.left).toBeGreaterThan(400);
    expect(l.top + size.height).toBeLessThan(500);
    // Tail leaves the bottom edge and ends just short of the head.
    expect(l.tailBase.y).toBe(l.top + size.height);
    expect(Math.hypot(l.tailTip.x - 400, l.tailTip.y - 500)).toBeCloseTo(12, 5);
  });

  it("flips to the left near the right edge of the stage", () => {
    const l = layoutBubble({ anchor: { x: 1300, y: 500 }, size });
    expect(l.side).toBe("left");
    expect(l.left + size.width).toBeLessThan(1300);
  });

  it("goes below the head when there is no room above", () => {
    const l = layoutBubble({ anchor: { x: 400, y: 80 }, size });
    expect(l.below).toBe(true);
    expect(l.top).toBeGreaterThan(80);
    expect(l.tailBase.y).toBe(l.top);
  });

  it("honours a preferred side when it fits, and overrides it when it doesn't", () => {
    expect(layoutBubble({ anchor: { x: 700, y: 500 }, size, prefer: "left" }).side).toBe("left");
    expect(layoutBubble({ anchor: { x: 100, y: 500 }, size, prefer: "left" }).side).toBe("right");
  });

  it("always stays on the stage", () => {
    for (const anchor of [
      { x: 0, y: 0 },
      { x: 1440, y: 900 },
      { x: 720, y: 450 },
      { x: 5, y: 895 },
    ]) {
      const l = layoutBubble({ anchor, size });
      expect(l.left).toBeGreaterThanOrEqual(16);
      expect(l.left + size.width).toBeLessThanOrEqual(1440 - 16);
      expect(l.top).toBeGreaterThanOrEqual(16);
      expect(l.top + size.height).toBeLessThanOrEqual(900 - 16);
    }
  });

  it("keeps the tail base on the bubble, away from its rounded corners", () => {
    const l = layoutBubble({ anchor: { x: 400, y: 500 }, size });
    expect(l.tailBase.x).toBeGreaterThanOrEqual(l.left + 20);
    expect(l.tailBase.x).toBeLessThanOrEqual(l.left + size.width - 20);
  });
});

describe("estimateBubbleSize", () => {
  it("grows with the text up to the max width, then wraps", () => {
    const short = estimateBubbleSize("Hi!");
    const long = estimateBubbleSize("This is a much longer line that will certainly need to wrap onto several lines in the bubble.");
    expect(short.width).toBeLessThan(long.width);
    expect(long.width).toBe(360);
    expect(long.height).toBeGreaterThan(short.height);
  });
});
