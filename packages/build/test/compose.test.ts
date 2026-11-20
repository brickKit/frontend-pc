import { describe, expect, it } from "vitest";
import { compose, generated, major, parseBaseline } from "../src/compose.ts";

const baseline = parseBaseline({ components: [{ id: "erp/purchase", version: "3.0.27" }, { id: "mdm/product", version: "3.0.49" },
  { id: "infra/workflow", version: "3.0.13" }] });
const mod = (name: string, component: string, contract = 3, needs: string[] = []) =>
  ({ name, declared: { component, contract, needs } });

describe("compose (FP03)", () => {
  it("takes a module whose component and needs are in the baseline at its contract major", () => {
    const c = compose(baseline, [mod("purchase", "erp/purchase", 3, ["infra/workflow"])]);
    expect(c.included).toEqual([{ name: "purchase", component: "erp/purchase", version: "3.0.27" }]);
    expect(c.excluded).toEqual([]);
  });
  it("leaves out a module whose component is not selected (UI01: no inventory, no inventory pages)", () => {
    const c = compose(baseline, [mod("inventory", "erp/inventory")]);
    expect(c.included).toEqual([]);
    expect(c.excluded).toEqual([{ name: "inventory", reason: "not in the baseline: erp/inventory" }]);
  });
  it("leaves out a module whose need is missing, naming it", () => {
    const c = compose(baseline, [mod("product", "mdm/product", 3, ["erp/inventory"])]);
    expect(c.excluded[0]?.reason).toBe("not in the baseline: erp/inventory");
  });
  it("leaves out a module built for another contract major", () => {
    const c = compose(baseline, [mod("workflow", "infra/workflow", 4)]);
    expect(c.excluded[0]?.reason).toContain("is contract 3, the module needs 4");
  });
  it("imports only the included modules", () => {
    const c = compose(baseline, [mod("purchase", "erp/purchase"), mod("inventory", "erp/inventory")]);
    const text = generated(c, "baseline/standard.yaml");
    expect(text).toContain('import m0 from "../../../modules/purchase/src/module.ts";');
    expect(text).not.toContain("modules/inventory/");
    expect(text).toContain("// left out: inventory: not in the baseline: erp/inventory");
  });
  it("refuses a baseline listing a component twice or without a version", () => {
    expect(() => parseBaseline({ components: [{ id: "a/b", version: "3.0.0" }, { id: "a/b", version: "3.0.1" }] })).toThrow("twice");
    expect(() => parseBaseline({ components: [{ id: "a/b" }] })).toThrow("without id or version");
    expect(() => major("x")).toThrow();
  });
});
