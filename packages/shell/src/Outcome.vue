<script setup lang="ts">
// FP08: one way to show what went wrong. "Try again" and "unconfirmed" offer the retry; a refusal shows its reason's
// text when the page's module has one (messages under <module>.reasons.<REASON>), else the generic line with the code.
import { BeAlert, BeButton } from "@be/ui-kit-pc";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { Outcome } from "./errors.ts";

const props = defineProps<{ outcome: Outcome | null; module?: string }>();
const emit = defineEmits<{ retry: [] }>();
const { t, te } = useI18n();

const text = computed(() => {
  const o = props.outcome;
  if (!o || o.kind === "ok") return "";
  switch (o.kind) {
    case "not-found": return t("error.notFound");
    case "denied": return t("error.denied");
    case "invalid": return t("error.invalid");
    case "retry": return t("error.retry");
    case "unconfirmed": return t("error.unconfirmed");
    case "in-progress": return t("error.inProgress");
    case "upgrade": return t("error.upgrade");
    case "login": return "";
    case "refused": {
      const key = `${props.module}.reasons.${o.reason}`;
      return props.module && te(key) ? t(key, o.metadata) : t("error.refused", { reason: o.reason });
    }
    case "defect": return t("error.defect", { reason: o.reason });
    default: return t("error.unknown", { reason: o.reason ?? String(o.status) });
  }
});
const retriable = computed(() => ["retry", "unconfirmed", "in-progress"].includes(props.outcome?.kind ?? ""));
</script>

<template>
  <BeAlert
    v-if="text"
    :type="retriable ? 'warning' : 'error'"
    :message="text"
    show-icon
  >
    <template
      v-if="retriable"
      #action
    >
      <BeButton
        size="small"
        @click="emit('retry')"
      >
        {{ outcome?.kind === "unconfirmed" ? t("error.ask") : t("shell.retry") }}
      </BeButton>
    </template>
  </BeAlert>
</template>
