<script setup lang="ts">
import { ListView } from "@be/shell";
</script>

<template>
  <ListView
    module="partner"
    heading="partner.partners"
    path="/api/partner/partners"
    field="partners"
    :columns="[{'field': 'name', 'title': 'partner.name'}, {'field': 'kind', 'title': 'partner.kind'}, {'field': 'country', 'title': 'partner.country'}, {'field': 'tax_id', 'title': 'partner.tax_id'}, {'field': 'state', 'title': 'partner.state'}]"
    :detail="(r) => `/partner/partners/${r.id}`"
  />
</template>
