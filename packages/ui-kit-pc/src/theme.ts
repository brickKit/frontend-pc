// FP12: Ant Design Vue's seed tokens are the one source of every color and size. The kit derives the full token set
// with the theme's algorithms (light or dark, default or compact density, switched together) and from it the CSS
// variables vxe-table reads, so a table looks like the rest of the page. The deployment's primary color (runtime
// configuration, FP11) overrides the seed's. Pages never write a color or a size (scripts/check-styles.mjs).
import { theme } from "ant-design-vue";
import type { GlobalToken } from "ant-design-vue/es/theme/interface";
import seed from "../../../tokens/seed.json";

export type Mode = "light" | "dark";
export type Density = "default" | "compact";

export interface Look {
  mode: Mode;
  density: Density;
  primary?: string; // the deployment's brand color
}

export function themeConfig(look: Look) {
  const algorithm = [look.mode === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
    ...(look.density === "compact" ? [theme.compactAlgorithm] : [])];
  return { algorithm, token: { ...seed, ...(look.primary ? { colorPrimary: look.primary } : {}) } };
}

/** The CSS variables vxe-table and the kit's layout read, from the derived tokens (useToken inside the provider). */
export function tableVariables(t: GlobalToken): Record<string, string> {
  const px = (n: number) => `${n}px`;
  return {
    "--vxe-ui-font-color": t.colorText,
    "--vxe-ui-font-primary-color": t.colorPrimary,
    "--vxe-ui-font-disabled-color": t.colorTextDisabled,
    "--vxe-ui-font-size-default": px(t.fontSize),
    "--vxe-ui-layout-background-color": t.colorBgContainer,
    "--vxe-ui-base-popup-border-color": t.colorBorderSecondary,
    "--vxe-ui-border-radius": px(t.borderRadius),
    "--vxe-ui-table-border-color": t.colorBorderSecondary,
    "--vxe-ui-table-border-radius": px(t.borderRadius),
    "--vxe-ui-table-header-background-color": t.colorFillAlter,
    "--vxe-ui-table-row-hover-background-color": t.controlItemBgHover,
    "--vxe-ui-table-row-height-default": px(t.controlHeight + 8),
    "--vxe-ui-table-row-height-medium": px(t.controlHeight + 4),
    "--vxe-ui-table-row-height-small": px(t.controlHeight),
    "--vxe-ui-table-row-height-mini": px(t.controlHeightSM),
    "--vxe-ui-table-validate-error-color": t.colorError,
    // the kit's own layout (kit.css)
    "--be-gap": px(t.padding),
    "--be-gap-small": px(t.paddingXS),
    "--be-title-size": px(t.fontSizeHeading4),
  };
}

/** Writes the variables on the root element, with the look it came from. */
export function applyVariables(vars: Record<string, string>, look: Look, root: HTMLElement = document.documentElement): void {
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
  root.dataset.theme = look.mode;
  root.dataset.density = look.density;
}
