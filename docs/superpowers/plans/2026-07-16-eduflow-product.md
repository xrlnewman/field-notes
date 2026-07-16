# EduFlow 教培管理平台实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建 EduFlow 免费开源教培课程与学员管理产品，包含学员小程序、Vue 管理后台、Go Gin API，并发布到个人博客。

**Architecture:** 以已验证的 StoreFlow/StockFlow 前端工程结构为基础复制出两个独立仓库，但重新建模为课程、班级、学员、报名、考勤和学习任务。`eduflow-admin` 内含 `web/` 与 `server/`，服务器先提供可运行的内存演示服务，MySQL 8.4/Redis 8 通过 Docker Compose 和配置入口保留扩展边界；`eduflow-miniapp` 只通过 `/api/v1` 客户端访问接口，离线时回退到虚构快照；博客只保存 Markdown、截图和 GitHub URL。

**Tech Stack:** uni-app、Vue 3、TypeScript、Vite、Go 1.25、Gin、JWT/RBAC、MySQL 8.4、Redis 8、Docker Compose、Astro、Vitest、Node test。

## Global Constraints

- 仓库名固定为 `eduflow-miniapp` 和 `eduflow-admin`，GitHub owner 为 `xrlnewman`，两个仓库均使用 MIT 许可并公开。
- 视觉令牌固定为 `#6D4AFF`、`#FF7A59`、`#18A889`、`#E7A72B`、`#F7F8FC`、`#1D2230`、`#E7E9F1`，不复用 StockFlow 蓝橙视觉。
- 不修改 `linli-*`、`homeflow-*`、`storeflow-*`、`stockflow-*` 现有仓库；不复制 `inventory-system` 源码。
- 所有列表接口分页；写接口使用 `Idempotency-Key`，返回 `{ code, message, data }`；演示金额、姓名和课程数据必须明确是虚构数据。
- 密钥只走环境变量；截图只来自运行页面并转成真实 PNG，博客内容不保存业务源码。

---

### Task 1: 建立 EduFlow 两个仓库骨架

**Files:**
- Create: `eduflow-miniapp/package.json`, `src/`, `tests/`, `README.md`, `LICENSE`
- Create: `eduflow-admin/go.mod`, `server/`, `web/`, `README.md`, `LICENSE`
- Test: `eduflow-miniapp/tests/eduflow.test.ts`, `eduflow-admin/web/tests/eduflow.test.js`

**Interfaces:**
- Produces public repositories `https://github.com/xrlnewman/eduflow-miniapp` and `https://github.com/xrlnewman/eduflow-admin` for later blog metadata.

- [ ] **Step 1: 从 StoreFlow/StockFlow 复制骨架，排除 `.git`、`node_modules`、`dist`、构建产物和运行日志。**
- [ ] **Step 2: 全量替换标题、包名、README、环境变量、Docker 服务名和 GitHub URL，删除预约/库存语义页面，只保留 EduFlow 路由入口。**
- [ ] **Step 3: 写最小测试，断言项目文案为 EduFlow、离线演示可进入，且不存在旧产品文案。**
- [ ] **Step 4: 运行 `npm install --no-audit --no-fund`、后台 `npm install --no-audit --no-fund` 和 `go mod download`；提交 `feat(eduflow): 初始化教培产品仓库`。**

### Task 2: 实现 EduFlow Go API 与内存演示服务

**Files:**
- Create: `eduflow-admin/server/internal/app/education/service.go`
- Create: `eduflow-admin/server/internal/transport/httpapi/education_handlers.go`
- Modify: `eduflow-admin/server/internal/transport/httpapi/router.go`
- Test: `eduflow-admin/server/tests/eduflow_education_test.go`
- Modify: `eduflow-admin/server/README.md`, `eduflow-admin/server/docs/api-contract.md`, `eduflow-admin/deploy/docker-compose.yml`

**Interfaces:**
- Service methods: `Dashboard(ctx)`, `Courses(ctx, page, pageSize)`, `Schedules(ctx, page, pageSize)`, `Students(ctx, page, pageSize)`, `Attendance(ctx, page, pageSize)`, `Tasks(ctx, page, pageSize)`, `Enroll(ctx, courseID, idempotencyKey)`, `MarkAttendance(ctx, id, status, idempotencyKey)`.
- Routes: `GET /api/v1/dashboard`, `/courses`, `/schedules`, `/students`, `/attendance`, `/tasks`; `POST /api/v1/enrollments` and `POST /api/v1/attendance/:id/mark`.

- [ ] **Step 1: 先写登录、健康检查和教育 GET/POST 路由测试，断言统一 envelope、分页字段、演示标识和重复幂等请求结果一致。**
- [ ] **Step 2: 实现 `education.Service` 的虚构课程、排课、学员、考勤和任务数据；写操作使用互斥锁和 idempotency map，所有跨 IO 方法保留 `context.Context`。**
- [ ] **Step 3: 在 Gin router 注册受保护路由，复用现有认证/recover/middleware，错误返回 HTTP 状态和可读 message，不吞错。**
- [ ] **Step 4: 将 Docker Compose 固定为 MySQL 8.4、Redis 8，配置默认库名 `eduflow`，README 说明真实适配边界。**
- [ ] **Step 5: 运行 `gofmt -w . && go vet ./... && go test ./...`；提交 `feat(api): 完成 EduFlow 教务接口闭环`。**

### Task 3: 实现学员小程序工作流

**Files:**
- Modify: `eduflow-miniapp/src/api/client.ts`, `src/styles/theme.scss`, `src/pages.json`
- Modify: `eduflow-miniapp/src/pages/index/index.vue`, `src/pages/workbench/workbench.vue`, `src/pages/orders/orders.vue`, `src/pages/profile/profile.vue`
- Delete: old service/booking/order-domain files not used by EduFlow
- Test: `eduflow-miniapp/tests/eduflow.test.ts`

**Interfaces:**
- Client methods: `fetchDashboard`, `fetchCourses`, `fetchSchedules`, `fetchStudents`, `fetchTasks`, `enrollCourse`, `markAttendance`; each returns `{ source: 'api'|'demo', data }` and sends `Idempotency-Key` for writes.

- [ ] **Step 1: 先写客户端测试，断言课程快照结构、网络失败回退、报名请求携带幂等键和学习进度格式化。**
- [ ] **Step 2: 写紫色/珊瑚色主题令牌和底部 tabs：学习首页、课程、课表、我的；删除库存/预约/门店业务入口。**
- [ ] **Step 3: 将首页实现为今日课程、学习进度、待完成任务和报名入口；课程页展示老师、课时、名额和分类。**
- [ ] **Step 4: 将课表页实现为日期卡、教室、老师、签到状态；我的页展示学员身份、课程数和免费开源说明。**
- [ ] **Step 5: 运行 `npm test` 与 `npm run build:h5`；提交 `feat(miniapp): 完成 EduFlow 学员工作台`。**

### Task 4: 实现 Vue 教务运营后台

**Files:**
- Modify: `eduflow-admin/web/src/App.vue`, `web/src/styles.css`, `web/src/api/client.js`, `web/index.html`, `web/README.md`
- Delete: unused old domain modules
- Test: `eduflow-admin/web/tests/eduflow.test.js`

**Interfaces:**
- UI navigation keys: `overview`, `courses`, `schedules`, `students`, `attendance`, `tasks`.
- Client actions: `dashboard`, `courses`, `schedules`, `students`, `attendance`, `tasks`, `enrollCourse`, `markAttendance`.

- [ ] **Step 1: 先写 Node test，断言演示数据覆盖课程/学员/考勤，API 未配置时进入离线演示。**
- [ ] **Step 2: 实现深墨侧栏、浅画布、紫色选中、珊瑚色动作、青绿色完成、琥珀色提醒的视觉系统；移动宽度下改为顶部横向导航。**
- [ ] **Step 3: 实现总览指标、课程中心、排课表、学员列表、考勤处理和学习任务页面，所有演示数据标记为“演示数据”。**
- [ ] **Step 4: 将报名确认和考勤按钮接入 API 客户端，写操作成功后更新本地状态并显示 toast，错误不静默。**
- [ ] **Step 5: 运行 `npm test && npm run build`；提交 `feat(admin): 完成 EduFlow 教务后台`。**

### Task 5: 真实页面截图与博客内容

**Files:**
- Create: `field-notes/public/images/projects/eduflow-platform/{admin-dashboard,courses,schedules,students}.png`
- Create: `field-notes/src/content/projects/eduflow-platform.md`
- Modify: `field-notes/src/lib/projects.ts`, `src/pages/projects/index.astro`
- Test: `field-notes/tests/content.test.ts`, `tests/projects.test.ts`, `tests/build-smoke.test.ts`

**Interfaces:**
- Blog metadata uses `repoUrl` `https://github.com/xrlnewman/eduflow-admin` and `repositories` nodes for `eduflow-miniapp` and `eduflow-admin`.

- [ ] **Step 1: 启动后台和 H5，在浏览器中按“总览、课程、排课、学员”页面分别截取当前视口，禁止使用造成错位的 fullPage 截图；把 JPEG 转为真实 PNG 并读取宽高。**
- [ ] **Step 2: 添加“教育培训”分类和 EduFlow Markdown，写清免费开源、MySQL 8.4、Redis 8、虚构演示数据和两个仓库关联。**
- [ ] **Step 3: 更新公开项目 ID、页面数量、分类计数和截图存在性测试；确保 Giscus 仍使用 GitHub 登录在站内评论。**
- [ ] **Step 4: 运行博客 `npm run verify`；提交 `feat(blog): 增加 EduFlow 教培项目展示`。**

### Task 6: 公开仓库、合并、部署和最终验收

**Files:**
- Modify: `field-notes` main branch through merge only
- Publish: GitHub repositories `eduflow-miniapp`, `eduflow-admin`

- [ ] **Step 1: 为两个仓库设置本地作者和 MIT 许可，提交并推送 `main`，匿名确认 GitHub 页面返回 200。**
- [ ] **Step 2: 在博客仓库 fetch origin 后将 `feat/eduflow-product` fast-forward 合并到 `main`，重跑 `npm run verify` 并推送。**
- [ ] **Step 3: 使用现有 Cloudflare Pages 配置部署 `field-notes`，记录部署 URL，不在日志中输出令牌。**
- [ ] **Step 4: 检查博客首页、项目目录、EduFlow 详情页、4 张截图和两个 GitHub URL 返回 200；三仓库 `git status --short --branch` 均干净。**
- [ ] **Step 5: 在博客项目页浏览器验收截图、关联仓库和 Giscus 评论区，最后删除已合并的 EduFlow worktree 和分支。**
