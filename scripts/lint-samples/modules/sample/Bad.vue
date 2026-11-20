<script lang="ts">
import { Button as AButton } from "ant-design-vue";
export default { components: { AButton }, data() { return { n: 1 }; } };
</script>
<template><AButton>Literal text {{ n }}</AButton></template>
<style scoped>
.x { color: #ff0000; padding: 8px; }
</style>
