<script setup lang="ts">
// A record's detail (FP01's detail template): its fields as the owner answered them (masked ones said so), the
// actions the page adds in the slot, a not-found that looks the same as not visible (FP08).
import { BeDescriptions, BeDescriptionsItem, BeDetailPage } from "@be/ui-kit-pc";
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import Outcome from "./Outcome.vue";
import { api } from "./state.ts";
import type { Outcome as Result } from "./errors.ts";
import Value from "./Value.vue";

const props = defineProps<{ module: string; heading: string; path: string; fields: { field: string; title: string }[] }>();
const emit = defineEmits<{ loaded: [record: Record<string, unknown>] }>();
const { t } = useI18n();
const record = ref<Record<string, unknown> | null>(null);
const outcome = ref<Result | null>(null);

async function load() {
  const out = await api("GET", props.path);
  if (out.kind === "ok") {
    record.value = out.body as Record<string, unknown>;
    outcome.value = null;
    emit("loaded", record.value);
  } else {
    outcome.value = out;
  }
}
watch(() => props.path, load, { immediate: true });
defineExpose({ load });
</script>

<template>
  <BeDetailPage
    :title="t(heading)"
    :state="record ? String(record.state ?? '') : ''"
  >
    <template #actions>
      <slot
        name="actions"
        :record="record"
      />
    </template>
    <Outcome
      :outcome="outcome"
      :module="module"
      @retry="load"
    />
    <BeDescriptions
      v-if="record"
      bordered
      :column="2"
    >
      <BeDescriptionsItem
        v-for="f in fields"
        :key="f.field"
        :label="t(f.title)"
      >
        <Value
          :record="record"
          :field="f.field"
        />
      </BeDescriptionsItem>
    </BeDescriptions>
    <slot :record="record" />
  </BeDetailPage>
</template>
