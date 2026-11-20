# frontend-pc

组件 `frontend/pc`（PC 办公入口）的仓库：Vue 3、TypeScript、Ant Design Vue 与 vxe-table 的单页应用，pnpm 工作区；镜像是静态文件服务。用法与部署在 `BRICKKIT.md`，设计在 `docs/design.md`，代码地图在 `AGENTS.md`。

旧版本（1.x，`frontend-standard`）在分支 `legacy/v1`，标签保留；本主分支按终局设计从零开始（D59），版本从 `3.0.0` 起（A110）。设计依据：装配项目 [be-assembly-standard](https://github.com/brickKit/be-assembly-standard) 的边界卡 `docs/zh/07-components/frontend.md`（`frontend/pc` 一节）、协议 20 与前端技术栈。

## 在项目里使用

在装配项目里 `brickkit add frontend/pc@<版本>`，边缘把 `/` 路由到它（不挂会话中间件），再按 `BRICKKIT.md` 的“部署前准备”配置身份成员、授权成员与品牌。

## 文档

| 问题 | 看哪里 |
| --- | --- |
| 它做什么、怎样部署与配置 | `BRICKKIT.md` |
| 为什么这样设计：术语、规则、取舍、未决问题 | `docs/design.md` |
| 怎样改它 | `AGENTS.md` |

## 开发

见 `AGENTS.md` 的“构建与测试”。
