# 第二批产品产品化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 LabFlow、TravelFlow、CreatorFlow、LegalFlow、VenueFlow 五个现有项目升级为可演示的领域闭环，并同步更新博客展示、截图和线上验收。

**Architecture:** 每个产品保留独立 admin/API 与 miniapp 仓库。后端沿用现有 Go Gin 服务和内存/SQL store 双实现，在领域服务层增加状态机、事件时间线、幂等键和输入校验；前端通过现有 API client 调用统一响应信封，依赖不可用时只使用虚构 seed 数据。博客复用 `ProjectCapabilityPanel` 展示模块、角色、流程、指标和仓库边界。

**Tech Stack:** Go 1.25、Gin、MySQL 8.4、Redis 8、Docker Compose、Vite、原生 JavaScript/Vue、Astro、Vitest、Playwright。

## Global Constraints

- 所有数据均为虚构演示数据，不接入真实医疗、支付、旅行供应商、电子签章或第三方账号。
- 所有写接口要求 `Idempotency-Key`，返回 `{code,message,data,traceId}`；重复键返回同一结果且不重复写事件。
- 所有状态变化写入 `actor`、`action`、`from_status`、`to_status`、`created_at`，非法状态和缺少字段必须返回可读错误。
- Go 跨 IO 方法首参接收 `context.Context`，repo 使用参数化 SQL；MySQL 8.4 建立主键、状态、业务唯一键和时间索引。
- Redis 8 用于幂等键、短期锁和列表缓存；无外部依赖时允许内存回退，生产启动必须校验配置。
- 每个仓库保留当前旧接口兼容层，新页面只调用新领域接口；不修改其他产品仓库。
- 每个任务都必须 TDD：先写失败测试，再写最小实现，再跑完整仓库验证。

---

### Task 1: LabFlow 样本送检与报告闭环

**Files:**
- Modify: `labflow-admin/server/types.go`, `service.go`, `store.go`, `main.go`, `deploy/mysql/init.sql`
- Modify: `labflow-admin/web/src/api.js`, `main.js`, `tests/api.test.js`, `tests/careflow.test.js`
- Modify: `labflow-miniapp/api.js`, `main.js`, `styles.css`, `tests/api.test.js`, `tests/careflow.test.js`
- Modify: `field-notes/src/content/projects/labflow-platform.md`
- Test: `field-notes/tests/productization-phase2.test.ts`

**Interfaces:**
- `GET /samples?page=1&pageSize=20&status=&keyword=` 返回样本列表分页。
- `GET /samples/:id` 返回患者别名、样本类型、检验项目、当前状态和事件时间线。
- `POST /samples` 输入 `{subjectAlias,sampleType,collectedAt,tests[]}`；要求别名和至少一个检验项目。
- `POST /samples/:id/receive`、`POST /samples/:id/start-test`、`POST /samples/:id/review`、`POST /samples/:id/archive` 均输入 `{actor}`，只允许设计中的顺序状态。
- `POST /samples/:id/report` 输入 `{result,remark}`，只能从“检验中”进入“待复核”。

- [ ] **Step 1: Write failing tests** for missing subject alias, empty tests, illegal review before testing, duplicate idempotency key, event ordering and report archive.
- [ ] **Step 2: Run `go test ./...` in `labflow-admin`** and record the expected missing-domain failures.
- [ ] **Step 3: Add Sample/Test/Report/Event/Idempotency types and SQL tables** with status constants and indexes; keep the old appointment handlers unchanged.
- [ ] **Step 4: Implement service state transitions and handlers** with context propagation, envelope response and idempotent event writes.
- [ ] **Step 5: Add admin list/detail/review UI** with status filter, sample detail timeline, report review form, empty/error state and fictional-data label.
- [ ] **Step 6: Add miniapp quick-create/list/detail/review UI** and refresh the detail after every successful action; display failures as toast text.
- [ ] **Step 7: Run `go test ./... && go vet ./...`, front-end `npm test && npm run build`, then commit `feat(labflow): 完成样本送检报告闭环`.

### Task 2: TravelFlow 旅行预订与售后闭环

**Files:**
- Modify: `travelflow-admin/server/domain.go`, `store.go`, `sql_store.go`, `main.go`, `deploy/mysql/init.sql`
- Modify: `travelflow-admin/web/src/api.js`, `main.js`, `tests/api.test.js`, `tests/careflow.test.js`
- Modify: `travelflow-miniapp/api.js`, `main.js`, `styles.css`, `tests/api.test.js`, `tests/careflow.test.js`
- Modify: `field-notes/src/content/projects/travelflow-platform.md`
- Test: `field-notes/tests/productization-phase2.test.ts`

**Interfaces:**
- `GET /travel-products`、`GET /travel-products/:id`、`GET /bookings`、`GET /bookings/:id/events`。
- `POST /travel-products` 输入 `{name,destination,departAt,returnAt,price,capacity}`。
- `POST /bookings` 输入 `{productId,travelerAlias,quantity,contactHint}`，库存不足必须拒绝。
- `POST /bookings/:id/confirm`、`POST /bookings/:id/pay`、`POST /bookings/:id/complete`、`POST /bookings/:id/after-sale` 均要求幂等键和 actor。
- 状态固定为 `草稿→待确认→已预订→已支付→出行中→已完成`，售后从已支付/已完成进入“售后中”。

- [ ] **Step 1: Write failing tests** for date range, capacity overbooking, payment before confirmation, after-sale reason, duplicate booking key and timeline ordering.
- [ ] **Step 2: Run targeted Go tests and verify expected failures.**
- [ ] **Step 3: Add Product/Booking/Payment/AfterSale/Event/Idempotency models and SQL constraints**; use integer cents for price and quantity locks for capacity.
- [ ] **Step 4: Implement service transitions, inventory release and handlers** with fictional-data response fields.
- [ ] **Step 5: Implement admin product calendar, booking list/detail, payment/after-sale actions and seven-day metric cards.**
- [ ] **Step 6: Implement miniapp product detail, traveler booking, booking status, payment confirmation and after-sale form.**
- [ ] **Step 7: Run both repository test/build matrices and commit `feat(travelflow): 完成旅行预订售后闭环`.

### Task 3: CreatorFlow 内容排期与发布闭环

**Files:**
- Modify: `creatorflow-admin/server/types.go`, `service.go`, `store.go`, `main.go`, `deploy/mysql/init.sql`
- Modify: `creatorflow-admin/web/src/api.js`, `main.js`, `tests/api.test.js`, `tests/careflow.test.js`
- Modify: `creatorflow-miniapp/api.js`, `main.js`, `styles.css`, `tests/api.test.js`, `tests/careflow.test.js`
- Modify: `field-notes/src/content/projects/creatorflow-platform.md`
- Test: `field-notes/tests/productization-phase2.test.ts`

**Interfaces:**
- `GET /content-items`、`GET /content-items/:id`、`GET /content-items/:id/events` 支持状态、负责人和发布日期筛选。
- `POST /content-items` 输入 `{title,channel,owner,plannedAt}`；标题、渠道和负责人必填。
- `POST /content-items/:id/script` 输入 `{body}`；`POST /content-items/:id/submit-review` 输入 `{actor}`。
- `POST /content-items/:id/publish` 输入 `{publishedAt,actor}`；`POST /content-items/:id/metrics` 输入 `{views,likes,comments,shares}`。
- 状态固定为 `待选题→写作中→制作中→待审核→已发布→已复盘`。

- [ ] **Step 1: Write failing tests** for required title/channel, script before writing, publish before review, metric non-negative validation, idempotent publish and event order.
- [ ] **Step 2: Run targeted Go tests and confirm missing behavior.**
- [ ] **Step 3: Add ContentItem/Script/PublishRecord/Metrics/Event/Idempotency types, store methods and indexes.**
- [ ] **Step 4: Implement state machine and API handlers with owner/actor audit fields.**
- [ ] **Step 5: Implement admin Kanban/list, review queue, publish form, channel metrics and recent activity timeline.**
- [ ] **Step 6: Implement miniapp topic creation, draft editor, review status, publish confirmation and metrics card.**
- [ ] **Step 7: Run tests/build/vet and commit `feat(creatorflow): 完成内容排期发布复盘闭环`.

### Task 4: LegalFlow 法务案件协同闭环

**Files:**
- Modify: `legalflow-admin/server/types.go`, `service.go`, `store.go`, `main.go`, `deploy/mysql/init.sql`
- Modify: `legalflow-admin/web/src/api.js`, `main.js`, `tests/api.test.js`, `tests/careflow.test.js`
- Modify: `legalflow-miniapp/api.js`, `main.js`, `styles.css`, `tests/api.test.js`, `tests/careflow.test.js`
- Modify: `field-notes/src/content/projects/legalflow-platform.md`
- Test: `field-notes/tests/productization-phase2.test.ts`

**Interfaces:**
- `GET /matters`、`GET /matters/:id`、`GET /matters/:id/events` 支持案件状态和负责人筛选。
- `POST /matters` 输入 `{subjectAlias,caseType,priority,deadline}`；不得接收身份证号或真实客户信息。
- `POST /matters/:id/file` 输入 `{name,kind,checksum}`；`POST /matters/:id/assign` 输入 `{assignee,actor}`。
- `POST /matters/:id/close` 输入 `{result,actor}`；只有待结案状态允许关闭。
- 状态固定为 `待委托→已立案→协同中→待结案→已结案`。

- [ ] **Step 1: Write failing tests** for alias-only input, missing deadline, assignment ownership, document checksum, close-before-pending-close, duplicate file idempotency and ordered timeline.
- [ ] **Step 2: Run targeted Go tests and verify expected failures.**
- [ ] **Step 3: Add Matter/Task/Document/Hearing/Event/Idempotency types and SQL constraints** with deadline and status indexes.
- [ ] **Step 4: Implement service transitions, task assignment and document event audit.**
- [ ] **Step 5: Implement admin matter queue, deadline dashboard, detail timeline, task assignment and document archive UI.**
- [ ] **Step 6: Implement miniapp matter list/detail, assigned task action, document upload metadata and closure summary.**
- [ ] **Step 7: Run tests/build/vet and commit `feat(legalflow): 完成案件协同结案闭环`.

### Task 5: VenueFlow 场馆预约售票与日结闭环

**Files:**
- Modify: `venueflow-admin/server/domain.go`, `store.go`, `sql_store.go`, `main.go`, `deploy/mysql/init.sql`
- Modify: `venueflow-admin/web/src/api.js`, `main.js`, `tests/api.test.js`, `tests/careflow.test.js`
- Modify: `venueflow-miniapp/api.js`, `main.js`, `styles.css`, `tests/api.test.js`, `tests/careflow.test.js`
- Modify: `field-notes/src/content/projects/venueflow-platform.md`
- Test: `field-notes/tests/productization-phase2.test.ts`

**Interfaces:**
- `GET /venues`、`GET /sessions`、`GET /sessions/:id`、`GET /sessions/:id/events`。
- `POST /sessions` 输入 `{venueId,title,startsAt,endsAt,capacity,price}`；时间范围和容量必须有效。
- `POST /sessions/:id/publish`、`POST /sessions/:id/sell` 输入 `{quantity,actor}`；不能超过可售库存。
- `POST /sessions/:id/checkin` 输入 `{ticketCode,actor}`；同一票码只能核销一次。
- `POST /sessions/:id/settle` 输入 `{actor}`；只有活动结束且无待处理异常时允许日结。
- 状态固定为 `草稿→已排期→售票中→活动中→待结算→已结算`。

- [ ] **Step 1: Write failing tests** for invalid time range, duplicate ticket check-in, over-sale, settlement before end, idempotent publish and event order.
- [ ] **Step 2: Run targeted Go tests and confirm expected failures.**
- [ ] **Step 3: Add Venue/Session/Ticket/Settlement/Event/Idempotency types and SQL constraints** with unique ticket codes and capacity indexes.
- [ ] **Step 4: Implement state machine, inventory checks and handlers.**
- [ ] **Step 5: Implement admin venue calendar, session list, sales/check-in dashboard, exception queue and settlement detail.**
- [ ] **Step 6: Implement miniapp session detail, ticket purchase, ticket card, check-in result and activity status.**
- [ ] **Step 7: Run tests/build/vet and commit `feat(venueflow): 完成场馆售票核销日结闭环`.

### Task 6: 博客内容、截图与五个详情页

**Files:**
- Modify: `field-notes/src/content/projects/labflow-platform.md`
- Modify: `field-notes/src/content/projects/travelflow-platform.md`
- Modify: `field-notes/src/content/projects/creatorflow-platform.md`
- Modify: `field-notes/src/content/projects/legalflow-platform.md`
- Modify: `field-notes/src/content/projects/venueflow-platform.md`
- Create/replace verified assets: `field-notes/public/images/projects/{labflow,travelflow,creatorflow,legalflow,venueflow}/shot-{1..4}.png`
- Test: `field-notes/tests/productization-phase2.test.ts`

- [ ] **Step 1: Add failing content assertions** for each product's modules, roles, workflow, metrics, integrations, two repository URLs and four screenshots.
- [ ] **Step 2: Run the targeted Vitest file and verify it fails before content is updated.**
- [ ] **Step 3: Add domain-specific frontmatter and concise Markdown sections**; mark medical/travel data as fictional and preserve existing screenshot paths.
- [ ] **Step 4: Capture screenshots only after each product passes its browser checks; verify dimensions, no overflow, correct title and no broken assets.**
- [ ] **Step 5: Run `npm test`, `npm run check`, `npm run build` in the `field-notes` workspace and commit `feat(blog): 更新第二批产品能力展示`.

### Task 7: 跨仓库验收与上线

**Files:**
- Create: `.audit/productization-phase2-browser-check.mjs`
- Modify only intentional files in the 10 product repositories and `field-notes`.

- [ ] **Step 1: From the workspace root, run every admin/API `go test ./...` and `go vet ./...`; run every miniapp `npm test` and `npm run build`.**
- [ ] **Step 2: Start representative admin and miniapp builds on unique ports; use Playwright to load home/list/detail, perform one legal action, one illegal action and verify visible error plus no console errors.**
- [ ] **Step 3: Run `git fetch` in every repository, inspect status and push only the approved feature branches; do not force-push.**
- [ ] **Step 4: Deploy `field-notes` with `npx wrangler pages deploy dist --project-name field-notes --branch main`.**
- [ ] **Step 5: Verify canonical home, `/projects/`, and the five new detail pages at desktop and mobile sizes; confirm 30 project cards, four screenshots per product, two repository links, HTTP 200 and no console errors.**
- [ ] **Step 6: Record deployment URL, commit IDs, test counts and any local-only boundary in `docs/public-project-roadmap.md`, then commit `docs(phase2): 完成第二批上线验收`.
