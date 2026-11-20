<script setup lang="ts">
// The theme in one place (FP12): the provider gets the seed with the look's algorithms; inside it the derived tokens
// become the CSS variables vxe-table and the kit read, written again whenever the look changes.
import { ConfigProvider, theme } from "ant-design-vue";
import { computed, defineComponent, watchEffect } from "vue";
import { applyVariables, tableVariables, themeConfig, type Look } from "./theme.ts";

const props = defineProps<{ look: Look }>();
const config = computed(() => themeConfig(props.look));

// a child of the provider: useToken reads the provider's derived tokens
const Variables = defineComponent({
  props: { look: { type: Object as () => Look, required: true } },
  setup(p) {
    const { token } = theme.useToken();
    watchEffect(() => applyVariables(tableVariables(token.value), p.look));
    return () => null;
  },
});
</script>

<template>
  <ConfigProvider :theme="config">
    <Variables :look="look" />
    <slot />
  </ConfigProvider>
</template>
