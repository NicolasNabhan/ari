"use client";

import { useState } from "react";
import { compileProcedure } from "@/lib/apprentice/procedure";
import type { Lessons } from "@/lib/apprentice/types";

// What Ari compiled from the expert's session: the playbook the tutor follows.
export function ProcedureView({ lessons }: { lessons: Lessons }) {
  const [open, setOpen] = useState(false);
  const procedure = compileProcedure(lessons);
  return (
    <>
      <button data-ari="view-procedure" onClick={() => setOpen(true)} className="text-xs text-indigo-600 underline dark:text-indigo-300">
        View the procedure Ari compiled
      </button>
      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <pre
            data-ari="procedure-text"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] w-full max-w-2xl overflow-auto whitespace-pre-wrap rounded-2xl bg-white p-6 text-sm shadow-2xl dark:bg-zinc-900"
          >
            {procedure.text}
          </pre>
        </div>
      )}
    </>
  );
}
