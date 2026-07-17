# 第二批产品产品化设计

## 背景与目标

第一阶段已经完成 InvoiceFlow、RepairFlow、SupplyFlow、PayrollFlow、BookingFlow 的能力展示和博客上线修复。第二阶段继续把下一批五个已有公开项目从“可展示页面”推进为可演示的领域产品，并保持每个项目都能在博客详情页看到前台、后台、API、状态流和源码边界。

本阶段覆盖 LabFlow、TravelFlow、CreatorFlow、LegalFlow、VenueFlow。每个产品必须能从移动端/前台发起主流程，在 Go Gin 后台查看列表和详情，推进至少一次合法状态，触发一次非法操作并得到明确错误；所有状态变化都要有事件时间线，演示数据必须是虚构数据。

## 范围与非目标

### 范围

- `labflow-admin` / `labflow-miniapp`
- `travelflow-admin` / `travelflow-miniapp`
- `creatorflow-admin` / `creatorflow-miniapp`
- `legalflow-admin` / `legalflow-miniapp`
- `venueflow-admin` / `venueflow-miniapp`
- `field-notes` 的五个项目详情页、截图和产品能力说明

### 非目标

- 不接入真实医疗、支付、旅行供应商、电子签章或第三方账号。
- 不把演示数据写入真实客户环境。
- 不重写第一阶段产品的领域逻辑；只复用稳定的接口、幂等、事件和测试约定。
- 不把博客公网展示描述成公网 API；博客只展示可复现的源码和本地运行边界。

## 产品闭环

| 产品 | 主实体 | 状态流转 | 必须可演示的关键动作 |
| --- | --- | --- | --- |
| LabFlow | Sample、Test、Report | 待送检 → 已接收 → 检验中 → 待复核 → 已出报告 → 已归档 | 创建样本、接收、开始检验、复核报告、归档 |
| TravelFlow | Product、Booking、Payment、AfterSale | 草稿 → 待确认 → 已预订 → 已支付 → 出行中 → 已完成 / 售后中 | 配置产品、创建预订、确认支付、完成出行、登记售后 |
| CreatorFlow | Topic、Script、Content、PublishRecord | 待选题 → 写作中 → 制作中 → 待审核 → 已发布 → 已复盘 | 创建选题、提交审核、发布、记录数据复盘 |
| LegalFlow | Matter、Task、Document、Hearing | 待委托 → 已立案 → 协同中 → 待结案 → 已结案 | 新建案件、分派任务、归档材料、结案复盘 |
| VenueFlow | Venue、Session、Ticket、Settlement | 草稿 → 已排期 → 售票中 → 活动中 → 待结算 → 已结算 | 创建场次、售票、核销、活动收尾、日结 |

## 共享技术约定

1. 后端继续采用 Go Gin，保持 `cmd`/`internal` 分层现状；新领域服务首参接收 `context.Context`，存储层使用参数化 SQL。
2. MySQL 8.4 保存主实体、明细、事件和幂等记录；金额使用最小货币单位或 Decimal，状态、主键、时间和业务唯一键建立索引。
3. Redis 8 用于幂等键、短期锁和列表缓存；没有外部依赖时使用内存回退，生产启动仍校验 MySQL/Redis 配置。
4. 所有写接口要求 `Idempotency-Key`，统一返回 `{code,message,data,traceId}`；重复请求返回第一次业务结果，不能重复写事件。
5. 非法状态、越权动作、超量/超售、缺少必填字段必须返回可读错误，不能吞错；状态变化写入 `actor`、`action`、`from_status`、`to_status`、`created_at`。

## 后台与移动端体验

后台每个产品提供总览指标、业务列表、详情抽屉/页面、待处理或异常视图、状态时间线和下一步动作；列表至少支持关键词或状态筛选、分页/空态和错误反馈。移动端提供首页指标、快捷创建、业务列表、详情、状态刷新和一个高频动作，所有写操作成功后刷新详情并显示 toast。

五个产品使用不同的视觉色板和领域文案，不能继续使用同一套“预约/回访”模板；医疗和旅行页面明确标注“虚构数据/演示流程”，不出现真实机构、身份证号或支付凭证。

## 博客展示

五个项目继续使用 `ProjectCapabilityPanel` 的结构化字段：`modules`、`roles`、`workflow`、`metrics`、`integrations`。每个项目详情页至少包含 4 张经过构建后验证的截图、两个关联仓库、领域闭环说明和本地运行边界。旧字段和已有截图不删除，新增内容只补领域准确的模块、流程和指标。

## 测试与验收

- Go：每个 admin/API 执行 `go test ./...`、`go vet ./...`，覆盖创建、合法/非法状态、幂等、事件顺序和关键领域约束。
- 前端：每个 miniapp 执行 `npm test`、`npm run build`，覆盖 API 回退、必填校验、空态、成功动作和失败 toast。
- 浏览器：每个产品至少加载首页、列表、详情，完成一条合法动作并触发一条失败动作；截图前确认标题、数据、色板、移动端裁切和控制台无 error/warning。
- 博客：执行 `npm test`、`npm run check`、`npm run build`，确认仍有 30 个项目，五个详情页的闭环、截图和双仓库链接完整。

## 上线顺序

按 LabFlow → TravelFlow → CreatorFlow → LegalFlow → VenueFlow 分批提交。每个产品的两个仓库完成测试和远端同步后，再更新博客内容和截图；五个产品全部通过后统一部署 Cloudflare Pages，并做首页、项目列表和五个详情页的桌面/移动端 smoke check。
