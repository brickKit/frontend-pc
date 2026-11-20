// FP08: every answer becomes one outcome the pages show the same way (protocol 20's table). Retryability comes from
// be-protocol's reason catalog (reasons.generated.ts); a reason the catalog does not know is protective: shown as not
// done, never as success.
import { reasons } from "./reasons.generated.ts";

export interface Problem {
  status?: number;
  reason?: string;
  domain?: string;
  metadata?: Record<string, string>;
  violations?: { field: string; reason: string; description?: string }[];
  trace_id?: string;
}

export type Outcome =
  | { kind: "ok"; status: number; body: unknown }
  // 401 SESSION_ENDED (the edge) or TOKEN_INVALID (no cookie: another tab logged out): go to the login (FP06)
  | { kind: "login" }
  // not visible and not there look the same (no leak of whether it exists)
  | { kind: "not-found" }
  | { kind: "denied"; reason: string }
  | { kind: "invalid"; violations: NonNullable<Problem["violations"]>; reason: string }
  // cannot be proven now, busy, a dependency down: "try again", never "no rights" or an empty list
  | { kind: "retry"; reason: string; retryAfter?: number }
  // a timeout, a lost connection, RESULT_UNKNOWN: the result is not known; ask again with the same key
  | { kind: "unconfirmed"; reason?: string }
  | { kind: "in-progress" }
  | { kind: "upgrade" } // CAPABILITY_UNSUPPORTED: the backend needs upgrading
  | { kind: "defect"; reason: string } // this entry's own mistake (a reused key, a missing header)
  | { kind: "refused"; reason: string; domain: string; metadata: Record<string, string> } // a known business refusal
  | { kind: "unknown"; status: number; reason?: string }; // protective

const loginReasons = new Set(["SESSION_ENDED", "TOKEN_INVALID"]);
const defects = new Set(["IDEMPOTENCY_KEY_REUSED", "CSRF_HEADER_REQUIRED"]);

/** retryAfter reads a Retry-After header in seconds (P3.6); a date or garbage is ignored. */
export function retryAfter(header: string | null): number | undefined {
  if (!header || !/^\d+$/.test(header.trim())) return undefined;
  return Number(header.trim());
}

export function classify(status: number, problem: Problem | undefined, retryAfterHeader: string | null = null): Outcome {
  if (status >= 200 && status < 300) return { kind: "ok", status, body: problem };
  const reason = problem?.reason;
  if (!reason) {
    // no problem body: a gateway's or the network's answer; a 5xx without a reason is not known to be undone
    if (status === 504 || status === 502) return { kind: "unconfirmed" };
    return { kind: "unknown", status };
  }
  if (status === 401 && loginReasons.has(reason)) return { kind: "login" };
  if (reason === "NOT_FOUND") return { kind: "not-found" };
  if (reason === "PERMISSION_DENIED") return { kind: "denied", reason };
  if (defects.has(reason)) return { kind: "defect", reason };
  if (reason === "IDEMPOTENCY_IN_PROGRESS") return { kind: "in-progress" };
  if (reason === "CAPABILITY_UNSUPPORTED") return { kind: "upgrade" };
  if (problem?.violations?.length) return { kind: "invalid", violations: problem.violations, reason };
  const known = problem?.domain === "be" || problem?.domain === undefined ? reasons[reason] : undefined;
  if (known?.retry === "yes") return { kind: "retry", reason, retryAfter: retryAfter(retryAfterHeader) };
  if (known?.retry === "query_first") return { kind: "unconfirmed", reason };
  if (known || (problem?.domain && problem.domain !== "be" && status < 500)) {
    // a platform reason that is final, or a component's own business refusal: the page shows it by its reason
    return { kind: "refused", reason, domain: problem?.domain ?? "be", metadata: problem?.metadata ?? {} };
  }
  return { kind: "unknown", status, reason };
}
