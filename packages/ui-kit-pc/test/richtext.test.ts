// @vitest-environment jsdom
// DOMPurify needs a full DOM to work at all; jsdom is one, as a browser is.
import { mount } from "@vue/test-utils";
import DOMPurify from "dompurify";
import { describe, expect, it, vi } from "vitest";
import BeRichText from "../src/BeRichText.vue";
import { sanitize } from "../src/richtext.ts";

describe("rich text (FP20, UI17)", () => {
  it("drops scripts, handlers, styles and javascript: links", () => {
    expect(DOMPurify.isSupported).toBe(true);
    const out = sanitize('<p onclick="x()">hi<script>alert(1)</script><img src=x onerror=alert(1)>' +
      '<a href="javascript:alert(1)">a</a><a href="https://ok.example/">b</a><span style="color:red">c</span></p>');
    expect(out).not.toMatch(/script|onclick|onerror|javascript|style|<img/);
    expect(out).toContain('<a href="https://ok.example/">b</a>');
    expect(out).toContain("hi");
  });
  it("the component shows only the cleaned html", () => {
    const w = mount(BeRichText, { props: { html: "<b>x</b><script>bad()</script><strong>y</strong>" } });
    expect(w.html()).not.toContain("<script");
    expect(w.html()).toContain("<strong>y</strong>");
  });
  it("where DOMPurify cannot work, the html is shown as text, never as html", () => {
    vi.spyOn(DOMPurify, "isSupported", "get").mockReturnValue(false);
    expect(sanitize("<script>x</script>")).toBe("&#60;script&#62;x&#60;/script&#62;");
    vi.restoreAllMocks();
  });
});
