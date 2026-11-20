import { describe, expect, it } from "vitest";
import type { Visible } from "../src/access.ts";
import { definePageModule } from "../src/module.ts";
import { entries, groups, palette, Tabs } from "../src/navigation.ts";
import { defaultPrefs, loadPrefs, modeOf, savePrefs, visited } from "../src/prefs.ts";
import { runtimeConfig } from "../src/runtime.ts";

const mod = (name: string, domain: string, title: string) => {
  const m = definePageModule({ component: `x/${name}`, contract: 3 }, { name, domain, messages: {},
    routes: [{ path: `/${name}`, component: {} }], menu: [{ key: "k", route: `/${name}`, title, operation: "op" }] });
  return { module: m, items: m.menu } as Visible;
};
const titles: Record<string, string> = { "p.list": "Purchase requisitions", "s.list": "Sales orders", "n.list": "My messages" };
const t = (k: string) => titles[k] ?? k;
const visible = [mod("purchase", "supply", "p.list"), mod("sales", "trade", "s.list"), mod("notification", "work", "n.list")];

describe("navigation (FP10)", () => {
  it("groups by domain, favorites first, filtered by the query", () => {
    expect(groups(visible, "", ["sales"], t)).toEqual([{ domain: "favorites", modules: ["sales"] },
      { domain: "supply", modules: ["purchase"] }, { domain: "trade", modules: ["sales"] }, { domain: "work", modules: ["notification"] }]);
    expect(groups(visible, "orders", [], t)).toEqual([{ domain: "trade", modules: ["sales"] }]);
  });
  it("the palette finds items by every word of the query", () => {
    const all = entries(visible, t);
    expect(palette(all, "purchase req").map((e) => e.route)).toEqual(["/purchase"]);
    expect(palette(all, "  ")).toEqual([]);
  });
  it("a tab with an unsaved form closes only when the user confirms", () => {
    const tabs = new Tabs();
    tabs.open("/a", "A");
    tabs.open("/b", "B");
    tabs.open("/a", "A");
    expect(tabs.list.map((x) => x.route)).toEqual(["/a", "/b"]);
    tabs.mark("/b", true);
    expect(tabs.close("/b", () => false)).toBeUndefined();
    expect(tabs.list).toHaveLength(2);
    expect(tabs.close("/b", () => true)).toBe("/a");
    expect(tabs.close("/a", () => true)).toBeNull();
  });
});

describe("preferences and runtime configuration (FP11)", () => {
  it("defaults from the browser's language; storage that throws or holds garbage gives the defaults", () => {
    expect(defaultPrefs("zh-TW").language).toBe("zh-CN");
    expect(defaultPrefs("fr-FR").language).toBe("en-US");
    expect(loadPrefs({ getItem: () => { throw new Error("denied"); } }, "en-US")).toEqual(defaultPrefs("en-US"));
    expect(loadPrefs({ getItem: () => '{"theme":"neon","density":"compact","favorites":[1,"sales"]}' }, "en-US"))
      .toMatchObject({ theme: "system", density: "compact", favorites: ["sales"] });
    expect(() => savePrefs({ setItem: () => { throw new Error("full"); } }, defaultPrefs("en-US"))).not.toThrow();
  });
  it("following the system; the recent list", () => {
    expect(modeOf("system", true)).toBe("dark");
    expect(modeOf("light", true)).toBe("light");
    expect(visited(["a", "b"], "b")).toEqual(["b", "a"]);
  });
  it("the deployment's branding: checked, this site's logo only, defaults when absent", () => {
    expect(runtimeConfig(null).productName).toBe("BrickEnterprise");
    expect(runtimeConfig({ productName: "ACME ERP", primaryColor: "#00aa55", logoUrl: "https://x.example/l.png",
      watermark: "true", sharedTerminal: true })).toEqual({ productName: "ACME ERP", primaryColor: "#00aa55",
      logoUrl: undefined, watermark: true, gray: false, sharedTerminal: true });
    expect(runtimeConfig({ primaryColor: "red" }).primaryColor).toBeUndefined();
  });
});
