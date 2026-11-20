<script setup lang="ts">
import { ListView } from "@be/shell";
</script>

<template>
  <ListView
    module="product"
    heading="product.products"
    path="/api/product/products"
    field="products"
    :columns="[{'field': 'code', 'title': 'product.code'}, {'field': 'name', 'title': 'product.name'}, {'field': 'kind', 'title': 'product.kind'}, {'field': 'base_unit', 'title': 'product.unit'}, {'field': 'state', 'title': 'product.state'}]"
    :detail="(r) => `/product/products/${r.id}`"
  />
</template>
