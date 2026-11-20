// FP12: pages and the shell write no colors, sizes or spacing of their own: every one comes from the design tokens
// (CSS variables the kit derives from the seed). Scans <style> blocks of .vue files and .css files outside the kit's
// tokens for literal colors (#rgb, rgb(), hsl(), named colors are left to review) and pixel values; exits 1 listing them.
// Usage: node scripts/check-styles.mjs [root ...]  (default: modules packages/shell)
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const roots = process.argv.slice(2).length ? process.argv.slice(2) : ["modules", "packages/shell"];
const literal = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|\b\d*\.?\d+px\b/g;

function* files(dir) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* files(p);
    else if (p.endsWith(".vue") || p.endsWith(".css")) yield p;
  }
}

const found = [];
for (const root of roots) {
  for (const f of files(root)) {
    const text = readFileSync(f, "utf8");
    const blocks = f.endsWith(".css") ? [text] : [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
    for (const b of blocks) {
      for (const m of b.matchAll(literal)) found.push(`${f}: ${m[0]} (use a design token, FP12)`);
    }
  }
}
if (found.length) {
  console.error(found.join("\n"));
  process.exit(1);
}
