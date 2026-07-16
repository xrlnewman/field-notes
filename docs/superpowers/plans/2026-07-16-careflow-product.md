# CareFlow 诊所预约与健康随访平台实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 新增一个包含患者端小程序、诊所运营后台和 Go Gin API 的 CareFlow 预约/签到/随访产品，并接入博客展示。

**Architecture:** `careflow-miniapp` 负责患者预约、候诊和随访体验；`careflow-admin/web` 负责诊所运营后台；`careflow-admin/server` 提供预约、签到、患者和随访 API。产品明确是预约运营工具，不提供诊断、处方和真实医疗数据。

**Tech Stack:** uni-app Vue 3、TypeScript、Vue 3、Vite、Go 1.25、Gin、MySQL 8.4、Redis 8、Docker Compose、Vitest、Go test。

## Global Constraints

- 主题色：`#F8FAFC`、`#4F46E5`、`#10B981`、`#F97316`；医疗蓝灰用于次要信息，卡片统一 16px 圆角。
- 演示数据至少包含 20 预约、8 医生、30 患者、12 随访，全部是虚构数据。
- 只实现预约、签到、候诊、服务记录、复诊提醒、随访问卷和满意度；不实现诊断、处方和支付。
- 服务端统一 `{ code, message, data, traceId }`，写接口使用 `Idempotency-Key`；Redis 8 用于号源锁和预约幂等。
- 桌面截图必须 1045×1224 正常视口；患者端截图必须 390×844 设备视口。

### Task 1: 初始化患者端仓库

**Files:**
- Create: `careflow-miniapp/package.json`, `src/pages/*.vue`, `src/api/client.ts`, `tests/careflow.test.ts`, `README.md`

- [ ] 写失败测试：验证预约首页包含科室/医生号源，预约提交带幂等键，网络失败回退演示数据。
- [ ] 实现首页科室、预约、候诊、健康档案 4 个页面；显示预约状态、候诊号和随访任务。
- [ ] 实现暖白/靛蓝/薄荷青/珊瑚视觉令牌、预约时间卡片和清晰状态色。
- [ ] 运行 `npm test`、`npm run build:h5`，提交 `feat(careflow): 初始化患者端预约流程`。

### Task 2: 初始化诊所后台与 API 仓库

**Files:**
- Create: `careflow-admin/web/src/App.vue`, `web/src/styles.css`, `web/tests/careflow.test.js`
- Create: `careflow-admin/server/cmd/api/main.go`, `server/internal/app/clinic/`, `server/internal/transport/httpapi/`, `server/internal/platform/cache/`, `server/internal/config/`
- Create: `careflow-admin/deploy/docker-compose.yml`, `README.md`

- [ ] 先写 Go handler/service 测试，覆盖 `/healthz`、`/api/v1/dashboard`、`/departments`、`/doctors`、`/appointments`、`/patients`、`/followups`。
- [ ] 实现总览、预约队列、医生排班、患者档案、随访任务 5 个后台视图；使用热力/进度/状态组件呈现运营数据。
- [ ] 实现 POST `/appointments`、`/appointments/:id/checkin`、`/followups/:id/complete`，支持号源锁、幂等和分页。
- [ ] 实现 MySQL 8.4/Redis 8 compose、配置校验、超时和结构化日志。
- [ ] 运行 `go vet ./... && go test ./...`、`npm test && npm run build`，提交 `feat(careflow): 完成诊所后台与接口`。

### Task 3: 截图与博客接入

- [ ] 在正确 1045×1224 视口截取总览、预约队列、排班、随访 4 张后台图；在 390×844 视口截取患者预约图。
- [ ] 用图像查看逐张确认没有竖排文字、裁切、按钮溢出或大面积空白；文件控制在 1MB 内。
- [ ] 在博客 worktree 新增 `src/content/projects/careflow-platform.md`、分类“医疗健康”，更新项目计数与测试。
- [ ] 运行 `npm run verify`、资源 HTTP 200 检查，提交 `feat(blog): 增加 CareFlow 项目展示`。
