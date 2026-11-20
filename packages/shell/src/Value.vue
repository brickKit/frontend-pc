<script setup lang="ts">
// A record's field as the owner answered it (FP08): masked fields say so, an empty one shows nothing.
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { masked } from "./list.ts";

const props = defineProps<{ record: Record<string, unknown> | null; field: string }>();
const { t } = useI18n();
const hidden = computed(() => masked(props.record, props.field));
const value = computed(() => {
  const v = props.record?.[props.field];
  return v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
});
</script>

<template>
  <span
    v-if="hidden"
    class="be-masked"
  >{{ t("error.masked") }}</span>
  <span v-else>{{ value }}</span>
</template>
