<script setup lang="ts">
import { DetailView } from "@be/shell";
import { useRoute } from "vue-router";

const route = useRoute();
</script>

<template>
  <DetailView
    module="partner"
    heading="partner.partner"
    :path="`/api/partner/partners/${route.params.id}`"
    :fields="[{'field': 'name', 'title': 'partner.name'}, {'field': 'kind', 'title': 'partner.kind'}, {'field': 'country', 'title': 'partner.country'}, {'field': 'tax_id', 'title': 'partner.tax_id'}, {'field': 'state', 'title': 'partner.state'}, {'field': 'updated_at', 'title': 'partner.updated'}]"
  />
</template>
