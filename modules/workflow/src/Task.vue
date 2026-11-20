<script setup lang="ts">
// A task and its decision (FP09): approve or reject straight at the task's own component, with the task's version and
// an idempotency key kept for "ask again"; every refusal shown by its reason (P17.10).
import { OutcomeAlert, api, newKey, type Outcome as Result } from "@be/shell";
import { BeAlert, BeButton, BeDescriptions, BeDescriptionsItem, BeDetailPage, BeInput, BeSpace } from "@be/ui-kit-pc";
import type { Answer, infraWorkflow } from "@be/api";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { decisionPath, type Decision } from "./decide.ts";

type Item = Answer<infraWorkflow.paths, "/api/workflow/tasks/{id}", "get">;
interface Task { id: string; component: string; version: number; state: string;
  summary: { title: string; fields: { key: string; label: string; value: string }[] } }
const route = useRoute();
const { t } = useI18n();
const item = ref<Item | null>(null);
const outcome = ref<Result | null>(null);
const comment = ref("");
const sent = ref(false);
let pending: { key: string; body: Decision } | null = null; // an unconfirmed decision is asked again with its key
const task = computed(() => item.value?.task as Task | undefined);

async function load() {
  const out = await api("GET", `/api/workflow/tasks/${route.params.id}?component=${encodeURIComponent(String(route.query.component))}`);
  if (out.kind === "ok") item.value = out.body as Item;
  else outcome.value = out;
}
async function decide(decision: "approve" | "reject") {
  const tk = task.value;
  if (!tk) return;
  pending = { key: newKey(), body: { version: tk.version, decision, comment: comment.value || null } };
  await send();
}
async function send() {
  if (!pending || !task.value) return;
  const out = await api("POST", decisionPath(task.value.component, task.value.id), { body: pending.body, idempotencyKey: pending.key });
  outcome.value = out.kind === "ok" ? null : out;
  if (out.kind === "ok") sent.value = true;
  if (out.kind !== "unconfirmed" && out.kind !== "in-progress") pending = null; // known: a new decision gets a new key
}
watch(() => route.params.id, load, { immediate: true });
</script>

<template>
  <BeDetailPage
    :title="task?.summary.title ?? t('workflow.task')"
    :state="task?.state"
  >
    <OutcomeAlert
      :outcome="outcome"
      module="workflow"
      @retry="pending ? send() : load()"
    />
    <BeAlert
      v-if="sent"
      type="success"
      :message="t('workflow.decided')"
    />
    <BeDescriptions
      v-if="task"
      bordered
      :column="1"
    >
      <BeDescriptionsItem
        v-for="f in task.summary.fields"
        :key="f.key"
        :label="f.label"
      >
        {{ f.value }}
      </BeDescriptionsItem>
    </BeDescriptions>
    <BeSpace
      v-if="task && task.state === 'pending' && !sent"
      direction="vertical"
    >
      <BeInput
        v-model:value="comment"
        :placeholder="t('workflow.comment')"
      />
      <BeSpace>
        <BeButton
          type="primary"
          @click="decide('approve')"
        >
          {{ t("workflow.approve") }}
        </BeButton>
        <BeButton
          danger
          @click="decide('reject')"
        >
          {{ t("workflow.reject") }}
        </BeButton>
      </BeSpace>
    </BeSpace>
  </BeDetailPage>
</template>
