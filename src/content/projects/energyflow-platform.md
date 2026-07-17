---
title: EnergyFlow 能源巡检平台
description: 能源设备建档、计划巡检、派单、复核、告警处理与节能复盘平台，适合园区和工厂的设备运营团队。
publishedAt: 2026-07-16T13:45:00-05:00
updatedAt: 2026-07-16T13:45:00-05:00
status: active
category: 工业能源
tech: [Vite, Vue 3, TypeScript, Go 1.25, Gin, MySQL 8.4, Redis 8, Docker Compose]
cover: /images/projects/energyflow-platform/shot-1.png
repoUrl: https://github.com/xrlnewman/energyflow-admin
repositories:
  - name: energyflow-miniapp
    role: frontend
    description: 巡检员移动工作台，支持扫码派单、设备巡检、复核归档和告警处理。
    tech: [Vite, JavaScript, Responsive UI]
    url: https://github.com/xrlnewman/energyflow-miniapp
  - name: energyflow-admin
    role: admin
    description: 能源巡检后台与 Go Gin API，覆盖任务、设备、告警、事件和节能复盘。
    tech: [Vite, Vue 3, Go, Gin, MySQL 8.4, Redis 8]
    url: https://github.com/xrlnewman/energyflow-admin
screenshots:
  - src: /images/projects/energyflow-platform/shot-1.png
    alt: EnergyFlow 能源巡检总览
    title: 能源巡检总览
    caption: 深海蓝底色承载工业稳定感，青绿表达达标，橙色表达告警，地图、趋势和任务形成完整运营视图。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/energyflow-platform/shot-2.png
    alt: EnergyFlow 巡检任务列表
    title: 巡检与告警
    caption: 设备区域、巡检员、计划时间和当前状态集中展示，告警中心保留 SLA 处理入口。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/energyflow-platform/shot-3.png
    alt: EnergyFlow 巡检员移动工作台
    title: 移动巡检
    caption: 移动端优先展示待巡检设备和现场动作，巡检员可在设备旁提交复核。
    viewport: mobile
    width: 390
    height: 844
  - src: /images/projects/energyflow-platform/shot-4.png
    alt: EnergyFlow 移动告警处理
    title: 告警处理
    caption: 告警处理、设备状态和巡检事件在同一张卡片里完成，避免现场人员切换多个系统。
    viewport: mobile
    width: 390
    height: 844
featured: false
draft: false
---

## 巡检流程

设备建档 → 计划巡检 → 派单 → 现场记录 → 待复核 → 已归档 → 告警处理 → 节能复盘；每次状态推进写入事件时间线。

## 仓库关联与运行范围

`energyflow-miniapp` 面向巡检员，`energyflow-admin` 负责运营后台、Go API、MySQL 8.4 与 Redis 8 Compose。两端共享设备、计划、告警和能耗记录；设备、区域和能耗数据均为虚构演示。
