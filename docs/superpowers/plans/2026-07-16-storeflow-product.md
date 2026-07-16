# StoreFlow 门店经营预约 SaaS 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建一套新的 StoreFlow 门店预约与会员经营产品，包含顾客小程序、门店后台和 Go Gin API，并把它发布到个人博客。

**Architecture:** `storeflow-miniapp` 负责顾客端预约和会员视图；`storeflow-admin` 作为单仓库承载 Vue 后台与 Go API；API 通过 MySQL 8.4 保存业务数据、Redis 8 处理时段锁与幂等，两个前端通过环境变量连接 API，接口不可用时保留演示数据。

**Tech Stack:** uni-app、Vue 3、TypeScript、Vite、Go 1.25、Gin、MySQL 8.4、Redis 8、Docker Compose、Astro、Cloudflare Pages。

## Global Constraints

- StoreFlow 使用靛蓝 `#4F46E5`、杏黄 `#F59E0B`、薄荷绿 `#10B981` 和淡紫灰画布 `#F7F7FC`。
- 业务写入必须有后端校验、RBAC、幂等键、审计日志和错误日志。
- 所有跨 IO Go 函数首参为 `context.Context`，Redis/MySQL 外部调用必须带超时。
- 不保存密钥、Token 或真实个人信息；演示数据使用脱敏姓名和虚构地址。
- 每个任务结束都运行对应仓库测试；博客发布前运行 `npm test`、`npm run check`、`npm run build`。

### Task 1: 创建两个独立仓库与基线

**Files:**
- Create: `storeflow-miniapp/`
- Create: `storeflow-admin/`
- Create: `field-notes/.worktrees/storeflow-product/docs/superpowers/specs/2026-07-16-storeflow-design.md`

- [ ] **Step 1: Create clean repositories**

Copy only source, docs, tests and package manifests from the proven HomeFlow scaffolds into new directories, excluding `.git`, `.worktrees`, `node_modules`, `dist` and runtime logs. Rename package and README identity to StoreFlow, then run `git init`, configure repository-local author, and commit `chore: 初始化 StoreFlow 仓库`.

- [ ] **Step 2: Run baseline tests**

Run `npm test` in the miniapp and admin web, and `go test ./...` in the API. Expected: baseline tests pass before feature changes.

### Task 2: StoreFlow 顾客小程序

**Files:**
- Modify: `storeflow-miniapp/src/styles/theme.scss`
- Modify: `storeflow-miniapp/src/pages/index/index.vue`
- Modify: `storeflow-miniapp/src/pages/service/service.vue`
- Modify: `storeflow-miniapp/src/pages/booking/booking.vue`
- Modify: `storeflow-miniapp/src/pages/orders/orders.vue`
- Modify: `storeflow-miniapp/src/api/client.ts`
- Test: `storeflow-miniapp/tests/storeflow.test.ts`

- [ ] **Step 1: Add failing product-content tests**

Assert the source contains `STORE FLOW`, `预约到店`, StoreFlow color tokens, and the appointment client methods `fetchStores`, `fetchStoreServices`, `fetchSlots`, `createAppointment`, `fetchAppointments`.

- [ ] **Step 2: Implement the minimal demo flow**

Use the existing API client shape but rename the domain to stores, services, slots and appointments. Keep the offline fallback explicit. Add a store selector, service cards with duration, a slot grid, an orange confirmation button, and an orders list that shows appointment number and arrival status.

- [ ] **Step 3: Verify the flow**

Run `npm test`, `npm run build:h5`, and use the browser to exercise home → service → booking → orders. Expected: no console errors and the five appointment states render with the StoreFlow palette.

- [ ] **Step 4: Commit**

`git commit -am "feat(miniapp): 完成 StoreFlow 门店预约流程"`

### Task 3: StoreFlow 管理后台与 API

**Files:**
- Modify: `storeflow-admin/web/src/styles.css`
- Modify: `storeflow-admin/web/src/App.vue`
- Create/Modify: `storeflow-admin/server/internal/app/`
- Create/Modify: `storeflow-admin/server/internal/platform/`
- Create/Modify: `storeflow-admin/server/internal/transport/`
- Create: `storeflow-admin/server/migrations/001_storeflow_core.sql`
- Test: `storeflow-admin/server/internal/app/appointment_test.go`

- [ ] **Step 1: Add domain tests first**

Cover appointment creation idempotency, slot capacity, cancellation before start, and completion transition. Expected initial test failure until the domain types and service are added.

- [ ] **Step 2: Implement domain and repositories**

Create `Store`, `ServiceItem`, `StaffSchedule`, `Slot`, `Appointment`, `Member` and `AuditEntry` types. Keep repositories behind interfaces and use parameterized SQL. Use unique `(store_id, slot_id, idempotency_key)` and Redis `SET NX EX` for short locks.

- [ ] **Step 3: Implement Gin transport**

Expose `GET /api/v1/stores`, `GET /api/v1/stores/:id/services`, `GET /api/v1/stores/:id/slots`, `POST /api/v1/appointments`, `GET /api/v1/appointments`, `PATCH /api/v1/appointments/:id/status`, and admin summary endpoints. Add request validation, JWT/RBAC middleware, trace ID, structured errors and pagination.

- [ ] **Step 4: Replace admin demo labels and colors**

Change dashboard labels to门店、预约、到店率、会员复购；use StoreFlow indigo for navigation, orange for primary actions and amber pending states, green only for completed states. Preserve offline fallback and login flow.

- [ ] **Step 5: Verify**

Run `go vet ./... && go test ./...`, then `npm test && npm run build` in `storeflow-admin/web`. Expected: all domain, transport and frontend tests pass.

- [ ] **Step 6: Commit**

`git commit -am "feat(platform): 完成 StoreFlow 后台与预约 API"`

### Task 4: 博客项目页与展示素材

**Files:**
- Create: `field-notes/.worktrees/storeflow-product/public/images/projects/storeflow-platform/`
- Create: `field-notes/.worktrees/storeflow-product/src/content/projects/storeflow-platform.md`
- Modify: `field-notes/.worktrees/storeflow-product/src/content/projects/index.md` only if the content collection requires an index entry
- Test: `field-notes/.worktrees/storeflow-product/tests/projects.test.ts`

- [ ] **Step 1: Capture five polished screens**

Capture顾客首页、预约表单、预约记录、后台总览、预约调度；inspect every screenshot for clipping, broken text and color consistency before committing.

- [ ] **Step 2: Add project frontmatter**

Link `https://github.com/xrlnewman/storeflow-miniapp` and `https://github.com/xrlnewman/storeflow-admin`, state that the product is free/open source, and list the two repos and their roles.

- [ ] **Step 3: Verify and publish**

Run `npm test && npm run check && npm run build`, commit `feat(blog): 展示 StoreFlow 门店预约 SaaS`, push the branch, fast-forward `main`, and deploy to Cloudflare Pages. Verify every screenshot URL returns HTTP 200.

### Task 5: 交付与后续迭代边界

- [ ] **Step 1: Confirm clean branches**

Run `git status --short` in StoreFlow repos and the blog worktree; expected clean after commits.

- [ ] **Step 2: Confirm public links**

Verify GitHub repository pages, blog project page and Cloudflare production URL.

- [ ] **Step 3: Record post-MVP backlog**

Keep payments, coupons write operations, notification channels and tenant billing out of this release; put them in a follow-up issue instead of expanding the current MVP.
