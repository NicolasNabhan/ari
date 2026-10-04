// Bringing a source into the hub: store it, then ask /api/extract for its
// knowledge (Claude, or the server's rules), falling back to the rules in the
// browser if the route can't be reached.
import { extractKnowledge } from "@/lib/context/knowledge";
import { addSource, setItems, type Engine } from "@/lib/context/knowledgeStore";
import type { ContextSource, ExtractedKnowledge } from "@/lib/context/types";

type ExtractResponse = { source: ContextSource; items: ExtractedKnowledge[]; engine: Engine; note?: string; error?: string };

export async function ingest(source: ContextSource): Promise<{ note?: string }> {
  addSource(source);
  try {
    const res = await fetch("/api/extract", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ source }) });
    if (!res.ok) throw new Error(String(res.status));
    const r = (await res.json()) as ExtractResponse;
    setItems(source.id, r.items, r.engine);
    return { note: r.note };
  } catch {
    setItems(source.id, extractKnowledge(source), "rules");
    return { note: "Couldn't reach the extractor, so Ari used its built-in rules." };
  }
}

// PDFs and Word files are read on the server; the response carries the text.
export async function ingestUpload(file: File): Promise<{ source?: ContextSource; note?: string; error?: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/extract", { method: "POST", body: form }).catch(() => null);
  if (!res) return { error: "Couldn't reach the server." };
  const r = (await res.json().catch(() => ({ error: `Upload failed (${res.status})` }))) as Partial<ExtractResponse>;
  if (!res.ok || !r.source) return { error: r.error ?? `Upload failed (${res.status})` };
  addSource(r.source);
  setItems(r.source.id, r.items ?? [], r.engine ?? "rules");
  return { source: r.source, note: r.note };
}
