// "What Ari learned": one line per decision, with its level and whether it's
// a rule nobody wrote down.
import { levelOf, type Level } from "@/lib/apprentice/reasonTypes";
import { isUnwritten } from "@/lib/apprentice/teach";
import type { DecisionCard } from "@/lib/apprentice/types";

export type Learned = { id: string; title: string; chosen: string; reason: string | null; fromMaria: boolean; level: Level; unwritten: boolean };

export function learnedFrom(cards: DecisionCard[]): Learned[] {
  return cards.map((c) => ({
    id: c.id,
    title: c.title,
    chosen: c.options.find((o) => o.id === c.chosen)?.label ?? "",
    reason: c.reason?.text ?? null,
    fromMaria: c.reason?.source === "expert",
    level: c.reason ? levelOf(c.reason.types) : "unknown",
    unwritten: isUnwritten(c),
  }));
}
