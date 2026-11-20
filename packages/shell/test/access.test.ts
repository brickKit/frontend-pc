import { describe, expect, it, vi } from "vitest";
import { Permissions, visibleMenu, type Fetched } from "../src/access.ts";
import { definePageModule } from "../src/module.ts";
import { gateOf, loggedOut, loginUrl, onMessage } from "../src/session.ts";

const product = definePageModule({ component: "mdm/product", contract: 3, optional: ["erp/inventory"] }, {
  name: "product", domain: "master", messages: {},
  routes: [{ path: "/products", component: {} }, { path: "/products/new", component: {} }],
  menu: [{ key: "list", route: "/products", title: "t", operation: "mdm.product.product.read" },
    { key: "new", route: "/products/new", title: "t", operation: "mdm.product.product.create" }],
});
const stock = definePageModule({ component: "erp/inventory", contract: 3, needs: ["mdm/product"] }, {
  name: "inventory", domain: "supply", messages: {}, routes: [{ path: "/stock", component: {} }],
  menu: [{ key: "stock", route: "/stock", title: "t", operation: "erp.inventory.position.read" }],
});
const features = (...ids: string[]) => ({ components: ids.map((id) => ({ id, version: "3.0.1" })) });

describe("the menu (FP04)", () => {
  it("shows only items whose operation the user holds (UI02)", () => {
    const v = visibleMenu([product], features("mdm/product"), new Set(["mdm.product.product.read"]));
    expect(v.map((x) => x.items.map((i) => i.key))).toEqual([["list"]]);
  });
  it("hides a module whose component or need the deployment lacks, whatever the permissions (UI01)", () => {
    const all = new Set(["mdm.product.product.read", "erp.inventory.position.read"]);
    expect(visibleMenu([product, stock], features("mdm/product"), all).map((x) => x.module.name)).toEqual(["product"]);
    expect(visibleMenu([stock], features("erp/inventory"), all)).toEqual([]);
  });
  it("shows nothing before features or permissions are known", () => {
    expect(visibleMenu([product], null, new Set(["mdm.product.product.read"]))).toEqual([]);
    expect(visibleMenu([product], features("mdm/product"), null)).toEqual([]);
  });
  it("checks the declared capabilities once the deployment's features carry them", () => {
    const m = definePageModule({ component: "infra/authz", contract: 3, capabilities: ["authz.delegation.single"] }, {
      name: "delegation", domain: "admin", messages: {}, routes: [{ path: "/d", component: {} }],
      menu: [{ key: "d", route: "/d", title: "t", operation: "op" }] });
    const ops = new Set(["op"]);
    expect(visibleMenu([m], features("infra/authz"), ops)).toHaveLength(1); // the features say nothing yet
    expect(visibleMenu([m], { components: [{ id: "infra/authz", version: "3.0.60", capabilities: ["authz.core"] }] }, ops)).toEqual([]);
  });
  it("refuses a declaration whose menu item has no operation or no route (FP02)", () => {
    expect(() => definePageModule({ component: "a/b", contract: 3 }, { name: "x", domain: "d", messages: {},
      routes: [], menu: [{ key: "k", route: "/r", title: "t", operation: "op" }] })).toThrow("has no route");
    expect(() => definePageModule({ component: "a/b", contract: 3 }, { name: "x", domain: "d", messages: {},
      routes: [{ path: "/r", component: {} }], menu: [{ key: "k", route: "/r", title: "t", operation: "" }] })).toThrow("no operation");
  });
});

describe("permissions (FP05)", () => {
  it("keeps the last answer when a refresh cannot be proven, and says it is stale", async () => {
    const answers: Fetched[] = [{ kind: "ok", operations: ["a"] }, { kind: "retry" }];
    const p = new Permissions(async () => answers.shift()!, () => 0);
    await p.refresh(false);
    await p.refresh(true);
    expect([...p.keys!]).toEqual(["a"]);
    expect(p.stale).toBe(true);
  });
  it("asks again after a 403 at most once in 30 seconds", async () => {
    let t = 0;
    const f = vi.fn(async (): Promise<Fetched> => ({ kind: "ok", operations: [] }));
    const p = new Permissions(f, () => t);
    await p.denied();
    t = 10_000;
    await p.denied();
    t = 31_000;
    await p.denied();
    expect(f).toHaveBeenCalledTimes(2);
  });
});

describe("the session (FP06)", () => {
  it("logs in with the current path, encoded; never back to the logged-out page", () => {
    expect(loginUrl("/purchase/requisitions", "?state=draft&x=1")).toBe("/api/iam/login?return_to=%2Fpurchase%2Frequisitions%3Fstate%3Ddraft%26x%3D1");
    expect(loginUrl("/logged-out")).toBe("/api/iam/login?return_to=%2F");
    expect(loginUrl("//evil.example/x")).toBe("/api/iam/login?return_to=%2F");
  });
  it("the gate: features in a live session, the login on 401, retry otherwise", () => {
    expect(gateOf({ kind: "ok", status: 200, body: { components: [] } })).toEqual({ kind: "in", features: { components: [] } });
    expect(gateOf({ kind: "login" })).toEqual({ kind: "login" });
    expect(gateOf({ kind: "retry", reason: "DEPENDENCY_UNAVAILABLE" })).toEqual({ kind: "retry" });
  });
  it("a logout tells the other tabs, clears, shows the logged-out page; the others follow", async () => {
    const calls: string[] = [];
    const b = { navigate: (u: string) => calls.push("go " + u), clear: async () => { calls.push("clear"); },
      post: (m: unknown) => calls.push("post " + JSON.stringify(m)) };
    await loggedOut(b);
    expect(calls).toEqual(['post {"type":"logout"}', "clear", "go /logged-out"]);
    calls.length = 0;
    await onMessage(b, { type: "other" });
    await onMessage(b, { type: "logout" });
    expect(calls).toEqual(["clear", "go /logged-out"]);
  });
});
