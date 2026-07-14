# Inventory System

进销存管理系统后端 API。**Laravel 12 + PHP 8.3 + MySQL 8 + Redis + Sanctum + Spatie Permission**。

适配 Vue3 / React 等前端，前端推荐用 `vue-element-plus-admin` 或 `naive-ui-admin`。

---

## 功能模块

| 模块 | 说明 |
|---|---|
| 用户/角色/权限 | 基于 Spatie Permission；预置 super-admin / sales / purchase / stock-manager 4 个角色 |
| 仓库管理 | 多仓库支持，每个商品×SKU×仓库独立库存 |
| 供应商 / 客户 | 编码、联系方式、税务、应收/应付余额 |
| 商品 | 树形分类 + 商品（SPU）+ 多规格（SKU/variant）+ 多图 + 条码 |
| 库存 | 实时库存 / 占用库存 / 加权平均成本 / 完整流水 |
| 采购 | 草稿 → 已确认 → 已收货（自动入库 + 应付增加） |
| 销售 | 草稿 → 已确认（占用）→ 已发货（出库 + 应收增加）→ 已完成 |
| 调拨 | A 仓出 + B 仓入（一个事务内） |
| 盘点 | 系统数 vs 实盘数，自动生成盘盈/盘亏调整 |
| 报表 | 仪表盘 KPI / 销售/采购/库存/利润报表 |
| 操作日志 | 仅预留 `operation_logs` 表与 `OperationLog` 模型，尚未接入写入 |

---

## 核心设计

### 库存与成本

- **加权平均成本**（默认）：`newAvg = (oldQty × oldAvg + addQty × addCost) / (oldQty + addQty)`
- 所有出入库**必须**通过 `StockService`，保证：
  1. `stocks` 表数量一致（首次写入先 `insertOrIgnore` 原子确保库存行存在，再取得行级锁）
  2. `stock_movements` 流水完整（含 source_type/source_id 反查）
  3. 出库自动用当前加权平均成本作为销售成本
- `stocks.variant_key` 是 stored generated column，表达式为 `COALESCE(variant_id, 0)`；唯一键使用 `warehouse_id + product_id + variant_key`，因此无 SKU 商品的 `NULL variant_id` 也只能有一条库存记录。
- 可配置允许负库存：`INVENTORY_NEGATIVE_STOCK=true`
- 调拨：源仓 avg_cost 直接带到目标仓
- 盘点：差异自动调整库存（盘盈走 in，盘亏走 out）

### 单据流转

```
采购：draft → confirmed → received（触发入库 + 应付增加）
销售：draft → confirmed（占用）→ shipped（出库 + 应收增加）→ completed
调拨：draft → execute（一次出库 + 一次入库）
盘点：in_progress → 录入实盘数 → complete（差异调整）
```

每次单据状态变更都先在事务内按 ID 重新读取并锁定订单行，再校验数据库中的最新状态，避免并发请求基于陈旧模型重复流转。采购收货与销售发货都只接受 `confirmed`；不能从 `draft` 跳过确认。采购、销售取消只接受 `draft` 或 `confirmed`，已收货、已发货、已完成或已取消单据不能重复流转。

### 单据号

格式 `{前缀}YYYYMMDD####`，如 `PO202501150001`。基于 Redis Cache 自增，按日+前缀计数。

---

## 数据库表

核心表包括：
- `users` `roles` `permissions` + Spatie 关联表
- `warehouses` 仓库
- `suppliers` / `customers`
- `product_categories` / `products` / `product_variants`
- `stocks` 实时库存（以 generated `variant_key` 归一可空 variant，warehouse × product × variant_key 唯一）
- `stock_movements` 流水
- `purchase_orders` / `purchase_order_items`
- `sales_orders` / `sales_order_items`
- `stock_transfers` / `stock_transfer_items`
- `stock_takes` / `stock_take_items`
- `payments` 收付款
- `operation_logs`

---

## 安装与运行

```bash
composer install
```

仓库提交 `composer.lock`，`composer install` 会按锁定版本安装依赖，并在生成 autoload 前幂等创建 Laravel 所需的 `bootstrap/cache`、`storage/framework/*` 和 `storage/logs` 目录。仓库不提供 `.env` 或 `.env.example`；生产部署必须通过平台环境变量或密钥管理器外部配置 `APP_KEY`、数据库连接和 Redis 连接，不能把这些值提交到仓库。

创建管理员前还必须提供三个变量，密码按 UTF-8 字符数计算且不得少于 12 个字符。PowerShell 示例：

```powershell
$env:INVENTORY_ADMIN_USERNAME = "inventory-admin"
$env:INVENTORY_ADMIN_EMAIL = "inventory-admin@example.com"
$env:INVENTORY_ADMIN_PASSWORD = $env:DEPLOY_SECRET_INVENTORY_ADMIN_PASSWORD

php artisan migrate --force
php artisan db:seed --force
```

Bash 示例：

```bash
export INVENTORY_ADMIN_USERNAME="inventory-admin"
export INVENTORY_ADMIN_EMAIL="inventory-admin@example.com"
export INVENTORY_ADMIN_PASSWORD="$DEPLOY_SECRET_INVENTORY_ADMIN_PASSWORD"

php artisan migrate --force
php artisan db:seed --force
```

迁移和 Seeder 成功后再启动服务：

```bash
php artisan serve
```

任一管理员变量缺失或密码不足 12 个 UTF-8 字符时，`AdminUserSeeder` 会明确失败，不会创建默认账号。密码写入依赖 `User` 模型的 `hashed` cast 自动哈希，Seeder 不输出口令。

---

## API 端点（摘要）

| Method | URL | 功能 |
|---|---|---|
| POST | `/api/auth/login` | 登录，返回 token |
| GET | `/api/auth/me` | 当前用户信息 |
| GET | `/api/warehouses` | 仓库列表 |
| GET | `/api/products` | 商品列表（支持 keyword/category_id/low_stock 过滤）|
| GET | `/api/stocks` | 库存查询 |
| GET | `/api/stocks/movements` | 库存流水 |
| GET | `/api/stocks/low-stock` | 库存预警 |
| POST | `/api/purchase-orders` | 创建采购单 |
| POST | `/api/purchase-orders/{id}/receive` | 已确认采购单收货入库 |
| POST | `/api/sales-orders` | 创建销售单 |
| POST | `/api/sales-orders/{id}/ship` | 已确认销售单发货（出库 + 应收）|
| POST | `/api/stock-transfers/{id}/execute` | 执行调拨 |
| GET | `/api/reports/dashboard` | 仪表盘 KPI |
| GET | `/api/reports/sales?group_by=customer&start_date=&end_date=` | 销售报表 |

---

## 已知限制（v0.1.0）

- ❌ 没有图片上传接口（你可以前端直传 OSS 后存 URL）
- ❌ 没有微信/支付宝支付集成（payments 表只是手工记账）
- ❌ 没有 FIFO/LIFO 成本算法（仅加权平均，框架已留好 `INVENTORY_COST_METHOD`）
- ❌ 没有退货流程（采购退货 / 销售退货）
- ❌ 没有批次号 / 序列号 / 保质期
- ❌ 没有多公司 / 多组织
- ❌ 操作日志仅预留表与模型，尚未接入中间件或控制器写入

这些都可以在 v0.2 加。

---

## 配套前端

可适配 Vue 3 或 React 管理端。所有接口返回 `{code, message, data}` 格式，配合请求拦截器即可。

---

## License

MIT © xrlnewman
