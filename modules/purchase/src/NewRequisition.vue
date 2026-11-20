<script setup lang="ts">
// A new requisition, with the offline draft rule (FP13, D24): when the server cannot be reached the form is kept as a
// local draft (this user, this legal entity, the allowed fields only); back online the user confirms its submission,
// which the backend checks as always; a draft is never shown as submitted.
import { Drafts, OutcomeAlert, api, idbStore, newKey, state, type Draft, type Outcome as Result } from "@be/shell";
import { BeAlert, BeButton, BeFormPage, BeInput, BeSpace } from "@be/ui-kit-pc";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { body, REQUISITION, requisitionDraft, type Line } from "./form.ts";

const { t } = useI18n();
const router = useRouter();
const lines = ref<Line[]>([{ product_id: "", quantity: "1", unit: "", needed_date: null }]);
const outcome = ref<Result | null>(null);
const offline = ref(false);
const drafts = ref<Draft[]>([]);
const store = () => new Drafts(idbStore(), state.user, Date.now);

async function refresh() {
  drafts.value = (await store().list(state.legalEntity)).filter((d) => d.key.form === REQUISITION);
}
async function create(b: NonNullable<ReturnType<typeof body>>, key: string): Promise<Result> {
  return api("POST", "/api/purchase/requisitions", { body: b, idempotencyKey: key });
}
async function save() {
  const le = state.legalEntity;
  const b = le ? body(le, lines.value, null) : null;
  if (!le || !b) return;
  const out = await create(b, newKey());
  if (out.kind === "ok") return router.push(`/purchase/requisitions/${(out.body as { id: string }).id}`);
  if (out.kind === "unconfirmed" || (out.kind === "retry" && out.reason === "NETWORK")) {
    // not reachable: kept offline; an unconfirmed create would be asked again by its key from the draft
    await store().save(REQUISITION, requisitionDraft, le, newKey(), { department_id: b.department_id, lines: b.lines });
    offline.value = true;
    await refresh();
    return;
  }
  outcome.value = out;
}
async function confirm(d: Draft) {
  const s = await store().submitting(d, d.idempotencyKey ?? newKey());
  const out = await create({ legal_entity_id: d.key.legalEntity, department_id: (d.values.department_id ?? null) as string | null,
    lines: d.values.lines as Line[] }, s.idempotencyKey!);
  if (out.kind === "ok") {
    await store().accepted(s);
    return router.push(`/purchase/requisitions/${(out.body as { id: string }).id}`);
  }
  if (out.kind !== "unconfirmed" && out.kind !== "retry" && out.kind !== "in-progress") await store().refused(s);
  outcome.value = out;
  await refresh();
}
onMounted(refresh);
</script>

<template>
  <BeFormPage :title="t('purchase.newRequisition')">
    <template #notice>
      <BeAlert
        v-if="offline"
        type="warning"
        :message="t('purchase.offline')"
      />
      <OutcomeAlert
        :outcome="outcome"
        module="purchase"
        @retry="save"
      />
    </template>
    <BeSpace
      v-for="(l, i) in lines"
      :key="i"
    >
      <BeInput
        v-model:value="l.product_id"
        :placeholder="t('purchase.product')"
      />
      <BeInput
        v-model:value="l.quantity"
        :placeholder="t('purchase.quantity')"
      />
      <BeInput
        v-model:value="l.unit"
        :placeholder="t('purchase.unit')"
      />
    </BeSpace>
    <BeButton @click="lines.push({ product_id: '', quantity: '1', unit: '', needed_date: null })">
      {{ t("purchase.addLine") }}
    </BeButton>
    <template #submit>
      <BeButton
        type="primary"
        @click="save"
      >
        {{ t("purchase.save") }}
      </BeButton>
    </template>
    <section v-if="drafts.length">
      <h3>{{ t("purchase.drafts") }}</h3>
      <BeSpace
        v-for="d in drafts"
        :key="d.key.id"
      >
        <span>{{ t("purchase.lines", { n: (d.values.lines as Line[]).length }) }}</span>
        <BeAlert
          v-if="d.formVersion !== requisitionDraft.version"
          type="info"
          :message="t('purchase.draftChanged')"
        />
        <BeButton @click="confirm(d)">
          {{ t("purchase.confirmSubmit") }}
        </BeButton>
      </BeSpace>
    </section>
  </BeFormPage>
</template>
