export type Profile = { name: string; role: string; company: string };

export type Audience = "expert" | "newcomer";

const key = (audience: Audience) => (audience === "expert" ? "ari.profile" : "ari.profile.newcomer");

export const MARIA: Profile = { name: "Maria", role: "Procurement Manager", company: "Northwind Supply" };
export const NEWCOMER: Profile = { name: "Sam", role: "Procurement Manager", company: "Northwind Supply" };

export function loadProfile(audience: Audience): Profile | null {
  try {
    const raw = localStorage.getItem(key(audience));
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
}

export function saveProfile(audience: Audience, profile: Profile) {
  try {
    localStorage.setItem(key(audience), JSON.stringify(profile));
  } catch {
    // Private mode or blocked storage: the profile just won't be remembered.
  }
}
