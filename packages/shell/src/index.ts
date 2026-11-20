// What page modules may use from the shell (FP01): the declaration, the backend, the features, the drafts, formats.
export { definePageModule, type DraftForm, type MenuItem, type PageModule } from "./module.ts";
export { api } from "./state.ts";
export type { Outcome } from "./errors.ts";
export { has } from "./access.ts";
export { Drafts, idbStore, type Draft } from "./drafts.ts";
export { businessDate, instant, localized, money } from "./format.ts";
export { newKey } from "./request.ts";
export { masked, query, step, type Page } from "./list.ts";
export { state } from "./state.ts";
export { default as ListView } from "./ListView.vue";
export { default as DetailView } from "./DetailView.vue";
export { default as OutcomeAlert } from "./Outcome.vue";
export { default as Value } from "./Value.vue";
