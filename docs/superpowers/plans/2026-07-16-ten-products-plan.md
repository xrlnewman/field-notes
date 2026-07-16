# 十个高需求产品扩展 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增 10 个可运行的行业产品，使个人博客达到 20 个项目，并完成仓库、截图、闭环 API 和线上展示验收。

**Architecture:** 每个产品拆分 admin/API 与 miniapp 两个仓库。后台统一采用 Go Gin + MySQL 8.4 + Redis 8 + Docker Compose，前端通过 `/api/v1` 客户端调用；没有依赖时以合成数据回退，配置依赖后执行真实写入和事件审计。

**Tech Stack:** Go 1.25, Gin, MySQL 8.4, Redis 8, Docker Compose, Vite, vanilla JavaScript/Vue, Node test runner, Astro content collection.

## Global Constraints

- 所有写接口要求 `Idempotency-Key`，状态变化必须写事件记录。
- 所有 API 使用 `{ code, message, data, traceId }` envelope。
- 所有数据均为虚构演示数据，医疗/支付/身份等高风险领域不接入真实数据。
- 每个产品必须有后台/API 仓库与移动端仓库，并在博客项目详情中双向关联。
- 完成前必须通过 Go/Node 测试、构建、Compose 配置检查和 GitHub/博客线上 HTTP 检查。

---

### Task 1: 第一批四个产品

**Products:** HireFlow、FeeFlow、CRMFlow、ContractFlow。

**Deliverables:** 每个产品两个 GitHub 仓库、一个 admin/API + MySQL/Redis Compose、一个移动端、4 张截图、博客内容文件。

- [ ] 为每个产品从已验证闭环模板创建独立仓库和分支。
- [ ] 写状态机测试：招聘候选人、费控单、销售商机、合同分别覆盖创建到完成/归档。
- [ ] 写 API client 和前端动作测试，确保写操作带幂等键并能刷新状态。
- [ ] 构建、截图、检查无溢出后提交并推送。

### Task 2: 第二批四个产品

**Products:** PropertyFlow、HelpdeskFlow、EventFlow、RetailFlow。

- [ ] 为工单、客服、票务、门店订单分别定义领域事件与状态流转。
- [ ] 每个项目提供总览、列表、异常/售后、结算或分析四类后台视图。
- [ ] 移动端提供报修/回复/核销/订单处理等高频动作，并实现 API 回退。
- [ ] 完成测试、截图和 GitHub 推送。

### Task 3: 第三批两个产品

**Products:** PetFlow、EnergyFlow。

- [ ] 实现预约服务、会员扣次、设备巡检、告警工单等状态机。
- [ ] 补 MySQL seed、Redis 幂等和事件时间线。
- [ ] 完成双端测试、截图和 GitHub 推送。

### Task 4: 博客集成和视觉验收

- [ ] 新增 10 个内容文件，补 10 个行业分类和双仓库链接。
- [ ] 每个项目至少 4 张构建后截图，检查尺寸、文字、色板、移动端裁切。
- [ ] 项目列表达到 20 个，分类筛选和详情页链接测试通过。

### Task 5: 全量上线验收

- [ ] 对 20 个仓库执行状态、测试、构建和远端同步检查。
- [ ] 对新增产品选择至少 2 个 Compose 栈做 MySQL/Redis 真实冒烟。
- [ ] 部署博客，验证首页、列表页和 10 个详情页 HTTP 200。
- [ ] 记录每个产品真实上线边界：博客公网展示，后端通过 Compose 可复现，不虚报公网 API。
