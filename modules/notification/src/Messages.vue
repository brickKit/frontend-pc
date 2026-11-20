<script setup lang="ts">
// My in-app messages (infra/notification): unread first if asked, mark one or all read, follow a message's link
// (a path on this site, as the owner gives it: FP20, never built here).
import { OutcomeAlert, api, newKey, query, step, type Page } from "@be/shell";
import { BeButton, BeListPage, BeSpace, BeTable, BeTag } from "@be/ui-kit-pc";
import type { Answer, infraNotification } from "@be/api";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

type Row = Answer<infraNotification.paths, "/api/notification/messages", "get">["messages"][number];
const { t } = useI18n();
const router = useRouter();
const unread = ref(false);
const page = ref<Page<Row>>({ rows: [], next: null, outcome: null });
const columns = computed(() => [{ field: "title", title: t("notification.subject") },
  { field: "created_at", title: t("notification.sent"), width: 200 }, { field: "actions", title: "", width: 220 }]);

async function load(cursor: string | null) {
  const out = await api("GET", "/api/notification/messages" + query({ unread: unread.value || undefined, cursor, limit: 50 }));
  page.value = step(cursor ? page.value : { rows: [], next: null, outcome: null }, "messages", out);
}
async function mark(path: string) {
  const out = await api("POST", path, { idempotencyKey: newKey() });
  if (out.kind === "ok") await load(null);
  else page.value = { ...page.value, outcome: out };
}
const local = (link: unknown) => typeof link === "string" && link.startsWith("/") && !link.startsWith("//");
watch(unread, () => load(null), { immediate: true });
</script>

<template>
  <BeListPage :title="t('notification.messages')">
    <template #actions>
      <BeButton @click="unread = !unread">
        {{ t("notification.unread") }}
      </BeButton>
      <BeButton @click="mark('/api/notification/messages/read-all')">
        {{ t("notification.readAll") }}
      </BeButton>
    </template>
    <OutcomeAlert
      :outcome="page.outcome"
      module="notification"
      @retry="load(null)"
    />
    <BeTable
      :columns="columns"
      :rows="page.rows"
    >
      <template #title="{ row }">
        {{ row.title }}
        <BeTag v-if="!row.read_at">
          {{ t("notification.unread") }}
        </BeTag>
        <BeTag v-if="row.withdrawn">
          {{ t("notification.withdrawn") }}
        </BeTag>
      </template>
      <template #actions="{ row }">
        <BeSpace>
          <BeButton
            v-if="local(row.link)"
            size="small"
            @click="router.push(String(row.link))"
          >
            {{ t("notification.open") }}
          </BeButton>
          <BeButton
            v-if="!row.read_at"
            size="small"
            @click="mark(`/api/notification/messages/${row.id}/read`)"
          >
            {{ t("notification.read") }}
          </BeButton>
        </BeSpace>
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
