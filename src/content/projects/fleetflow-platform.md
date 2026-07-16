---
title: FleetFlow 同城配送调度平台
description: 面向同城配送团队的免费开源运单、车辆、异常与司机协同平台，提供移动端工作台、运营后台与 Go Gin API。
publishedAt: 2026-07-16T12:00:00-05:00
updatedAt: 2026-07-16T12:00:00-05:00
status: active
category: 物流运输
tech: [Vite, TypeScript, Go 1.25, Gin, MySQL 8.4, Redis 8, Docker Compose]
cover: /images/projects/fleetflow-platform/admin-dashboard.png
repoUrl: https://github.com/xrlnewman/fleetflow-admin
repositories:
  - name: fleetflow-miniapp
    role: frontend
    description: 司机与调度员移动工作台，覆盖扫码接单、路线追踪、签收记录和异常提醒。
    tech: [Vite, TypeScript, Responsive UI]
    url: https://github.com/xrlnewman/fleetflow-miniapp
  - name: fleetflow-admin
    role: admin
    description: 调度后台与 Go Gin API，覆盖运单、车辆司机、异常中心、对账结算，并提供 MySQL 8.4 / Redis 8 Compose。
    tech: [Vite, JavaScript, Go, Gin, MySQL 8.4, Redis 8]
    url: https://github.com/xrlnewman/fleetflow-admin
screenshots:
  - src: /images/projects/fleetflow-platform/admin-dashboard.png
    alt: FleetFlow 配送运营总览，展示今日运单、准时率、在途车辆、趋势图和线路地图
    title: 配送运营总览
    caption: KPI、履约趋势、实时线路、今日运单与异常待处理集中在同一屏，使用蓝色主色、青绿色完成态和橙色提醒态区分优先级。
    viewport: desktop
    width: 1045
    height: 1224
  - src: /images/projects/fleetflow-platform/shipments-admin.png
    alt: FleetFlow 运单调度列表，展示路线、货物、司机、车辆、预计送达和状态
    title: 运单调度
    caption: 12 条演示运单可按状态分配司机，表格保留路线、货物、车辆和预计送达等高价值字段。
    viewport: desktop
    width: 1045
    height: 1224
  - src: /images/projects/fleetflow-platform/exceptions-admin.png
    alt: FleetFlow 异常中心，展示超时预警、地址确认和车辆告警处理动作
    title: 异常中心
    caption: 异常按高、中、低优先级展示，可直接标记已处理，演示数据不连接真实订单。
    viewport: desktop
    width: 1045
    height: 1224
  - src: /images/projects/fleetflow-platform/home-mobile.png
    alt: FleetFlow 移动端配送工作台，展示今日运单、路线和异常提醒
    title: 移动工作台
    caption: 移动端用深海蓝和青绿色建立路线感，扫码接单、我的路线、签收记录三项高频动作置于首屏。
    viewport: mobile
    width: 390
    height: 844
featured: true
draft: false
---

## 产品定位

FleetFlow 是一套免费开源、可自部署的同城配送调度底座，面向商超配送、餐饮供应链、社区团购和小型物流团队。它把“建单—调度—在途—签收—异常—结算”串成一条可复盘的工作流。

## 两个仓库如何关联

`fleetflow-miniapp` 负责司机和一线调度员的移动工作台，`fleetflow-admin` 负责运营后台、Go Gin API 与 Docker Compose 基础设施。两端通过 `/api/v1` 统一响应信封关联；未配置 API 时，前端仍可使用内置演示数据完整预览。

## 核心能力

- 运单调度：查看路线、货物、预计送达、司机与车辆状态，支持分配动作。
- 线路与车辆：用地图式线路舞台展示在途车辆，司机列表呈现在线、休息和利用率。
- 异常中心：超时、地址确认、车辆温度等异常带优先级和闭环动作。
- 对账结算：按周展示运单数、司机数、金额和结算状态。
- 数据边界：所有姓名、车牌、订单号均为虚构演示数据，不连接真实物流业务。

## 免费承诺与技术实现

源码公开、允许自部署。后台采用 Vite、Go 1.25、Gin；MySQL 8.4 与 Redis 8 通过 Compose 预留真实部署边界，写接口支持 `Idempotency-Key`，列表接口统一分页。
