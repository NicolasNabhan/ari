// Claude pulls the knowledge out of a meeting transcript, a file or an email
// (server only). Same client setup and structured-output style as the Judge.
// PDFs go in as a document block, and Claude returns their text as well.
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { northwind } from "@/lib/northwind/seed";
import { groundQuotes, knowledgeSourceFor } from "./knowledge";
import type { ContextSource, ExtractedKnowledge } from "./types";

const MODEL = "claude-opus-5-5";
const client = new Anthropic();

const SYSTEM = `You help Ari, an AI apprentice at ${northwind.company.name}, learn how a procurement manager does her job so it can teach the next person.
Often the context behind a decision only exists in a meeting or a file: a formula Finance asked for, an approval rule a manager said out loud, a vendor's track record, a supplier's discount pattern.
From the source you're given, pull out each fact or rule a newcomer would need to make the same decisions. Skip small talk, greetings and one-off logistics.

The decision steps of a purchase, as ids:
- quotes: asking vendors for quotes
- vendor: choosing a vendor
- scoring: scoring vendors in the shared sheet
- approval: routing the approval (self, manager, CFO)
- po: issuing the purchase order

The company's written procedure, so you can tell written rules from unwritten ones:
${northwind.procedure.map((r) => `${r.id} ${r.title}: ${r.text}`).join("\n")}`;

const Item = z.object({
  text: z.string().describe("The fact or rule in plain words, one sentence a newcomer can act on"),
  quote: z.string().describe("The exact words from the source it comes from, copied character for character (no speaker label)"),
  level: z.enum(["must", "advice", "choice", "none"]).describe("must = a rule to follow; advice = strong advice from experience; choice = personal preference; none = just a fact"),
  step: z.enum(["quotes", "vendor", "scoring", "approval", "po", "none"]).describe("The decision step it explains, or none"),
});
const FromText = z.object({ items: z.array(Item) });
const FromPdf = z.object({ text: z.string().describe("The document's full plain text, in reading order"), items: z.array(Item) });

type Out = { text: string; items: z.infer<typeof Item>[] };

async function ask(content: Anthropic.Beta.BetaContentBlockParam[], pdf: boolean): Promise<Out> {
  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium", format: betaZodOutputFormat(pdf ? FromPdf : FromText) },
    system: SYSTEM,
    messages: [{ role: "user", content }],
  });
  if (response.stop_reason === "refusal" || !response.parsed_output) throw new Error(`Extraction gave no answer (${response.stop_reason})`);
  return response.parsed_output as Out;
}

function toKnowledge(source: ContextSource, items: Out["items"]): ExtractedKnowledge[] {
  const out = items.map((k, i) => ({
    id: `${source.id}:c${i}`,
    sourceId: source.id,
    text: k.text,
    quote: k.quote || undefined,
    source: knowledgeSourceFor(source.kind),
    level: k.level === "none" ? undefined : k.level,
    step: k.step === "none" ? undefined : k.step,
  }));
  return groundQuotes(out, source.text);
}

const describeSource = (s: ContextSource) =>
  `${s.kind === "meeting" ? "Meeting transcript" : s.kind === "email" ? "Email" : "File"}: "${s.title}", ${s.day}${s.time ? ` ${s.time}` : ""}${s.from ? `, from ${s.from}` : ""}.`;

export async function claudeExtract(source: ContextSource): Promise<ExtractedKnowledge[]> {
  const r = await ask([{ type: "text", text: `${describeSource(source)}\n\n<source>\n${source.text}\n</source>\n\nExtract the knowledge.` }], false);
  return toKnowledge(source, r.items);
}

export async function claudeExtractPdf(source: ContextSource, pdfBase64: string): Promise<{ text: string; items: ExtractedKnowledge[] }> {
  const r = await ask(
    [
      { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdfBase64 } },
      { type: "text", text: `${describeSource(source)}\n\nReturn the document's text, then extract the knowledge. Quotes must be copied from the text you return.` },
    ],
    true,
  );
  return { text: r.text, items: toKnowledge({ ...source, text: r.text }, r.items) };
}
