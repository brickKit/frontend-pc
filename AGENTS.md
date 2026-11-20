# frontend/pc

PC 办公入口（浏览器里的单页应用）的代码。为什么这样设计（规则 FP01–FP20、首批页面模块、依赖与版本、实现状态、未决问题）在 [docs/design.md](docs/design.md)；跨组件的规则在装配项目 be-assembly-standard 的协议 20、前端技术栈与线协议第 11 章。**改代码前先读设计里对应的规则**。

## 代码地图

一个 pnpm 工作区：

| 目录 | 是什么 | 规则 |
| --- | --- | --- |
| `packages/ui-kit-pc/` | 第三方 UI 只在这里：AntDV 与 vxe-table 的封装（`BeTable`、`BeRichText`、`Be*` 别名）、四种页面模板（`packages/ui-kit-pc/src/templates/`）、主题（`packages/ui-kit-pc/src/theme.ts`：令牌到 CSS 变量；`BeTheme.vue` 在 provider 里用 `useToken()` 取派生令牌并写变量）、导出防公式注入（`packages/ui-kit-pc/src/export.ts`）、富文本白名单（`packages/ui-kit-pc/src/richtext.ts`） | FP01、FP12、FP20 |
| `packages/shell/` | 外壳应用：`main.ts`（入口、路由、语言）、`App.vue`（服务选择器、菜单、标签页、命令面板、法人切换、偏好、登出）、`state.ts`（登录门槛、`features`、权限、`api()`、法人、版本检查）；逻辑各在一个文件：`request.ts` 与 `errors.ts`（请求头、幂等键、重试、错误分类）、`session.ts`、`access.ts`（菜单过滤与权限刷新）、`drafts.ts`、`format.ts`、`navigation.ts`、`prefs.ts`、`runtime.ts`、`version.ts`、`list.ts`（游标分页、屏蔽字段）；通用页面部件 `ListView.vue`、`DetailView.vue`、`Outcome.vue`（导出名 `OutcomeAlert`）、`Value.vue`；`packages/shell/src/module.ts`（页面模块的声明；页面模块从包的子路径 module 导入它）；`index.ts` 是页面模块能用的全部 | FP02、FP04–FP11、FP13、FP17、FP19 |
| `packages/shell/src/reasons.generated.ts` | 平台原因与可否重试，由 `scripts/gen-reasons.mjs` 从 be-protocol 的原因目录（它的向量 errors.json）生成 | FP08 |
| `packages/shell/src/modules.generated.ts` | 编进产物的页面模块，由 `pnpm compose` 按基线生成 | FP03 |
| `packages/build/` | 按客户基线组合（`compose.ts`、`cli.ts`） | FP03 |
| `packages/api/` | 从各组件契约生成的类型：`packages/api/scripts/generate.ts`（`BE_ASSEMBLY=<装配项目> node packages/api/scripts/generate.ts`）把基线版本的契约文档与事件 schema 取进 `packages/api/contracts/`、生成 `packages/api/src/generated/`；`packages/api/src/types.ts` 的 `Answer`、`RequestBody` 从中取回答与请求体的类型 | FP07 |
| `modules/` | 页面模块，一个后端组件一个（首批：`workflow`、`notification`、`partner`、`product`、`inventory`、`sales`、`purchase`）；`package.json` 的 `bePageModule` 写组件、契约主版本、`needs`、`capabilities`、`optional`（只写这一处）；各模块的声明文件（例 `modules/purchase/src/module.ts`）用 `definePageModule` 声明菜单、路由（按需加载）、文本、草稿；列表与详情用外壳的 `ListView`、`DetailView`，只写配置 | FP02 |
| `baseline/standard.yaml` | 组合用的基线（装配项目标准部署的组件与精确版本） | FP03 |
| `tokens/seed.json` | 设计令牌的种子值，移动端照它 | FP12 |
| `scripts/` | `check-styles.mjs`（样式里的字面颜色与像素）、`lint-proof.sh` 与 `scripts/lint-samples/`（每条 lint 规则在样例上红）、`gen-reasons.mjs` | FP12、FP16 |

## 构建与测试

Node 与 pnpm 用本机 fnm 的（`eval "$(fnm env)"`）；版本在 `package.json` 的 `engines` 与 `packageManager`。

- `pnpm install`（锁文件进仓库；`core-js` 的安装脚本被明确禁止，见 `pnpm-workspace.yaml`）
- `pnpm lint`（ESLint，警告也不放过；样式检查）、`pnpm lint:proof`（每条规则在违规样例上红）
- `pnpm typecheck`（`vue-tsc` 严格模式）
- `pnpm test`（Vitest：FE-1 在 `packages/*/test/` 与 `modules/*/test/`，FE-2 在 `packages/ui-kit-pc/test/`；默认 happy-dom，富文本的测试用 jsdom，因为 DOMPurify 要完整的 DOM）
- `pnpm build`（先 `pnpm compose`，再 Vite 构建到 `dist/`，带 `version.json`）
- FE-3、FE-4（真实浏览器经边缘）**跑之前先问维护者**（测试规范）

## 易错点

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

## 设计取舍

- 一个仓库多个包，基线是源码的一部分（一个版本一个镜像）；品牌在运行时读；样式许内联（AntDV 的 CSS-in-JS）；静态服务用 nginx。理由在 `docs/design.md` 的“取舍”。
- 请求只经 `packages/shell/src/request.ts`，不用 openapi-fetch：重试、幂等键与错误分类要在一处。

## 改代码前自查

- 改的是哪条 FP 规则？先读 `docs/design.md` 里那一条，改了行为就一起改设计。
- 加了页面里的文字？进语言资源，`zh-CN` 与 `en-US` 都要有。
- 加了第三方 UI？只在 `packages/ui-kit-pc/` 里，页面经它的封装用。
- 改了版本号吗？每次改动都升 `package.json` 与 `component.yaml` 的版本（两处相同）。

## 版本

`package.json` 与 `component.yaml` 的版本相同（开发阶段每次只升最后一位，用过的不再用）；`brickkit release` 发布。

<!-- brickkit:managed:begin lang=zh -->
## BrickKit

这是一个 BrickKit 组件：平台只读 `component.yaml`。它依赖的规则：

- `configSchema` 的键就是代码读的环境变量名。不能用保留名：`COMPONENT_ID`、`COMPONENT_VERSION`、`PORT`、`BRICKKIT_SERVED_MEMBERS`、`BRICKKIT_SERVED_MEMBERS_CONFIG`，以及任何 `*_ENDPOINT`。
- 依赖写精确版本。依赖的地址以 `<ID>_ENDPOINT` 注入；缺席的可选依赖根本没有这个变量，读的时候要带兜底。
- `/healthz` 只查本进程，不查依赖。迁移命令用同一个镜像跑，遇到不认识的参数必须直接失败；`local.migrationCommand` 从源码跑同一条迁移，给 `mode: local` 用。
- `BRICKKIT.md` 会随版本进入每个使用它的项目，在那里是脱离仓库单独读的：跟代码一起改，不放相对链接。
- 发版：改 `metadata.version`，提交、推送，`brickkit release`。`brickkit lint` 会检查清单和这些文档——在项目里、在这个目录下跑，只查这个组件（`--all` 查整个项目）。
- 完整规则在 `brickkit-component` 技能里（装了技能的项目或仓库根目录下的 `.claude/skills/brickkit-component/SKILL.md`；`brickkit skills update` 会装上）；参数问 `brickkit <命令> --help`；BrickKit 自己的文档用 `brickkit docs` 看。
<!-- brickkit:managed:end -->
