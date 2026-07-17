---
title: TravelFlow 旅行酒店预订平台
description: 旅行产品、询价预订、支付确认、出行服务、售后与结算一体化平台，适合旅行社和精品酒店团队。
publishedAt: 2026-07-16T14:30:00-05:00
updatedAt: 2026-07-16T14:30:00-05:00
status: active
category: 旅游住宿
tech: [Vite, Vue 3, TypeScript, Go 1.25, Gin, MySQL 8.4, Redis 8, Docker Compose]
cover: /images/projects/travelflow-platform/shot-1.png
repoUrl: https://github.com/xrlnewman/travelflow-admin
repositories:
  - name: travelflow-miniapp
    role: frontend
    description: 旅客移动端，支持行程浏览、预订确认、入住提醒、客服沟通和评价。
    tech: [Vite, TypeScript, Responsive UI]
    url: https://github.com/xrlnewman/travelflow-miniapp
  - name: travelflow-admin
    role: admin
    description: 旅行运营后台与 Go Gin API，覆盖产品、库存、订单、入住、售后和供应商结算。
    tech: [Vite, Go, Gin, MySQL 8.4, Redis 8]
    url: https://github.com/xrlnewman/travelflow-admin
screenshots:
  - src: /images/projects/travelflow-platform/shot-1.png
    alt: TravelFlow 旅行总览
    title: 旅行运营总览
    caption: 管理端展示七日履约指标、调度队列和客服异常，作为旅行运营入口。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/travelflow-platform/shot-2.png
    alt: TravelFlow 预订订单列表
    title: 产品日历与预订队列
    caption: 管理端按出发日期查看产品库存、预订状态、支付结果和售后入口。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/travelflow-platform/shot-3.png
    alt: TravelFlow 移动行程页面
    title: 移动端旅行产品
    caption: 移动端以产品卡展示目的地、日期、价格和实时余量，预订入口保持单手可达。
    viewport: mobile
    width: 390
    height: 844
  - src: /images/projects/travelflow-platform/shot-4.png
    alt: TravelFlow 移动订单确认
    title: 移动端订单状态与售后
    caption: 旅客订单显示支付状态、出行人数与售后入口，操作结果回到运营后台事件时间线。
    viewport: mobile
    width: 390
    height: 844
featured: false
draft: false
---

## 预订与售后流程

旅行产品创建先进入 `草稿`，运营发布后才可被预订；旅客提交 `/bookings` 会生成预订草稿并锁定库存，确认动作补齐 `待确认 → 已预订` 事件。订单状态严格按照 `草稿 → 待确认 → 已预订 → 已支付 → 出行中 → 已完成` 推进；已支付或已完成订单可以通过 `/bookings/:id/after-sale` 进入 `售后中`，出行中的订单不允许直接售后。支付和售后分别生成结构化 `Payment` / `AfterSale` 记录，售后在同一事务内只释放一次库存。重复写请求必须携带 `Idempotency-Key`，重复提交只回放第一次结果。

核心 API：`GET /travel-products`、`GET /travel-products/:id`、`POST /travel-products`、`GET /bookings`、`GET /bookings/:id/events`、`POST /bookings`、`POST /bookings/:id/confirm`、`POST /bookings/:id/pay`、`POST /bookings/:id/complete`、`POST /bookings/:id/after-sale`。日期范围、金额（分）、数量和库存均由后端校验，超卖、越级支付和无售后原因会被拒绝。

## 仓库关联与运行范围

`travelflow-miniapp` 面向旅客与前台，提供产品浏览、库存余量、预订、支付状态、行程完成和售后入口；`travelflow-admin` 负责旅行运营、Go Gin API、MySQL 8.4 与 Redis 8，提供产品/预订列表筛选、详情事件时间线和售后动作。两端共享行程、房型、预订、售后和结算状态；行程、房型和订单均为虚构演示数据。
