---
title: HomeFlow 到家云服务平台
description: 面向保洁、维修、安装等到家服务商的预约、派单与履约平台，包含微信小程序、师傅工作台、运营后台与 Gin API。
publishedAt: 2026-07-16
updatedAt: 2026-07-16
status: active
category: 社区服务
tech: [uni-app, Vue 3, TypeScript, Go 1.25, Gin, MySQL 8.4, Redis 8, Docker Compose]
cover: /images/projects/homeflow-platform/admin-dashboard.jpg
repoUrl: https://github.com/xrlnewman/homeflow-admin
repositories:
  - name: homeflow-miniapp
    role: frontend
    description: 面向客户与服务人员的 uni-app 客户端，支持微信小程序与 H5，覆盖预约、订单时间线和履约工作台。
    tech: [uni-app, Vue 3, TypeScript, Vite]
    url: https://github.com/xrlnewman/homeflow-miniapp
  - name: homeflow-admin
    role: admin
    description: 面向运营团队的后台管理端与 Go API 单仓库，包含订单调度、服务目录、师傅、评价、审计与 RBAC。
    tech: [Vue 3, Vite, Element Plus, ECharts, Go, Gin]
    url: https://github.com/xrlnewman/homeflow-admin
screenshots:
  - src: /images/projects/homeflow-platform/admin-dashboard.jpg
    alt: HomeFlow 到家云运营后台总览，展示经营指标与订单调度
    title: 运营总览
    caption: 后台以订单调度为核心，串联经营数据、提醒、服务团队、趋势和服务质量。
    viewport: desktop
    width: 1280
    height: 900
  - src: /images/projects/homeflow-platform/home-mobile-v3.png
    alt: HomeFlow 到家云小程序首页，展示热门到家服务
    title: 客户端首页
    caption: 以“快速预约”和热门服务为入口，清晰呈现服务价格、时长与服务范围。
    viewport: mobile
    width: 853
    height: 1844
  - src: /images/projects/homeflow-platform/booking-mobile.jpg
    alt: HomeFlow 到家云小程序预约表单页
    title: 预约表单
    caption: 选择服务、上门地址与可用时段，预约提交带幂等键并进入订单履约链路。
    viewport: mobile
    width: 390
    height: 844
  - src: /images/projects/homeflow-platform/orders-mobile.jpg
    alt: HomeFlow 到家云小程序订单列表页
    title: 订单时间线
    caption: 客户可以按状态查看订单，并在服务完成后确认与评价。
    viewport: mobile
    width: 390
    height: 844
  - src: /images/projects/homeflow-platform/workbench-mobile.jpg
    alt: HomeFlow 到家云服务人员工作台
    title: 师傅工作台
    caption: 服务人员按“前往、到达、开始服务、完成”推进状态，并上传履约凭证。
    viewport: mobile
    width: 390
    height: 844
featured: true
draft: false
---

## 产品定位

HomeFlow 到家云是一套免费开源的到家服务运营底座，面向保洁、维修、安装、家电清洗和整理收纳等本地服务团队。它把“客户预约—时段锁定—智能派单—师傅履约—客户确认—评价沉淀”串成一条可追踪链路。

## 双仓库协作

产品拆成两个公开仓库：`homeflow-miniapp` 负责客户和师傅端，`homeflow-admin` 负责后台管理端、Go API 与 Docker Compose 基础设施。两边共享 `docs/api-contract.md`，便于后续独立部署和二次开发。

## 联调方式

两个前端都支持通过 `VITE_API_BASE_URL` 或 `UNI_APP_API_BASE_URL` 指向 Gin API，并使用 `homeflow_access_token` 复用登录令牌。未配置 API、网络不可用或接口返回异常时，会自动回退到内置演示数据，保证本地预览和作品展示不中断；后台页面会明确标记当前数据来源。

后台配置 API 地址后会先进入登录页，登录成功后令牌保存在浏览器本地存储，退出时会调用登出接口并清理令牌。API 连接 MySQL 8.4 时，订单、事件、审计、评价和履约凭证会在服务启动阶段回载到读模型；开发环境数据库不可用时仍可使用离线演示。

## 技术实现

小程序使用 uni-app、Vue 3 与 TypeScript，可构建 H5 与微信小程序；后台使用 Vue 3、Element Plus 与 ECharts；后端使用 Go 1.25、Gin、JWT/RBAC，并以 MySQL 8.4 持久化订单事件、审计、评价和履约凭证，Redis 8 负责预约时段短锁，Docker Compose 提供本地一键启动。

## 关键能力

- 预约时段容量控制、Redis 短锁与幂等键，避免重复下单和超卖。
- 订单状态机覆盖待派单、已派单、前往中、服务中、待确认、已完成与已取消。
- 基于技能、区域、距离和负载的派单推荐，并限制师傅只能操作自己的订单。
- 评价、履约凭证、地址簿、服务目录、经营看板、RBAC 和操作审计。
