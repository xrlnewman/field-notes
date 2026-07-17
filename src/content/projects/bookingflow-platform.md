---
title: BookingFlow 预约排班平台
description: 免费开源的服务配置、预约、排班、到店核销、评价与复购提醒一体化预约平台，适合美容、健身和咨询门店。
publishedAt: 2026-07-16T14:20:00-05:00
updatedAt: 2026-07-16T14:20:00-05:00
status: active
category: 生活服务
tech: [Vite, Vue 3, TypeScript, Go 1.25, Gin, MySQL 8.4, Redis 8, Docker Compose]
cover: /images/projects/bookingflow-platform/shot-1.png
repoUrl: https://github.com/xrlnewman/bookingflow-admin
repositories:
  - name: bookingflow-miniapp
    role: frontend
    description: 顾客预约与员工排班移动端，支持选服务、选时间、签到核销和评价。
    tech: [Vite, TypeScript, Responsive UI]
    url: https://github.com/xrlnewman/bookingflow-miniapp
  - name: bookingflow-admin
    role: admin
    description: 预约后台与 Go Gin API，覆盖服务、门店、员工、排班、预约和会员复购。
    tech: [Vite, Go, Gin, MySQL 8.4, Redis 8]
    url: https://github.com/xrlnewman/bookingflow-admin
screenshots:
  - src: /images/projects/bookingflow-platform/shot-1.png
    alt: BookingFlow 预约总览
    title: 预约运营总览
    caption: 今日预约、空闲时段、到店率和复购提醒形成门店当天的工作节奏。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/bookingflow-platform/shot-2.png
    alt: BookingFlow 排班日历
    title: 排班与预约
    caption: 员工、服务、时间段和预约状态以日历与列表组合呈现，减少冲突排班。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/bookingflow-platform/shot-3.png
    alt: BookingFlow 移动预约页面
    title: 移动预约
    caption: 顾客可以快速选服务和时间，确认后获得清晰的到店提醒。
    viewport: mobile
    width: 390
    height: 844
  - src: /images/projects/bookingflow-platform/shot-4.png
    alt: BookingFlow 移动核销页面
    title: 到店核销
    caption: 前台在手机端完成签到、服务记录和评价邀请，状态会同步到后台。
    viewport: mobile
    width: 390
    height: 844
featured: false
draft: false
---

## 完整闭环

服务配置 → 顾客预约 → 员工排班 → 到店签到 → 服务完成 → 评价回访 → 复购提醒；预约占位和核销动作支持幂等。

## 仓库关联与免费边界

`bookingflow-miniapp` 面向顾客与前台，`bookingflow-admin` 负责门店运营、Go API、MySQL 8.4 与 Redis 8。项目免费公开，服务、会员和预约均为虚构演示数据。
