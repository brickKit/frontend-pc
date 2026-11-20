<script setup lang="ts">
// A requisition; its requester submits a draft one (the approval then reaches the lead's worklist, D68).
import { DetailView, OutcomeAlert, api, newKey, type Outcome as Result } from "@be/shell";
import { BeButton } from "@be/ui-kit-pc";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";

const route = useRoute();
const { t } = useI18n();
const outcome = ref<Result | null>(null);
const view = ref<{ load: () => Promise<void> } | null>(null);
let key = newKey();

async function submit() {
  const out = await api("POST", `/api/purchase/requisitions/${route.params.id}/submit`, { idempotencyKey: key });
  outcome.value = out.kind === "ok" ? null : out;
  if (out.kind === "ok") {
    key = newKey();
    await view.value?.load();
  }
}
</script>

<template>
  <DetailView
    ref="view"
    module="purchase"
    heading="purchase.requisition"
    :path="`/api/purchase/requisitions/${route.params.id}`"
    :fields="[{ field: 'number', title: 'purchase.number' }, { field: 'state', title: 'purchase.state' },
              { field: 'reason', title: 'purchase.reason' }, { field: 'updated_at', title: 'purchase.updated' }]"
  >
    <template #actions="{ record }">
      <BeButton
        v-if="record?.state === 'draft'"
        type="primary"
        @click="submit"
      >
        {{ t("purchase.submit") }}
      </BeButton>
    </template>
    <OutcomeAlert
      :outcome="outcome"
      module="purchase"
      @retry="submit"
    />
  </DetailView>
</template>
