import type { Audience } from "@/lib/workspace/profile";
import { CalendarDays } from "lucide-react";
import { PageTitle } from "./PageTitle";

// The expert's whole week: meetings, breaks, recurring tasks, and patterns
// only visible across days. Placeholder: being built.
export function WeekView({ audience }: { audience: Audience }) {
  return <PageTitle icon={CalendarDays} tone="sky" title="Week & schedule" subtitle={audience === "expert" ? "Your week" : "Maria's week"} />;
}
