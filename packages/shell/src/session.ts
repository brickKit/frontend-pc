// FP06: the browser session as the page sees it. The page never holds a token: the identity member keeps the session,
// the edge injects the token. The shell starts by asking for the features document (only a live session gets it, P11.8:
// the login gate); "log in again" is a full navigation to the identity member's login with the current path; a logout
// tells the other tabs (BroadcastChannel), clears what the browser holds and shows the logged-out page, which makes no
// API request. The identity provider not signing the browser in again silently is the identity member's (A178).
import type { Features } from "./access.ts";
import type { Outcome } from "./errors.ts";

export const LOGIN = "/api/iam/login";
export const LOGOUT = "/api/iam/logout";
export const FEATURES = "/api/features";
export const LOGGED_OUT = "/logged-out";
export const CHANNEL = "be-session";

/** The login address for where the user is: a path on this site (the identity member accepts nothing else). */
export function loginUrl(path: string, search = ""): string {
  const here = path.startsWith("/") && !path.startsWith("//") && path !== LOGGED_OUT ? path + search : "/";
  return `${LOGIN}?return_to=${encodeURIComponent(here)}`;
}

export type Gate = { kind: "in"; features: Features } | { kind: "login" } | { kind: "retry" };

export function gateOf(o: Outcome): Gate {
  if (o.kind === "ok") return { kind: "in", features: o.body as Features };
  if (o.kind === "login") return { kind: "login" };
  return { kind: "retry" };
}

export interface Browser {
  navigate: (url: string) => void;
  clear: () => Promise<void>; // FP13's drafts rule and the caches: what the logout leaves behind
  post: (message: unknown) => void; // to the other tabs
}

/** After this tab's logout was answered (or the session was already over): tell the others, clear, show the page. */
export async function loggedOut(b: Browser): Promise<void> {
  b.post({ type: "logout" });
  await b.clear();
  b.navigate(LOGGED_OUT);
}

/** Another tab logged out: this one clears too and leaves for the login gate's answer. */
export async function onMessage(b: Browser, message: unknown): Promise<void> {
  if ((message as { type?: string } | null)?.type !== "logout") return;
  await b.clear();
  b.navigate(LOGGED_OUT);
}
