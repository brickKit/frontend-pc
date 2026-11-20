<script setup lang="ts">
// My tasks or the ones I decided: the worklist's projection of every flow manager's tasks (D68).
import { OutcomeAlert, api, query, step, type Page } from "@be/shell";
import { BeButton, BeListPage, BeTable, BeTag } from "@be/ui-kit-pc";
import type { Answer, infraWorkflow } from "@be/api";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

type Row = Answer<infraWorkflow.paths, "/api/workflow/tasks", "get">["tasks"][number];
const props = defineProps<{ done?: boolean }>();
const { t } = useI18n();
const router = useRouter();
const page = ref<Page<Row>>({ rows: [], next: null, outcome: null });
const columns = computed(() => [{ field: "summary", title: t("workflow.summary") }, { field: "document", title: t("workflow.document") },
  { field: "received_at", title: t("workflow.received"), width: 200 }]);
const path = computed(() => (props.done ? "/api/workflow/tasks/done" : "/api/workflow/tasks"));

async function load(cursor: string | null) {
  const out = await api("GET", path.value + query({ cursor, limit: 50 }));
  page.value = step(cursor ? page.value : { rows: [], next: null, outcome: null }, "tasks", out);
}
watch(path, () => load(null), { immediate: true });
const task = (r: Row) => r.task as unknown as { id: string; component: string; summary: { title: string }; document: { number: string | null } };
</script>

<template>
  <BeListPage :title="t(done ? 'workflow.done' : 'workflow.tasks')">
    <OutcomeAlert
      :outcome="page.outcome"
      module="workflow"
      @retry="load(page.next)"
    />
    <BeTable
      :columns="columns"
      :rows="page.rows"
      @open="(r) => router.push(`/workflow/tasks/${task(r).id}?component=${encodeURIComponent(task(r).component)}`)"
    >
      <template #summary="{ row }">
        {{ task(row).summary.title }}
        <BeTag
          v-if="row.stale"
          color="warning"
        >
          {{ t("workflow.stale") }}
        </BeTag>
      </template>
      <template #document="{ row }">
        {{ task(row).document.number }}
      </template>
    </BeTable>
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
