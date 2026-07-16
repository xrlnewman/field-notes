# StockFlow 进销存与库存预警平台设计

## 产品定位

StockFlow 面向小型门店、批发商和多仓商家，提供商品、仓库、采购、销售和库存预警的一体化管理。它复用本地 `inventory-system` 已验证的业务模型，但重新以 Go Gin API、运营后台和移动端小程序组成可公开运行的独立产品；不复制邻里社区关系链，也不与 StoreFlow 的到店预约重叠。

核心承诺：免费、开源、可自部署；MySQL 8.4 与 Redis 8 作为默认基础设施，演示数据离线可用，真实 API 可通过环境变量启用。

## 目标用户与首版范围

- 小型零售店：快速查看库存、登记销售、接收采购。
- 连锁门店运营者：按仓库看库存，处理低库存预警，追踪单据状态。
- 仓管/采购人员：维护商品 SKU、入库、出库与库存流水。

首版只做一条完整闭环：商品与仓库 → 采购入库 → 销售出库 → 库存预警 → 流水追溯。退货、批次、支付和多组织留到后续版本，不在本轮假装完成。

## 产品组成与仓库关系

```text
stockflow-miniapp   顾客/店员移动端：库存总览、商品搜索、采购入库、销售出库、预警
stockflow-admin     运营后台 + Go Gin API：商品、仓库、单据、流水、仪表盘
field-notes         产品详情、源码关系、截图与免费开源说明
```

后台仓库同时包含 `server/` 与 `web/`。API 统一返回 `{ code, message, data }`，列表统一分页结构。小程序默认走演示数据，API 不可用时明确显示“演示数据”而不白屏。

## 视觉方向

StockFlow 不沿用 StoreFlow 的靛蓝主色。采用“石墨黑 + 电光蓝 + 青柠状态色”的仓储操作感：

- brand `#2563EB`：导航、主按钮、链接；
- action `#F97316`：入库、出库等需要确认的动作；
- success `#16A34A`：库存正常、已完成；
- warning `#EAB308`：低库存预警；
- canvas `#F5F7FB`、ink `#172033`、line `#E4E8F0`。

颜色必须按语义使用，橙色不能表示成功，绿色不能铺满所有按钮。移动端使用卡片与数字层级突出“今日销售、待入库、低库存”。后台使用密度适中的表格、状态胶囊和趋势卡。

## API 与数据边界

首版接口：

- `GET /api/v1/dashboard`：销售额、待入库、低库存、库存总额；
- `GET /api/v1/warehouses`：仓库列表；
- `GET /api/v1/products`：分页商品与 SKU；
- `GET /api/v1/stocks/alerts`：低库存列表；
- `GET /api/v1/purchase-orders`、`POST /api/v1/purchase-orders/:id/receive`；
- `GET /api/v1/sales-orders`、`POST /api/v1/sales-orders/:id/ship`；
- `GET /api/v1/stock-movements`：按商品、仓库、来源筛选的流水。

Go 代码遵守 `transport -> app -> platform` 单向依赖；所有跨 IO 函数接收 `context.Context`；写入操作用业务单号保证幂等，库存变更和流水在同一事务内完成。MySQL 连接使用 `MYSQL_*` 环境变量，Redis 使用 `REDIS_ADDR`，禁止把密钥写入仓库。

## 质量标准

- 小程序：API 客户端、库存数字格式化、预警状态和主流程单测；`npm test` 与 H5 build 通过。
- 后台：Go `go vet ./...`、`go test ./...`；Web 单测覆盖 API envelope、颜色语义和单据状态；Vite build 通过。
- 博客：6 张以内清晰截图，项目页显示两个 StockFlow 仓库入口；完整 `npm run verify` 通过。
- 所有仓库公开前扫描令牌、真实账号、数据库备份和生产地址；README 写清关联仓库、运行命令、演示数据边界与 MIT 许可。

## 明确不做

- 不新增邻里社区仓库；
- 不把 `inventory-system` 的 Laravel 源码直接复制到公开仓库；
- 不加入桌面工具、开发工具或与网站产品无关的工具卡片；
- 不声称真实销售额、客户量或线上交易数据。
