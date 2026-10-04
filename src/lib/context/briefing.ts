// What Ari tells the new employee when they first open the schedule: the
// fixed points of the week, the breaks, and a pattern only visible across
// the whole week. Built from the expert's week (Maria's sample week here).
import { detectPatterns } from "./patterns";
import { MARIA_OBSERVATIONS, MARIA_SCHEDULE, MARIA_SOURCES } from "./mariaWeek";

export function scheduleBriefing(expert: string): string {
  const patterns = detectPatterns({ schedule: MARIA_SCHEDULE, observations: MARIA_OBSERVATIONS, sources: MARIA_SOURCES });
  const fixed = patterns.filter((p) => p.kind === "recurring-slot" && p.level === "must").slice(0, 3);
  const breaks = patterns.find((p) => p.kind === "by-weekday" && /break/i.test(p.summary));
  const trend = patterns.find((p) => p.kind === "trend");
  return [
    `This is your week, built from how ${expert} worked.`,
    fixed.length ? `The fixed points: ${fixed.map((p) => p.summary).join("; ")}.` : "",
    breaks ? `Breaks are part of the job too: ${breaks.summary}.` : "",
    trend ? `And something you'd only see across the whole week: ${trend.summary}. ${trend.advice ?? ""}` : "",
    "Now let's do your first purchase. Open your Inbox.",
  ]
    .filter(Boolean)
    .join(" ");
}
