import { describe, expect, it } from "vitest";
import { businessDate, decimalsOf, instant, localized, money } from "../src/format.ts";
import { outdated } from "../src/version.ts";

// Intl separates a currency code with a no-break space
const plain = (s: string) => s.replace(/\u00a0/g, " ");

describe("formats (FP17)", () => {
  it("an amount takes its currency's decimals, three for KWD (UI16), none for JPY", () => {
    expect(decimalsOf("KWD")).toBe(3);
    expect(decimalsOf("JPY")).toBe(0);
    expect(plain(money("1234.5", "KWD", "en-US"))).toBe("KWD 1,234.500");
    expect(money("1234", "JPY", "en-US")).toBe("¥1,234");
    expect(money("1234.56", "CNY", "zh-CN")).toBe("¥1,234.56");
  });
  it("formats a long decimal exactly, never through a float", () => {
    expect(money("12345678901234567.89", "USD", "en-US")).toBe("$12,345,678,901,234,567.89");
  });
  it("refuses what is not a decimal string", () => {
    expect(() => money("1e3", "USD", "en-US")).toThrow();
    expect(() => businessDate("2026-11-20T00:00:00Z")).toThrow();
  });
  it("a business date stays as it is; an instant is in the legal entity's zone, named", () => {
    expect(businessDate("2026-11-20")).toBe("2026-11-20");
    expect(instant("2026-11-20T23:30:00Z", "Asia/Shanghai", "en-GB")).toBe("21/11/2026, 07:30 GMT+8");
  });
  it("data text falls back: the language, its primary subtag, the default", () => {
    const t = { default: "Widget", translations: { zh: "小部件", "en-GB": "Widget (GB)" } };
    expect(localized(t, "en-GB")).toBe("Widget (GB)");
    expect(localized(t, "zh-CN")).toBe("小部件");
    expect(localized(t, "de-DE")).toBe("Widget");
  });
});

describe("old clients (FP19, UI15)", () => {
  const running = { version: "3.0.0", commit: "abc" };
  it("offers a reload when the deployment serves another build", () => {
    expect(outdated(running, { version: "3.0.1", commit: "def" })).toBe(true);
    expect(outdated(running, { version: "3.0.0", commit: "abc" })).toBe(false);
  });
  it("an unreadable answer is not a new build", () => {
    expect(outdated(running, null)).toBe(false);
    expect(outdated(running, { version: 3 })).toBe(false);
  });
});
