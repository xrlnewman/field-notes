---
title: Inventory System
description: 一个覆盖采购、销售、调拨、盘点与库存报表的 Laravel 进销存后端。
publishedAt: 2026-07-10
status: completed
category: 业务系统
tech: [Laravel 12, PHP 8.3, MySQL, Redis]
cover: /images/projects/inventory-system.svg
repoUrl: https://github.com/xrlnewman/inventory-system
featured: true
draft: false
---

## 项目目标

建立一套可追溯的进销存 API，把采购入库、销售出库、仓库调拨、库存盘点和经营报表统一在同一套库存账中。

## 核心能力

- 管理仓库、分类、商品、供应商和客户等基础资料；
- 驱动采购单与销售单的状态流转，并在完成环节更新库存；
- 查询实时库存、库存流水和低库存商品，支持手工出入库、跨仓调拨与盘点调整；
- 提供经营看板以及销售、采购、库存和利润报表接口。

## 技术实现

项目基于 Laravel 12 和 PHP 8.3，使用 Sanctum 处理 API 身份认证，并提供角色与权限种子数据。仓库提交 `composer.lock` 以固定安装版本，Composer 在生成 autoload 前创建 Laravel 运行目录；管理员 Seeder 只接受外部环境变量，按 UTF-8 字符数执行最低 12 字符校验，并依赖 `User` 模型的 hashed cast 存储密码。库存表以 stored generated `variant_key = COALESCE(variant_id, 0)` 统一有无 SKU 的唯一身份；库存服务在事务中先用 `insertOrIgnore` 原子确保库存行存在，再取得行锁、记录库存流水，并在采购入库时计算移动加权平均成本。每次单据状态变更也会在事务内重新读取并锁定订单行，再校验数据库最新状态；采购收货和销售发货只能从已确认状态进入，取消只接受草稿或已确认单据。调拨与盘点调整同样在事务边界内完成。

## 工程取舍

当前实现聚焦单组织、加权平均成本和清晰的单据状态流，尚未覆盖退货、多组织以及 FIFO/LIFO 等成本算法。仓库不附带 `.env` 模板或默认管理员口令，部署方必须从外部提供应用、数据库、Redis 与管理员配置；API 的细粒度权限中间件也仍需在进一步产品化时补齐。
