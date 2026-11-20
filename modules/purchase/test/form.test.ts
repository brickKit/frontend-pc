import { describe, expect, it } from "vitest";
import { body, requisitionDraft } from "../src/form.ts";
import module from "../src/module.ts";

const p = "0190f3a1-0000-7000-8000-000000000001";
describe("the requisition form (FP13)", () => {
  it("builds the request with decimal strings, refuses an incomplete line", () => {
    expect(body("LE", [{ product_id: p, quantity: "2.5", unit: "PCS", needed_date: null }], null))
      .toEqual({ legal_entity_id: "LE", department_id: null, lines: [{ product_id: p, quantity: "2.5", unit: "PCS", needed_date: null }] });
    expect(body("LE", [{ product_id: p, quantity: "0", unit: "PCS", needed_date: null }], null)).toBeNull();
    expect(body("LE", [{ product_id: "", quantity: "1", unit: "PCS", needed_date: null }], null)).toBeNull();
    expect(body("LE", [{ product_id: p, quantity: "1e3", unit: "PCS", needed_date: null }], null)).toBeNull();
  });
  it("its draft keeps the lines and the department only, declared in the module", () => {
    expect(requisitionDraft.fields).toEqual(["department_id", "lines"]);
    expect(module.drafts["purchase.requisition"]).toBe(requisitionDraft);
    expect(module.needs).toEqual(["mdm/product"]);
  });
});
