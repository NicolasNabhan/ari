"use client";

import { driver, type Driver } from "driver.js";
import "driver.js/dist/driver.css";

// Points at the next button or field in teach mode.
let active: Driver | null = null;

export function highlight(dataAri: string) {
  clearHighlight();
  active = driver({ allowClose: true, overlayOpacity: 0.35, stagePadding: 6, popoverClass: "ari-highlight" });
  active.highlight({
    element: `[data-ari="${dataAri}"]`,
    popover: { title: "Ari", description: "Next step is here." },
  });
}

export function clearHighlight() {
  active?.destroy();
  active = null;
}
