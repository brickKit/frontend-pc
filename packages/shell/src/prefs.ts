// FP11: the user's preferences. Theme (light, dark, following the system) and density in this browser; favorites and
// language here too until the identity member's profile has them (an open question). Browser storage may be missing
// or refuse (a private window): every read and write tolerates it.
import type { Density, Mode } from "@be/ui-kit-pc";

export type ThemeChoice = Mode | "system";

export interface Prefs {
  theme: ThemeChoice;
  density: Density;
  language: string;
  favorites: string[]; // page module names
  recent: string[];
}

const KEY = "be.prefs";
export const languages = ["zh-CN", "en-US"];

export function defaultPrefs(browserLanguage: string): Prefs {
  const language = languages.find((l) => l === browserLanguage) ?? languages.find((l) => l.split("-")[0] === browserLanguage.split("-")[0]) ?? "en-US";
  return { theme: "system", density: "default", language, favorites: [], recent: [] };
}

export function loadPrefs(storage: Pick<Storage, "getItem"> | undefined, browserLanguage: string): Prefs {
  const d = defaultPrefs(browserLanguage);
  try {
    const raw = JSON.parse(storage?.getItem(KEY) ?? "null") as Partial<Prefs> | null;
    if (!raw) return d;
    return { theme: ["light", "dark", "system"].includes(raw.theme as string) ? (raw.theme as ThemeChoice) : d.theme,
      density: raw.density === "compact" ? "compact" : "default",
      language: languages.includes(raw.language as string) ? (raw.language as string) : d.language,
      favorites: Array.isArray(raw.favorites) ? raw.favorites.filter((x) => typeof x === "string") : [],
      recent: Array.isArray(raw.recent) ? raw.recent.filter((x) => typeof x === "string").slice(0, 8) : [] };
  } catch {
    return d;
  }
}

export function savePrefs(storage: Pick<Storage, "setItem"> | undefined, p: Prefs): void {
  try {
    storage?.setItem(KEY, JSON.stringify(p));
  } catch {
    // a private window or a full storage: the preference lasts for this page only
  }
}

export function modeOf(choice: ThemeChoice, systemDark: boolean): Mode {
  return choice === "system" ? (systemDark ? "dark" : "light") : choice;
}

/** The most recent first, at most 8, no repeats. */
export function visited(recent: string[], name: string): string[] {
  return [name, ...recent.filter((x) => x !== name)].slice(0, 8);
}
