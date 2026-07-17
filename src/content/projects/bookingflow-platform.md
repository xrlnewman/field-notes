---
title: BookingFlow 预约排班平台
description: 服务配置、预约、排班、到店核销、评价与复购提醒一体化预约平台，适合美容、健身和咨询门店。
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
modules:
  - name: 服务与时段
    description: 配置服务、价格、员工和可预约资源，避免时段冲突。
    features: [服务目录, 时段库存, 冲突锁定]
  - name: 预约与排班
    description: 将客户预约与员工日历、改期和候补名单关联。
    features: [在线预约, 改期取消, 员工排班]
  - name: 到店与复购
    description: 从签到进入服务记录，沉淀评价、优惠和复购提醒。
    features: [扫码签到, 服务记录, 评价回访]
roles:
  - name: 客户
    scope: 选择服务时段、支付定金和管理预约
  - name: 门店前台
    scope: 签到核销、改约处理和现场排班
  - name: 服务人员
    scope: 查看日历、开始服务和提交评价结果
workflow:
  - label: 选择服务时段
    status: 待确认
  - label: 支付定金
    status: 已预约
  - label: 到店签到
    status: 已签到
  - label: 服务执行
    status: 服务中
  - label: 完成评价
    status: 已完成
metrics:
  - label: 今日预约
    value: '86'
    trend: 较昨日 +14.6%
  - label: 时段利用率
    value: 78.4%
    trend: 本周平均
  - label: 到店率
    value: 93.1%
    trend: 较上月 +2.8%
  - label: 复购提醒
    value: 42条
    trend: 今日待发送
integrations: [MySQL 8.4, Redis 8, Docker Compose, 日历导出]
featured: false
draft: false
---

## 业务流程

服务配置 → 顾客预约 → 员工排班 → 到店签到 → 服务完成 → 评价回访 → 复购提醒；预约占位和核销动作支持幂等。

## 仓库关联与运行范围

`bookingflow-miniapp` 面向顾客与前台，`bookingflow-admin` 负责门店运营、Go API、MySQL 8.4 与 Redis 8。两端共享预约、容量、退款和评价状态；服务、会员和预约均为虚构演示数据。
