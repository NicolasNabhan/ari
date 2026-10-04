// The Claude-backed Judge (server only). Every call returns typed JSON via
// structured outputs; the browser falls back to the rule Judge if this fails.
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { northwind } from "@/lib/northwind/seed";
import { describeAttention } from "@/lib/gaze/attention";
import { REASON_TYPE_NAMES } from "./reasonTypes";
import type { DecisionCard, JudgeCall, JudgeContext, JudgeResult } from "./types";

const MODEL = "claude-opus-5-5";
const client = new Anthropic();

const SYSTEM = `You are the judgment behind Ari, an AI apprentice that sits beside an expert at ${northwind.company.name} and learns how they do their job so it can teach the next person.
Ari only interrupts the expert when it genuinely cannot explain a choice AND the reason would change how someone else should do the job.
Latency-sensitive; begin your answer immediately and keep every string short.

The company's written procurement procedure:
${northwind.procedure.map((r) => `${r.id} ${r.title}: ${r.text}`).join("\n")}

Vendors (quotes and delivery history):
${northwind.vendors
  .map(
    (v) =>
      `- ${v.name} (${v.label}): ${v.blurb} Quotes: ${v.quotes.map((q) => `${q.requestId} $${q.total} (${q.leadTimeDays} days)`).join(", ") || "none"}. Orders: ${
        v.deliveryHistory.map((d) => `${d.order} $${d.amount} promised ${d.promised} delivered ${d.delivered}`).join("; ") || "none yet"
      }`,
  )
  .join("\n")}`;

function describe(card: DecisionCard) {
  const chosen = card.options.find((o) => o.id === card.chosen);
  return `Step "${card.title}"${card.procedureRef ? ` (procedure ${card.procedureRef})` : ""}. Options: ${card.options
    .map((o) => `${o.id} = ${o.label} [${o.status}]`)
    .join("; ")}. The expert chose: ${chosen?.label ?? card.chosen}.${card.previousChoices.length ? ` They first picked ${card.previousChoices.join(", then ")}.` : ""}${
    card.prediction ? ` Ari had predicted "${card.prediction.optionId}" (${card.prediction.correct ? "correct" : "wrong"}).` : ""
  }${card.howNotes.length ? ` Observed: ${card.howNotes.join("; ")}.` : ""}${card.attention?.length ? ` Eye tracking, before deciding: ${describeAttention(card.attention, 4)}.` : ""}`;
}

function situation(ctx: JudgeContext) {
  return `Expert: ${ctx.profile?.name ?? "unknown"}, ${ctx.profile?.role ?? ""}.
Today's task (their words): ${ctx.task?.text ?? "not given"}.
Request: ${ctx.request.subject}. "${ctx.request.body}" Budget $${ctx.request.budget}, due ${ctx.request.due}.
Decisions so far:
${ctx.cards.map((c) => `- ${describe(c)}${c.reason ? ` Reason (${c.reason.source}): ${c.reason.text}` : ""}`).join("\n") || "- none"}${
    ctx.attention?.length ? `\nWhat the expert just read (webcam eye tracking, dwell time per thing on screen): ${describeAttention(ctx.attention, 5)}.` : ""
  }`;
}

const Predict = z.object({ optionId: z.string() });
const Assess = z.object({
  explanation: z.string().describe("Ari's own explanation of why the expert chose this, or empty if it can't tell"),
  evidence: z.array(z.string()).describe("Specific things the explanation rests on: something the expert said, a request detail, a procedure section, a correct prediction. Short phrases."),
  confidence: z.number().describe("0 to 1: how sure Ari is that the explanation is the real reason"),
  matters: z.boolean().describe("Would knowing the real reason change how the next person should do this job?"),
  question: z.string().describe("If Ari should ask: one short spoken question, under 15 words, naming the alternative. Otherwise empty."),
  types: z.array(z.enum(REASON_TYPE_NAMES as [string, ...string[]])),
});
const SOURCES = ["Online or public", "Company document", "Company system", "Told by a person", "Already a given"] as const;
const Classify = z.object({
  types: z.array(z.enum(REASON_TYPE_NAMES as [string, ...string[]])).describe("One or more reason types that fit the answer"),
  summary: z.string().describe("The reason in one short sentence, in the expert's words where possible"),
  followUp: z
    .string()
    .describe("Only if the answer is vague in a way that matters to the next person (e.g. could be experience or taste): one gentle question under 15 words. Otherwise empty."),
  knowledge: z
    .array(z.object({ text: z.string(), source: z.enum(SOURCES) }))
    .describe("Knowledge the work depends on that this answer reveals (formulas, data sources, know-how), and where the next person can find it. Empty if none."),
});

async function ask<T extends z.ZodType>(schema: T, prompt: string): Promise<z.infer<T>> {
  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: betaZodOutputFormat(schema) },
    system: SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });
  if (response.stop_reason === "refusal" || !response.parsed_output) throw new Error(`Judge gave no answer (${response.stop_reason})`);
  return response.parsed_output as z.infer<T>;
}

export async function claudeJudge(call: JudgeCall): Promise<JudgeResult> {
  switch (call.kind) {
    case "predict": {
      const r = await ask(
        Predict,
        `${situation(call.context)}\n\nThe expert is about to do the step "${call.stepId}". Options: ${call.options
          .map((o) => `${o.id} = ${o.label} [${o.status}]`)
          .join("; ")}.\nPredict which option id they will pick, judging only from what an informed newcomer would know.`,
      );
      return { kind: "predict", optionId: call.options.some((o) => o.id === r.optionId) ? r.optionId : call.options[0].id };
    }
    case "assess": {
      const r = await ask(
        Assess,
        `${situation(call.context)}\n\nNew decision: ${describe(call.card)}\nCan Ari explain this choice itself from what it knows? Only claim high confidence if the evidence really explains it. A choice can be usual and still unexplained (e.g. picking between two equally fine options). If the decision is a number the expert typed (like a vendor score), the question is where that number comes from and what knowledge produces it. If eye tracking shows what they read before deciding, use it as evidence (with the dwell time) and make the question specific to it, e.g. "You spent a while on Apex's late deliveries: is that why you picked Brightline?"`,
      );
      return { kind: "assess", ...r, confidence: Math.max(0, Math.min(1, r.confidence)) };
    }
    case "classify": {
      const r = await ask(
        Classify,
        `${situation(call.context)}\n\nAri asked about: ${describe(call.card)}\nThe expert answered: "${call.answer}"\nSort the answer into reason types.`,
      );
      return { kind: "classify", types: r.types, summary: r.summary, followUp: r.followUp || undefined, knowledge: r.knowledge.length ? r.knowledge : undefined };
    }
  }
}
