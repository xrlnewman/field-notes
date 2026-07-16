---
title: StockFlow 进销存与库存预警平台
description: 面向小型零售与仓配团队的免费开源进销存产品，包含小程序端、Vue 管理后台与 Go Gin API。
publishedAt: 2026-07-16
updatedAt: 2026-07-16
status: active
category: 供应链管理
tech: [uni-app, Vue 3, TypeScript, Go 1.25, Gin, MySQL 8.4, Redis 8, Docker Compose]
cover: /images/projects/stockflow-platform/admin-dashboard.png
repoUrl: https://github.com/xrlnewman/stockflow-admin
repositories:
  - name: stockflow-miniapp
    role: frontend
    description: 面向仓库与门店工作人员的 uni-app 客户端，覆盖经营总览、采购入库、销售出库、库存预警与库存流水。
    tech: [uni-app, Vue 3, TypeScript, Vite]
    url: https://github.com/xrlnewman/stockflow-miniapp
  - name: stockflow-admin
    role: admin
    description: 面向运营团队的 Vue 管理后台与 Go Gin API 单仓库，包含商品、仓库、采购、销售、预警、流水与 Docker Compose 基础设施。
    tech: [Vue 3, Vite, Go, Gin, MySQL 8.4, Redis 8]
    url: https://github.com/xrlnewman/stockflow-admin
screenshots:
  - src: /images/projects/stockflow-platform/admin-dashboard.png
    alt: StockFlow 进销存后台经营总览，展示销售、库存总值、库存预警与仓库概览
    title: 经营总览
    caption: 用四张关键指标卡快速判断销售、库存价值、待入库单据和低库存风险，再从预警与仓库概览进入下一步处理。
    viewport: desktop
    width: 1045
    height: 1224
  - src: /images/projects/stockflow-platform/products.png
    alt: StockFlow 商品中心，展示商品 SKU、仓库、当前库存与库存状态
    title: 商品中心
    caption: 商品、SKU、所属仓库和安全库存集中在一张可读表格中，正常、偏低与严重预警状态使用不同色值区分。
    viewport: desktop
    width: 1045
    height: 1224
  - src: /images/projects/stockflow-platform/purchases.png
    alt: StockFlow 采购入库页面，展示采购单、供应商、金额与确认入库动作
    title: 采购入库
    caption: 待入库单据提供明确的确认动作，已入库单据保留状态，避免仓库人员在多个页面之间来回核对。
    viewport: desktop
    width: 1045
    height: 1224
  - src: /images/projects/stockflow-platform/sales.png
    alt: StockFlow 销售出库页面，展示销售单、客户、金额与确认出库动作
    title: 销售出库
    caption: 待发货销售单进入出库队列，完成出库后同步更新状态，橙色动作色只用于需要处理的关键按钮。
    viewport: desktop
    width: 1045
    height: 1224
featured: true
draft: false
---

## 产品定位

StockFlow 是一套免费开源、可自部署的进销存底座，面向小型零售店、仓配团队和多仓运营者。它把“维护商品—采购入库—销售出库—库存预警—追溯流水”串成一条清晰的库存链路，先解决每天最容易出错的库存动作。

## 双仓库协作

产品拆成两个公开仓库：`stockflow-miniapp` 负责一线人员使用的移动端工作台，`stockflow-admin` 负责运营后台、Go Gin API 与 Docker Compose 基础设施。两个仓库通过 `/api/v1` 契约关联，未配置 API 时仍可用内置演示数据完整预览。

## 核心能力

- 商品与仓库：维护 SKU、仓库归属、安全库存和基础库存数量。
- 采购入库：查看供应商采购单，确认收货后写入幂等动作，避免重复入库。
- 销售出库：按销售单推进出库状态，保留客户、金额与仓库信息。
- 库存预警：根据安全库存识别偏低和严重风险，支持从总览进入明细。
- 库存流水：记录入库、出库来源与数量，为后续审计和盘点留下入口。

## 技术实现

小程序使用 uni-app、Vue 3 与 TypeScript，可构建 H5 与微信小程序；后台采用 Vue 3 与 Vite；后端采用 Go 1.25、Gin、JWT/RBAC，以 MySQL 8.4 持久化商品、仓库和单据，Redis 8 预留幂等与短期库存锁能力，Docker Compose 提供本地一键启动。

## 免费承诺

StockFlow 源码公开、允许自部署，不依赖商业账号才能查看演示。仓库中的金额、商品和库存均为虚构演示数据，不代表真实交易；你可以按自己的业务继续扩展采购、销售和仓储规则。
