// Where a speech bubble goes on the stage: beside and above the speaker's
// head, flipped to the other side (or below) when it would leave the stage,
// with a tail running from the bubble's edge to the head. Pure, so it can be
// tested; all numbers are stage pixels.
import { STAGE } from "./stage";

export type Point = { x: number; y: number };
export type Size = { width: number; height: number };
export type BubbleSide = "left" | "right";

export type BubbleLayout = {
  left: number;
  top: number;
  side: BubbleSide; // which side of the head the bubble sits on
  below: boolean; // under the head (no room above)
  tailBase: Point; // on the bubble's edge
  tailTip: Point; // just short of the head
};

export const BUBBLE_MAX_WIDTH = 360;

// A rough size before the bubble has been measured.
export function estimateBubbleSize(text: string, maxWidth = BUBBLE_MAX_WIDTH): Size {
  const charsPerLine = Math.floor((maxWidth - 36) / 8.6);
  const width = Math.min(maxWidth, Math.max(120, text.length * 8.6 + 36));
  const lines = Math.max(1, Math.ceil(text.length / charsPerLine));
  return { width, height: 34 + lines * 24 };
}

export function layoutBubble(opts: {
  anchor: Point;
  size: Size;
  stage?: Size;
  prefer?: BubbleSide | "auto";
  offsetX?: number; // horizontal distance from the head to the bubble's near edge
  gapY?: number; // vertical distance from the head to the bubble
  margin?: number; // keep this far from the stage edges
  tipGap?: number; // the tail stops this short of the head
}): BubbleLayout {
  const { anchor, size } = opts;
  const stage = opts.stage ?? STAGE;
  const offsetX = opts.offsetX ?? 28;
  const gapY = opts.gapY ?? 44;
  const margin = opts.margin ?? 16;
  const tipGap = opts.tipGap ?? 12;

  const fitsRight = anchor.x + offsetX + size.width <= stage.width - margin;
  const fitsLeft = anchor.x - offsetX - size.width >= margin;
  let side: BubbleSide;
  if (opts.prefer === "left") side = fitsLeft || !fitsRight ? "left" : "right";
  else if (opts.prefer === "right") side = fitsRight || !fitsLeft ? "right" : "left";
  else side = fitsRight || !fitsLeft ? "right" : "left";

  let left = side === "right" ? anchor.x + offsetX : anchor.x - offsetX - size.width;
  left = clamp(left, margin, Math.max(margin, stage.width - margin - size.width));

  const below = anchor.y - gapY - size.height < margin;
  let top = below ? anchor.y + gapY : anchor.y - gapY - size.height;
  top = clamp(top, margin, Math.max(margin, stage.height - margin - size.height));

  // The tail leaves the edge facing the head, near the corner closest to it.
  const inset = Math.min(34, size.width / 2);
  const tailBase = {
    x: clamp(anchor.x, left + inset, left + size.width - inset),
    y: below ? top : top + size.height,
  };
  const dx = tailBase.x - anchor.x;
  const dy = tailBase.y - anchor.y;
  const dist = Math.hypot(dx, dy) || 1;
  const pull = Math.min(tipGap, dist / 2);
  const tailTip = { x: anchor.x + (dx / dist) * pull, y: anchor.y + (dy / dist) * pull };

  return { left, top, side, below, tailBase, tailTip };
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}
