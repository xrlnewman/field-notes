---
title: LabFlow 医疗样本管理平台
description: 送检登记、样本接收、检验、结果复核、报告归档一体化样本管理平台，使用脱敏别名和虚构数据演示医疗流程可追踪性。
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
    description: 采样与检验移动工作台，支持快速送检、接收确认、检验进度、报告复核和结果刷新。
    tech: [Vite, TypeScript, Responsive UI]
    url: https://github.com/xrlnewman/labflow-miniapp
  - name: labflow-admin
    role: admin
    description: 样本管理后台与 Go Gin API，覆盖样本列表筛选、详情时间线、检验项目、报告复核和归档审计。
    tech: [Vite, Go, Gin, MySQL 8.4, Redis 8]
    url: https://github.com/xrlnewman/labflow-admin
screenshots:
  - src: /images/projects/labflow-platform/shot-1.png
    alt: LabFlow 样本总览
    title: 样本与检验总览
    caption: 今日送检、已接收、检验中、待复核和已归档样本以清晰状态色区分，所有数据均为虚构演示数据。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/labflow-platform/shot-2.png
    alt: LabFlow 样本列表
    title: 样本流转列表
    caption: 样本编号、受检者别名、样本类型、检验项目和当前节点集中展示，便于追踪报告进度。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/labflow-platform/shot-3.png
    alt: LabFlow 移动样本接收
    title: 移动样本接收
    caption: 工作人员在移动端创建送检单、确认接收并刷新样本详情，不暴露真实身份信息。
    viewport: mobile
    width: 390
    height: 844
  - src: /images/projects/labflow-platform/shot-4.png
    alt: LabFlow 移动复核页面
    title: 复核与报告
    caption: 报告结果、复核动作、事件时间线和归档状态集中在一张任务卡内，仅用于演示产品流程。
    viewport: mobile
    width: 390
    height: 844
featured: false
draft: false
---

## 检验流程

待送检（送检登记） → 已接收 → 检验中 → 待复核 → 已出报告 → 已归档；后台和移动端都可推进合法节点，非法回退返回明确错误。每次状态变化写入 actor、action、fromStatus、toStatus 和时间线；报告结果单独保存并在复核后进入归档。

## API 闭环

`GET /api/v1/samples` 支持 status、keyword、page、pageSize 筛选；详情返回检验项目、报告和事件时间线。`POST /samples` 要求受检者别名和至少一项检验项目；`receive`、`start-test`、`report`、`review`、`archive` 均要求幂等键，重复请求不会重复写事件。

## 仓库关联与运行范围

`labflow-miniapp` 面向采样与检验人员，提供快捷创建、列表、详情刷新和失败 toast；`labflow-admin` 提供状态筛选、详情时间线、报告复核和归档操作。两端共享 Go Gin API、MySQL 8.4 与 Redis 8 的幂等边界；不接入真实医疗机构、患者或检验数据。
