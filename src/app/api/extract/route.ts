// Knowledge from a meeting transcript, file or email.
//
// JSON:      POST { source: ContextSource }
// Multipart: POST file=<.pdf|.docx|.txt|.md|.csv> (+ optional title, day)
// Both return { source, items: ExtractedKnowledge[], engine: "claude" | "rules", note? }.
//
// Claude does the extraction when ANTHROPIC_API_KEY is set; otherwise, or if
// Claude fails, the rule-based extractor does (engine "rules"). PDFs need
// Claude to read them; .docx is unzipped here.
import { claudeExtract, claudeExtractPdf } from "@/lib/context/claudeExtract";
import { docxText } from "@/lib/context/docx";
import { extractKnowledge, workdayOf } from "@/lib/context/knowledge";
import type { ContextSource, Weekday } from "@/lib/context/types";

export const dynamic = "force-dynamic";

const hasClaude = () => !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
const WEEKDAYS: Weekday[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];

async function extract(source: ContextSource) {
  if (!hasClaude()) return { source, items: extractKnowledge(source), engine: "rules" as const, note: "Claude isn't configured, so Ari used its built-in rules." };
  try {
    return { source, items: await claudeExtract(source), engine: "claude" as const };
  } catch (e) {
    return { source, items: extractKnowledge(source), engine: "rules" as const, note: `Claude failed (${e instanceof Error ? e.message : "error"}), so Ari used its built-in rules.` };
  }
}

async function fromUpload(form: FormData) {
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Send a file in the 'file' field." }, { status: 400 });
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const day = String(form.get("day") ?? "");
  const source: ContextSource = {
    id: `file-${Date.now().toString(36)}`,
    kind: "file",
    title: String(form.get("title") || file.name),
    day: WEEKDAYS.includes(day as Weekday) ? (day as Weekday) : workdayOf(new Date()),
    origin: "uploaded",
    text: "",
  };
  const bytes = Buffer.from(await file.arrayBuffer());

  if (ext === "pdf") {
    if (!hasClaude()) {
      return Response.json({ error: "Reading PDFs needs Claude (ANTHROPIC_API_KEY isn't set). Upload a .txt, .md, .csv or .docx instead." }, { status: 503 });
    }
    try {
      const { text, items } = await claudeExtractPdf(source, bytes.toString("base64"));
      return Response.json({ source: { ...source, text }, items, engine: "claude" });
    } catch (e) {
      return Response.json({ error: `Couldn't read the PDF (${e instanceof Error ? e.message : "error"}).` }, { status: 502 });
    }
  }
  let text: string;
  try {
    text = ext === "docx" ? docxText(bytes) : bytes.toString("utf8");
  } catch {
    return Response.json({ error: "Couldn't read that file. Try .txt, .md, .csv, .pdf or .docx." }, { status: 415 });
  }
  if (!text.trim()) return Response.json({ error: "That file has no text in it." }, { status: 422 });
  return Response.json(await extract({ ...source, text }));
}

export async function POST(request: Request) {
  if ((request.headers.get("content-type") ?? "").includes("multipart/form-data")) return fromUpload(await request.formData());
  const body = (await request.json().catch(() => null)) as { source?: ContextSource } | null;
  const source = body?.source;
  if (!source?.id || typeof source.text !== "string") return Response.json({ error: "Send { source: ContextSource }." }, { status: 400 });
  return Response.json(await extract(source));
}
