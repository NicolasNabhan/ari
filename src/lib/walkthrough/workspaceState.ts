// What the workspace shows during the walkthrough, as plain data, and the
// actions Maria takes on it. Each action also gives the workspace events a
// real click would emit, so the Apprentice Core sees exactly what it sees live.
import { quoteFor } from "@/lib/northwind/seed";
import type { ApprovalRoute, Screen, WorkspaceEvent } from "@/lib/workspace/events";

export type WorkspaceView = {
  screen: Screen;
  openRequestId: string | null;
  ticked: string[]; // vendors ticked for quotes, not sent yet
  quoted: Record<string, string[]>;
  historyFor: string | null; // vendor whose delivery history is open
  selected: Record<string, string>;
  scoreDraft: Record<string, string>; // typed, not entered yet
  scores: Record<string, Record<string, number>>;
  routes: Record<string, ApprovalRoute>;
  issued: Record<string, boolean>;
};

export type WorkspaceAction =
  | { type: "open_request"; requestId: string }
  | { type: "go"; screen: Screen }
  | { type: "tick"; vendorId: string }
  | { type: "request_quotes"; requestId: string }
  | { type: "toggle_history"; vendorId: string }
  | { type: "select_vendor"; requestId: string; vendorId: string }
  | { type: "type_score"; vendorId: string; text: string }
  | { type: "enter_score"; requestId: string; vendorId: string }
  | { type: "route"; requestId: string; to: ApprovalRoute }
  | { type: "issue_po"; requestId: string };

export const emptyWorkspace = (): WorkspaceView => ({
  screen: "inbox",
  openRequestId: null,
  ticked: [],
  quoted: {},
  historyFor: null,
  selected: {},
  scoreDraft: {},
  scores: {},
  routes: {},
  issued: {},
});

export function applyAction(ws: WorkspaceView, a: WorkspaceAction): { ws: WorkspaceView; events: WorkspaceEvent[] } {
  const amount = (requestId: string) => quoteFor(ws.selected[requestId], requestId)?.total ?? 0;
  switch (a.type) {
    case "open_request":
      return { ws: { ...ws, openRequestId: a.requestId, screen: "requests" }, events: [{ type: "request_opened", requestId: a.requestId }] };
    case "go":
      return { ws: { ...ws, screen: a.screen }, events: [{ type: "screen_opened", screen: a.screen }] };
    case "tick":
      return { ws: { ...ws, ticked: ws.ticked.includes(a.vendorId) ? ws.ticked : [...ws.ticked, a.vendorId] }, events: [] };
    case "request_quotes":
      return {
        ws: { ...ws, quoted: { ...ws.quoted, [a.requestId]: ws.ticked } },
        events: [{ type: "quotes_requested", requestId: a.requestId, vendorIds: ws.ticked }],
      };
    case "toggle_history": {
      const opening = ws.historyFor !== a.vendorId;
      return {
        ws: { ...ws, historyFor: opening ? a.vendorId : null },
        events: opening ? [{ type: "delivery_history_opened", vendorId: a.vendorId }] : [],
      };
    }
    case "select_vendor": {
      const previousVendorId = ws.selected[a.requestId] ?? null;
      if (previousVendorId === a.vendorId) return { ws, events: [] };
      return {
        ws: { ...ws, selected: { ...ws.selected, [a.requestId]: a.vendorId } },
        events: [{ type: "vendor_selected", requestId: a.requestId, vendorId: a.vendorId, previousVendorId }],
      };
    }
    case "type_score":
      return { ws: { ...ws, scoreDraft: { ...ws.scoreDraft, [a.vendorId]: a.text } }, events: [] };
    case "enter_score": {
      const score = Number(ws.scoreDraft[a.vendorId]);
      return {
        ws: { ...ws, scores: { ...ws.scores, [a.requestId]: { ...ws.scores[a.requestId], [a.vendorId]: score } } },
        events: [{ type: "score_entered", requestId: a.requestId, vendorId: a.vendorId, score }],
      };
    }
    case "route":
      return {
        ws: { ...ws, routes: { ...ws.routes, [a.requestId]: a.to } },
        events: [{ type: "approval_routed", requestId: a.requestId, vendorId: ws.selected[a.requestId], amount: amount(a.requestId), to: a.to }],
      };
    case "issue_po":
      return {
        ws: { ...ws, issued: { ...ws.issued, [a.requestId]: true } },
        events: [{ type: "po_issued", requestId: a.requestId, vendorId: ws.selected[a.requestId], amount: amount(a.requestId) }],
      };
  }
}
