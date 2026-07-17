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
| `field-notes` `npm test` | 448 tests passed |
| `field-notes` `npx vitest run tests/productization-phase2.test.ts` | 4 tests passed |

## 分支与提交

- admin：`feat/travelflow-booking-after-sale`
- miniapp：`feat/travelflow-miniapp-booking-after-sale`
- blog：沿用 `feat/productization-phase2`

各仓库仅提交本任务相关变更，未 push。旅行预订创建初始状态为 `待确认`，确认动作推进到 `已预订`，与当前公开 API 的单次确认动作保持一致；`草稿` 作为产品编辑态未暴露为订单动作。
