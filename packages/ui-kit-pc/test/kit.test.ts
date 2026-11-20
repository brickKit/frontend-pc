import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { ConfigProvider, theme } from "ant-design-vue";
import { defineComponent, h, nextTick } from "vue";
import BeTheme from "../src/BeTheme.vue";
import { safeCell, toCsv } from "../src/export.ts";
import BeListPage from "../src/templates/BeListPage.vue";
import BeFormPage from "../src/templates/BeFormPage.vue";
import { tableVariables, themeConfig, type Look } from "../src/theme.ts";
import seed from "../../../tokens/seed.json";

describe("exports (FP20, UI18)", () => {
  it("a cell that would run as a formula gets an apostrophe", () => {
    expect(["=SUM(A1)", "+1", "-1", "@cmd", "\tx", "\rx"].map(safeCell)).toEqual(["'=SUM(A1)", "'+1", "'-1", "'@cmd", "'\tx", "'\rx"]);
    expect([12, "a=b", null, undefined].map(safeCell)).toEqual(["12", "a=b", "", ""]);
  });
  it("CSV quotes every cell and doubles quotes", () => {
    expect(toCsv([["a\"b", "=1"]])).toBe('"a""b","\'=1"\r\n');
  });
});

describe("the theme (FP12)", () => {
  // the derived tokens as the provider gives them to its children
  const variablesOf = async (look: Look) => {
    let got: Record<string, string> = {};
    const Probe = defineComponent({ setup() {
      const { token } = theme.useToken();
      got = tableVariables(token.value);
      return () => null;
    } });
    mount(defineComponent({ setup: () => () => h(ConfigProvider, { theme: themeConfig(look) }, () => h(Probe)) }));
    await nextTick();
    return got;
  };
  it("derives the table's variables from the seed, and the deployment's primary color wins", async () => {
    expect((await variablesOf({ mode: "light", density: "default" }))["--vxe-ui-font-primary-color"]).toBe(seed.colorPrimary);
    expect((await variablesOf({ mode: "light", density: "default", primary: "#00aa55" }))["--vxe-ui-font-primary-color"]).toBe("#00aa55");
  });
  it("dark and compact change the derived values together", async () => {
    const light = await variablesOf({ mode: "light", density: "default" });
    const dark = await variablesOf({ mode: "dark", density: "compact" });
    expect(dark["--vxe-ui-layout-background-color"]).not.toBe(light["--vxe-ui-layout-background-color"]);
    expect(dark["--vxe-ui-table-row-height-default"]).not.toBe(light["--vxe-ui-table-row-height-default"]);
  });
  it("BeTheme writes the variables on the root element with the look", async () => {
    const look: Look = { mode: "dark", density: "compact" };
    mount(BeTheme, { props: { look } });
    await nextTick();
    const want = await variablesOf(look);
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.dataset.density).toBe("compact");
    for (const k of ["--vxe-ui-font-primary-color", "--vxe-ui-layout-background-color", "--be-gap"]) {
      expect(document.documentElement.style.getPropertyValue(k)).toBe(want[k]);
    }
  });
});

describe("templates (FP01)", () => {
  it("the list page lays out the page's slots under its title", () => {
    const w = mount(BeListPage, { props: { title: "Orders" },
      slots: { actions: "<button>New</button>", filters: "<input>", default: "<table></table>", paging: "<nav></nav>" } });
    expect(w.find("h1").text()).toBe("Orders");
    expect(w.find(".be-page-actions button").exists()).toBe(true);
    expect(w.find(".be-list-filters input").exists()).toBe(true);
    expect(w.find(".be-list-paging nav").exists()).toBe(true);
  });
  it("the form page has the notice line and the submit bar", () => {
    const w = mount(BeFormPage, { props: { title: "New" }, slots: { notice: "<p>draft</p>", submit: "<button>Send</button>" } });
    expect(w.find(".be-form-notice p").text()).toBe("draft");
    expect(w.find(".be-form-submit button").exists()).toBe(true);
  });
});
