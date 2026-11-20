<script setup lang="ts">
// The detail template: a title with the record's state, the actions, the sections; tabs for optional parts (FP02).
defineProps<{ title: string; state?: string }>();
</script>

<template>
  <section class="be-page be-detail-page">
    <header class="be-page-head">
      <h1 class="be-page-title">
        {{ title }}
      </h1>
      <span
        v-if="state"
        class="be-page-state"
      >{{ state }}</span>
      <div class="be-page-actions">
        <slot name="actions" />
      </div>
    </header>
    <slot />
  </section>
</template>
