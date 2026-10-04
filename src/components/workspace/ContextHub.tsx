import type { Audience } from "@/lib/workspace/profile";
import { ContextHubView } from "@/components/context/ContextHubView";

// Files and meetings the work depends on: connected meetings with
// transcripts, live recording, uploads, and the knowledge pulled from them.
export function ContextHub({ audience }: { audience: Audience }) {
  return <ContextHubView audience={audience} />;
}
