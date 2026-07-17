---
title: VenueFlow 场馆运营平台
description: 场地配置、预约售票、入场核销、活动执行、会员与日结分析一体化场馆运营平台。
publishedAt: 2026-07-16T14:45:00-05:00
updatedAt: 2026-07-17T06:30:00-05:00
status: active
category: 场馆运营
tech: [Vite, Vue 3, TypeScript, Go 1.25, Gin, MySQL 8.4, Redis 8, Docker Compose]
cover: /images/projects/venueflow-platform/shot-1.png
repoUrl: https://github.com/xrlnewman/venueflow-admin
repositories:
  - name: venueflow-miniapp
    role: frontend
    description: 用户购票与工作人员移动端，支持选场次、购票、扫码核销、现场服务和评价。
    tech: [Vite, TypeScript, Responsive UI]
    url: https://github.com/xrlnewman/venueflow-miniapp
  - name: venueflow-admin
    role: admin
    description: 场馆后台与 Go Gin API，覆盖场地、场次、票务、会员、核销和日结分析。
    tech: [Vite, Go, Gin, MySQL 8.4, Redis 8]
    url: https://github.com/xrlnewman/venueflow-admin
screenshots:
  - src: /images/projects/venueflow-platform/shot-1.png
    alt: VenueFlow 场馆总览
    title: 场馆运营总览
    caption: 今日入场、售票收入、热门场次和现场待处理事项形成一张运营控制台。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/venueflow-platform/shot-2.png
    alt: VenueFlow 场次列表
    title: 场次与票务
    caption: 场馆、场次、票档、库存和核销状态清晰排列，方便运营快速调整。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/venueflow-platform/shot-3.png
    alt: VenueFlow 移动购票页面
    title: 移动购票
    caption: 用户可以快速选择场次和票档，购票后直接获得入场凭证与提醒。
    viewport: mobile
    width: 390
    height: 844
  - src: /images/projects/venueflow-platform/shot-4.png
    alt: VenueFlow 移动核销页面
    title: 入场核销
    caption: 工作人员在现场完成扫码核销、异常处理和服务记录，数据同步到日结看板。
    viewport: mobile
    width: 390
    height: 844
featured: false
draft: false
---

## 场馆流程

场地配置 → 场次排期 → 售票开放 → 活动进行 → 入场核销 → 待结算 → 日结完成。每个节点都记录操作人、发生时间和状态变更，票务库存与核销动作使用业务幂等键，重复提交不会重复扣减库存或重复入场。

## 线上功能模块

- 场馆与场次：维护场馆地址、容量和营业状态；创建场次时校验时间范围、容量、票价，按草稿、已排期、售票中、活动中、待结算、已结算推进。
- 售票与库存：实时展示已售名额、剩余容量、票价和售票进度；超出容量直接拒绝，订单写入后生成唯一票码。
- 入场核销：工作人员使用票码完成现场核验，重复票码返回冲突并保留首次核销记录；移动端展示票码状态与入场时间。
- 活动执行：后台按场次查看售票、核销、到场率与异常提醒，移动端提供活动记录和现场处理入口。
- 日结与审计：活动结束且无待处理异常后才允许日结，自动汇总售票张数与收入，事件时间线支持按发生顺序回放。
- 权限与数据：管理端负责场次、库存、异常和日结，移动端负责购票、票码和现场核销；接口统一返回分页数据和操作结果。

## 接口与状态约束

管理端与移动端共享 `GET /venues`、`GET /sessions`、`GET /sessions/:id`、`GET /sessions/:id/events`；写入通过创建场次、发布排期、售票、核销、状态推进和结算接口完成，并要求 `Idempotency-Key`。状态只允许按业务顺序流转，活动未结束或存在待处理异常时，结算接口会拒绝请求。

## 仓库关联与运行范围

`venueflow-miniapp` 面向用户与现场人员，`venueflow-admin` 提供场馆后台、Go API、MySQL 8.4 与 Redis 8。两端共享场馆、场次、票务、核销和日结状态；场馆、场次和票务均为虚构演示数据。
