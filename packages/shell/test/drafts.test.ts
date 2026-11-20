import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it } from "vitest";
import { Drafts, DraftsFull, KEEP_MS, idbStore, memoryStore, type DraftStore } from "../src/drafts.ts";

const form = { version: 2, fields: ["title", "lines"] };

for (const [name, make] of [["memory", () => memoryStore()], ["IndexedDB", () => idbStore(new IDBFactory())]] as
  [string, () => DraftStore][]) {
  describe(`drafts in ${name} (FP13, D24)`, () => {
    it("keeps only the allowed fields: a restricted field never enters (UI14)", async () => {
      const d = new Drafts(make(), "u1", () => 0);
      const saved = await d.save("purchase.requisition", form, "LE1", "n1", { title: "a", lines: [1], unit_price: "9.99" });
      expect(saved.values).toEqual({ title: "a", lines: [1] });
      expect(saved.formVersion).toBe(2);
      expect((await d.list("LE1"))[0]!.values).toEqual({ title: "a", lines: [1] });
    });
    it("another user on the same terminal sees none of them (UI10); another legal entity is apart", async () => {
      const store = make();
      await new Drafts(store, "u1", () => 0).save("f", form, "LE1", "n1", { title: "a" });
      expect(await new Drafts(store, "u2", () => 0).list()).toEqual([]);
      expect(await new Drafts(store, "u1", () => 0).list("LE2")).toEqual([]);
    });
    it("expires after 7 days", async () => {
      const store = make();
      await new Drafts(store, "u1", () => 0).save("f", form, "LE1", "n1", { title: "a" });
      expect(await new Drafts(store, "u1", () => KEEP_MS + 1).list()).toEqual([]);
      expect(await store.all()).toEqual([]);
    });
    it("refuses a draft over 5 MiB per user", async () => {
      const d = new Drafts(make(), "u1", () => 0);
      await expect(d.save("f", form, "LE1", "n1", { title: "x".repeat(5 * 1024 * 1024) })).rejects.toBeInstanceOf(DraftsFull);
    });
    it("a shared terminal's logout clears local drafts, keeps one being submitted with its key (UI30)", async () => {
      const store = make();
      const d = new Drafts(store, "u1", () => 0);
      await d.save("f", form, "LE1", "local", { title: "a" });
      const s = await d.submitting(await d.save("f", form, "LE1", "sent", { title: "b" }), "key-1");
      await d.logout(true);
      const left = await d.list();
      expect(left.map((x) => [x.key.id, x.state, x.idempotencyKey])).toEqual([["sent", "submitting", "key-1"]]);
      await d.accepted(s);
      expect(await d.list()).toEqual([]);
    });
    it("a personal computer's logout keeps them; a refusal brings a submitted draft back to local (UI12)", async () => {
      const d = new Drafts(make(), "u1", () => 0);
      const s = await d.submitting(await d.save("f", form, "LE1", "n1", { title: "a" }), "k");
      await d.logout(false);
      const back = await d.refused(s);
      expect([back.state, back.idempotencyKey]).toEqual(["local", undefined]);
      expect((await d.list()).map((x) => x.state)).toEqual(["local"]);
    });
  });
}
