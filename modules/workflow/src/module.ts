import { definePageModule } from "@be/shell/module";
import pkg from "../package.json";
import messages from "./messages.ts";

export default definePageModule(pkg.bePageModule, {
  name: "workflow",
  domain: "work",
  messages,
  routes: [
    { path: "/workflow/tasks", component: () => import("./Tasks.vue") },
    { path: "/workflow/done", component: () => import("./Tasks.vue"), props: { done: true } },
    { path: "/workflow/tasks/:id", component: () => import("./Task.vue") },
  ],
  menu: [
    { key: "tasks", route: "/workflow/tasks", title: "workflow.tasks", operation: "infra.workflow.task.read" },
    { key: "done", route: "/workflow/done", title: "workflow.done", operation: "infra.workflow.task.read" },
  ],
});
