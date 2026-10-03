"use client";

import { useState } from "react";
import type { Profile } from "@/lib/workspace/profile";

const ROLES = ["Procurement Manager", "Finance Manager", "Operations Manager", "Compliance Manager", "IT Manager"];

export function ProfileForm({ initial, onSave }: { initial: Profile; onSave: (p: Profile) => void }) {
  const [p, setP] = useState(initial);
  const field = "mt-1 w-full rounded-lg border px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";
  return (
    <main className="mx-auto w-full max-w-md px-6 py-16">
      <h1 className="text-2xl font-semibold">Your profile</h1>
      <p className="mt-2 text-zinc-500">Ari learns your job once, here, so it never has to ask again.</p>
      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (p.name.trim()) onSave({ name: p.name.trim(), role: p.role, company: p.company.trim() });
        }}
      >
        <label className="block text-sm font-medium">
          Name
          <input className={field} value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
        </label>
        <label className="block text-sm font-medium">
          Job role
          <select className={field} value={p.role} onChange={(e) => setP({ ...p, role: e.target.value })}>
            {ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Company
          <input className={field} value={p.company} onChange={(e) => setP({ ...p, company: e.target.value })} />
        </label>
        <button data-ari="profile-continue" className="w-full rounded-lg bg-indigo-600 py-2 font-medium text-white">
          Continue
        </button>
      </form>
    </main>
  );
}
