import vue from "@vitejs/plugin-vue";
import { readFileSync } from "node:fs";
import { defineConfig } from "vitest/config";

// FP19: the build's identity, in the bundle (__BUILD__) and in /version.json, which the shell compares every 5 minutes
const build = { version: JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")).version as string,
  commit: process.env.BE_COMMIT ?? "dev" };

// The entry is the shell's index.html; the output is the static site the image serves (FP15). Assets get content
// digests in their names (long caching); index.html, version.json and config.json do not.
export default defineConfig({
  root: "packages/shell",
  define: { __BUILD__: JSON.stringify(build) },
  plugins: [vue(), {
    name: "be-version",
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "version.json", source: JSON.stringify(build) + "\n" });
    },
  }],
  build: { outDir: "../../dist", emptyOutDir: true, sourcemap: false },
  test: {
    root: ".",
    include: ["packages/*/test/**/*.test.ts", "modules/*/test/**/*.test.ts"],
    environment: "happy-dom",
  },
});
