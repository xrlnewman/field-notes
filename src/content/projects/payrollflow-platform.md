---
title: PayrollFlow 薪酬绩效管理平台
description: 员工档案、绩效目标、薪资核算、审批发放和月度归档一体化人力平台，适合中小企业建立透明的人事流程。
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
modules:
  - name: 薪资周期
    description: 以月份为单位汇总员工、考勤和绩效输入。
    features: [周期锁定, 考勤导入, 绩效汇总]
  - name: 核算与复核
    description: 展示逐员应发、扣款、个税和社保差异。
    features: [规则计算, 差异校验, 复核批注]
  - name: 发放与工资条
    description: 管理发放批次、失败重试和员工工资条可见范围。
    features: [批次发放, 失败重试, 工资条下载]
roles:
  - name: HR 专员
    scope: 导入考勤绩效、运行核算和处理差异
  - name: 部门主管
    scope: 复核本部门员工明细并提交审批
  - name: 财务主管
    scope: 锁定周期、发起发放和查看审计记录
workflow:
  - label: 创建薪资周期
    status: 草稿
  - label: 导入考勤绩效
    status: 计算中
  - label: 差异复核
    status: 待复核
  - label: 发放审批
    status: 待发放
  - label: 银行批次演示
    status: 发放中
  - label: 工资条归档
    status: 已归档
metrics:
  - label: 本期员工数
    value: '486'
    trend: 覆盖 12 个部门
  - label: 应发薪资
    value: ¥428.6万
    trend: 较上期 +2.4%
  - label: 待复核差异
    value: '7笔'
    trend: 需主管确认
  - label: 发放成功率
    value: 99.2%
    trend: 最近 6 个周期
integrations: [MySQL 8.4, Redis 8, Docker Compose, CSV 导入]
featured: false
draft: false
---

## 薪资流程

员工入职 → 目标确认 → 月度绩效 → 薪资核算 → 主管审批 → 发放确认 → 月度归档；薪资批次和审批事件可回放。

## 仓库关联与运行范围

`payrollflow-miniapp` 提供员工与主管移动体验，`payrollflow-admin` 提供人力后台、Go API、MySQL 8.4 与 Redis 8。两端共享考勤、核算、复核、发放和归档状态；员工、考勤和薪资数据均为虚构演示数据。
