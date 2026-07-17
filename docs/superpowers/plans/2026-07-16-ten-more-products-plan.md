# 再增十个高需求产品 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增 10 个可运行的行业产品，使个人博客达到 30 个项目，并完成双仓库、闭环 API、截图、GitHub 与线上博客验收。

**Architecture:** 每个产品拆为 admin/API 与 miniapp 两个公开仓库。后台统一采用 Go Gin + MySQL 8.4 + Redis 8 + Docker Compose，前端通过 `/api/v1` 客户端调用；无外部依赖时展示合成数据，配置依赖后执行真实写入和审计事件。

**Tech Stack:** Go 1.25, Gin, MySQL 8.4, Redis 8, Docker Compose, Vite/Vue/TypeScript, Astro content collections, Playwright。

## Global Constraints

- 所有写接口带 `Idempotency-Key`，状态变化写事件记录。
- API 响应统一为 `{ code, message, data, traceId }`。
- 所有数据是虚构演示数据，医疗、支付、身份场景不接入真实数据。
- 每个产品必须有 admin/API 与 miniapp 两个公开仓库并在博客双向关联。
- 完成前必须通过 Go/Node 测试、构建、Compose 配置、截图和线上 HTTP 检查。

---

### Task 1: InvoiceFlow、RepairFlow、SupplyFlow、PayrollFlow、BookingFlow

**Deliverables:** 5 个产品各自的 admin/API 与 miniapp 仓库、Compose、状态机测试、4 张截图及 GitHub 远端。

- [ ] 从已验证模板复制仓库并改名，替换领域文案、状态、seed、色板和 API 别名。
- [ ] 覆盖开票收款、售后维修、采购审批、薪资核算、预约排班五条闭环；写入要求幂等键，状态变更写事件。
- [ ] 后台提供总览、列表、待处理、分析/结算页面，移动端提供高频动作和状态刷新。
- [ ] 运行 Go 测试/vet、前端测试/构建、Compose 检查和 Playwright 截图，提交并推送公开仓库。

### Task 2: LabFlow、TravelFlow、CreatorFlow、LegalFlow、VenueFlow

**Deliverables:** 5 个产品各自的 admin/API 与 miniapp 仓库、Compose、状态机测试、4 张截图及 GitHub 远端。

- [ ] 从已验证模板复制仓库并改名，替换医疗样本、旅行订单、内容排期、法务案件、场馆运营数据和色板。
- [ ] 覆盖送检到报告、预订到售后、选题到发布、立案到结案、预约到日结五条闭环；写入要求幂等键，状态变更写事件。
- [ ] 为医疗与支付相关界面明确使用虚构数据和演示边界，不接入真实服务。
- [ ] 运行 Go 测试/vet、前端测试/构建、Compose 检查和 Playwright 截图，提交并推送公开仓库。

### Task 3: 博客内容和分类

**Files:**
- Create: `E:\project\field-notes\src\content\projects\{invoice,repair,supply,payroll,booking,lab,travel,creator,legal,venue}flow-platform.md`
- Modify: `E:\project\field-notes\src\lib\projects.ts`
- Modify: `E:\project\field-notes\src\pages\projects\index.astro`
- Modify: `E:\project\field-notes\tests\content.test.ts`
- Modify: `E:\project\field-notes\tests\projects.test.ts`
- Modify: `E:\project\field-notes\tests\build-smoke.test.ts`
- Create: `E:\project\field-notes\public\images\projects\<slug>\shot-{1..4}.png`

- [ ] 将博客项目数和标题文案更新为 30 个，并新增 `售后服务`、`采购供应链`、`旅游住宿`、`内容创作`、`法律服务`、`场馆运营` 六个分类。
- [ ] 每个内容文件写入准确标题、闭环、技术栈、双仓库链接、4 张截图与免费开源边界。
- [ ] 将 40 张截图复制到 public，确保封面和截图引用存在且尺寸/格式有效。
- [ ] 更新内容、分类统计、项目数量、详情页和 HTML 页面数断言。

### Task 4: 全量验证与部署

- [ ] 运行博客 `npm run verify`，确认测试、Astro check、构建和截图检查全部通过。
- [ ] 对新增产品至少选择两组 Compose 运行真实创建/状态推进/完成及幂等冒烟。
- [ ] `git fetch` 后提交并推送博客，部署 Cloudflare Pages。
- [ ] 验证项目列表包含 30 个项目，10 个新详情页、40 张新截图和 20 个新 GitHub 仓库链接返回 HTTP 200。
- [ ] 重新检查浏览器桌面/移动端无溢出、空白、错配图片或控制台错误后收尾。
