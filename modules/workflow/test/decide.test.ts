import { describe, expect, it } from "vitest";
import { decisionPath } from "../src/decide.ts";
import module from "../src/module.ts";

const id = "0190f3a1-0000-7000-8000-0000000000aa";
describe("the worklist's decisions (FP09, P17.14)", () => {
  it("go to the task's own component, by its public prefix", () => {
    expect(decisionPath("erp/purchase", id)).toBe(`/api/purchase/flow/tasks/${id}/decisions`);
    expect(decisionPath("erp/payment", id)).toBe(`/api/payment/flow/tasks/${id}/decisions`);
  });
  it("refuse what is not a component ID and a task ID (no path from the projection)", () => {
    expect(() => decisionPath("../x", id)).toThrow();
    expect(() => decisionPath("erp/purchase", "../../admin")).toThrow();
  });
  it("the module needs the task read for both menu items", () => {
    expect(module.menu.map((m) => m.operation)).toEqual(["infra.workflow.task.read", "infra.workflow.task.read"]);
    expect(module.component).toBe("infra/workflow");
  });
});
