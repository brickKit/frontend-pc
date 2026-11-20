<script setup lang="ts">
import { ListView } from "@be/shell";
</script>

<template>
  <ListView
    module="inventory"
    heading="inventory.positions"
    path="/api/inventory/positions"
    field="positions"
    :columns="[{'field': 'product_id', 'title': 'inventory.product'}, {'field': 'warehouse_id', 'title': 'inventory.warehouse'}, {'field': 'on_hand', 'title': 'inventory.on_hand'}, {'field': 'reserved', 'title': 'inventory.reserved'}, {'field': 'available', 'title': 'inventory.available'}]"
  />
</template>
