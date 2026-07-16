# StockFlow 进销存与库存预警平台实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 创建可公开的 StockFlow 小程序与 Go Gin 运营后台/API，并把可验证的产品展示接入个人博客。

**Architecture:** 从已验证的 StoreFlow UI/API 骨架复制结构但重新命名和建模；`stockflow-admin` 内含 `server/` 与 `web/`，API 采用统一 envelope，移动端通过 API 客户端访问演示/真实数据；博客只保存项目描述和截图，不复制业务源码。

**Tech Stack:** UniApp/Vue 3/TypeScript、Vite、Go 1.23、Gin、MySQL 8.4、Redis 8、Astro、Vitest。

## Global Constraints

- 仓库名固定为 `stockflow-miniapp`、`stockflow-admin`，统一 MIT 许可并公开到 `xrlnewman` GitHub。
- 视觉令牌固定为 `#2563EB`、`#F97316`、`#16A34A`、`#EAB308`、`#F5F7FB`、`#172033`、`#E4E8F0`。
- 不修改 Linli 仓库，不公开本地令牌，不复制 `inventory-system` Laravel 源码。
- 所有列表分页，写接口返回 `{ code, message, data }` 并保留错误链。

### Task 1: 建立两个独立仓库骨架

**Files:**
- Create: `E:/project/stockflow-miniapp/package.json`, `src/`, `tests/`, `README.md`
- Create: `E:/project/stockflow-admin/go.mod`, `server/`, `web/`, `README.md`
- Test: `E:/project/stockflow-miniapp/tests/stockflow.test.ts`

- [ ] **Step 1: 从 StoreFlow 已验证提交复制源码，排除 `.git`、`node_modules`、`dist` 和运行日志。**
- [ ] **Step 2: 全量替换包名、README、标题、环境变量和仓库链接，确保源码中不再出现 StoreFlow/HomeFlow 产品文案。**
- [ ] **Step 3: 配置本地作者、MIT 许可和 `origin`，提交 `chore(stockflow): 初始化进销存仓库`。**
- [ ] **Step 4: 运行 `git status --short`，确认两个仓库只包含预期源码。**

### Task 2: 实现 StockFlow API 与库存闭环

**Files:**
- Modify: `E:/project/stockflow-admin/server/internal/transport/httpapi/router.go`
- Create: `E:/project/stockflow-admin/server/internal/app/inventory/service.go`
- Create: `E:/project/stockflow-admin/server/tests/stockflow_test.go`
- Modify: `E:/project/stockflow-admin/server/.env.example`, `README.md`

- [ ] **Step 1: 先写接口测试，覆盖 dashboard、warehouses、products、stock alerts、purchase receive、sales ship 和 movements。**
- [ ] **Step 2: 实现内存演示服务与分页结构，真实数据库/Redis 适配保留在 platform 层；库存变更在服务层生成流水并做幂等检查。**
- [ ] **Step 3: 在 Gin router 注册 `/api/v1` 路由，增加请求校验、recover 和统一错误响应。**
- [ ] **Step 4: 运行 `go vet ./... && go test ./...`，提交 `feat(api): 完成 StockFlow 库存业务接口`。

### Task 3: 实现小程序库存工作台

**Files:**
- Modify: `E:/project/stockflow-miniapp/src/styles/theme.scss`
- Modify: `E:/project/stockflow-miniapp/src/api/client.ts`
- Modify: `E:/project/stockflow-miniapp/src/pages/index/index.vue`, `src/pages/workbench/workbench.vue`, `src/pages/service/service.vue`
- Create: `E:/project/stockflow-miniapp/tests/stockflow.test.ts`

- [ ] **Step 1: 写颜色令牌、库存数字格式化、预警等级和演示数据测试。**
- [ ] **Step 2: 将首页改为“今日库存 / 待入库 / 待发货 / 低库存”，加入商品搜索、仓库切换、扫码入库和销售出库入口。**
- [ ] **Step 3: 实现 `fetchDashboard`、`fetchWarehouses`、`fetchProducts`、`fetchStockAlerts`、`receivePurchase`、`shipSale`、`fetchMovements` 客户端方法，网络失败显示演示数据提示。**
- [ ] **Step 4: 运行 `npm test` 与 `npm run build:h5`，提交 `feat(miniapp): 完成 StockFlow 库存工作台`。

### Task 4: 实现运营后台与视觉系统

**Files:**
- Modify: `E:/project/stockflow-admin/web/src/App.vue`
- Modify: `E:/project/stockflow-admin/web/src/styles.css`
- Modify: `E:/project/stockflow-admin/web/src/domain/order-state.js`
- Create: `E:/project/stockflow-admin/web/tests/stockflow.test.js`

- [ ] **Step 1: 先写后台令牌、单据状态和 API envelope 测试。**
- [ ] **Step 2: 将 dashboard、商品、仓库、采购、销售、低库存和流水页面替换为 StockFlow 业务文案。**
- [ ] **Step 3: 应用电光蓝导航、橙色库存动作、绿色完成、黄色预警的语义配色，确认无“全屏绿色”或把成功状态显示为橙色。**
- [ ] **Step 4: 运行 `npm test && npm run build`，提交 `feat(admin): 完成 StockFlow 运营后台`。**

### Task 5: 公开仓库与博客项目页

**Files:**
- Create: `E:/project/field-notes/.worktrees/stockflow-product/public/images/projects/stockflow-platform/*.png`
- Create: `E:/project/field-notes/.worktrees/stockflow-product/src/content/projects/stockflow-platform.md`
- Modify: `src/lib/projects.ts`, `src/pages/projects/index.astro`, `tests/content.test.ts`, `tests/projects.test.ts`, `tests/build-smoke.test.ts`

- [ ] **Step 1: 用真实可运行页面或生成的统一视觉素材制作后台、库存首页、商品列表、预警和流水截图，记录准确尺寸并检查不含密钥。**
- [ ] **Step 2: 在内容文件中声明两个 GitHub 仓库 URL、免费开源说明、技术栈和明确的演示数据边界。**
- [ ] **Step 3: 运行 `npm run verify`，提交 `feat(blog): 增加 StockFlow 进销存项目展示`。**
- [ ] **Step 4: 创建并推送两个 GitHub 公开仓库，再合并博客主分支并部署 Cloudflare Pages。**
- [ ] **Step 5: 用 HTTP 200 检查项目目录、项目详情、全部截图和两个 GitHub 页面；三个仓库 `git status --short --branch` 均干净。**
