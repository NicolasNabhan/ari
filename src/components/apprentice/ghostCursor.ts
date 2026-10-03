"use client";

import type { CursorAction } from "@/lib/apprentice/types";

// Ari's own cursor for "show me": glides to each element, then points or clicks.
const STEP_MS = 900;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function cursorEl(): HTMLDivElement {
  let el = document.getElementById("ari-cursor") as HTMLDivElement | null;
  if (el) return el;
  el = document.createElement("div");
  el.id = "ari-cursor";
  el.setAttribute("aria-hidden", "true");
  el.style.cssText =
    "position:fixed;z-index:60;left:50%;top:50%;pointer-events:none;transition:left .7s ease,top .7s ease,transform .15s;display:flex;align-items:flex-start;gap:4px";
  el.innerHTML =
    '<svg width="22" height="22" viewBox="0 0 24 24"><path d="M3 2l7 19 2.5-8L21 10z" fill="#4f46e5" stroke="white" stroke-width="1.5"/></svg>' +
    '<span style="background:#4f46e5;color:white;font:600 11px system-ui;padding:1px 6px;border-radius:9999px;margin-top:14px">Ari</span>';
  document.body.appendChild(el);
  return el;
}

export async function driveCursor(actions: CursorAction[]) {
  const cursor = cursorEl();
  cursor.style.display = "flex";
  for (const { target, action } of actions) {
    // Clicks re-render the page, so look the element up each time.
    await wait(150);
    const el = document.querySelector<HTMLElement>(`[data-ari="${target}"]`);
    if (!el) continue;
    el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    const box = el.getBoundingClientRect();
    cursor.style.left = `${box.left + box.width / 2}px`;
    cursor.style.top = `${box.top + box.height / 2}px`;
    await wait(STEP_MS);
    if (action === "click") {
      cursor.style.transform = "scale(.8)";
      el.click();
      await wait(150);
      cursor.style.transform = "";
    } else {
      el.animate([{ outline: "3px solid #4f46e5" }, { outline: "3px solid transparent" }], { duration: 900 });
    }
  }
  await wait(600);
  cursor.style.display = "none"; // control goes back to the person
}
