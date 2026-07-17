---
title: PropertyFlow 物业工单平台
description: 报修、派单、上门、验收与评价一体化物业工单系统，适合社区和园区建立透明的服务流程。
publishedAt: 2026-07-16T13:20:00-05:00
updatedAt: 2026-07-16T13:20:00-05:00
status: active
category: 物业服务
tech: [Vite, Vue 3, TypeScript, Go 1.25, Gin, MySQL 8.4, Redis 8, Docker Compose]
cover: /images/projects/propertyflow-platform/shot-1.png
repoUrl: https://github.com/xrlnewman/propertyflow-admin
repositories:
  - name: propertyflow-miniapp
    role: frontend
    description: 住户报修与物业人员移动端，支持拍照描述、查看进度和验收评价。
    tech: [Vite, TypeScript, Responsive UI]
    url: https://github.com/xrlnewman/propertyflow-miniapp
  - name: propertyflow-admin
    role: admin
    description: 物业后台与 Go Gin API，覆盖工单、人员、SLA、验收和满意度统计。
    tech: [Vite, Go, Gin, MySQL 8.4, Redis 8]
    url: https://github.com/xrlnewman/propertyflow-admin
screenshots:
  - src: /images/projects/propertyflow-platform/shot-1.png
    alt: PropertyFlow 物业总览
    title: 物业服务总览
    caption: 报修量、按时完成率、超时工单与满意度分区呈现，青绿色完成态和珊瑚色风险态对比清楚。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/propertyflow-platform/shot-2.png
    alt: PropertyFlow 工单列表
    title: 工单调度
    caption: 工单表格保留位置、类型、处理人、SLA 和当前节点，适合物业主管快速派单。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/propertyflow-platform/shot-3.png
    alt: PropertyFlow 移动报修首页
    title: 移动报修
    caption: 住户可以在小屏内提交问题、查看上门时间并确认完成，过程不需要跳转外部平台。
    viewport: mobile
    width: 390
    height: 844
  - src: /images/projects/propertyflow-platform/shot-4.png
    alt: PropertyFlow 移动工单详情
    title: 验收评价
    caption: 工单完成后直接进入验收和评价，服务数据会回流到后台统计。
    viewport: mobile
    width: 390
    height: 844
featured: false
draft: false
---

## 工单流程

住户报修 → 物业派单 → 师傅上门 → 处理记录 → 住户验收 → 满意度评价；每个状态都有事件记录和幂等写入。

## 仓库关联与运行范围

`propertyflow-miniapp` 负责住户和一线人员体验，`propertyflow-admin` 负责运营、API、MySQL 8.4 与 Redis 8。两端共享报修、派单、验收和评价状态；地址、住户和工单均为虚构数据。
