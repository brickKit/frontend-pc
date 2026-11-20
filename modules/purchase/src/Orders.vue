<script setup lang="ts">
import { ListView } from "@be/shell";
</script>

<template>
  <ListView
    module="purchase"
    heading="purchase.orders"
    path="/api/purchase/orders"
    field="orders"
    per-legal-entity
    :columns="[{ field: 'number', title: 'purchase.number' }, { field: 'supplier', title: 'purchase.supplier' },
               { field: 'business_date', title: 'purchase.date' }, { field: 'total', title: 'purchase.total' },
               { field: 'state', title: 'purchase.state' }]"
    :detail="(r) => `/purchase/orders/${r.id}`"
  />
</template>
