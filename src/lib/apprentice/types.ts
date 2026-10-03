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
  knowledge?: KnowledgeItem[];
  question?: string; // what Ari asked, if it asked
  howNotes: string[];
  at: number; // time of the first choice
};

export type KnowledgeSource = "Online or public" | "Company document" | "Company system" | "Told by a person" | "Already a given";

// Something the work depends on, and where the next person can find it.
export type KnowledgeItem = { text: string; source: KnowledgeSource };

export type Reason = {
  source: "expert" | "ari"; // 🗣 Maria said it / 🤖 Ari's own explanation
  text: string;
  types: string[];
  evidence: string[];
  confidence?: number; // only for Ari's own explanations
  confirmed?: boolean; // the expert confirmed Ari's own explanation
};

// A must-follow rule Ari can check before the newcomer acts.
export type Guardrail = {
  id: string;
  text: string; // the rule, in plain words
  warning: string; // what Ari says when someone is about to break it
  step: StepId;
  requiredOption: string;
  minAmount: number; // applies to purchases over this amount
  onlyNewSuppliers: boolean; // …from suppliers who've never had an order this big
  unwritten: boolean;
};

// Everything Ari learned from one expert session, ready to teach.
export type Lessons = {
  expert: string;
  requestSubject: string;
  cards: DecisionCard[];
  guardrails: Guardrail[];
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
  // followUp: one gentle question when the answer is vague in a way that matters
  | { kind: "classify"; types: string[]; summary: string; followUp?: string; knowledge?: KnowledgeItem[] };

export type TodayTask = { text: string; requestId: string | null };

export type CoreInput =
  | { kind: "session_start"; profile: Profile; mode: Mode; lessons?: Lessons }
  // Something the person is about to do; Ari may warn before it happens.
  | { kind: "workspace_intent"; event: WorkspaceEvent }
  | { kind: "set_tap_to_hear"; on: boolean }
  | { kind: "tap_to_hear" } // the expert tapped "I have a question" 
  | { kind: "workspace_event"; event: WorkspaceEvent; at: number }
  | { kind: "utterance"; speaker: "expert" | "newcomer"; text: string; lang: string; at: number }
  | { kind: "judge_result"; requestId: string; result: JudgeResult };

export type CoreEffect =
  | { kind: "upsert_card"; card: DecisionCard }
  | { kind: "judge_request"; requestId: string; call: JudgeCall }
  | { kind: "ask"; text: string; cardId: string | null } // null: the "what are you working on?" question
  | { kind: "avatar"; state: "bubble" | "forward" | "tutor" }
  | { kind: "task_set"; task: TodayTask }
  | { kind: "signal_pending_question" } // tap-to-hear: show the signal, don't speak yet
  | { kind: "teach_explain"; text: string; highlight?: string; stepId?: StepId }
  | { kind: "warn_guardrail"; text: string; ruleId: string };

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
  lessons: Lessons | null;
  taught: StepId[]; // steps already explained to the newcomer
  warned: string[]; // intents already warned about (a second try goes through)
  busy: string[]; // why the expert is busy right now ("typing", "call")
  tapToHear: boolean;
  pendingTap: { cardId: string | null; text: string } | null;
  followedUp: string[]; // cards Ari already asked one follow-up about
  nextRequestId: number;
};
