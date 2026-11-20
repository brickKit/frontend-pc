import { definePageModule } from "@be/shell/module";
import pkg from "../package.json";
import messages from "./messages.ts";

export default definePageModule(pkg.bePageModule, {
  name: "sales",
  domain: "trade",
  messages,
  routes: [
    { path: "/sales/orders", component: () => import("./Orders.vue") },
    { path: "/sales/orders/:id", component: () => import("./Order.vue") },
  ],
  menu: [
    { key: "orders", route: "/sales/orders", title: "sales.orders", operation: "erp.sales.order.read" },
  ],
});
