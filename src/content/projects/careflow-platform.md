---
title: CareFlow 诊所预约与健康随访平台
description: 面向社区诊所和小型医疗机构的免费开源预约、候诊、排班和随访运营平台，提供移动端、后台与 Go Gin API。
publishedAt: 2026-07-16T12:00:00-05:00
updatedAt: 2026-07-16T12:00:00-05:00
status: active
category: 医疗健康
tech: [Vite, TypeScript, Go 1.25, Gin, MySQL 8.4, Redis 8, Docker Compose]
cover: /images/projects/careflow-platform/admin-dashboard.png
repoUrl: https://github.com/xrlnewman/careflow-admin
repositories:
  - name: careflow-miniapp
    role: frontend
    description: 患者预约工作台，覆盖创建预约、签到、候诊、接诊进度和随访提醒。
    tech: [Vite, TypeScript, Responsive UI]
    url: https://github.com/xrlnewman/careflow-miniapp
  - name: careflow-admin
    role: admin
    description: 诊所运营后台与 Go Gin API，覆盖预约全状态流转、医生排班、患者档案、随访任务和 MySQL 8.4 / Redis 8 Compose。
    tech: [Vite, JavaScript, Go, Gin, MySQL 8.4, Redis 8]
    url: https://github.com/xrlnewman/careflow-admin
screenshots:
  - src: /images/projects/careflow-platform/admin-dashboard.png
    alt: CareFlow 诊所运营总览，展示今日预约、平均候诊、完成量、科室负载和随访趋势
    title: 诊所运营总览
    caption: 用靛蓝作为工作台基色，珊瑚色表示改约与待随访，绿色表示完成态，避免医疗后台单一绿色造成的层级混淆。
    viewport: desktop
    width: 1045
    height: 1224
  - src: /images/projects/careflow-platform/appointments-admin.png
    alt: CareFlow 预约队列，展示预约编号、患者、科室、时间、状态和签到操作
    title: 预约队列
    caption: 20 条虚构预约以表格密度呈现，可直接区分候诊、已签到、待签到和已完成状态。
    viewport: desktop
    width: 1045
    height: 1224
  - src: /images/projects/careflow-platform/followups-admin.png
    alt: CareFlow 健康随访任务，展示任务编号、患者、任务内容和完成动作
    title: 随访任务
    caption: 随访任务保留到期时间和负责动作，帮助运营人员把复诊提醒变成可执行的任务清单。
    viewport: desktop
    width: 1045
    height: 1224
  - src: /images/projects/careflow-platform/home-mobile.png
    alt: CareFlow 移动端预约工作台，展示预约挂号、我的候诊、健康档案和预约卡片
    title: 患者移动工作台
    caption: 移动端首屏提供预约挂号、候诊、健康档案三个入口，卡片展示医生、科室和时间，适合社区诊所场景。
    viewport: mobile
    width: 390
    height: 844
featured: true
draft: false
---

## 产品定位

CareFlow 是一套免费开源、可自部署的诊所预约与健康随访运营底座，面向社区诊所、小型专科机构和健康管理工作室。它只解决预约、签到、候诊、排班、档案和随访流转，不替代医生诊断。

## 两个仓库如何关联

`careflow-miniapp` 负责患者侧预约工作台，`careflow-admin` 负责诊所运营后台、Go Gin API 与 Docker Compose 基础设施。两端通过 `/api/v1` 契约关联，未配置 API 时默认展示完整虚构数据。

## 核心能力与边界

- 预约队列：创建预约并推进待签到—签到—候诊—接诊—完成，状态事件可回放。
- 医生排班：按科室查看 8 位医生的时段利用率和当前接诊状态。
- 患者档案：用 30 条虚构档案展示最近科室、就诊日期和随访状态。
- 健康随访：用任务化列表追踪复诊/恢复提醒，支持创建、完成和幂等重试。
- 合规边界：不提供诊断、处方、支付、远程医疗或真实患者信息，所有姓名和编号仅用于界面演示。

## 免费承诺与技术实现

源码公开、允许自部署。后台采用 Vite、Go 1.25、Gin；MySQL 8.4 持久化预约事件与随访任务，Redis 8 提供 `Idempotency-Key` 幂等结果和资源锁，列表接口统一分页。
