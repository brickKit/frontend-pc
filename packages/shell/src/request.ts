// FP06, FP07: the one way a page reaches the backend. Same origin with the session cookie (the page never sees a token);
// BE-Request on every state change (P11.2); BE-Polling on polls (P11.7: they do not keep the session alive); an
// idempotency key on writes, the same key on every retry and on "ask again" (FP08). Only reads and writes with a key
// are retried automatically, and only on a retryable reason (protocol 20, UI31): a write without a key is never
// replayed. A 401 that means "log in again" goes to the session's handler.
import { classify, type Outcome, type Problem } from "./errors.ts";

export interface RequestOptions {
  body?: unknown;
  idempotencyKey?: string;
  polling?: boolean;
}

export interface Transport {
  fetch: typeof fetch;
  sleep: (ms: number) => Promise<void>;
  onLogin: () => void; // FP06: the session decides (clear state, go to the login)
}

export const RETRIES = 2;
const BACKOFF_MS = [1000, 3000];

export function newKey(): string {
  return crypto.randomUUID();
}

async function once(t: Transport, method: string, path: string, o: RequestOptions): Promise<Outcome> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (method !== "GET" && method !== "HEAD") headers["BE-Request"] = "1";
  if (o.polling) headers["BE-Polling"] = "1";
  if (o.idempotencyKey) headers["Idempotency-Key"] = o.idempotencyKey;
  if (o.body !== undefined) headers["Content-Type"] = "application/json";
  let r: Response;
  try {
    r = await t.fetch(path, { method, headers, credentials: "same-origin",
      body: o.body === undefined ? undefined : JSON.stringify(o.body) });
  } catch {
    // the request may or may not have arrived: a read is simply retried, a write's result is not known
    return method === "GET" ? { kind: "retry", reason: "NETWORK" } : { kind: "unconfirmed" };
  }
  const text = await r.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    body = undefined;
  }
  if (r.ok) return { kind: "ok", status: r.status, body };
  return classify(r.status, body as Problem | undefined, r.headers.get("Retry-After"));
}

export async function request(t: Transport, method: string, path: string, o: RequestOptions = {}): Promise<Outcome> {
  const retriable = method === "GET" || Boolean(o.idempotencyKey);
  let out = await once(t, method, path, o);
  for (let i = 0; retriable && i < RETRIES && (out.kind === "retry" || out.kind === "in-progress"); i++) {
    const wait = out.kind === "retry" && out.retryAfter !== undefined ? out.retryAfter * 1000 : BACKOFF_MS[i]!;
    await t.sleep(wait);
    out = await once(t, method, path, o);
  }
  if (out.kind === "login") t.onLogin();
  return out;
}
