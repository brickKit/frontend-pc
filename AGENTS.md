# frontend/pc

PC 办公入口（浏览器里的单页应用）的代码。为什么这样设计（规则 FP01–FP20、首批页面模块、依赖与版本、实现状态、未决问题）在 [docs/design.md](docs/design.md)；跨组件的规则在装配项目 be-assembly-standard 的协议 20、前端技术栈与线协议第 11 章。**改代码前先读设计里对应的规则**。

## 代码地图

一个 pnpm 工作区：

| 目录 | 是什么 | 规则 |
| --- | --- | --- |
| `packages/ui-kit-pc/` | 第三方 UI 只在这里：AntDV 与 vxe-table 的封装（`BeTable`、`BeRichText`、`Be*` 别名）、四种页面模板（`templates/`）、主题（`theme.ts`：令牌到 CSS 变量；`BeTheme.vue` 在 provider 里用 `useToken()` 取派生令牌并写变量）、导出防公式注入（`export.ts`）、富文本白名单（`richtext.ts`） | FP01、FP12、FP20 |
| `packages/shell/` | 外壳应用：`main.ts`（入口、路由、语言）、`App.vue`（服务选择器、菜单、标签页、命令面板、法人切换、偏好、登出）、`state.ts`（登录门槛、`features`、权限、`api()`、法人、版本检查）；逻辑各在一个文件：`request.ts` 与 `errors.ts`（请求头、幂等键、重试、错误分类）、`session.ts`、`access.ts`（菜单过滤与权限刷新）、`drafts.ts`、`format.ts`、`navigation.ts`、`prefs.ts`、`runtime.ts`、`version.ts`、`list.ts`（游标分页、屏蔽字段）；通用页面部件 `ListView.vue`、`DetailView.vue`、`Outcome.vue`（导出名 `OutcomeAlert`）、`Value.vue`；`module.ts`（页面模块的声明，`@be/shell/module`）；`index.ts` 是页面模块能用的全部 | FP02、FP04–FP11、FP13、FP17、FP19 |
| `packages/shell/src/reasons.generated.ts` | 平台原因与可否重试，由 `scripts/gen-reasons.mjs` 从 be-protocol 的 `vectors/errors.json` 生成 | FP08 |
| `packages/shell/src/modules.generated.ts` | 编进产物的页面模块，由 `pnpm compose` 按基线生成 | FP03 |
| `packages/build/` | 按客户基线组合（`compose.ts`、`cli.ts`） | FP03 |
| `packages/api/` | 从各组件契约生成的类型：`scripts/generate.ts`（`BE_ASSEMBLY=<装配项目> node packages/api/scripts/generate.ts`）把基线版本的 `contract/openapi.yaml` 与 `events/` 取进 `contracts/`、生成 `src/generated/`；`src/types.ts` 的 `Answer`、`RequestBody` 从中取回答与请求体的类型 | FP07 |
| `modules/<名字>/` | 页面模块，一个后端组件一个（首批：`workflow`、`notification`、`partner`、`product`、`inventory`、`sales`、`purchase`）；`package.json` 的 `bePageModule` 写组件、契约主版本、`needs`、`capabilities`、`optional`（只写这一处）；`src/module.ts` 用 `definePageModule` 声明菜单、路由（按需加载）、文本、草稿；列表与详情用外壳的 `ListView`、`DetailView`，只写配置 | FP02 |
| `baseline/standard.yaml` | 组合用的基线（装配项目标准部署的组件与精确版本） | FP03 |
| `tokens/seed.json` | 设计令牌的种子值，移动端照它 | FP12 |
| `scripts/` | `check-styles.mjs`（样式里的字面颜色与像素）、`lint-proof.sh` 与 `lint-samples/`（每条 lint 规则在样例上红）、`gen-reasons.mjs` | FP12、FP16 |

## 构建与测试

Node 与 pnpm 用本机 fnm 的（`eval "$(fnm env)"`）；版本在 `package.json` 的 `engines` 与 `packageManager`。

- `pnpm install`（锁文件进仓库；`core-js` 的安装脚本被明确禁止，见 `pnpm-workspace.yaml`）
- `pnpm lint`（ESLint，警告也不放过；样式检查）、`pnpm lint:proof`（每条规则在违规样例上红）
- `pnpm typecheck`（`vue-tsc` 严格模式）
- `pnpm test`（Vitest：FE-1 在 `packages/*/test/` 与 `modules/*/test/`，FE-2 在 `packages/ui-kit-pc/test/`；默认 happy-dom，富文本的测试用 jsdom，因为 DOMPurify 要完整的 DOM）
- `pnpm build`（先 `pnpm compose`，再 Vite 构建到 `dist/`，带 `version.json`）
- FE-3、FE-4（真实浏览器经边缘）**跑之前先问维护者**（测试规范）

## 不能弄坏的

| 不许 | 症状 | 规则 |
| --- | --- | --- |
| 页面或外壳直接引第三方 UI | 换组件库或升级要改每一页；lint 拒绝 | FP01 |
| 只看 `features` 不看 `permissions` 显示菜单 | 菜单看得见、点进去整页被拒 | FP04 |
| 不带幂等键的写请求自动重试 | 网络抖一下下了两张单 | FP07 |
| 把不认识的原因当成功 | 失败的提交显示成已完成 | FP08 |
| 待办的决定入口取投影里的地址，或不校验组件 ID | 决定被发到别处 | FP09 |
| 页面里手写颜色、像素 | 暗色与紧凑模式下错位；样式检查拒绝 | FP12 |
| 受限字段进本地草稿 | 共用终端上别人从浏览器存储读到 | FP13 |
| 在构建时注入品牌 | 同一版本对不同部署出不同产物 | FP11 |
| 全量安装 vxe-pc-ui | 首屏脚本多 660 kB、样式多 480 kB；vxe-table 只从它取类型 | FP01 |
| 把 `CLAUDE.md` 做成指向本文件的链接 | 往 `CLAUDE.md` 写的东西覆盖本文件（P4 真出过一次） | — |

## 版本

`package.json` 的 `version`（开发阶段每次只升最后一位，用过的不再用）；`component.yaml` 随 P6 加入。
