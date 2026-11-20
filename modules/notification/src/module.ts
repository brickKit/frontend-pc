import { definePageModule } from "@be/shell/module";
import pkg from "../package.json";
import messages from "./messages.ts";

export default definePageModule(pkg.bePageModule, {
  name: "notification",
  domain: "work",
  messages,
  routes: [{ path: "/notification/messages", component: () => import("./Messages.vue") }],
  menu: [{ key: "messages", route: "/notification/messages", title: "notification.messages",
    operation: "infra.notification.message.read" }],
});
