import type { LucideIcon } from "lucide-react";

export function PageTitle({ icon: Icon, title, subtitle, tone = "ari" }: { icon: LucideIcon; title: string; subtitle?: string; tone?: "ari" | "amber" | "sky" | "emerald" | "rose" }) {
  const tones = {
    ari: "from-ari-500 to-coral-500",
    amber: "from-amber-400 to-orange-500",
    sky: "from-sky-400 to-indigo-500",
    emerald: "from-emerald-400 to-teal-500",
    rose: "from-rose-400 to-coral-500",
  };
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg shadow-ari-500/20 ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">{title}</h1>
        {subtitle && <p className="text-sm text-zinc-500">{subtitle}</p>}
      </div>
    </div>
  );
}

export function PersonAvatar({ name }: { name: string }) {
  const hues = ["from-ari-400 to-ari-600", "from-coral-400 to-rose-500", "from-amber-300 to-orange-500", "from-emerald-300 to-teal-500", "from-sky-300 to-indigo-500"];
  const hue = hues[name.length % hues.length];
  return (
    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br text-sm font-bold text-white ${hue}`}>
      {name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)}
    </span>
  );
}
