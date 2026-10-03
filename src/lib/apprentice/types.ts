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
  reason?: Reason;
  question?: string; // what Ari asked, if it asked
  howNotes: string[];
  at: number; // time of the first choice
};

export type Reason = {
  source: "expert" | "ari"; // 🗣 Maria said it / 🤖 Ari's own explanation
  text: string;
  types: string[];
  evidence: string[];
  confidence?: number; // only for Ari's own explanations
};

export type JudgeCall =
  | { kind: "predict"; requestId: string; stepId: StepId; options: StepOption[]; context: JudgeContext }
  // Can Ari explain this choice itself, and would the reason matter to the next person?
  | { kind: "assess"; card: DecisionCard; context: JudgeContext }
  // Sort the expert's spoken answer into reason types.
  | { kind: "classify"; card: DecisionCard; answer: string; context: JudgeContext };

export type JudgeContext = {
  profile: Profile | null;
  request: { id: string; subject: string; body: string; budget: number; due: string };
  cards: DecisionCard[];
  task: TodayTask | null;
};

export type JudgeResult =
  | { kind: "predict"; optionId: string }
  | {
      kind: "assess";
      explanation: string;
      evidence: string[];
      confidence: number; // 0–1
      matters: boolean;
      question: string; // what to ask if Ari doesn't understand
      types: string[];
    }
  | { kind: "classify"; types: string[]; summary: string };

export type TodayTask = { text: string; requestId: string | null };

export type CoreInput =
  | { kind: "session_start"; profile: Profile; mode: Mode }
  | { kind: "workspace_event"; event: WorkspaceEvent; at: number }
  | { kind: "utterance"; speaker: "expert" | "newcomer"; text: string; lang: string; at: number }
  | { kind: "judge_result"; requestId: string; result: JudgeResult };

export type CoreEffect =
  | { kind: "upsert_card"; card: DecisionCard }
  | { kind: "judge_request"; requestId: string; call: JudgeCall }
  | { kind: "ask"; text: string; cardId: string | null } // null: the "what are you working on?" question
  | { kind: "avatar"; state: "bubble" | "forward" | "tutor" }
  | { kind: "task_set"; task: TodayTask };

export type CoreState = {
  profile: Profile | null;
  mode: Mode;
  events: TimedEvent[];
  cards: Record<string, DecisionCard>;
  cardOrder: string[];
  predictions: Record<string, string>; // card id → predicted option id
  pending: Record<string, { cardId: string; call: JudgeCall["kind"] }>; // judge request id → purpose
  task: TodayTask | null;
  openQuestion: { cardId: string | null; text: string } | null;
  questionQueue: { cardId: string; text: string }[];
  nextRequestId: number;
};
