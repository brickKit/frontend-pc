import { definePageModule } from "@be/shell/module";
import pkg from "../package.json";
import messages from "./messages.ts";

export default definePageModule(pkg.bePageModule, {
  name: "partner",
  domain: "master",
  messages,
  routes: [
    { path: "/partner/partners", component: () => import("./Partners.vue") },
    { path: "/partner/partners/:id", component: () => import("./Partner.vue") },
  ],
  menu: [
    { key: "partners", route: "/partner/partners", title: "partner.partners", operation: "mdm.partner.read" },
  ],
});
