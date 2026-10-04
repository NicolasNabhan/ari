// What Ari tells the new employee when they first open the schedule: a short,
// general picture of the week, and the one pattern only visible across it.
// Built from the expert's week (Maria's sample week here).
import { detectPatterns } from "./patterns";
import { MARIA_OBSERVATIONS, MARIA_SCHEDULE, MARIA_SOURCES } from "./mariaWeek";

export function scheduleBriefing(expert: string): string {
  const patterns = detectPatterns({ schedule: MARIA_SCHEDULE, observations: MARIA_OBSERVATIONS, sources: MARIA_SOURCES });
  const trend = patterns.find((p) => p.kind === "trend");
  const action = trend?.advice?.split(":")[0].toLowerCase();
  return [
    `This is your week, built from how ${expert} worked: a stand-up every morning, a few fixed meetings, and short breaks in the afternoon.`,
    trend ? `One pattern worth knowing: ${trend.summary}${action ? `, so ${action}` : ""}.` : "",
    "Now let's go back to your Inbox for your first purchase.",
  ]
    .filter(Boolean)
    .join(" ");
}
