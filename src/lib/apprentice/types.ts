import type { TimedEvent, WorkspaceEvent } from "@/lib/workspace/events";
import type { Profile } from "@/lib/workspace/profile";

export type Mode = "expert" | "newcomer";

// How an option relates to the written procedure.
//  procedure: what the procedure says to do
//  allowed:   fine, but the procedure doesn't ask for it
//  against:   breaks the written procedure
export type OptionStatus = "procedure" | "allowed" | "against";

export type StepOption = { id: string; label: string; status: OptionStatus };

export type StepId = "quotes" | "vendor" | "scoring" | "approval" | "po";

export type DecisionCard = {
  id: string; // `${requestId}:${stepId}`
  requestId: string;
  stepId: StepId;
  title: string;
  procedureRef?: string;
  options: StepOption[];
  chosen: string;
  previousChoices: string[];
  prediction?: { optionId: string; correct: boolean };
  at: number;
};

export type JudgeCall = {
  kind: "predict";
  requestId: string;
  stepId: StepId;
  options: StepOption[];
  context: JudgeContext;
};

export type JudgeContext = {
  profile: Profile | null;
  request: { id: string; subject: string; body: string; budget: number; due: string };
  cards: DecisionCard[];
};

export type JudgeResult = { kind: "predict"; optionId: string };

export type CoreInput =
  | { kind: "session_start"; profile: Profile; mode: Mode }
  | { kind: "workspace_event"; event: WorkspaceEvent; at: number }
  | { kind: "judge_result"; requestId: string; result: JudgeResult };

export type CoreEffect =
  | { kind: "upsert_card"; card: DecisionCard }
  | { kind: "judge_request"; requestId: string; call: JudgeCall };

export type CoreState = {
  profile: Profile | null;
  mode: Mode;
  events: TimedEvent[];
  cards: Record<string, DecisionCard>;
  cardOrder: string[];
  predictions: Record<string, string>; // card id → predicted option id
  pending: Record<string, { cardId: string }>; // judge request id → purpose
  nextRequestId: number;
};
