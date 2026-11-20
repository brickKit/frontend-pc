<script setup lang="ts">
// The settings template: a title and groups of settings, each saved on its own.
defineProps<{ title: string }>();
</script>

<template>
  <section class="be-page be-settings-page">
    <header class="be-page-head">
      <h1 class="be-page-title">
        {{ title }}
      </h1>
    </header>
    <slot />
  </section>
</template>
