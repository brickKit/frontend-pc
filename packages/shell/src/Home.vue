<script setup lang="ts">
// The landing page: the recently visited services (FP10).
import { BeButton, BeEmpty } from "@be/ui-kit-pc";
import { useI18n } from "vue-i18n";
import { state } from "./state.ts";

const { t } = useI18n();
</script>

<template>
  <section class="be-home">
    <h2>{{ t("shell.recent") }}</h2>
    <BeEmpty v-if="!state.prefs.recent.length" />
    <BeButton
      v-for="m in state.prefs.recent"
      :key="m"
      type="link"
    >
      {{ t(`${m}.title`) }}
    </BeButton>
  </section>
</template>

<style scoped>
.be-home { padding: var(--be-gap); }
</style>
