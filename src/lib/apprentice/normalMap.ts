// The "normal map": the steps of a purchase and the common options at each,
// marked against Northwind's written procedure.
import { northwind, quoteFor, vendor } from "@/lib/northwind/seed";
import type { TimedEvent, WorkspaceEvent } from "@/lib/workspace/events";
import type { StepId, StepOption } from "./types";

const QUOTES_THRESHOLD = 5_000; // §2
const SELF_APPROVAL_LIMIT = 50_000; // §4

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

export type Step = { requestId: string; stepId: StepId; title: string; procedureRef?: string; options: StepOption[] };

export function request(requestId: string) {
  return northwind.requests.find((r) => r.id === requestId);
}

export function quotesStep(requestId: string): Step {
  const needsThree = (request(requestId)?.budget ?? 0) > QUOTES_THRESHOLD;
  return {
    requestId,
    stepId: "quotes",
    title: "Get quotes",
    procedureRef: "§2",
    options: [
      { id: "three_quotes", label: "Request 3 or more quotes", status: needsThree ? "procedure" : "allowed" },
      { id: "fewer_quotes", label: "Request fewer than 3 quotes", status: needsThree ? "against" : "allowed" },
    ],
  };
}

export function vendorStep(requestId: string, vendorIds: string[]): Step {
  return {
    requestId,
    stepId: "vendor",
    title: "Pick a vendor",
    procedureRef: "§3",
    options: vendorIds.map((id) => ({
      id,
      label: `${vendor(id)?.name} (${vendor(id)?.label}) · ${usd(quoteFor(id, requestId)?.total ?? 0)}`,
      status: "allowed",
    })),
  };
}

export function approvalStep(requestId: string, amount: number): Step {
  const needsCfo = amount > SELF_APPROVAL_LIMIT;
  return {
    requestId,
    stepId: "approval",
    title: `Approve ${usd(amount)}`,
    procedureRef: "§4",
    options: [
      { id: "self", label: "Approve myself", status: needsCfo ? "against" : "procedure" },
      { id: "manager", label: "Send to my manager", status: needsCfo ? "against" : "allowed" },
      { id: "cfo", label: "Send to the CFO", status: needsCfo ? "procedure" : "allowed" },
    ],
  };
}

export function scoringStep(requestId: string): Step {
  return {
    requestId,
    stepId: "scoring",
    title: "Score the vendors",
    options: [{ id: "score", label: "Score vendors in the shared sheet", status: "allowed" }],
  };
}

export function poStep(requestId: string): Step {
  return {
    requestId,
    stepId: "po",
    title: "Issue the purchase order",
    procedureRef: "§5",
    options: [{ id: "issue", label: "Issue the PO after approval", status: "procedure" }],
  };
}

function quotedVendors(requestId: string, history: TimedEvent[]): string[] {
  for (let i = history.length - 1; i >= 0; i--) {
    const e = history[i].event;
    if (e.type === "quotes_requested" && e.requestId === requestId) return e.vendorIds;
  }
  return [];
}

// Which step (and which option) an event is a choice in, if any.
export function choiceFor(event: WorkspaceEvent, history: TimedEvent[]): { step: Step; chosen: string } | null {
  switch (event.type) {
    case "quotes_requested":
      return { step: quotesStep(event.requestId), chosen: event.vendorIds.length >= 3 ? "three_quotes" : "fewer_quotes" };
    case "vendor_selected":
      return { step: vendorStep(event.requestId, quotedVendors(event.requestId, history)), chosen: event.vendorId };
    case "approval_routed":
      return { step: approvalStep(event.requestId, event.amount), chosen: event.to };
    case "po_issued":
      return { step: poStep(event.requestId), chosen: "issue" };
    case "score_entered":
      return { step: scoringStep(event.requestId), chosen: "score" };
    default:
      return null;
  }
}

// After this event, which step comes next (so Ari can guess the expert's move).
export function nextStepAfter(event: WorkspaceEvent, history: TimedEvent[]): Step | null {
  switch (event.type) {
    case "request_opened":
      return quotesStep(event.requestId);
    case "quotes_requested":
      return vendorStep(event.requestId, event.vendorIds);
    case "vendor_selected": {
      const amount = quoteFor(event.vendorId, event.requestId)?.total;
      return amount === undefined ? null : approvalStep(event.requestId, amount);
    }
    case "approval_routed":
      return poStep(event.requestId);
    default:
      void history;
      return null;
  }
}
