---
title: PayrollFlow 薪酬绩效管理平台
description: 免费开源的员工档案、绩效目标、薪资核算、审批发放和月度归档一体化人力平台，适合中小企业建立透明的人事流程。
publishedAt: 2026-07-16T14:15:00-05:00
updatedAt: 2026-07-16T14:15:00-05:00
status: active
category: 人力资源
tech: [Vite, Vue 3, TypeScript, Go 1.25, Gin, MySQL 8.4, Redis 8, Docker Compose]
cover: /images/projects/payrollflow-platform/shot-1.png
repoUrl: https://github.com/xrlnewman/payrollflow-admin
repositories:
  - name: payrollflow-miniapp
    role: frontend
    description: 员工与主管移动端，支持目标确认、绩效反馈、工资单查看和审批提醒。
    tech: [Vite, TypeScript, Responsive UI]
    url: https://github.com/xrlnewman/payrollflow-miniapp
  - name: payrollflow-admin
    role: admin
    description: 人力后台与 Go Gin API，覆盖员工、考勤、绩效、薪资核算和发放批次。
    tech: [Vite, Go, Gin, MySQL 8.4, Redis 8]
    url: https://github.com/xrlnewman/payrollflow-admin
screenshots:
  - src: /images/projects/payrollflow-platform/shot-1.png
    alt: PayrollFlow 人力总览
    title: 人力与薪酬总览
    caption: 在岗人数、待评估员工、薪资预算和本月发放进度按管理优先级排列。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/payrollflow-platform/shot-2.png
    alt: PayrollFlow 薪酬核算列表
    title: 薪资核算
    caption: 部门、出勤、绩效系数、应发金额和审批状态在一张表中完成核对。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/payrollflow-platform/shot-3.png
    alt: PayrollFlow 移动绩效页面
    title: 移动绩效反馈
    caption: 员工与主管可以随时确认目标和反馈，避免绩效信息只在月底集中补录。
    viewport: mobile
    width: 390
    height: 844
  - src: /images/projects/payrollflow-platform/shot-4.png
    alt: PayrollFlow 移动工资单页面
    title: 工资单与提醒
    caption: 工资单、扣款说明和审批提醒以清晰的时间线展示，数据仅用于演示。
    viewport: mobile
    width: 390
    height: 844
featured: false
draft: false
---

## 完整闭环

员工入职 → 目标确认 → 月度绩效 → 薪资核算 → 主管审批 → 发放确认 → 月度归档；薪资批次和审批事件可回放。

## 仓库关联与免费边界

`payrollflow-miniapp` 提供员工与主管移动体验，`payrollflow-admin` 提供人力后台、Go API、MySQL 8.4 与 Redis 8。源码免费公开，员工、考勤和薪资数据均为虚构演示数据。
