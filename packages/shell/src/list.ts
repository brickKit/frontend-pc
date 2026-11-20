// A paged list as every owner answers it (protocol 14: cursors, never offsets): {<items>, next_cursor}. The page asks
// for the next page with the cursor as it came; a failure keeps what was shown and says so (FP08: never an empty list
// for "cannot confirm"). The owner applies its default range when the page sends none (FP18).
import type { Outcome } from "./errors.ts";

export interface Page<T> {
  rows: T[];
  next: string | null;
  outcome: Outcome | null; // the last failure, null when the last answer was fine
}

export function query(params: Record<string, string | number | boolean | undefined | null>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  const s = q.toString();
  return s ? `?${s}` : "";
}

/** The next state of a list from one answer: rows appended on success; kept, with the outcome, on failure. */
export function step<T>(page: Page<T>, field: string, out: Outcome): Page<T> {
  if (out.kind !== "ok") return { ...page, outcome: out };
  const body = (out.body ?? {}) as Record<string, unknown>;
  const rows = Array.isArray(body[field]) ? (body[field] as T[]) : [];
  const next = typeof body.next_cursor === "string" && body.next_cursor !== "" ? body.next_cursor : null;
  return { rows: [...page.rows, ...rows], next, outcome: null };
}

/** FP08: a field the owner masked (named in _masked) is "not yours to see", not empty. */
export function masked(record: Record<string, unknown> | null | undefined, field: string): boolean {
  const m = record?._masked;
  return Array.isArray(m) && m.includes(field);
}
