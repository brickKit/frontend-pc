<script setup lang="ts">
import { ListView } from "@be/shell";
import { BeButton } from "@be/ui-kit-pc";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

const { t } = useI18n();
const router = useRouter();
</script>

<template>
  <div>
    <BeButton
      type="primary"
      @click="router.push('/purchase/requisitions/new')"
    >
      {{ t("purchase.newRequisition") }}
    </BeButton>
    <ListView
      module="purchase"
      heading="purchase.requisitions"
      path="/api/purchase/requisitions"
      field="requisitions"
      per-legal-entity
      :columns="[{ field: 'number', title: 'purchase.number' }, { field: 'state', title: 'purchase.state' },
                 { field: 'updated_at', title: 'purchase.updated' }]"
      :detail="(r) => `/purchase/requisitions/${r.id}`"
    />
  </div>
</template>
