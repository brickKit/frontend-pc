<script setup lang="ts">
// The list most pages are (FP01's list template): the owner's own default range, the legal entity the user switched
// to when the list is per legal entity (FP10), more rows by the cursor, every failure shown without emptying the list.
import { BeButton, BeListPage, BeTable, type Column } from "@be/ui-kit-pc";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { query, step, type Page } from "./list.ts";
import Outcome from "./Outcome.vue";
import { api, state } from "./state.ts";

const props = defineProps<{
  module: string;
  heading: string; // a message key
  path: string;
  field: string; // the answer's list
  columns: { field: string; title: string; width?: number }[];
  detail?: (row: Record<string, unknown>) => string;
  perLegalEntity?: boolean;
  params?: Record<string, string>;
}>();
const { t } = useI18n();
const router = useRouter();
const page = ref<Page<Record<string, unknown>>>({ rows: [], next: null, outcome: null });
const loading = ref(false);
const cols = computed<Column[]>(() => props.columns.map((c) => ({ ...c, title: t(c.title) })));

async function load(cursor: string | null) {
  loading.value = true;
  const le = props.perLegalEntity ? state.legalEntity : undefined;
  const out = await api("GET", props.path + query({ ...props.params, legal_entity_id: le, cursor, limit: 50 }));
  page.value = step(cursor ? page.value : { rows: [], next: null, outcome: null }, props.field, out);
  loading.value = false;
}
watch(() => [props.path, state.legalEntity], () => load(null), { immediate: true });
</script>

<template>
  <BeListPage :title="t(heading)">
    <Outcome
      :outcome="page.outcome"
      :module="module"
      @retry="load(page.next)"
    />
    <BeTable
      :columns="cols"
      :rows="page.rows"
      :loading="loading"
      @open="(row) => detail && router.push(detail(row))"
    />
    <template #paging>
      <BeButton
        v-if="page.next"
        @click="load(page.next)"
      >
        {{ t("shell.more") }}
      </BeButton>
    </template>
  </BeListPage>
</template>
