// FP10: the two-level navigation. The service selector groups the modules the user has by their domain, searchable,
// with favorites first and the recently visited; inside a module a flat menu; app tabs across modules, a tab with an
// unsaved form asks before it closes; the command palette (⌘K) finds menu items by their title.
import type { Visible } from "./access.ts";

export type Title = (key: string) => string;

export interface Entry {
  module: string;
  domain: string;
  key: string;
  route: string;
  title: string; // translated
}

export function entries(visible: Visible[], t: Title): Entry[] {
  return visible.flatMap((v) => v.items.map((i) => ({ module: v.module.name, domain: v.module.domain, key: i.key,
    route: i.route, title: t(i.title) })));
}

const norm = (s: string) => s.toLocaleLowerCase().normalize("NFKC");

/** The selector's groups: favorites first, then each domain in order, modules matching the query only. */
export function groups(visible: Visible[], query: string, favorites: string[], t: Title): { domain: string; modules: string[] }[] {
  const q = norm(query.trim());
  const match = (v: Visible) => !q || norm(v.module.name).includes(q) ||
    v.items.some((i) => norm(t(i.title)).includes(q));
  const shown = visible.filter(match);
  const fav = shown.filter((v) => favorites.includes(v.module.name)).map((v) => v.module.name);
  const byDomain = new Map<string, string[]>();
  for (const v of shown) byDomain.set(v.module.domain, [...(byDomain.get(v.module.domain) ?? []), v.module.name]);
  return [...(fav.length ? [{ domain: "favorites", modules: fav }] : []),
    ...[...byDomain.keys()].sort().map((domain) => ({ domain, modules: byDomain.get(domain)!.sort() }))];
}

/** The command palette: menu items whose title or module contains every word of the query. */
export function palette(all: Entry[], query: string): Entry[] {
  const words = norm(query).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return all.filter((e) => words.every((w) => norm(e.title).includes(w) || norm(e.module).includes(w))).slice(0, 20);
}

export interface Tab {
  route: string;
  title: string;
  dirty: boolean; // an unsaved form
}

export class Tabs {
  list: Tab[] = [];

  open(route: string, title: string): void {
    if (!this.list.some((t) => t.route === route)) this.list.push({ route, title, dirty: false });
  }

  mark(route: string, dirty: boolean): void {
    const t = this.list.find((x) => x.route === route);
    if (t) t.dirty = dirty;
  }

  /** Closes a tab; one with an unsaved form only when confirm() says yes. Returns the tab to show next, if any. */
  close(route: string, confirm: () => boolean): string | null | undefined {
    const i = this.list.findIndex((t) => t.route === route);
    if (i < 0) return undefined;
    if (this.list[i]!.dirty && !confirm()) return undefined;
    this.list.splice(i, 1);
    return (this.list[i] ?? this.list[i - 1])?.route ?? null;
  }
}
