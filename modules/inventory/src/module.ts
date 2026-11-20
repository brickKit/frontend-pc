import { definePageModule } from "@be/shell/module";
import pkg from "../package.json";
import messages from "./messages.ts";

export default definePageModule(pkg.bePageModule, {
  name: "inventory",
  domain: "supply",
  messages,
  routes: [
    { path: "/inventory/positions", component: () => import("./Positions.vue") },
  ],
  menu: [
    { key: "positions", route: "/inventory/positions", title: "inventory.positions", operation: "erp.inventory.stock.read" },
  ],
});
