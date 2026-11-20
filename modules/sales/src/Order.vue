<script setup lang="ts">
import { DetailView } from "@be/shell";
import { useRoute } from "vue-router";

const route = useRoute();
</script>

<template>
  <DetailView
    module="sales"
    heading="sales.order"
    :path="`/api/sales/orders/${route.params.id}`"
    :fields="[{'field': 'number', 'title': 'sales.number'}, {'field': 'customer', 'title': 'sales.customer'}, {'field': 'business_date', 'title': 'sales.date'}, {'field': 'currency', 'title': 'sales.currency'}, {'field': 'totals', 'title': 'sales.totals'}, {'field': 'state', 'title': 'sales.state'}]"
  />
</template>
