"use client";

import { useRef, useState } from "react";
import { FilePlus2, FolderOpen, LoaderCircle, TriangleAlert } from "lucide-react";
import { workdayOf } from "@/lib/context/knowledge";
import { sampleSourcesFor } from "@/lib/context/knowledgeStore";
import type { ContextSource } from "@/lib/context/types";
import { ingest, ingestUpload } from "./ingest";

const IN_BROWSER = ["txt", "md", "csv"];
const ON_SERVER = ["pdf", "docx"];
const extOf = (name: string) => name.split(".").pop()?.toLowerCase() ?? "";

// Drop files for Ari to read. Text files are read in the browser; PDFs and
// Word documents are read on the server.
export function FileDrop({ onAdded }: { onAdded: (sourceId: string, note?: string) => void }) {
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function take(files: File[]) {
    setProblem(null);
    for (const file of files) {
      const ext = extOf(file.name);
      setBusy(file.name);
      if (IN_BROWSER.includes(ext)) {
        const source: ContextSource = {
          id: `file-${Date.now().toString(36)}`,
          kind: "file",
          title: file.name,
          day: workdayOf(new Date()),
          origin: "uploaded",
          text: (await file.text()).trim(),
        };
        if (!source.text) setProblem(`${file.name} is empty.`);
        else {
          const r = await ingest(source);
          onAdded(source.id, r.note);
        }
      } else if (ON_SERVER.includes(ext)) {
        const r = await ingestUpload(file);
        if (r.source) onAdded(r.source.id, r.note);
        else setProblem(r.error ?? "Couldn't read that file.");
      } else {
        setProblem(`Ari can't read .${ext} files yet. Try .txt, .md, .csv, .pdf or .docx.`);
      }
    }
    setBusy(null);
  }

  async function addSamples() {
    const samples = sampleSourcesFor("files");
    setBusy("Maria's files");
    await Promise.all(samples.map((s) => ingest(s)));
    setBusy(null);
    onAdded(samples[0].id);
  }

  return (
    <div
      data-ari="file-drop"
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        void take([...e.dataTransfer.files]);
      }}
      className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-4 text-center transition-all ${
        over ? "scale-[1.01] border-ari-400 bg-ari-50" : "border-ari-200 bg-white/60"
      }`}
    >
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-amber-300 to-orange-500 text-white">
        {busy ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <FilePlus2 className="h-5 w-5" />}
      </span>
      {busy ? (
        <p className="text-sm text-ari-700">Reading {busy}…</p>
      ) : (
        <>
          <p className="text-sm font-semibold text-zinc-800">Drop files here</p>
          <p className="text-xs text-zinc-500">.txt, .md, .csv, .pdf or .docx: procedures, notes, supplier emails</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button onClick={() => input.current?.click()} className="ari-lift rounded-xl bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 ring-1 ring-zinc-200">
              Choose files
            </button>
            <button onClick={addSamples} className="ari-lift inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-sm font-medium text-ari-700 ring-1 ring-ari-200">
              <FolderOpen className="h-4 w-4" /> Maria&apos;s files
            </button>
          </div>
        </>
      )}
      {problem && (
        <p className="flex items-start gap-1.5 text-xs text-rose-700">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {problem}
        </p>
      )}
      <input
        ref={input}
        type="file"
        multiple
        accept=".txt,.md,.csv,.pdf,.docx"
        className="hidden"
        onChange={(e) => {
          const files = [...(e.target.files ?? [])];
          e.target.value = "";
          void take(files);
        }}
      />
    </div>
  );
}
