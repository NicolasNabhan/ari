"use client";

import { useEventLog } from "@/lib/workspace/WorkspaceContext";

export function EventLog() {
  const log = useEventLog();
  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Event log (debug)</h2>
      {log.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-400">No events yet.</p>
      ) : (
        <ol data-ari="event-log" className="mt-2 space-y-1 font-mono text-xs">
          {log.map(({ event, at }, i) => {
            const { type, ...rest } = event;
            return (
              <li key={i} className="rounded bg-zinc-100 px-2 py-1 dark:bg-zinc-800">
                <span className="text-zinc-400">{new Date(at).toLocaleTimeString()}</span> <span className="font-semibold">{type}</span>{" "}
                {Object.keys(rest).length > 0 && <span className="text-zinc-500">{JSON.stringify(rest)}</span>}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
