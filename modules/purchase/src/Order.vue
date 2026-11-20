<script setup lang="ts">
import { DetailView } from "@be/shell";
import { useRoute } from "vue-router";

const route = useRoute();
</script>

<template>
  <DetailView
    module="purchase"
    heading="purchase.order"
    :path="`/api/purchase/orders/${route.params.id}`"
    :fields="[{ field: 'number', title: 'purchase.number' }, { field: 'supplier', title: 'purchase.supplier' },
              { field: 'business_date', title: 'purchase.date' }, { field: 'currency', title: 'purchase.currency' },
              { field: 'total', title: 'purchase.total' }, { field: 'state', title: 'purchase.state' }]"
  />
</template>
