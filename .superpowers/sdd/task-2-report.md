# Task 2 · TravelFlow 旅行预订与售后闭环

## 完成内容

- `travelflow-admin/server` 新增旅行产品、库存锁定、预订、支付、行程完成、售后领域模型与内存/ MySQL 8.4 存储实现。
- 新增 `/api/v1/travel-products`、`/api/v1/bookings` 及确认、支付、完成、售后、事件时间线接口；写接口统一要求 `Idempotency-Key`，状态动作要求 `actor`，售后要求原因。
- 日期范围、金额（分）、数量、库存和状态迁移均在后端校验；预订使用事务锁定库存，重复请求回放同一结果。
- 管理端增加旅行产品管理、库存余量、预订状态筛选和售后动作面板；移动端增加产品浏览、预订、支付状态、完成与售后入口。
- 产品详情文档补充接口边界、状态机、库存与幂等约束，保持 `travelflow-admin` / `travelflow-miniapp` 仓库关联。

## TDD 与验证

先新增 `server/travel_booking_test.go`，首次运行 `go test ./server` 按预期因领域类型尚未定义而失败（RED）；实现后转绿。

| 检查项 | 结果 |
| --- | --- |
| `travelflow-admin` `go test ./...` | 通过 |
| `travelflow-admin` `go vet ./...` | 通过 |
| `travelflow-admin/web` `npm test` | 3 tests passed |
| `travelflow-admin/web` `npm run build` | 通过 |
| `travelflow-miniapp` `npm test` | 3 tests passed |
| `travelflow-miniapp` `npm run build` | 通过 |
| `field-notes` `npm test` | 449 tests passed |
| `field-notes` `npm run check` | 0 errors / 0 warnings / 0 hints |
| `field-notes` `npm run build` | 通过 |
| `field-notes` `npx vitest run tests/productization-phase2.test.ts` | 4 tests passed |

## 分支与提交

- admin：`feat/travelflow-booking-after-sale`
- miniapp：`feat/travelflow-miniapp-booking-after-sale`
- blog：沿用 `feat/productization-phase2`

各仓库仅提交本任务相关变更，未 push。旅行产品和预订均从 `草稿` 开始；一次确认动作记录 `草稿 → 待确认 → 已预订`，保持公开 API 的单次确认体验。

## 审查修复（第二轮）

- 产品与预订补充 `草稿` 边界：产品创建草稿、发布后可预订；预订草稿确认时记录 `草稿 → 待确认 → 已预订` 事件。
- 新增结构化 `Payment` 与 `AfterSale` 记录；售后仅允许 `已支付` / `已完成`，在同一内存锁或 MySQL 事务中按唯一 booking 记录只释放一次库存。
- 负价格（含 `-0.50`）、整数溢出、负容量/数量均返回 HTTP 400；SQL 列表扫描和详情查询错误不再静默吞掉；Redis 锁按 token 校验后释放。
- 管理端新增产品日历、产品/预订详情、事件时间线和售后原因表单；移动端调用产品详情、预订详情/事件 API，并提供旅客、人数、联系方式、售后原因表单，成功后刷新。
- 重新生成四张真实页面截图：管理端总览/产品队列（1440×960），移动端产品/预订状态（390×844）；四张 SHA-256 均不重复，并同步更新图注。
