import { definePageModule } from "@be/shell/module";
import pkg from "../package.json";
import messages from "./messages.ts";

export default definePageModule(pkg.bePageModule, {
  name: "product",
  domain: "master",
  messages,
  routes: [
    { path: "/product/products", component: () => import("./Products.vue") },
    { path: "/product/products/:id", component: () => import("./Product.vue") },
  ],
  menu: [
    { key: "products", route: "/product/products", title: "product.products", operation: "mdm.product.read" },
  ],
});
