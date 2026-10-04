"use client";

import { Eye, Languages, MessageCircleQuestion, ShieldAlert } from "lucide-react";
import type { Lang } from "@/lib/apprentice/types";

// What a new hire can try while Ari teaches.
export function TipsBar({ lang }: { lang: Lang }) {
  const es = lang === "es-ES";
  const tips = [
    { icon: MessageCircleQuestion, text: es ? "Pregunta «¿por qué?» en cualquier paso" : "Ask “why?” at any step" },
    { icon: Eye, text: es ? "Pulsa «Muéstramelo»" : "Press “Show me”" },
    { icon: Languages, text: es ? "Habla en español" : "Ask in Spanish" },
    { icon: ShieldAlert, text: es ? "Prueba a aprobarlo tú" : "Try approving it yourself" },
  ];
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[68px] z-40 flex justify-center px-4">
      <ul className="ari-stagger pointer-events-auto flex flex-wrap justify-center gap-2 rounded-full border border-emerald-100 bg-white/90 px-3 py-2 shadow-lg shadow-emerald-500/10 backdrop-blur">
        {tips.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
            <Icon className="h-3.5 w-3.5" /> {text}
          </li>
        ))}
      </ul>
    </div>
  );
}
