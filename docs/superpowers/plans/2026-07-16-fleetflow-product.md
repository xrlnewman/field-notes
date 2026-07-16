# FleetFlow 同城配送平台实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 新增一个包含司机端小程序、调度后台和 Go Gin API 的 FleetFlow 同城运输履约产品，并接入博客展示。

**Architecture:** `fleetflow-miniapp` 负责司机/收货端体验和离线演示；`fleetflow-admin/web` 负责调度运营后台；`fleetflow-admin/server` 按 transport → app → platform 分层提供接口。博客通过项目 markdown 关联两个仓库和稳定截图资源。

**Tech Stack:** uni-app Vue 3、TypeScript、Vue 3、Vite、Go 1.25、Gin、MySQL 8.4、Redis 8、Docker Compose、Vitest、Go test。

## Global Constraints

- 主题色：`#0F1B33`、`#3B82F6`、`#19C3A6`、`#FF9D4D`；橙色只表示主动作或告警。
- 演示数据至少包含 12 运单、8 司机、6 车辆、5 异常，不能出现空列表主画面。
- 服务端统一 `{ code, message, data, traceId }`，写接口使用 `Idempotency-Key`。
- Redis 8 用于派单幂等和时段/车辆锁；MySQL 8.4 用于生产配置，离线演示不依赖外部服务。
- 桌面截图必须 1045×1224 正常视口；司机端截图必须 390×844 设备视口。

### Task 1: 初始化司机端仓库

**Files:**
- Create: `fleetflow-miniapp/package.json`, `src/pages/*.vue`, `src/api/client.ts`, `tests/fleetflow.test.ts`, `README.md`

- [ ] 写失败测试：验证离线 dashboard 有 128 运单、待派车和准时率字段，派单请求带幂等键。
- [ ] 实现最小 uni-app 页面：运单首页、运单池、运单详情、我的；接口失败回退到固定演示数据。
- [ ] 实现蓝色/青绿色视觉令牌、状态标签、节点时间线和司机端大按钮。
- [ ] 运行 `npm test`、`npm run build:h5`，确认通过后提交 `feat(fleetflow): 初始化司机端工作流`。

### Task 2: 初始化调度后台与 API 仓库

**Files:**
- Create: `fleetflow-admin/web/src/App.vue`, `web/src/styles.css`, `web/tests/fleetflow.test.js`
- Create: `fleetflow-admin/server/cmd/api/main.go`, `server/internal/app/dispatch/`, `server/internal/transport/httpapi/`, `server/internal/platform/cache/`, `server/internal/config/`
- Create: `fleetflow-admin/deploy/docker-compose.yml`, `README.md`

- [ ] 先写 Go handler/service 测试，覆盖 `/healthz`、`/api/v1/dashboard`、`/shipments`、`/drivers`、`/exceptions`、`/settlements`。
- [ ] 实现总览、运单调度、车辆司机、异常中心、对账 5 个后台视图；使用真实感 seed 数据和图表占位组件。
- [ ] 实现 POST `/shipments`、`/shipments/:id/assign`、`/shipments/:id/events`、`/exceptions/:id/resolve`，统一分页和幂等响应。
- [ ] 实现 MySQL 8.4/Redis 8 compose、配置校验、超时和结构化日志。
- [ ] 运行 `go vet ./... && go test ./...`、`npm test && npm run build`，提交 `feat(fleetflow): 完成调度后台与接口`。

### Task 3: 截图与博客接入

- [ ] 在正确 1045×1224 视口截取总览、调度、异常、对账 4 张后台图；在 390×844 视口截取司机运单图。
- [ ] 用图像查看逐张确认没有竖排文字、裁切、按钮溢出或大面积空白；文件控制在 1MB 内。
- [ ] 在博客 worktree 新增 `src/content/projects/fleetflow-platform.md`、分类“物流运输”，更新项目计数与测试。
- [ ] 运行 `npm run verify`、资源 HTTP 200 检查，提交 `feat(blog): 增加 FleetFlow 项目展示`。
