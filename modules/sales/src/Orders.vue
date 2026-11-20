<script setup lang="ts">
import { ListView } from "@be/shell";
</script>

<template>
  <ListView
    module="sales"
    heading="sales.orders"
    path="/api/sales/orders"
    field="orders"
    :columns="[{'field': 'number', 'title': 'sales.number'}, {'field': 'customer', 'title': 'sales.customer'}, {'field': 'business_date', 'title': 'sales.date'}, {'field': 'currency', 'title': 'sales.currency'}, {'field': 'state', 'title': 'sales.state'}]"
    :detail="(r) => `/sales/orders/${r.id}`"
    per-legal-entity
  />
</template>
