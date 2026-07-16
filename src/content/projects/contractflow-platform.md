---
title: ContractFlow 合同管理平台
description: 免费开源的合同起草、审批、电子签署、履约提醒和归档工作台，让合同从草稿到履约都有时间线。
publishedAt: 2026-07-16T13:15:00-05:00
updatedAt: 2026-07-16T13:15:00-05:00
status: active
category: 合同管理
tech: [uni-app, Vue 3, TypeScript, Go 1.25, Gin, MySQL 8.4, Redis 8, Docker Compose]
cover: /images/projects/contractflow-platform/shot-1.png
repoUrl: https://github.com/xrlnewman/contractflow-admin
repositories:
  - name: contractflow-miniapp
    role: frontend
    description: 合同移动审批端，查看待审合同、签署节点、到期提醒和履约备注。
    tech: [uni-app, Vue 3, TypeScript]
    url: https://github.com/xrlnewman/contractflow-miniapp
  - name: contractflow-admin
    role: admin
    description: 合同后台与 Go Gin API，覆盖合同起草、审核、签署、履约提醒与归档。
    tech: [Vite, Go, Gin, MySQL 8.4, Redis 8]
    url: https://github.com/xrlnewman/contractflow-admin
screenshots:
  - src: /images/projects/contractflow-platform/shot-1.png
    alt: ContractFlow 合同总览
    title: 合同总览
    caption: 靛蓝主色传达稳定和合规，合同数量、待审批和即将到期节点形成清晰的运营层级。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/contractflow-platform/shot-2.png
    alt: ContractFlow 合同列表
    title: 合同审批
    caption: 合同类型、对方、负责人、金额和到期日集中展示，重要动作保持在右侧可见。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/contractflow-platform/shot-3.png
    alt: ContractFlow 移动合同首页
    title: 移动合同工作台
    caption: 移动端突出待审批和到期提醒，让管理者不必回到电脑才能处理关键节点。
    viewport: mobile
    width: 390
    height: 844
  - src: /images/projects/contractflow-platform/shot-4.png
    alt: ContractFlow 移动合同详情
    title: 合同履约时间线
    caption: 审批、签署、回款与归档节点按时间线排列，减少合规流程的遗漏。
    viewport: mobile
    width: 390
    height: 844
featured: false
draft: false
---

## 产品定位

ContractFlow 面向没有法务系统的创业团队与项目公司，先用清晰的状态和提醒把合同生命周期跑通。

## 完整闭环

起草 → 审批 → 签署 → 履约提醒 → 到期复核 → 归档；状态事件与审计日志可回放，写接口要求幂等键。

## 两个仓库如何关联

`contractflow-miniapp` 提供移动审批体验，`contractflow-admin` 提供后台、领域 API、MySQL 8.4 和 Redis 8 Compose。

## 免费边界

源码公开并支持自部署；合同内容和签署均为演示流程，不替代真实电子签名或法律意见。
