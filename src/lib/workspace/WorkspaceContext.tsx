"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createEventBus, type EventBus, type TimedEvent } from "./events";

const BusContext = createContext<EventBus | null>(null);

export function EventBusProvider({ children }: React.PropsWithChildren) {
  const [bus] = useState(() => createEventBus());
  return <BusContext.Provider value={bus}>{children}</BusContext.Provider>;
}

export function useEventBus(): EventBus {
  const bus = useContext(BusContext);
  if (!bus) throw new Error("useEventBus must be used inside EventBusProvider");
  return bus;
}

export function useEventLog(): TimedEvent[] {
  const bus = useEventBus();
  const [log, setLog] = useState<TimedEvent[]>(() => bus.history());
  useEffect(() => bus.subscribe((e) => setLog((l) => [...l, e])), [bus]);
  return log;
}
