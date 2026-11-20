// The shell's entry: the kit, the routes of every module in the build, the languages, the start (FP06's gate).
import { installKit } from "@be/ui-kit-pc";
import { createApp } from "vue";
import { createI18n } from "vue-i18n";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";
import Home from "./Home.vue";
import { messages } from "./messages.ts";
import { modules, start, state } from "./state.ts";

// every module's texts under its own name, the module names and domains for the selector
const all: Record<string, Record<string, unknown>> = structuredClone(messages);
for (const m of modules) {
  for (const [locale, texts] of Object.entries(m.messages)) {
    const target = (all[locale] ??= {}) as Record<string, Record<string, unknown>>;
    target[m.name] = texts;
  }
}
const i18n = createI18n({ legacy: false, locale: state.prefs.language, fallbackLocale: "en-US", messages: all as never });
const router = createRouter({ history: createWebHistory(), routes: [
  { path: "/", component: Home },
  { path: "/logged-out", component: Home },
  ...modules.flatMap((m) => m.routes),
] });
const app = createApp(App).use(router).use(i18n);
installKit(app);
app.mount("#app");
void start();
