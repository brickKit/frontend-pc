# frontend/pc

## 组件定位

PC 办公入口：浏览器里的单页应用（Vue 3、Ant Design Vue、vxe-table），挂在边缘的 `/` 下。它不是业务权威：每条规则、每次授权都在后端组件。

- **页面模块**：每个后端组件一组页面；本组件的版本按它自带的基线组合（哪些模块编进产物）。部署里没装的组件，它的菜单在运行时隐藏。
- **菜单**：只显示部署装了的组件（边缘提供的 `features`）且用户持有操作键的菜单项（授权成员的 `GET /api/authz/me/operations`）；隐藏不是安全边界，后端照样拒绝。
- **会话**：页面从不接触令牌。身份成员持有会话、边缘按会话注入令牌；会话结束时跳到身份成员的登录。
- **断网草稿**：连不上后端时，表单存为本地草稿（按用户与法人隔离，只存允许的字段），联网后由用户确认提交。

**3.0.0**（第一个重建的版本）首批页面：待办与已办、任务详情（同意、驳回直发所属组件）；我的消息；业务伙伴；产品（装了库存时带库存标签页）；可用量；销售订单；采购申请（新建与提交，断网草稿）与采购订单。

## 部署前准备

- **边缘**：`/` 路由到本组件，**不挂** be-edge 的会话中间件；`/api/` 按各组件的公网前缀路由并挂中间件。边缘要用 be-edge alpha.17 起（会话结束后留下的 Cookie 不挡住再登录）。
- **身份成员**：`IAM_CALLBACK_URL` 是边缘的来源加 `/api/iam/callback`，并登记在 Casdoor 的登录应用里；`IAM_AFTER_LOGIN_URL` 为 `/`；登录应用不开“登录会话”（否则登出后会被静默再登录）。要 `infra/iam-casdoor` 3.0.59 起。
- **授权成员**：要 `infra/authz` 3.0.61 起（“我的操作”带调用者的主体）。
- **品牌与开关**（可选，启动时写进 `/config.json`）：`PC_PRODUCT_NAME`、`PC_PRIMARY_COLOR`（`#rrggbb`）、`PC_LOGO_URL`（本站的路径）、`PC_WATERMARK`、`PC_GRAY_MODE`、`PC_SHARED_TERMINAL`（共用终端：登出时清除本地草稿）。不合形状的值被忽略并记一行日志。
- 没有数据库、不连消息系统、没有密钥。

## 依赖说明

- 运行时本组件只是静态文件服务，不调用任何组件；页面经边缘调用。
- 可选：首批页面模块的后端组件（`infra/workflow`、`infra/notification`、`mdm/partner`、`mdm/product`、`erp/inventory`、`erp/sales`、`erp/purchase`）与 `mdm/org`（法人切换）。没装的，菜单不显示。

## 配置指南

全部键见 `component.yaml` 的 `configSchema`。

## 契约索引

- **用户面**：没有接口；本组件只发静态文件（`/`、`/assets/`、`/config.json`、`/version.json`、`/healthz`）。
- **它调用的**（浏览器经边缘）：各页面模块的后端组件的用户面、授权成员的 `GET /api/authz/me/operations`、身份成员的登录与登出、边缘的 `GET /api/features`。
- **系统面、事件**：没有。

## 外壳声明

不是外壳，也不能被外壳承载（不是 SDK 组件，是独立的静态文件服务）。

## 运行与运维

- 健康与就绪：`/healthz`（只答本进程）。
- 缓存：`/assets/` 下的文件按内容摘要命名、长期缓存；`index.html`、`version.json`、`config.json` 不缓存。新版本部署后，已打开的页面在 5 分钟内提示刷新。
- 安全头：每个页面带内容安全策略（只许本站脚本、不许内联脚本；样式许内联，Ant Design Vue 要）、`X-Content-Type-Options`、`Referrer-Policy`。
- 无状态：可以多副本。

## 升级说明

3.0.0 是第一个重建的版本；旧的 1.x（`frontend/standard`）不兼容，不升级、重新部署。
