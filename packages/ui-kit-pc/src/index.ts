// The kit: the only place third-party UI appears (FP01). Pages and the shell import from here.
import type { App } from "vue";
import "ant-design-vue/dist/reset.css";
// vxe-table alone: it takes only types from vxe-pc-ui, whose full install doubled the first load (C12 P5: the
// shell chunk 1522 kB -> 862 kB, its CSS 630 kB -> 154 kB)
import VxeTable from "vxe-table";
import "vxe-table/lib/style.css";
import "./kit.css";

export { default as BeTable, type Column } from "./BeTable.vue";
export { default as BeRichText } from "./BeRichText.vue";
export { default as BeListPage } from "./templates/BeListPage.vue";
export { default as BeDetailPage } from "./templates/BeDetailPage.vue";
export { default as BeFormPage } from "./templates/BeFormPage.vue";
export { default as BeSettingsPage } from "./templates/BeSettingsPage.vue";
export { safeCell, toCsv } from "./export.ts";
export { sanitize } from "./richtext.ts";
export { default as BeTheme } from "./BeTheme.vue";
export { applyVariables, tableVariables, themeConfig, type Density, type Look, type Mode } from "./theme.ts";
// Ant Design Vue's parts the pages use, under the kit's names
export {
  Alert as BeAlert, Button as BeButton, ConfigProvider as BeConfigProvider, Form as BeForm, FormItem as BeFormItem,
  Input as BeInput, InputNumber as BeInputNumber, Layout as BeLayout, LayoutContent as BeLayoutContent,
  LayoutHeader as BeLayoutHeader, LayoutSider as BeLayoutSider, Menu as BeMenu, MenuItem as BeMenuItem,
  Modal as BeModal, Result as BeResult, Select as BeSelect, Space as BeSpace, Spin as BeSpin, TabPane as BeTabPane,
  Tabs as BeTabs, Tag as BeTag, Descriptions as BeDescriptions, DescriptionsItem as BeDescriptionsItem,
  Pagination as BePagination, DatePicker as BeDatePicker, Empty as BeEmpty,
} from "ant-design-vue";

export function installKit(app: App): void {
  app.use(VxeTable);
}
