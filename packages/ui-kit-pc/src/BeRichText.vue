<script setup lang="ts">
// Rich text, cleaned by the allowlist before it reaches the DOM (FP20, UI17).
import { computed } from "vue";
import { sanitize } from "./richtext.ts";

const props = defineProps<{ html: string }>();
const clean = computed(() => sanitize(props.html));
</script>

<template>
  <!-- the html is cleaned by sanitize() above -->
  <!-- eslint-disable vue/no-v-html -->
  <div
    class="be-rich-text"
    v-html="clean"
  />
  <!-- eslint-enable vue/no-v-html -->
</template>
