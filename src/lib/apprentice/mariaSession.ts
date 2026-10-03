// Maria's laptop session, written by hand so teach mode works on its own.
// (Ticket 13 replaces it with a session recorded from a real run.)
import type { Lessons } from "./types";

const card = (c: Omit<Lessons["cards"][number], "requestId" | "previousChoices" | "id"> & { previousChoices?: string[] }) => ({
  id: `req-laptops:${c.stepId}`,
  requestId: "req-laptops",
  previousChoices: [],
  ...c,
});

export const MARIA_SESSION: Lessons = {
  expert: "Maria",
  requestSubject: "40 laptops for the new Marketing hires",
  cards: [
    card({
      stepId: "quotes",
      title: "Get quotes",
      procedureRef: "§2",
      options: [
        { id: "three_quotes", label: "Request 3 or more quotes", status: "procedure" },
        { id: "fewer_quotes", label: "Request fewer than 3 quotes", status: "against" },
      ],
      chosen: "three_quotes",
      prediction: { optionId: "three_quotes", correct: true },
      reason: {
        source: "ari",
        text: "The procedure asks for at least 3 quotes on anything over $5,000.",
        types: ["Company policy"],
        evidence: ["follows procedure §2", "Ari predicted it"],
        confidence: 0.92,
        confirmed: true,
      },
      howNotes: [],
      at: 1,
    }),
    card({
      stepId: "vendor",
      title: "Pick a vendor",
      procedureRef: "§3",
      options: [
        { id: "apex", label: "Apex Tech (Vendor A) · $36,800", status: "allowed" },
        { id: "brightline", label: "Brightline Systems (Vendor B) · $38,400", status: "allowed" },
        { id: "coreparts", label: "CoreParts (Vendor C) · $39,920", status: "allowed" },
      ],
      chosen: "brightline",
      prediction: { optionId: "apex", correct: false },
      question: "Why Brightline Systems over the cheaper Apex Tech?",
      reason: {
        source: "expert",
        text: "Apex shipped late twice last year, and Friday was a hard deadline.",
        types: ["Lesson learned", "Time or deadline"],
        evidence: [],
      },
      howNotes: ["Paused 14s before choosing", "Opened Apex Tech's delivery history before deciding"],
      at: 2,
    }),
    card({
      stepId: "scoring",
      title: "Score the vendors",
      options: [{ id: "score", label: "Score vendors in the shared sheet", status: "allowed" }],
      chosen: "score",
      question: "Where does that number come from?",
      reason: {
        source: "expert",
        text: "40% price, 60% delivery record. It's Finance's formula, nobody wrote it down.",
        types: ["Company-specific method"],
        evidence: [],
      },
      knowledge: [{ text: "Vendor score = 40% price + 60% delivery record (Finance's formula)", source: "Told by a person" }],
      howNotes: [],
      at: 2.5,
    }),
    card({
      stepId: "approval",
      title: "Approve $38,400",
      procedureRef: "§4",
      options: [
        { id: "self", label: "Approve myself", status: "procedure" },
        { id: "manager", label: "Send to my manager", status: "allowed" },
        { id: "cfo", label: "Send to the CFO", status: "allowed" },
      ],
      chosen: "cfo",
      prediction: { optionId: "self", correct: false },
      question: "The procedure doesn't require that for $38,400. Why send it to the CFO?",
      reason: {
        source: "expert",
        text: "New suppliers over $25k always go to the CFO first. It's not written down anywhere.",
        types: ["Team convention"],
        evidence: [],
      },
      howNotes: ['Emailed David Okafor (CFO): "Please approve the Brightline laptop order"'],
      at: 3,
    }),
    card({
      stepId: "po",
      title: "Issue the purchase order",
      procedureRef: "§5",
      options: [{ id: "issue", label: "Issue the PO after approval", status: "procedure" }],
      chosen: "issue",
      prediction: { optionId: "issue", correct: true },
      reason: {
        source: "ari",
        text: "She tells the requester herself as soon as the PO goes out. That's her own habit.",
        types: ["Personal preference"],
        evidence: ["messaged Tom Reyes right after"],
        confidence: 0.74,
      },
      howNotes: ['Messaged Tom Reyes (Marketing Lead): "PO is out, laptops arrive Thursday"'],
      at: 4,
    }),
  ],
  guardrails: [
    {
      id: "new-supplier-cfo",
      text: "New suppliers over $25k go to the CFO first.",
      warning: "Wait. New suppliers over $25k go to the CFO first. That's Maria's rule.",
      step: "approval",
      requiredOption: "cfo",
      minAmount: 25_000,
      onlyNewSuppliers: true,
      unwritten: true,
    },
  ],
};
