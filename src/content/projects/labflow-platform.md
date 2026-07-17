---
title: LabFlow 医疗样本管理平台
description: 免费开源的送检登记、样本接收、检验、复核、报告归档一体化样本管理平台，使用虚构数据演示医疗流程可追踪性。
publishedAt: 2026-07-16T14:25:00-05:00
updatedAt: 2026-07-16T14:25:00-05:00
status: active
category: 医疗健康
tech: [Vite, Vue 3, TypeScript, Go 1.25, Gin, MySQL 8.4, Redis 8, Docker Compose]
cover: /images/projects/labflow-platform/shot-1.png
repoUrl: https://github.com/xrlnewman/labflow-admin
repositories:
  - name: labflow-miniapp
    role: frontend
    description: 采样与检验移动工作台，支持扫码接收、任务确认、异常上报和报告提醒。
    tech: [Vite, TypeScript, Responsive UI]
    url: https://github.com/xrlnewman/labflow-miniapp
  - name: labflow-admin
    role: admin
    description: 样本管理后台与 Go Gin API，覆盖送检、样本、检验任务、复核和报告归档。
    tech: [Vite, Go, Gin, MySQL 8.4, Redis 8]
    url: https://github.com/xrlnewman/labflow-admin
screenshots:
  - src: /images/projects/labflow-platform/shot-1.png
    alt: LabFlow 样本总览
    title: 样本与检验总览
    caption: 今日送检、待接收、检验中和待复核样本以清晰状态色区分，所有数据均为演示数据。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/labflow-platform/shot-2.png
    alt: LabFlow 样本列表
    title: 样本流转列表
    caption: 样本编号、来源、检验项目、负责人和当前节点集中展示，便于追踪异常。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/labflow-platform/shot-3.png
    alt: LabFlow 移动样本接收
    title: 移动样本接收
    caption: 工作人员扫码确认样本状态并提交异常说明，减少手工重复录入。
    viewport: mobile
    width: 390
    height: 844
  - src: /images/projects/labflow-platform/shot-4.png
    alt: LabFlow 移动复核页面
    title: 复核与报告
    caption: 复核节点、报告状态和提醒集中在一张任务卡内，仅用于演示产品流程。
    viewport: mobile
    width: 390
    height: 844
featured: false
draft: false
---

## 完整闭环

送检登记 → 样本接收 → 检验任务 → 结果复核 → 报告归档 → 通知查看；每个节点写入事件时间线，异常可回退处理。

## 仓库关联与免费边界

`labflow-miniapp` 面向采样与检验人员，`labflow-admin` 提供后台、Go API、MySQL 8.4 与 Redis 8。项目免费公开，不接入真实医疗机构、患者或检验数据。
