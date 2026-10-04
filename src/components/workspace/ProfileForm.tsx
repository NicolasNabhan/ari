"use client";

import { useState } from "react";
import { ArrowRight, Briefcase, Building2, Sparkles, User } from "lucide-react";
import type { Profile } from "@/lib/workspace/profile";

function FieldIcon({ icon: I }: { icon: typeof User }) {
  return <I className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />;
}

const ROLES = ["Procurement Manager", "Finance Manager", "Operations Manager", "Compliance Manager", "IT Manager"];

export function ProfileForm({ initial, onSave }: { initial: Profile; onSave: (p: Profile) => void }) {
  const [p, setP] = useState(initial);
  const field = "w-full rounded-2xl border border-zinc-200 bg-white py-3 pl-11 pr-4 outline-none focus:border-ari-400 focus:ring-4 focus:ring-ari-100";
  return (
    <main className="grid min-h-screen place-items-center px-6 py-16">
      <form
        className="ari-pop w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl shadow-ari-500/10"
        onSubmit={(e) => {
          e.preventDefault();
          if (p.name.trim()) onSave({ name: p.name.trim(), role: p.role, company: p.company.trim() });
        }}
      >
        <div className="px-7 py-6 text-white ari-gradient-animated">
          <Sparkles className="h-6 w-6" />
          <h1 className="mt-2 text-2xl font-semibold">Your profile</h1>
          <p className="text-white/90">Ari learns your job once, here, so it never has to ask again.</p>
        </div>
        <div className="ari-stagger space-y-4 px-7 py-6">
          <label className="block text-sm font-medium text-zinc-700">
            Name
            <span className="relative mt-1 block">
              <FieldIcon icon={User} />
              <input className={field} value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
            </span>
          </label>
          <label className="block text-sm font-medium text-zinc-700">
            Job role
            <span className="relative mt-1 block">
              <FieldIcon icon={Briefcase} />
              <select className={field} value={p.role} onChange={(e) => setP({ ...p, role: e.target.value })}>
                {ROLES.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </span>
          </label>
          <label className="block text-sm font-medium text-zinc-700">
            Company
            <span className="relative mt-1 block">
              <FieldIcon icon={Building2} />
              <input className={field} value={p.company} onChange={(e) => setP({ ...p, company: e.target.value })} />
            </span>
          </label>
          <button data-ari="profile-continue" className="ari-lift flex w-full items-center justify-center gap-2 rounded-2xl py-3 font-semibold text-white shadow-lg shadow-ari-500/30 ari-gradient">
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>
    </main>
  );
}
