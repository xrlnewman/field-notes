---
title: StoreFlow 门店预约与会员经营平台
description: 面向美容、美甲、健身、洗护等门店的预约、排班、会员经营与运营看板，包含 uni-app 小程序、Vue 管理后台与 Gin API。
publishedAt: 2026-07-16
updatedAt: 2026-07-16
status: active
category: 门店经营
tech: [uni-app, Vue 3, TypeScript, Go 1.25, Gin, MySQL 8.4, Redis 8, Docker Compose]
cover: /images/projects/storeflow-platform/admin-dashboard.png
repoUrl: https://github.com/xrlnewman/storeflow-admin
repositories:
  - name: storeflow-miniapp
    role: frontend
    description: 面向到店用户的 uni-app 客户端，覆盖门店选择、项目浏览、时段预约、预约列表与会员入口。
    tech: [uni-app, Vue 3, TypeScript, Vite]
    url: https://github.com/xrlnewman/storeflow-miniapp
  - name: storeflow-admin
    role: admin
    description: 面向门店运营团队的 Vue 管理后台与 Go API 单仓库，包含预约调度、门店项目、员工排班、会员经营与 Docker Compose 基础设施。
    tech: [Vue 3, Vite, Go, Gin, MySQL 8.4, Redis 8]
    url: https://github.com/xrlnewman/storeflow-admin
screenshots:
  - src: /images/projects/storeflow-platform/admin-dashboard.png
    alt: StoreFlow 门店运营后台总览，展示预约日程、营业指标与员工排班
    title: 预约运营总览
    caption: 以预约日程为主工作区，串联营业额、完成预约、到店率、员工排班和运营提醒。
    viewport: desktop
    width: 1487
    height: 1058
  - src: /images/projects/storeflow-platform/home-mobile.png
    alt: StoreFlow 小程序首页，展示门店与热门预约项目
    title: 门店首页
    caption: 用户先选择门店，再从热门项目进入预约，价格、时长和服务入口保持清晰可见。
    viewport: mobile
    width: 864
    height: 1821
  - src: /images/projects/storeflow-platform/booking-mobile.png
    alt: StoreFlow 小程序预约项目页，展示日期、时段与员工选择
    title: 时段预约
    caption: 可用时段、已选时段、员工偏好和确认金额集中在一条预约链路内，降低重复操作。
    viewport: mobile
    width: 864
    height: 1821
  - src: /images/projects/storeflow-platform/appointments-mobile.png
    alt: StoreFlow 小程序我的预约页，展示待到店与已完成服务
    title: 我的预约
    caption: 按待确认、已安排和已完成查看预约，门店、时间、员工与状态一屏对齐。
    viewport: mobile
    width: 864
    height: 1821
featured: true
draft: false
---

## 产品定位

StoreFlow 是一套门店经营底座，服务美容、美甲、健身、洗护、摄影和体验课等需要“按时间交付”的线下门店。它把“选择门店—选择项目—锁定时段—安排员工—到店服务—会员复购”串成一条可追踪链路。

## 双仓库协作

产品拆成两个公开仓库：`storeflow-miniapp` 负责用户端预约体验，`storeflow-admin` 负责运营后台、Go API 与 Docker Compose 基础设施。两边通过 `/api/v1` 契约联调，未配置 API 时仍能用内置演示数据完整预览。

## 技术实现

小程序使用 uni-app、Vue 3 与 TypeScript，可构建 H5 与微信小程序；后台使用 Vue 3 与 Vite；后端使用 Go 1.25、Gin、JWT/RBAC，以 MySQL 8.4 持久化门店、项目、预约、员工和会员数据，Redis 8 负责预约时段短锁与幂等控制，Docker Compose 提供本地一键启动。

## 关键能力

- 门店与服务项目管理：价格、时长、营业范围和可预约状态统一维护。
- 预约时段容量控制：Redis 短锁、幂等键和状态转换避免重复预约与超卖。
- 员工排班与预约调度：按门店、技能、负载安排员工，后台可推进确认、到店和完成状态。
- 会员经营与运营看板：沉淀到店次数、复购提醒、完成预约、到店率和营业趋势。
- 运行环境：本地演示使用 MySQL 8.4、Redis 8 和 Gin API，门店、员工、会员和预约均使用演示数据。
