<script setup lang="ts">
// The form template: a title, a notice line (a draft kept offline, a changed revision), the fields, the submit bar.
defineProps<{ title: string }>();
</script>

<template>
  <section class="be-page be-form-page">
    <header class="be-page-head">
      <h1 class="be-page-title">
        {{ title }}
      </h1>
    </header>
    <div class="be-form-notice">
      <slot name="notice" />
    </div>
    <slot />
    <footer class="be-form-submit">
      <slot name="submit" />
    </footer>
  </section>
</template>
