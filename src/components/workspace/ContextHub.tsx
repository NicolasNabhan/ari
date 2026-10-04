import type { Audience } from "@/lib/workspace/profile";
import { FolderOpen } from "lucide-react";
import { PageTitle } from "./PageTitle";

// Files and meetings the work depends on: connected meetings with
// transcripts, live recording, uploads, and the knowledge pulled from them.
// Placeholder: being built.
export function ContextHub({ audience }: { audience: Audience }) {
  return <PageTitle icon={FolderOpen} tone="emerald" title="Files & meetings" subtitle={audience === "expert" ? "What Ari learns from" : "Where Maria's knowledge comes from"} />;
}
