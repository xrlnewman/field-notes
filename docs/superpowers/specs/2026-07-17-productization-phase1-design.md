# 第一批项目产品化设计

## 背景与目标

当前 30 个公开项目的博客详情页已经有项目截图和仓库链接，但第一批 10 个产品中有 8 个仍沿用预约/回访模板，导致页面文案和代码模型不一致。本阶段把 5 个交易型产品 InvoiceFlow、RepairFlow、SupplyFlow、PayrollFlow、BookingFlow 做成可演示的上线级闭环，并同步升级博客详情页的能力表达。

本阶段完成后，每个产品都能从前台发起业务，在后台查看详情、推进状态、记录关键动作，并在异常时给出明确反馈；博客页面能展示角色、模块、流程、指标和源码边界，而不是只有两段说明。

## 范围

### 产品仓库

每个产品包含一个 Go Gin 后台仓库和一个前台/小程序仓库，共 10 个仓库：

- `invoiceflow-admin` / `invoiceflow-miniapp`
- `repairflow-admin` / `repairflow-miniapp`
- `supplyflow-admin` / `supplyflow-miniapp`
- `payrollflow-admin` / `payrollflow-miniapp`
- `bookingflow-admin` / `bookingflow-miniapp`

### 博客仓库

`field-notes` 增加结构化产品能力展示，覆盖上述 5 个项目，并为剩余项目保留兼容的 Markdown 正文。

## 产品闭环

| 产品 | 主实体 | 状态流转 | 必须可演示的关键动作 |
| --- | --- | --- | --- |
| InvoiceFlow | Invoice、Payment、Reconciliation | 草稿 → 待审核 → 已开具 → 部分回款 → 已核销 → 已归档 | 新建开票、审核、登记回款、核销、查看时间线 |
| RepairFlow | WorkOrder、Quote、Dispatch、Warranty | 待受理 → 已诊断 → 待报价 → 待派工 → 上门中 → 待验收 → 已结案 | 创建工单、报价确认、派工、验收、登记保修 |
| SupplyFlow | PurchaseRequest、Quote、PurchaseOrder、Receipt | 草稿 → 询价中 → 待审批 → 已下单 → 部分到货 → 已质检 → 已入库 | 创建采购、录入报价、审批、收货质检、入库 |
| PayrollFlow | PayrollPeriod、PayrollItem、Approval、PayBatch | 草稿 → 计算中 → 待复核 → 待发放 → 发放中 → 已归档 | 创建周期、计算、复核差异、发放、查看工资条 |
| BookingFlow | Service、Availability、Booking、Payment | 待确认 → 已预约 → 已签到 → 服务中 → 已完成 / 已取消 | 选择服务时段、创建预约、改期、签到、完成评价 |

## 后端设计

1. 每个仓库新增领域类型、输入校验、状态机和事件记录；保留旧预约接口只作为迁移兼容层，不再让新页面依赖 `Appointment` 语义。
2. 新增列表、详情、事件时间线、创建和状态变更接口。所有写接口要求业务幂等键，返回统一响应信封 `{code,message,data}`。
3. MySQL 迁移新增主实体、明细/子项、事件和幂等记录，字段使用明确的时间类型、金额使用最小货币单位或 Decimal，主表和子表建立外键与索引。
4. Redis 8 用于幂等键、短期锁和列表缓存；未配置 MySQL/Redis 时开发模式可以使用内存实现，但生产启动必须校验环境变量并明确报错。
5. 写操作记录 `actor`、`action`、`from_status`、`to_status`、`created_at`，详情接口返回时间线，供后台和前台共同展示。

## 前台与后台设计

### 后台

- 总览：业务量、待办、金额/数量指标、异常卡片和近 7 日趋势。
- 列表：关键词、状态、日期、负责人筛选，分页和空态；点击进入详情。
- 详情：主信息、明细、状态时间线、关联对象、下一步动作和错误反馈。
- 操作：创建、审批/确认、状态推进、批量导出；危险动作二次确认并保留事件。

### 前台/小程序

- 首页：产品指标、快捷创建、待处理任务和最近记录。
- 业务列表：筛选、分页、状态徽章和下拉刷新。
- 业务详情：字段、明细、事件时间线、操作按钮、成功/失败 toast。
- 任务/消息：逾期提醒、异常处理、操作结果。
- 我的：当前演示角色、数据范围、源码/接口说明。

## 博客展示设计

`field-notes` 的项目 schema 为项目增加可选结构化字段：`modules`、`roles`、`workflow`、`metrics`、`integrations`。项目详情页新增“产品能力”区域，按模块卡片、角色矩阵、状态流、运营指标和代码仓库分组展示；旧项目没有新字段时继续渲染现有 Markdown 正文，不破坏已有 30 个项目。

## 测试与验收

每个产品至少提供以下测试：

- Go：`go test ./...`、`go vet ./...`，覆盖创建、合法状态流转、非法流转、幂等、详情时间线。
- 前台：`npm test`、`npm run build`，覆盖 API 请求、表单必填、空态和错误态。
- 浏览器：真实页面加载、切换列表/详情、创建一条演示数据、推进一次状态、触发一次失败提示，检查控制台无 error/warning，并重新采集桌面/移动截图。
- 博客：`npm test`、`npm run check`、`npm run test:build`，确认 30 个项目、截图和 GitHub 链接仍完整。

## 非目标

- 本阶段不接入真实支付、短信、税务、银行或第三方生产账号。
- 演示数据全部为虚构数据，不上传个人或客户资料。
- 不在 5 个项目完成前同时重写剩余 20 个项目的业务后端；剩余项目沿用同一验收标准分批处理。

