// Everything the expert does in the workspace becomes one of these events.
// The workspace only emits them; it knows nothing about Ari.

export type WorkspaceEvent =
  | { type: "profile_saved"; name: string; role: string; company: string }
  | { type: "screen_opened"; screen: Screen }
  | { type: "request_opened"; requestId: string }
  | { type: "delivery_history_opened"; vendorId: string }
  | { type: "quotes_requested"; requestId: string; vendorIds: string[] }
  | { type: "vendor_selected"; requestId: string; vendorId: string; previousVendorId: string | null };

export type Screen = "inbox" | "requests" | "vendors";

export type TimedEvent = { event: WorkspaceEvent; at: number };

export type EventBus = {
  emit: (event: WorkspaceEvent) => void;
  history: () => TimedEvent[];
  subscribe: (listener: (e: TimedEvent) => void) => () => void;
};

export function createEventBus(now: () => number = Date.now): EventBus {
  const listeners = new Set<(e: TimedEvent) => void>();
  const past: TimedEvent[] = [];
  return {
    history: () => [...past],
    emit(event) {
      const timed = { event, at: now() };
      past.push(timed);
      listeners.forEach((l) => l(timed));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
