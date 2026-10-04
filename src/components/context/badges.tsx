import { CloudUpload, FileText, Lightbulb, Link2, Mail, Mic, Palette, RefreshCw, ShieldAlert, Sparkle, Video, type LucideIcon } from "lucide-react";
import type { StepId } from "@/lib/apprentice/types";
import { STEP_LINK } from "@/lib/context/knowledge";
import type { ContextSource } from "@/lib/context/types";
import type { Level } from "@/lib/apprentice/reasonTypes";

const LEVELS: Partial<Record<Level, { label: string; icon: LucideIcon; className: string }>> = {
  must: { label: "Must follow", icon: ShieldAlert, className: "bg-rose-50 text-rose-700 ring-rose-200" },
  advice: { label: "Strong advice", icon: Lightbulb, className: "bg-amber-50 text-amber-800 ring-amber-200" },
  choice: { label: "Your choice", icon: Palette, className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
};

export function LevelBadge({ level }: { level?: Level }) {
  const l = level && LEVELS[level];
  if (!l) return null;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ${l.className}`}>
      <l.icon className="h-3 w-3" /> {l.label}
    </span>
  );
}

export function StepLink({ step }: { step?: string }) {
  if (!step || !(step in STEP_LINK)) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-ari-50 px-2 py-0.5 text-[11px] font-semibold text-ari-700 ring-1 ring-ari-200">
      <Link2 className="h-3 w-3" /> Linked to: {STEP_LINK[step as StepId]}
    </span>
  );
}

export const KIND_ICON: Record<ContextSource["kind"], LucideIcon> = { meeting: Video, file: FileText, email: Mail };

const ORIGIN: Record<ContextSource["origin"], { label: string; icon: LucideIcon; className: string }> = {
  connected: { label: "Synced", icon: RefreshCw, className: "bg-sky-50 text-sky-700" },
  uploaded: { label: "Uploaded", icon: CloudUpload, className: "bg-amber-50 text-amber-800" },
  recorded: { label: "Recorded", icon: Mic, className: "bg-rose-50 text-rose-700" },
  sample: { label: "Sample", icon: Sparkle, className: "bg-zinc-100 text-zinc-600" },
};

export function OriginBadge({ origin }: { origin: ContextSource["origin"] }) {
  const o = ORIGIN[origin];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${o.className}`}>
      <o.icon className="h-2.5 w-2.5" /> {o.label}
    </span>
  );
}
