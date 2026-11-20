// The writing rules (FP01, FP14, FP17): Composition API with <script setup> only, no bare text in templates, and
// third-party UI only inside packages/ui-kit-pc. Each rule has a violating sample in scripts/lint-samples/ that
// `pnpm lint:proof` shows red.
import js from "@eslint/js";
import vue from "eslint-plugin-vue";
import globals from "globals";
import ts from "typescript-eslint";

const thirdPartyUI = ["ant-design-vue", "ant-design-vue/*", "vxe-table", "vxe-table/*", "vxe-pc-ui", "vxe-pc-ui/*",
  "echarts", "echarts/*", "dompurify"];

export default [
  { ignores: ["**/dist/**", "**/node_modules/**", "packages/api/src/generated/**", "scripts/lint-samples/**",
    "**/modules.generated.ts"] },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...vue.configs["flat/recommended"],
  {
    files: ["**/*.vue"],
    languageOptions: { parserOptions: { parser: ts.parser, extraFileExtensions: [".vue"] } },
  },
  {
    files: ["**/*.{ts,vue}"],
    languageOptions: { globals: { ...globals.browser } },
    rules: {
      "vue/component-api-style": ["error", ["script-setup"]],
      "vue/block-lang": ["error", { script: { lang: "ts" } }],
      "vue/no-bare-strings-in-template": "error",
      "vue/multi-word-component-names": "off",
    },
  },
  {
    // pages and the shell use the kit's wrappers, never the third-party UI itself (FP01)
    files: ["**/modules/**/*.{ts,vue}", "packages/shell/**/*.{ts,vue}", "packages/api/**/*.ts"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [{ group: thirdPartyUI,
        message: "third-party UI only in packages/ui-kit-pc (FP01): use its wrapper" }] }],
    },
  },
  // a test may define small components inline
  { files: ["**/test/**/*.ts"], rules: { "vue/one-component-per-file": "off" } },
  { files: ["scripts/**/*.{js,mjs}", "packages/*/scripts/**/*.ts", "*.js", "*.ts"],
    languageOptions: { globals: { ...globals.node } } },
];
