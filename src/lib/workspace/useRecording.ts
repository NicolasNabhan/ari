"use client";

import { useEffect, useRef } from "react";

// Records the whole workspace with rrweb (clicks, typing, scrolls with
// timestamps) so a session can be replayed and timed later.
export function useRecording(active: boolean) {
  const events = useRef<unknown[]>([]);
  useEffect(() => {
    if (!active) return;
    let stop: (() => void) | undefined;
    let cancelled = false;
    import("@rrweb/record").then(({ record }) => {
      if (cancelled) return;
      stop = record({ emit: (e) => void events.current.push(e) }) ?? undefined;
      // Handy for checking the recording from the browser console.
      (window as unknown as { ariRecording: unknown[] }).ariRecording = events.current;
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [active]);
  return events;
}
