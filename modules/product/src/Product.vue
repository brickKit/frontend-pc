<script setup lang="ts">
import { DetailView } from "@be/shell";
import { useRoute } from "vue-router";
import { ListView, has, state } from "@be/shell";
import { BeTabPane, BeTabs } from "@be/ui-kit-pc";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const route = useRoute();
</script>

<template>
  <DetailView
    module="product"
    heading="product.product"
    :path="`/api/product/products/${route.params.id}`"
    :fields="[{'field': 'code', 'title': 'product.code'}, {'field': 'name', 'title': 'product.name'}, {'field': 'kind', 'title': 'product.kind'}, {'field': 'base_unit', 'title': 'product.unit'}, {'field': 'state', 'title': 'product.state'}]"
  >
    <!-- the stock tab only when the deployment has erp/inventory (FP02's optional) -->
    <BeTabs v-if="has(state.features, 'erp/inventory')">
      <BeTabPane
        key="stock"
        :tab="t('product.stock')"
      >
        <ListView
          module="product"
          heading="product.stock"
          path="/api/inventory/positions"
          field="positions"
          :params="{ product_id: String(route.params.id) }"
          :columns="[{ field: 'warehouse_id', title: 'product.warehouse' }, { field: 'on_hand', title: 'product.on_hand' },
                     { field: 'reserved', title: 'product.reserved' }, { field: 'available', title: 'product.available' }]"
        />
      </BeTabPane>
    </BeTabs>
  </DetailView>
</template>
