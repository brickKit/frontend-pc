<script setup lang="ts">
// The shell (FP10): the service selector, the module's flat menu, the app tabs, the command palette, the preferences,
// the logout; the theme from the preferences and the deployment's branding (FP11, FP12).
import { BeAlert, BeButton, BeInput, BeLayout, BeLayoutContent, BeLayoutHeader, BeLayoutSider, BeMenu, BeMenuItem,
  BeModal, BeResult, BeSelect, BeSpace, BeTabPane, BeTabs, BeTheme, type Look } from "@be/ui-kit-pc";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { visibleMenu } from "./access.ts";
import { entries, groups, palette } from "./navigation.ts";
import { modeOf, visited } from "./prefs.ts";
import { logout, modules, permissions, setPrefs, state, tabs } from "./state.ts";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const systemDark = ref(window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false);
const look = computed<Look>(() => ({ mode: modeOf(state.prefs.theme, systemDark.value), density: state.prefs.density,
  primary: state.config.primaryColor }));
const visible = computed(() => visibleMenu(modules, state.features, permissions.value?.keys ?? null));
const all = computed(() => entries(visible.value, t));
const query = ref("");
const selector = computed(() => groups(visible.value, query.value, state.prefs.favorites, t));
const current = computed(() => visible.value.find((v) => v.items.some((i) => route.path.startsWith(i.route))));
const paletteOpen = ref(false);
const paletteQuery = ref("");
const found = computed(() => palette(all.value, paletteQuery.value));

function go(path: string, title: string, module: string) {
  tabs.open(path, title);
  setPrefs({ recent: visited(state.prefs.recent, module) });
  void router.push(path);
}
function openModule(name: string) {
  const v = visible.value.find((x) => x.module.name === name);
  const first = v?.items[0];
  if (v && first) go(first.route, t(first.title), name);
}
function closeTab(path: string) {
  const next = tabs.close(path, () => window.confirm(t("shell.unsaved")));
  if (next) void router.push(next);
  else if (next === null) void router.push("/");
}
function reload() {
  window.location.reload();
}
function key(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    paletteOpen.value = true;
  }
}
onMounted(() => window.addEventListener("keydown", key));
onBeforeUnmount(() => window.removeEventListener("keydown", key));
</script>

<template>
  <BeTheme :look="look">
    <div :class="{ 'be-gray': state.config.gray }">
      <BeResult
        v-if="state.phase === 'out'"
        status="info"
        :title="t('shell.loggedOut')"
      >
        <template #extra>
          <BeButton
            type="primary"
            href="/api/iam/login?return_to=%2F"
          >
            {{ t("shell.loginAgain") }}
          </BeButton>
        </template>
      </BeResult>
      <BeResult
        v-else-if="state.phase === 'retry'"
        status="warning"
        :title="t('shell.retryTitle')"
      >
        <template #extra>
          <BeButton
            type="primary"
            @click="reload"
          >
            {{ t("shell.retry") }}
          </BeButton>
        </template>
      </BeResult>
      <BeLayout
        v-else-if="state.phase === 'in'"
        class="be-shell"
      >
        <BeLayoutHeader class="be-shell-head">
          <img
            v-if="state.config.logoUrl"
            :src="state.config.logoUrl"
            alt=""
            class="be-shell-logo"
          >
          <span class="be-shell-product">{{ state.config.productName }}</span>
          <BeSpace class="be-shell-tools">
            <BeButton @click="paletteOpen = true">
              {{ t("shell.palette") }}
            </BeButton>
            <BeSelect
              :value="state.prefs.theme"
              :options="[{ value: 'light', label: t('shell.light') },
                         { value: 'dark', label: t('shell.dark') }, { value: 'system', label: t('shell.system') }]"
              :aria-label="t('shell.theme')"
              @change="(v: unknown) => setPrefs({ theme: v as 'light' | 'dark' | 'system' })"
            />
            <BeSelect
              :value="state.prefs.density"
              :options="[{ value: 'default', label: t('shell.comfortable') },
                         { value: 'compact', label: t('shell.compact') }]"
              :aria-label="t('shell.density')"
              @change="(v: unknown) => setPrefs({ density: v as 'default' | 'compact' })"
            />
            <BeButton @click="logout">
              {{ t("shell.logout") }}
            </BeButton>
          </BeSpace>
        </BeLayoutHeader>
        <BeAlert
          v-if="state.newBuild"
          type="info"
          :message="t('shell.reload')"
          banner
        />
        <BeAlert
          v-if="permissions?.stale"
          type="warning"
          :message="t('shell.stale')"
          banner
        />
        <BeLayout>
          <BeLayoutSider
            class="be-shell-side"
            theme="light"
          >
            <BeInput
              v-model:value="query"
              :placeholder="t('shell.search')"
              allow-clear
            />
            <p v-if="!selector.length">
              {{ t("shell.noServices") }}
            </p>
            <template
              v-for="g in selector"
              :key="g.domain"
            >
              <h3 class="be-shell-domain">
                {{ t(`domains.${g.domain}`) }}
              </h3>
              <BeButton
                v-for="m in g.modules"
                :key="g.domain + m"
                type="text"
                block
                @click="openModule(m)"
              >
                {{ t(`${m}.title`) }}
              </BeButton>
            </template>
            <BeMenu
              v-if="current"
              mode="inline"
              :selected-keys="[route.path]"
            >
              <BeMenuItem
                v-for="i in current.items"
                :key="i.route"
                @click="go(i.route, t(i.title), current.module.name)"
              >
                {{ t(i.title) }}
              </BeMenuItem>
            </BeMenu>
          </BeLayoutSider>
          <BeLayoutContent>
            <BeTabs
              v-if="tabs.list.length"
              :active-key="route.path"
              type="editable-card"
              hide-add
              @change="(k: unknown) => router.push(String(k))"
              @edit="(k: unknown) => closeTab(String(k))"
            >
              <BeTabPane
                v-for="tab in tabs.list"
                :key="tab.route"
                :tab="tab.title"
              />
            </BeTabs>
            <RouterView />
          </BeLayoutContent>
        </BeLayout>
        <BeModal
          v-model:open="paletteOpen"
          :title="t('shell.palette')"
          :footer="null"
        >
          <BeInput
            v-model:value="paletteQuery"
            :placeholder="t('shell.search')"
            auto-focus
          />
          <BeButton
            v-for="e in found"
            :key="e.route"
            type="text"
            block
            @click="() => { paletteOpen = false; go(e.route, e.title, e.module); }"
          >
            {{ e.title }}
          </BeButton>
        </BeModal>
      </BeLayout>
    </div>
  </BeTheme>
</template>

<style scoped>
.be-shell { min-height: 100vh; }
.be-shell-head { display: flex; align-items: center; gap: var(--be-gap-small); }
.be-shell-product { font-size: var(--be-title-size); font-weight: 600; color: var(--vxe-ui-font-color); }
.be-shell-tools { margin-left: auto; }
.be-shell-logo { height: var(--be-title-size); }
.be-shell-side { padding: var(--be-gap-small); }
.be-shell-domain { margin: var(--be-gap-small) 0 0; font-size: var(--vxe-ui-font-size-default); }
.be-gray { filter: grayscale(1); }
</style>
