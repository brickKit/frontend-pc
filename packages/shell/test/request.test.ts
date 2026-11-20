import { describe, expect, it, vi } from "vitest";
import { classify } from "../src/errors.ts";
import { request, type Transport } from "../src/request.ts";

type Answer = { status: number; body?: unknown; headers?: Record<string, string> } | "network";

function transport(answers: Answer[]) {
  const seen: { method: string; path: string; headers: Record<string, string>; body?: string }[] = [];
  const t: Transport = {
    fetch: vi.fn(async (path: RequestInfo | URL, init?: RequestInit) => {
      seen.push({ method: init!.method!, path: String(path), headers: init!.headers as Record<string, string>,
        body: init!.body as string | undefined });
      const a = answers.shift()!;
      if (a === "network") throw new TypeError("failed to fetch");
      return new Response(a.body === undefined ? null : JSON.stringify(a.body), { status: a.status, headers: a.headers });
    }) as unknown as typeof fetch,
    sleep: vi.fn(async () => {}),
    onLogin: vi.fn(),
  };
  return { t, seen };
}
const problem = (status: number, reason: string, extra: object = {}) => ({ status, body: { status, reason, domain: "be", ...extra } });

describe("request (FP06, FP07)", () => {
  it("sends BE-Request on writes only, BE-Polling on polls, the key, the cookie's origin", async () => {
    const { t, seen } = transport([{ status: 200, body: {} }, { status: 200, body: {} }]);
    await request(t, "GET", "/api/x", { polling: true });
    await request(t, "POST", "/api/x", { body: { a: 1 }, idempotencyKey: "k1" });
    expect(seen[0]!.headers["BE-Request"]).toBeUndefined();
    expect(seen[0]!.headers["BE-Polling"]).toBe("1");
    expect(seen[1]!.headers["BE-Request"]).toBe("1");
    expect(seen[1]!.headers["Idempotency-Key"]).toBe("k1");
    expect(seen[1]!.body).toBe('{"a":1}');
    expect((t.fetch as ReturnType<typeof vi.fn>).mock.calls[0]![1].credentials).toBe("same-origin");
  });
  it("retries a keyed write on a retryable reason with the same key, by Retry-After (UI31)", async () => {
    const { t, seen } = transport([{ ...problem(503, "DEPENDENCY_UNAVAILABLE"), headers: { "Retry-After": "2" } },
      { status: 201, body: { id: 1 } }]);
    const out = await request(t, "POST", "/api/x", { body: {}, idempotencyKey: "k2" });
    expect(out).toEqual({ kind: "ok", status: 201, body: { id: 1 } });
    expect(seen.map((s) => s.headers["Idempotency-Key"])).toEqual(["k2", "k2"]);
    expect(t.sleep).toHaveBeenCalledWith(2000);
  });
  it("never replays a write without a key: it is 'try again' for the user (UI31)", async () => {
    const { t, seen } = transport([problem(503, "AUTHORIZATION_UNPROVABLE")]);
    expect(await request(t, "POST", "/api/x", { body: {} })).toEqual({ kind: "retry", reason: "AUTHORIZATION_UNPROVABLE", retryAfter: undefined });
    expect(seen).toHaveLength(1);
  });
  it("gives up after two retries and says so", async () => {
    const { t, seen } = transport([problem(503, "SERVICE_BUSY"), problem(503, "SERVICE_BUSY"), problem(503, "SERVICE_BUSY")]);
    expect((await request(t, "GET", "/api/x")).kind).toBe("retry");
    expect(seen).toHaveLength(3);
  });
  it("a lost write is unconfirmed, a lost read is retried", async () => {
    const w = transport(["network"]);
    expect(await request(w.t, "POST", "/api/x", { body: {} })).toEqual({ kind: "unconfirmed" });
    const r = transport(["network", { status: 200, body: [] }]);
    expect((await request(r.t, "GET", "/api/x")).kind).toBe("ok");
  });
  it("hands 'log in again' to the session, for SESSION_ENDED and TOKEN_INVALID (FP06)", async () => {
    for (const reason of ["SESSION_ENDED", "TOKEN_INVALID"]) {
      const { t } = transport([problem(401, reason)]);
      expect(await request(t, "GET", "/api/x")).toEqual({ kind: "login" });
      expect(t.onLogin).toHaveBeenCalledTimes(1);
    }
  });
});

describe("classify (FP08)", () => {
  it("maps protocol 20's table", () => {
    expect(classify(404, { reason: "NOT_FOUND", domain: "be" }).kind).toBe("not-found");
    expect(classify(403, { reason: "PERMISSION_DENIED", domain: "be" }).kind).toBe("denied");
    expect(classify(400, { reason: "REQUEST_INVALID", domain: "be", violations: [{ field: "/qty", reason: "TOO_SMALL" }] }))
      .toEqual({ kind: "invalid", reason: "REQUEST_INVALID", violations: [{ field: "/qty", reason: "TOO_SMALL" }] });
    expect(classify(503, { reason: "AUTHORIZATION_VIEW_EXPIRED", domain: "be" }).kind).toBe("retry");
    expect(classify(501, { reason: "CAPABILITY_UNSUPPORTED", domain: "be" }).kind).toBe("upgrade");
    expect(classify(409, { reason: "IDEMPOTENCY_IN_PROGRESS", domain: "be" }).kind).toBe("in-progress");
    expect(classify(422, { reason: "IDEMPOTENCY_KEY_REUSED", domain: "be" }).kind).toBe("defect");
    expect(classify(504, { reason: "RESULT_UNKNOWN", domain: "be" })).toEqual({ kind: "unconfirmed", reason: "RESULT_UNKNOWN" });
    expect(classify(504, undefined).kind).toBe("unconfirmed");
  });
  it("a final platform reason and a component's own refusal are shown by their reason", () => {
    expect(classify(409, { reason: "TASK_NOT_PENDING", domain: "be" })).toMatchObject({ kind: "refused", reason: "TASK_NOT_PENDING" });
    expect(classify(409, { reason: "OVER_RECEIPT", domain: "erp/purchase", metadata: { limit: "5%" } }))
      .toEqual({ kind: "refused", reason: "OVER_RECEIPT", domain: "erp/purchase", metadata: { limit: "5%" } });
  });
  it("an unknown platform reason or a 5xx is protective, never success", () => {
    expect(classify(409, { reason: "SOMETHING_NEW", domain: "be" })).toEqual({ kind: "unknown", status: 409, reason: "SOMETHING_NEW" });
    expect(classify(500, { reason: "BOOM", domain: "erp/sales" }).kind).toBe("unknown");
    expect(classify(418, undefined).kind).toBe("unknown");
  });
  it("401 that is not a login reason is not a login", () => {
    expect(classify(401, { reason: "TOKEN_STALE", domain: "be" }).kind).not.toBe("login");
  });
});
