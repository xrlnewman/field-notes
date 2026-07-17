---
title: VenueFlow 场馆运营平台
description: 免费开源的场地配置、预约售票、入场核销、活动执行、会员与日结分析一体化场馆运营平台。
publishedAt: 2026-07-16T14:45:00-05:00
updatedAt: 2026-07-16T14:45:00-05:00
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

## 完整闭环

场地配置 → 场次发布 → 用户购票 → 入场核销 → 现场服务 → 会员评价 → 日结分析；票务库存和核销动作支持幂等。

## 仓库关联与免费边界

`venueflow-miniapp` 面向用户与现场人员，`venueflow-admin` 提供场馆后台、Go API、MySQL 8.4 与 Redis 8。项目免费公开，场馆、场次和票务均为虚构演示数据。
