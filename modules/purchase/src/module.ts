import { definePageModule } from "@be/shell/module";
import pkg from "../package.json";
import { REQUISITION, requisitionDraft } from "./form.ts";
import messages from "./messages.ts";

export default definePageModule(pkg.bePageModule, {
  name: "purchase",
  domain: "supply",
  messages,
  drafts: { [REQUISITION]: requisitionDraft },
  routes: [
    { path: "/purchase/requisitions", component: () => import("./Requisitions.vue") },
    { path: "/purchase/requisitions/new", component: () => import("./NewRequisition.vue") },
    { path: "/purchase/requisitions/:id", component: () => import("./Requisition.vue") },
    { path: "/purchase/orders", component: () => import("./Orders.vue") },
    { path: "/purchase/orders/:id", component: () => import("./Order.vue") },
  ],
  menu: [
    { key: "requisitions", route: "/purchase/requisitions", title: "purchase.requisitions", operation: "erp.purchase.requisition.read" },
    { key: "orders", route: "/purchase/orders", title: "purchase.orders", operation: "erp.purchase.order.read" },
  ],
});
