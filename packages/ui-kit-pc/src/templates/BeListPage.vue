<script setup lang="ts">
// The list template: a title, the filters (with the owner's default range when none is chosen, FP18), the actions,
// the table, the paging. Pages fill the slots; the layout and spacing are the kit's.
defineProps<{ title: string }>();
</script>

<template>
  <section class="be-page be-list-page">
    <header class="be-page-head">
      <h1 class="be-page-title">
        {{ title }}
      </h1>
      <div class="be-page-actions">
        <slot name="actions" />
      </div>
    </header>
    <div class="be-list-filters">
      <slot name="filters" />
    </div>
    <slot />
    <footer class="be-list-paging">
      <slot name="paging" />
    </footer>
  </section>
</template>
