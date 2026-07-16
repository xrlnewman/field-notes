---
title: EventFlow 活动票务平台
description: 免费开源的活动创建、售票、核销、现场服务与结算平台，适合课程、展会、社群和小型演出快速上线。
publishedAt: 2026-07-16T13:30:00-05:00
updatedAt: 2026-07-16T13:30:00-05:00
status: active
category: 文体活动
tech: [Vite, Vue 3, TypeScript, Go 1.25, Gin, MySQL 8.4, Redis 8, Docker Compose]
cover: /images/projects/eventflow-platform/shot-1.png
repoUrl: https://github.com/xrlnewman/eventflow-admin
repositories:
  - name: eventflow-miniapp
    role: frontend
    description: 购票与现场服务移动端，支持票券、核销、签到和活动提醒。
    tech: [Vite, TypeScript, Responsive UI]
    url: https://github.com/xrlnewman/eventflow-miniapp
  - name: eventflow-admin
    role: admin
    description: 活动后台与 Go Gin API，覆盖活动、票档、订单、核销和结算。
    tech: [Vite, Go, Gin, MySQL 8.4, Redis 8]
    url: https://github.com/xrlnewman/eventflow-admin
screenshots:
  - src: /images/projects/eventflow-platform/shot-1.png
    alt: EventFlow 活动运营总览
    title: 活动运营总览
    caption: 票房、核销率、现场人数和活动进度采用暖色和深色分层，首屏像一套正在运行的票务系统。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/eventflow-platform/shot-2.png
    alt: EventFlow 票务订单列表
    title: 票务与核销
    caption: 票档、订单状态和核销入口集中展示，现场人员可以按票种快速定位问题。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/eventflow-platform/shot-3.png
    alt: EventFlow 移动票券首页
    title: 移动票券
    caption: 用户在移动端查看票券、活动时间和入场提示，现场核销路径保持短而清晰。
    viewport: mobile
    width: 390
    height: 844
  - src: /images/projects/eventflow-platform/shot-4.png
    alt: EventFlow 移动核销页面
    title: 现场核销
    caption: 核销成功、异常票券和现场服务都在同一套移动体验中完成。
    viewport: mobile
    width: 390
    height: 844
featured: false
draft: false
---

## 完整闭环

创建活动 → 配置票档 → 售票 → 核销入场 → 现场服务 → 活动结算；订单和核销写入均带幂等键。

## 仓库关联与免费边界

`eventflow-miniapp` 面向购票人和现场人员，`eventflow-admin` 负责活动运营、API、数据库和 Redis 锁。源码免费，自带的票务、用户和金额均为虚构数据。
