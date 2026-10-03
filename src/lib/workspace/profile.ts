export type Profile = { name: string; role: string; company: string };

const KEY = "ari.profile";

export const MARIA: Profile = { name: "Maria", role: "Procurement Manager", company: "Northwind Supply" };

export function loadProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile: Profile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    // Private mode or blocked storage: the profile just won't be remembered.
  }
}
