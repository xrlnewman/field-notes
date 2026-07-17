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
    caption: 待确认订单、入住率、热门目的地和售后工单以旅行运营节奏呈现。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/travelflow-platform/shot-2.png
    alt: TravelFlow 预订订单列表
    title: 预订与库存
    caption: 行程、日期、房型、客户和确认状态集中展示，库存变化可追踪。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/travelflow-platform/shot-3.png
    alt: TravelFlow 移动行程页面
    title: 移动行程
    caption: 旅客在手机上查看行程、入住提醒和服务联系人，信息层级保持清爽。
    viewport: mobile
    width: 390
    height: 844
  - src: /images/projects/travelflow-platform/shot-4.png
    alt: TravelFlow 移动订单确认
    title: 订单确认与售后
    caption: 预订确认、改期申请和评价入口按状态排列，售后结果回到运营后台。
    viewport: mobile
    width: 390
    height: 844
featured: false
draft: false
---

## 预订与售后流程

旅行产品上架后，运营可以按目的地、出发日期和库存筛选产品。旅客提交 `/bookings` 会在 MySQL 事务中锁定库存并生成事件时间线，订单状态严格按照 `待确认 → 已预订 → 已支付 → 出行中 → 已完成` 推进；已支付或已完成订单可以通过 `/bookings/:id/after-sale` 进入 `售后中`，售后原因、操作人和每一步时间都会落入事件时间线。重复写请求必须携带 `Idempotency-Key`，重复提交只回放第一次结果。

核心 API：`GET /travel-products`、`GET /travel-products/:id`、`POST /travel-products`、`GET /bookings`、`GET /bookings/:id/events`、`POST /bookings`、`POST /bookings/:id/confirm`、`POST /bookings/:id/pay`、`POST /bookings/:id/complete`、`POST /bookings/:id/after-sale`。日期范围、金额（分）、数量和库存均由后端校验，超卖、越级支付和无售后原因会被拒绝。

## 仓库关联与运行范围

`travelflow-miniapp` 面向旅客与前台，提供产品浏览、库存余量、预订、支付状态、行程完成和售后入口；`travelflow-admin` 负责旅行运营、Go Gin API、MySQL 8.4 与 Redis 8，提供产品/预订列表筛选、详情事件时间线和售后动作。两端共享行程、房型、预订、售后和结算状态；行程、房型和订单均为虚构演示数据。
