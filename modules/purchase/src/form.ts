// The requisition form's draft rule (FP13): only these fields may be kept offline; the legal entity is the draft's
// isolation, not a field. The quantity is the decimal string the user typed, never a float.
import type { DraftForm } from "@be/shell";

export const REQUISITION = "purchase.requisition";
export const requisitionDraft: DraftForm = { version: 1, fields: ["department_id", "lines"] };

export interface Line {
  product_id: string;
  quantity: string;
  unit: string;
  needed_date: string | null;
}

/** The request body (RequisitionIn): lines without a product or a positive quantity are the user's to fix first. */
export function body(legalEntity: string, lines: Line[], department: string | null): { legal_entity_id: string;
  department_id: string | null; lines: Line[] } | null {
  const ok = lines.filter((l) => l.product_id && /^\d+(\.\d+)?$/.test(l.quantity) && Number(l.quantity) > 0 && l.unit);
  if (!ok.length || ok.length !== lines.length) return null;
  return { legal_entity_id: legalEntity, department_id: department, lines: ok };
}
