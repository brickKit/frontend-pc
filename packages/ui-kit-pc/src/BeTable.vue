<script setup lang="ts" generic="Row extends Record<string, unknown>">
// The table every page uses (FP01: vxe-table only here). Columns are declared by the page; cells show the row's value
// as text unless the page fills the column's slot (named after the field). Its colors and heights come from the
// theme's variables (theme.ts).
import { VxeColumn, VxeTable } from "vxe-table";

export interface Column {
  field: string;
  title: string; // already translated by the page
  width?: number;
}

defineProps<{ columns: Column[]; rows: Row[]; loading?: boolean; rowKey?: string }>();
const emit = defineEmits<{ open: [row: Row] }>();
</script>

<template>
  <VxeTable
    :data="rows"
    :loading="loading"
    :row-config="{ keyField: rowKey ?? 'id', isHover: true }"
    border="inner"
    show-overflow
    @cell-click="({ row }: { row: Row }) => emit('open', row)"
  >
    <VxeColumn
      v-for="c in columns"
      :key="c.field"
      :field="c.field"
      :title="c.title"
      :width="c.width"
    >
      <template
        v-if="$slots[c.field]"
        #default="{ row }"
      >
        <slot
          :name="c.field"
          :row="row"
        />
      </template>
    </VxeColumn>
  </VxeTable>
</template>
