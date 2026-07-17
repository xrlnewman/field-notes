---
title: CRMFlow 销售协同平台
description: 线索、客户、跟进、商机与赢单协同平台，让销售团队从线索进入到签约结果都可复盘。
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

## 销售流程

线索进入 → 分配负责人 → 跟进记录 → 商机推进 → 赢单或丢单 → 复盘统计；关键写操作使用幂等键并记录审计。

## 两个仓库如何关联

`crmflow-miniapp` 与 `crmflow-admin` 共享 Go API，移动端负责高频跟进，后台负责规则、数据和漏斗分析。

## 运行范围

客户名称、金额和联系人均为演示数据，不接入真实通讯录；线索、商机和赢单记录保留完整跟进时间线。

## 业务模块

- **线索接入**：支持手动录入、批量导入和渠道标签，分配时校验负责人和重复线索。
- **客户与联系人**：维护客户档案、联系人、最近沟通和服务机会，避免销售各自保存本地表格。
- **商机推进**：按阶段记录预计金额、赢率、竞争对手和下一步动作，阶段变化自动写入时间线。
- **赢单复盘**：赢单后沉淀合同摘要与交付负责人，丢单必须选择原因，漏斗报表按团队和渠道汇总。

## 数据与验收

线索、客户、联系人、商机、跟进记录和赢单结果通过唯一编号关联。验收路径为“录入线索—分配—跟进—创建商机—推进阶段—赢单/丢单—复盘”，移动端更新后后台漏斗即时刷新。
