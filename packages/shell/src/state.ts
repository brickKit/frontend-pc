// The shell's state, one instance per page: the session gate, the features, the permissions and their refresh, the
// look, the tabs, the version check (FP04-FP06, FP10, FP11, FP19). Pages reach the backend through api().
import { reactive, ref } from "vue";
import { Permissions, type Features, type Fetched } from "./access.ts";
import { idbStore, Drafts } from "./drafts.ts";
import type { Outcome } from "./errors.ts";
import { modules } from "./modules.generated.ts";
import { Tabs } from "./navigation.ts";
import { loadPrefs, savePrefs, type Prefs } from "./prefs.ts";
import { request, type RequestOptions } from "./request.ts";
import { runtimeConfig, defaults, type RuntimeConfig } from "./runtime.ts";
import { CHANNEL, FEATURES, gateOf, loggedOut, loginUrl, LOGOUT, onMessage } from "./session.ts";
import { CHECK_MS, outdated, VERSION_PATH, type BuildInfo } from "./version.ts";
import { REFRESH_MS } from "./access.ts";

declare const __BUILD__: BuildInfo;

const storage = (() => { try { return window.localStorage; } catch { return undefined; } })();
const channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(CHANNEL);

export const state = reactive({
  phase: "starting" as "starting" | "in" | "retry" | "out",
  features: null as Features | null,
  config: defaults as RuntimeConfig,
  prefs: loadPrefs(storage, navigator.language) as Prefs,
  newBuild: false,
  user: "",
});
export const permissions = ref<Permissions | null>(null);
export const tabs = reactive(new Tabs());
export { modules };

const browser = {
  navigate: (url: string) => window.location.assign(url),
  clear: async () => {
    state.features = null;
    permissions.value = null;
    await new Drafts(idbStore(), state.user, Date.now).logout(state.config.sharedTerminal);
  },
  post: (m: unknown) => channel?.postMessage(m),
};

function toLogin(): void {
  window.location.assign(loginUrl(window.location.pathname, window.location.search));
}

/** The one way a page reaches the backend (FP07). A 403 refreshes the permissions (FP05). */
export async function api(method: string, path: string, o: RequestOptions = {}): Promise<Outcome> {
  const out = await request({ fetch: window.fetch.bind(window), sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
    onLogin: toLogin }, method, path, o);
  if (out.kind === "denied") void permissions.value?.denied();
  return out;
}

async function operations(polling: boolean): Promise<Fetched> {
  const out = await api("GET", "/api/authz/me/operations", { polling });
  if (out.kind === "ok") {
    const b = out.body as { principal: string; operations: string[] };
    state.user = b.principal; // the verified caller (infra/authz 3.0.61): drafts are kept per user by it
    return { kind: "ok", operations: b.operations };
  }
  return out.kind === "login" ? { kind: "login" } : { kind: "retry" };
}

export function setPrefs(p: Partial<Prefs>): void {
  state.prefs = { ...state.prefs, ...p };
  savePrefs(storage, state.prefs);
}

export async function start(): Promise<void> {
  if (window.location.pathname === "/logged-out") {
    state.phase = "out";
    return;
  }
  try {
    const r = await fetch("/config.json", { cache: "no-store" });
    state.config = runtimeConfig(r.ok ? await r.json() : null);
  } catch {
    state.config = defaults;
  }
  const gate = gateOf(await request({ fetch: window.fetch.bind(window), sleep: async () => {}, onLogin: () => {} },
    "GET", FEATURES));
  if (gate.kind === "login") return toLogin();
  if (gate.kind === "retry") {
    state.phase = "retry";
    return;
  }
  state.features = gate.features;
  const p = new Permissions(operations, Date.now);
  await p.refresh(false);
  permissions.value = p;
  state.phase = "in";
  channel?.addEventListener("message", (e) => void onMessage(browser, e.data));
  const poll = () => {
    if (document.visibilityState !== "visible") return; // no polling behind a hidden tab (FP06)
    void p.refresh(true);
    void checkVersion();
  };
  setInterval(poll, Math.min(REFRESH_MS, CHECK_MS));
  window.addEventListener("focus", poll);
}

async function checkVersion(): Promise<void> {
  const out = await api("GET", VERSION_PATH, { polling: true });
  if (out.kind === "ok" && outdated(__BUILD__, out.body)) state.newBuild = true;
}

export async function logout(): Promise<void> {
  // answered or already over (401): either way this tab is logged out; no login redirect here
  await request({ fetch: window.fetch.bind(window), sleep: async () => {}, onLogin: () => {} }, "POST", LOGOUT, {});
  await loggedOut(browser);
}
