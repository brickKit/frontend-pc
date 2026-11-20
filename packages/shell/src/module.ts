// FP02: a page module's declaration. Its component, contract major, needs, capabilities and optional components are
// written once, in the module's package.json ("bePageModule"), which both the build (FP03) and this declaration read.
import type { RouteRecordRaw } from "vue-router";

export interface Declared {
  component: string;
  contract: number;
  needs?: string[];
  capabilities?: string[];
  optional?: string[];
}

export interface MenuItem {
  key: string; // unique in the module
  route: string; // the route's path
  title: string; // a message key in the module's messages
  operation: string; // the operation key the item needs; without it the item is not shown (FP04)
}

/** FP13: a form that keeps an offline draft, with the fields allowed into it (restricted fields never are). */
export interface DraftForm {
  version: number; // the form's structure version
  fields: string[];
}

export interface PageModule extends Required<Declared> {
  name: string;
  domain: string; // the service selector's group (FP10)
  menu: MenuItem[];
  routes: RouteRecordRaw[];
  messages: Record<string, Record<string, unknown>>; // locale -> messages (FP17)
  drafts: Record<string, DraftForm>;
}

export interface Definition {
  name: string;
  domain: string;
  menu: MenuItem[];
  routes: RouteRecordRaw[];
  messages: Record<string, Record<string, unknown>>;
  drafts?: Record<string, DraftForm>;
}

export function definePageModule(declared: Declared, d: Definition): PageModule {
  const m: PageModule = { component: declared.component, contract: declared.contract, needs: declared.needs ?? [],
    capabilities: declared.capabilities ?? [], optional: declared.optional ?? [], ...d, drafts: d.drafts ?? {} };
  const keys = new Set<string>();
  for (const item of m.menu) {
    if (keys.has(item.key)) throw new Error(`${m.name}: menu key ${item.key} twice`);
    keys.add(item.key);
    if (!item.operation) throw new Error(`${m.name}: menu item ${item.key} has no operation (FP02)`);
    if (!m.routes.some((r) => r.path === item.route)) throw new Error(`${m.name}: menu item ${item.key} has no route ${item.route}`);
  }
  for (const [form, f] of Object.entries(m.drafts)) {
    if (!f.fields.length) throw new Error(`${m.name}: draft form ${form} allows no field`);
  }
  return m;
}
