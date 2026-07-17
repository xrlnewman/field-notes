---
title: HelpdeskFlow 客服工单平台
description: 客服创建、分派、回复、解决与满意度一体化工单系统，为小团队提供可量化的服务台。
publishedAt: 2026-07-16T13:25:00-05:00
updatedAt: 2026-07-16T13:25:00-05:00
status: active
category: 客户服务
tech: [Vite, Vue 3, TypeScript, Go 1.25, Gin, MySQL 8.4, Redis 8, Docker Compose]
cover: /images/projects/helpdeskflow-platform/shot-1.png
repoUrl: https://github.com/xrlnewman/helpdeskflow-admin
repositories:
  - name: helpdeskflow-miniapp
    role: frontend
    description: 客服与客户移动工单端，支持回复、状态推进、附件说明和满意度反馈。
    tech: [Vite, TypeScript, Responsive UI]
    url: https://github.com/xrlnewman/helpdeskflow-miniapp
  - name: helpdeskflow-admin
    role: admin
    description: 客服后台与 Go Gin API，覆盖队列、SLA、回复、知识库和满意度分析。
    tech: [Vite, Go, Gin, MySQL 8.4, Redis 8]
    url: https://github.com/xrlnewman/helpdeskflow-admin
screenshots:
  - src: /images/projects/helpdeskflow-platform/shot-1.png
    alt: HelpdeskFlow 客服工作台
    title: 客服工作台
    caption: 待处理、SLA 风险、解决率和满意度用卡片分组，页面保持克制但信息足够支撑运营判断。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/helpdeskflow-platform/shot-2.png
    alt: HelpdeskFlow 工单列表
    title: 工单队列
    caption: 优先级、渠道、负责人和最后回复时间同屏展示，分派和解决动作紧邻状态标签。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/helpdeskflow-platform/shot-3.png
    alt: HelpdeskFlow 移动客服首页
    title: 移动客服
    caption: 移动端保留高频回复和状态推进动作，适合值班客服处理突发问题。
    viewport: mobile
    width: 390
    height: 844
  - src: /images/projects/helpdeskflow-platform/shot-4.png
    alt: HelpdeskFlow 移动工单详情
    title: 工单回复
    caption: 时间线保留双方沟通与处理记录，解决后可直接收集满意度。
    viewport: mobile
    width: 390
    height: 844
featured: false
draft: false
---

## 服务流程

客户创建 → 自动分派 → 客服回复 → 标记解决 → 客户评价；SLA 和审计事件让服务质量可量化。

## 仓库关联与运行范围

`helpdeskflow-miniapp` 和 `helpdeskflow-admin` 共享 Go API、MySQL 8.4、Redis 8 和幂等写入。两端共享工单状态、回复记录和满意度结果；客户对话和联系人只使用虚构数据。
