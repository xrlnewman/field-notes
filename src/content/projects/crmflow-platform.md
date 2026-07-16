---
title: CRMFlow 销售协同平台
description: 免费开源的线索、客户、跟进、商机与赢单协同平台，让销售团队从线索进入到签约结果都可复盘。
publishedAt: 2026-07-16T13:10:00-05:00
updatedAt: 2026-07-16T13:10:00-05:00
status: active
category: 销售管理
tech: [Vite, Vue 3, TypeScript, Go 1.25, Gin, MySQL 8.4, Redis 8, Docker Compose]
cover: /images/projects/crmflow-platform/shot-1.png
repoUrl: https://github.com/xrlnewman/crmflow-admin
repositories:
  - name: crmflow-miniapp
    role: frontend
    description: 销售移动工作台，支持线索跟进、商机备注、下一步提醒与赢单确认。
    tech: [Vite, Vue 3, TypeScript]
    url: https://github.com/xrlnewman/crmflow-miniapp
  - name: crmflow-admin
    role: admin
    description: 销售后台与 Go Gin API，覆盖线索分配、客户跟进、商机阶段和赢单统计。
    tech: [Vite, Go, Gin, MySQL 8.4, Redis 8]
    url: https://github.com/xrlnewman/crmflow-admin
screenshots:
  - src: /images/projects/crmflow-platform/shot-1.png
    alt: CRMFlow 销售漏斗总览
    title: 销售漏斗
    caption: 以漏斗、阶段卡和预计金额建立销售节奏，蓝紫色用于阶段推进，橙色只保留给风险提醒。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/crmflow-platform/shot-2.png
    alt: CRMFlow 客户跟进列表
    title: 客户跟进
    caption: 每条线索都包含负责人、下次联系时间和商机阶段，方便团队协作而不依赖口头同步。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/crmflow-platform/shot-3.png
    alt: CRMFlow 移动销售首页
    title: 移动销售工作台
    caption: 移动端突出今日待跟进和高价值商机，让销售在会议间隙也能更新状态。
    viewport: mobile
    width: 390
    height: 844
  - src: /images/projects/crmflow-platform/shot-4.png
    alt: CRMFlow 移动商机详情
    title: 商机详情
    caption: 时间线记录联系、报价和下一步动作，避免跟进信息散落在聊天工具里。
    viewport: mobile
    width: 390
    height: 844
featured: false
draft: false
---

## 产品定位

CRMFlow 面向以项目制销售、企业服务和本地商家为主的小团队，帮助负责人看清漏斗，也帮助一线销售减少重复录入。

## 完整闭环

线索进入 → 分配负责人 → 跟进记录 → 商机推进 → 赢单或丢单 → 复盘统计；关键写操作使用幂等键并记录审计。

## 两个仓库如何关联

`crmflow-miniapp` 与 `crmflow-admin` 共享 Go API，移动端负责高频跟进，后台负责规则、数据和漏斗分析。

## 免费边界

公开源码可免费部署；客户名称、金额和联系人均为演示数据，不接入真实通讯录。
