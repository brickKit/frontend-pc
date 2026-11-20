// FP11, FP15: the deployment's configuration, read at start from /config.json, which the static server writes from
// its environment when the container starts (never baked into the build). Missing or unreadable: the defaults.
export interface RuntimeConfig {
  productName: string;
  primaryColor?: string;
  logoUrl?: string;
  watermark: boolean; // the user's name over the pages
  gray: boolean; // a mourning day's gray mode
  sharedTerminal: boolean; // FP13: a logout clears the local drafts
}

export const defaults: RuntimeConfig = { productName: "BrickEnterprise", watermark: false, gray: false, sharedTerminal: false };

export function runtimeConfig(raw: unknown): RuntimeConfig {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const str = (k: string) => (typeof r[k] === "string" && r[k] !== "" ? (r[k] as string) : undefined);
  const flag = (k: string) => r[k] === true || r[k] === "true";
  const color = str("primaryColor");
  return { productName: str("productName") ?? defaults.productName,
    primaryColor: color && /^#[0-9a-fA-F]{6}$/.test(color) ? color : undefined,
    logoUrl: str("logoUrl")?.startsWith("/") ? str("logoUrl") : undefined, // this site only (FP20)
    watermark: flag("watermark"), gray: flag("gray"), sharedTerminal: flag("sharedTerminal") };
}
