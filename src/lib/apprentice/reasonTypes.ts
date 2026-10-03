// The reason types Ari sorts answers into, and the level each one defaults to.
// Kept as data so new types can be added without touching code.
export type Level = "must" | "advice" | "choice" | "unknown";

export const REASON_TYPES: { name: string; group: string; level: Level }[] = [
  { name: "Legal and regulatory", group: "Rules from outside", level: "must" },
  { name: "Safety and security", group: "Rules from outside", level: "must" },
  { name: "Accessibility", group: "Rules from outside", level: "must" },
  { name: "Industry standard", group: "Rules from outside", level: "must" },
  { name: "Platform or tool limits", group: "Rules from outside", level: "must" },
  { name: "Company policy", group: "Rules from the organization", level: "must" },
  { name: "Client or requester request", group: "Rules from the organization", level: "must" },
  { name: "Brand guidelines", group: "Rules from the organization", level: "must" },
  { name: "Team convention", group: "Rules from the organization", level: "must" },
  { name: "Budget", group: "Practical constraints", level: "must" },
  { name: "Time or deadline", group: "Practical constraints", level: "must" },
  { name: "Resources", group: "Practical constraints", level: "must" },
  { name: "Compatibility", group: "Practical constraints", level: "must" },
  { name: "Lesson learned", group: "Experience and judgment", level: "advice" },
  { name: "Quality", group: "Experience and judgment", level: "advice" },
  { name: "Efficiency", group: "Experience and judgment", level: "advice" },
  { name: "Risk avoidance", group: "Experience and judgment", level: "advice" },
  { name: "Audience", group: "Experience and judgment", level: "advice" },
  { name: "Context-specific", group: "Experience and judgment", level: "advice" },
  { name: "Gut feel or intuition", group: "Experience and judgment", level: "advice" },
  { name: "Personal preference", group: "Personal", level: "choice" },
  { name: "Signature style", group: "Personal", level: "choice" },
  { name: "Habit", group: "Personal", level: "choice" },
  { name: "No clear reason yet", group: "Unknown", level: "unknown" },
];

export const REASON_TYPE_NAMES = REASON_TYPES.map((t) => t.name);
