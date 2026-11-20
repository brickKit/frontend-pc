// FP04, FP05: what the shell shows. A menu item needs its module in the build (it is, or it would not be here), its
// component and every need in the deployment's features, and its operation in the user's permissions. Hiding is not a
// security boundary: the backend refuses anyway. Permissions come from the authorization member's
// GET /api/authz/me/operations (A177): kept when a refresh fails, refreshed on focus, every 5 minutes and after a 403.
import type { MenuItem, PageModule } from "./module.ts";

export interface Features {
  components: { id: string; version: string; capabilities?: string[] }[];
}

export function has(features: Features | null, component: string): boolean {
  return Boolean(features?.components.some((c) => c.id === component));
}

/** The capabilities a deployment's features declare for a component, or null when they say nothing (FP04: not yet). */
function capabilitiesOf(features: Features, component: string): string[] | null {
  return features.components.find((c) => c.id === component)?.capabilities ?? null;
}

export function moduleAvailable(m: PageModule, features: Features | null): boolean {
  if (!features) return false;
  if (![m.component, ...m.needs].every((c) => has(features, c))) return false;
  const declared = capabilitiesOf(features, m.component);
  return declared === null || m.capabilities.every((c) => declared.includes(c));
}

export interface Visible {
  module: PageModule;
  items: MenuItem[];
}

/** The menu: only modules the deployment has, only items the user may (FP04); no permissions known yet, no items. */
export function visibleMenu(modules: PageModule[], features: Features | null, permissions: ReadonlySet<string> | null): Visible[] {
  const out: Visible[] = [];
  for (const m of modules) {
    if (!moduleAvailable(m, features) || !permissions) continue;
    const items = m.menu.filter((i) => permissions.has(i.operation));
    if (items.length) out.push({ module: m, items });
  }
  return out;
}

export const REFRESH_MS = 5 * 60 * 1000;
export const AFTER_403_MS = 30 * 1000;

export type Fetched = { kind: "ok"; operations: string[] } | { kind: "retry" } | { kind: "login" };

/**
 * The user's permissions (FP05). A failed refresh keeps the last answer and says "retry"; with no answer yet there is
 * nothing to show, which is not "no rights". A 403 elsewhere asks again, at most once in 30 seconds.
 */
export class Permissions {
  keys: ReadonlySet<string> | null = null;
  stale = false;
  private last403 = -Infinity;

  constructor(private readonly fetchOps: (polling: boolean) => Promise<Fetched>, private readonly now: () => number) {}

  async refresh(polling: boolean): Promise<void> {
    const r = await this.fetchOps(polling);
    if (r.kind === "ok") {
      this.keys = new Set(r.operations);
      this.stale = false;
    } else if (r.kind === "retry") {
      this.stale = true; // keep the last keys
    }
  }

  /** A request was refused with 403: the grants may have changed. */
  async denied(): Promise<void> {
    const t = this.now();
    if (t - this.last403 < AFTER_403_MS) return;
    this.last403 = t;
    await this.refresh(false);
  }
}
