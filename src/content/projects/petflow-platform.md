---
title: PetFlow 宠物门店预约平台
description: 免费开源的宠物门店预约、服务排班、宠物档案、会员次卡与回访一体化平台，覆盖从预约到复购的服务闭环。
publishedAt: 2026-07-16T13:40:00-05:00
updatedAt: 2026-07-16T13:40:00-05:00
status: active
category: 生活服务
tech: [Vite, JavaScript, Go 1.25, Gin, MySQL 8.4, Redis 8, Docker Compose]
cover: /images/projects/petflow-platform/shot-1.png
repoUrl: https://github.com/xrlnewman/petflow-admin
repositories:
  - name: petflow-miniapp
    role: frontend
    description: 宠物主人移动端，支持预约、签到、服务进度和回访任务。
    tech: [Vite, JavaScript, Responsive UI]
    url: https://github.com/xrlnewman/petflow-miniapp
  - name: petflow-admin
    role: admin
    description: 宠物门店后台与 Go Gin API，覆盖预约队列、服务师排班、宠物档案和回访。
    tech: [Vite, Go, Gin, MySQL 8.4, Redis 8]
    url: https://github.com/xrlnewman/petflow-admin
screenshots:
  - src: /images/projects/petflow-platform/shot-1.png
    alt: PetFlow 门店运营总览
    title: 门店运营总览
    caption: 深靛蓝承载稳定感，珊瑚、青绿和琥珀分别表达待处理、完成和提醒，避免全屏只用一种绿色。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/petflow-platform/shot-2.png
    alt: PetFlow 宠物预约队列
    title: 服务项目负载
    caption: 预约队列、服务项目负载和回访趋势同屏，页面数据足够支撑门店主管安排人手。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/petflow-platform/shot-3.png
    alt: PetFlow 宠物主人移动预约
    title: 移动预约
    caption: 宠物主人可在移动端预约洗护、美容、SPA 和驱虫服务，并看到实时状态。
    viewport: mobile
    width: 390
    height: 844
  - src: /images/projects/petflow-platform/shot-4.png
    alt: PetFlow 移动回访任务
    title: 服务回访
    caption: 服务完成后通过回访任务承接下一次预约和会员次卡提醒，形成复购入口。
    viewport: mobile
    width: 390
    height: 844
featured: false
draft: false
---

## 完整闭环

预约 → 到店签到 → 排队与服务 → 完成归档 → 次卡扣减 → 回访与复购；预约状态事件和回访完成记录都能在 API 中回放。

## 仓库关联与免费边界

`petflow-miniapp` 是宠物主人端，`petflow-admin` 是门店后台和 Go API，MySQL 8.4 持久化、Redis 8 处理幂等锁。源码免费公开，宠物信息和订单为虚构演示。
