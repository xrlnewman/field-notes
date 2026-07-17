# 第一批项目产品化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 InvoiceFlow、RepairFlow、SupplyFlow、PayrollFlow、BookingFlow 的前后台和 API 从预约模板升级为可演示的领域业务闭环，并在博客中呈现结构化产品能力。

**Architecture:** 每个产品保留独立仓库和旧 API 兼容层，在 Go Gin 服务端新增领域实体、状态机、事件时间线和幂等写接口；后台与小程序只调用领域 API。`field-notes` 通过可选项目能力字段渲染模块、角色、流程和指标，旧项目没有字段时继续使用 Markdown 正文。

**Tech Stack:** Go 1.25、Gin、MySQL 8.4、Redis 8、Vue/Vite、TypeScript/JavaScript、Astro、Vitest、Playwright。

## Global Constraints

- 所有写接口返回 `{code,message,data}`，跨 IO 函数接收 `context.Context`，错误不得吞掉。
- 所有写接口要求 `Idempotency-Key`，重复请求返回同一业务结果；状态变更写入事件时间线。
- MySQL 8.4 使用外键、索引和明确的时间/金额字段；生产启动必须校验 MySQL/Redis 配置。
- 演示数据必须是虚构数据；不接入真实支付、短信、税务、银行或第三方账号。
- 每个仓库提交前必须通过对应的 `go test ./...`、`go vet ./...`、`npm test`、`npm run build`。
- 浏览器验收必须覆盖加载、列表、详情、创建、状态推进和错误反馈，并检查控制台无 error/warning。
- 分支统一为 `feat/productization-phase1`，提交信息使用中文业务描述。

---

### Task 1: InvoiceFlow 发票与回款闭环

**Files:**
- Modify: `E:/project/invoiceflow-admin/server/types.go`, `service.go`, `store.go`, `main.go`
- Modify: `E:/project/invoiceflow-admin/deploy/mysql/init.sql`
- Modify: `E:/project/invoiceflow-admin/web/src/api.js`, `main.js`, `tests/api.test.js`, `tests/careflow.test.js`
- Modify: `E:/project/invoiceflow-miniapp/src/api.js`, `main.js`, `tests/api.test.js`, `tests/careflow.test.js`

**Interfaces:**
- `GET /invoices?page=1&pageSize=20&status=&keyword=` 返回分页发票。
- `GET /invoices/:id` 返回发票抬头、税率、明细、回款汇总和状态事件。
- `POST /invoices` 创建发票申请，输入 `{customerId,customer,invoiceType,taxRate,amount,items}`。
- `POST /invoices/:id/status` 输入 `{status,actor}`，允许 `草稿→待审核→已开具→部分回款→已核销→已归档`。
- `POST /invoices/:id/payments` 输入 `{amount,paidAt,method,remark}` 登记回款。
- `POST /invoices/:id/reconcile` 执行核销并写事件。

- [ ] **Step 1: Write failing API/service tests** for invoice creation validation, illegal status transition, repeated `Idempotency-Key`, payment overrun rejection, and timeline ordering.
- [ ] **Step 2: Run `go test ./...`** in `invoiceflow-admin`; confirm the new tests fail because the domain types/routes do not exist.
- [ ] **Step 3: Add Invoice/InvoiceItem/Payment/InvoiceEvent types and SQL tables** with indexes on customer, status, issue date, and unique idempotency keys; add store methods with context and parameterized SQL.
- [ ] **Step 4: Implement service state machine and handlers** using the response envelope and `Idempotency-Key`; keep `/appointments` handlers unchanged for compatibility.
- [ ] **Step 5: Add API client methods and UI screens** for invoice list filters, detail drawer, payment form, reconcile action, timeline, empty/error states, and mobile quick-create.
- [ ] **Step 6: Add front-end tests** for required fields, filters, detail rendering, successful payment and failed overrun toast; run `npm test` and `npm run build` in both front-end workspaces.
- [ ] **Step 7: Run `go test ./... && go vet ./...`**, then commit `feat(invoiceflow): 完成发票回款核销闭环`.

### Task 2: RepairFlow 售后维修闭环

**Files:**
- Modify: `E:/project/repairflow-admin/server/types.go`, `service.go`, `store.go`, `main.go`, `deploy/mysql/init.sql`
- Modify: `E:/project/repairflow-admin/web/src/api.js`, `main.js`, `tests/api.test.js`, `tests/careflow.test.js`
- Modify: `E:/project/repairflow-miniapp/src/api.js`, `main.js`, `tests/api.test.js`, `tests/careflow.test.js`

**Interfaces:**
- `GET /work-orders?page=1&pageSize=20&status=&keyword=`、`GET /work-orders/:id`、`GET /work-orders/:id/events`。
- `POST /work-orders` 输入 `{customer,phone,address,device,issue,preferredSlot}`。
- `POST /work-orders/:id/quote` 输入 `{items,total,remark}`；`POST /work-orders/:id/dispatch` 输入 `{technicianId,scheduledAt}`。
- `POST /work-orders/:id/status` 状态为 `待受理→已诊断→待报价→待派工→上门中→待验收→已结案`。
- `POST /work-orders/:id/acceptance` 输入 `{result,paymentAmount,remark}`；`POST /work-orders/:id/warranty` 输入 `{months,remark}`。

- [ ] **Step 1: Write failing tests** for required address/device, quote approval, dispatch ownership, illegal status transitions, acceptance before completion, and idempotent work-order creation.
- [ ] **Step 2: Run the targeted Go tests** and record the expected missing-domain failures.
- [ ] **Step 3: Add work-order, quote, dispatch, service-report and warranty tables/types** with indexes for SLA status and technician schedule; implement store/service/handlers.
- [ ] **Step 4: Add admin UI** for SLA queue, work-order detail, quote/dispatch/acceptance actions and event timeline.
- [ ] **Step 5: Add miniapp UI** for repair request, work-order detail, technician ETA, quote confirmation, acceptance and warranty card.
- [ ] **Step 6: Add front-end tests**, run both front-end test/build commands, then run Go test/vet and commit `feat(repairflow): 完成报修派工验收闭环`.

### Task 3: SupplyFlow 采购供应链闭环

**Files:**
- Modify: `E:/project/supplyflow-admin/server/types.go`, `service.go`, `store.go`, `main.go`, `deploy/mysql/init.sql`
- Modify: `E:/project/supplyflow-admin/web/src/api.js`, `main.js`, `tests/api.test.js`, `tests/careflow.test.js`
- Modify: `E:/project/supplyflow-miniapp/src/api.js`, `main.js`, `tests/api.test.js`, `tests/careflow.test.js`

**Interfaces:**
- `GET /purchase-requests`、`GET /purchase-requests/:id`、`GET /purchase-requests/:id/events`。
- `POST /purchase-requests` 输入 `{requester,department,items:[{sku,name,quantity,unit}]}`。
- `POST /purchase-requests/:id/quotes` 输入 `{supplier,items,total,deliveryAt}`；`POST /purchase-requests/:id/approve`。
- `POST /purchase-requests/:id/order`、`POST /purchase-requests/:id/receipt` 输入收货和质检结果；`POST /purchase-requests/:id/reconcile`。
- 状态为 `草稿→询价中→待审批→已下单→部分到货→已质检→已入库`，不合格收货必须进入异常状态。

- [ ] **Step 1: Write failing tests** for SKU line validation, quote comparison, approval actor, partial receipt, failed QC and idempotent receipt.
- [ ] **Step 2: Run targeted tests** and confirm they fail for missing purchase-domain behavior.
- [ ] **Step 3: Add purchase request/item/quote/order/receipt/QC/stock tables and services** with foreign keys and quantity constraints.
- [ ] **Step 4: Implement admin filters, supplier comparison, approval drawer, receipt/QC form, stock view and reconciliation timeline.**
- [ ] **Step 5: Implement miniapp request creation, quote comparison, order detail, receipt status and exception task pages.**
- [ ] **Step 6: Run all tests/builds, then commit `feat(supplyflow): 完成采购收货质检入库闭环`.

### Task 4: PayrollFlow 薪酬发放闭环

**Files:**
- Modify: `E:/project/payrollflow-admin/server/types.go`, `service.go`, `store.go`, `main.go`, `deploy/mysql/init.sql`
- Modify: `E:/project/payrollflow-admin/web/src/api.js`, `main.js`, `tests/api.test.js`, `tests/careflow.test.js`
- Modify: `E:/project/payrollflow-miniapp/src/api.js`, `main.js`, `tests/api.test.js`, `tests/careflow.test.js`

**Interfaces:**
- `GET /payroll-periods`、`GET /payroll-periods/:id`、`GET /payroll-periods/:id/items`、`GET /payroll-periods/:id/events`。
- `POST /payroll-periods` 输入 `{month,department}`；`POST /payroll-periods/:id/calculate`；`POST /payroll-periods/:id/review`；`POST /payroll-periods/:id/pay`。
- `GET /employees/:id/payslips` 返回虚构工资条；`POST /payroll-periods/:id/adjustments` 输入调整原因和金额。
- 状态为 `草稿→计算中→待复核→待发放→发放中→已归档`，发放后禁止直接修改明细。

- [ ] **Step 1: Write failing tests** for payroll period validation, calculation totals, review difference, lock after pay, idempotent pay batch and adjustment audit.
- [ ] **Step 2: Run targeted tests** and verify the missing behavior is exposed.
- [ ] **Step 3: Add payroll period/item/attendance/approval/pay-batch/adjustment tables and services** with Decimal-safe money handling and audit events.
- [ ] **Step 4: Implement admin period list, employee detail, calculation diff, approval lock, pay-batch retry and payslip export UI.**
- [ ] **Step 5: Implement miniapp personal payslip, approval task, adjustment explanation and period status pages.**
- [ ] **Step 6: Run tests/build/vet and commit `feat(payrollflow): 完成薪资核算审批发放闭环`.

### Task 5: BookingFlow 预约排班闭环

**Files:**
- Modify: `E:/project/bookingflow-admin/server/types.go`, `service.go`, `store.go`, `main.go`, `deploy/mysql/init.sql`
- Modify: `E:/project/bookingflow-admin/web/src/api.js`, `main.js`, `tests/api.test.js`, `tests/careflow.test.js`
- Modify: `E:/project/bookingflow-miniapp/src/api.js`, `main.js`, `tests/api.test.js`, `tests/careflow.test.js`

**Interfaces:**
- `GET /services`、`GET /availability?serviceId=&date=`、`GET /bookings`、`GET /bookings/:id`、`GET /bookings/:id/events`。
- `POST /bookings` 输入 `{customer,serviceId,staffId,slotId,deposit}`；`POST /bookings/:id/reschedule`；`POST /bookings/:id/checkin`；`POST /bookings/:id/complete`；`POST /bookings/:id/refund`。
- 状态为 `待确认→已预约→已签到→服务中→已完成`，取消/退款必须释放时段库存。

- [ ] **Step 1: Write failing tests** for slot conflict, deposit validation, reschedule inventory release, cancellation/refund, completion review and idempotent booking.
- [ ] **Step 2: Run targeted tests** and confirm expected failures.
- [ ] **Step 3: Add service/availability/booking/payment/review tables and services** with a Redis slot lock and MySQL uniqueness constraint.
- [ ] **Step 4: Implement admin service catalog, calendar capacity, booking detail, reschedule/refund and no-show dashboard UI.**
- [ ] **Step 5: Implement miniapp service detail, slot selection, booking detail, reschedule/cancel, check-in and review UI.**
- [ ] **Step 6: Run tests/build/vet and commit `feat(bookingflow): 完成服务预约排班支付闭环`.

### Task 6: 博客结构化产品能力展示

**Files:**
- Modify: `E:/project/field-notes/src/lib/project-schema.ts`
- Modify: `E:/project/field-notes/src/layouts/ProjectLayout.astro`
- Create: `E:/project/field-notes/src/components/ProjectCapabilityPanel.astro`
- Modify: `E:/project/field-notes/src/content/projects/invoiceflow-platform.md`
- Modify: `E:/project/field-notes/src/content/projects/repairflow-platform.md`
- Modify: `E:/project/field-notes/src/content/projects/supplyflow-platform.md`
- Modify: `E:/project/field-notes/src/content/projects/payrollflow-platform.md`
- Modify: `E:/project/field-notes/src/content/projects/bookingflow-platform.md`
- Test: `E:/project/field-notes/tests/project-capabilities.test.ts`

**Interfaces:**
- Frontmatter optional fields: `modules: [{name,description,features[]}]`, `roles: [{name,scope}]`, `workflow: [{label,status}]`, `metrics: [{label,value,trend}]`, `integrations: string[]`.
- `ProjectCapabilityPanel` accepts `ProjectData` and renders only fields present, with accessible headings and mobile one-column layout.

- [ ] **Step 1: Write failing schema/render tests** for valid capability data, invalid empty module names, fallback when fields are absent, and the five project pages containing module/role/workflow headings.
- [ ] **Step 2: Run the targeted Vitest file** and confirm it fails before the fields/component exist.
- [ ] **Step 3: Extend the Zod schema and add `ProjectCapabilityPanel.astro`** with module cards, role matrix, workflow steps, metrics and integration tags.
- [ ] **Step 4: Add domain-specific capability frontmatter and concise Markdown sections** to the five project files; do not remove existing repository/screenshot metadata.
- [ ] **Step 5: Render the panel from `ProjectLayout.astro`**, run `npm test`, `npm run check`, `npm run test:build`, and verify all 30 project pages still build.
- [ ] **Step 6: Commit `feat(blog): 增加项目能力模型展示`.

### Task 7: Cross-project browser verification and screenshots

**Files:**
- Create: `E:/project/.audit/productization-phase1-browser-check.mjs`
- Modify: `E:/project/field-notes/public/images/projects/*` only with verified screenshots

- [ ] **Step 1: Start each of the five admin web builds and five miniapp builds on unique ports.**
- [ ] **Step 2: Run Playwright checks for each product**: load home, switch list, create demo record, open detail, advance status, trigger one invalid action, assert visible error and no console errors.
- [ ] **Step 3: Capture desktop admin and mobile miniapp screenshots only after layout assertions pass; reject images with wrong title, blank body, overflow or failed resource.
- [ ] **Step 4: Run the blog screenshot/content tests and commit `docs(blog): 更新第一批产品化截图`.

### Task 8: Integration review

- [ ] **Step 1: Verify every repository has only intentional changes and the branch is `feat/productization-phase1`.**
- [ ] **Step 2: Run the full command matrix from the design spec and record pass/fail counts.**
- [ ] **Step 3: Review API compatibility, migration safety, error paths, and visual screenshots; fix Critical/Important findings before merging.**
- [ ] **Step 4: Push each repository branch and deploy the blog only after the fixed-domain smoke check returns 200 and exposes 30 projects plus the new capability panel.**

