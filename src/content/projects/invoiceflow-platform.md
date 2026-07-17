---
title: InvoiceFlow 企业开票与收款平台
description: 免费开源的开票申请、审核、收款核销、对账与归档一体化企业财务平台，适合中小团队建立可追踪的回款流程。
publishedAt: 2026-07-16T14:00:00-05:00
updatedAt: 2026-07-16T14:00:00-05:00
status: active
category: 财务管理
tech: [Vite, Vue 3, TypeScript, Go 1.25, Gin, MySQL 8.4, Redis 8, Docker Compose]
cover: /images/projects/invoiceflow-platform/shot-1.png
repoUrl: https://github.com/xrlnewman/invoiceflow-admin
repositories:
  - name: invoiceflow-miniapp
    role: frontend
    description: 销售与财务移动工作台，支持开票申请、进度查看、收款确认和客户回款提醒。
    tech: [Vite, TypeScript, Responsive UI]
    url: https://github.com/xrlnewman/invoiceflow-miniapp
  - name: invoiceflow-admin
    role: admin
    description: 企业财务后台与 Go Gin API，覆盖客户、发票、回款、对账和归档。
    tech: [Vite, Go, Gin, MySQL 8.4, Redis 8]
    url: https://github.com/xrlnewman/invoiceflow-admin
screenshots:
  - src: /images/projects/invoiceflow-platform/shot-1.png
    alt: InvoiceFlow 财务总览
    title: 财务总览
    caption: 待开票金额、已回款、逾期客户和本月对账状态集中呈现，帮助财务先处理高风险事项。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/invoiceflow-platform/shot-2.png
    alt: InvoiceFlow 开票列表
    title: 开票与回款列表
    caption: 客户、金额、税率、开票状态和回款节点按业务顺序排列，减少跨表核对。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/invoiceflow-platform/shot-3.png
    alt: InvoiceFlow 移动开票申请
    title: 移动开票申请
    caption: 销售可在手机上提交开票信息并查看审批进度，财务收到清晰的待办提醒。
    viewport: mobile
    width: 390
    height: 844
  - src: /images/projects/invoiceflow-platform/shot-4.png
    alt: InvoiceFlow 移动收款确认
    title: 收款核销
    caption: 收款确认、凭证备注和客户余额在同一流程里完成，结果回流到对账看板。
    viewport: mobile
    width: 390
    height: 844
featured: false
draft: false
---

## 完整闭环

开票申请 → 财务审核 → 开票登记 → 收款确认 → 自动核销 → 对账归档；重复提交使用幂等键，状态变化写入财务事件。

## 仓库关联与免费边界

`invoiceflow-miniapp` 提供销售与财务移动体验，`invoiceflow-admin` 提供后台、Go API、MySQL 8.4 和 Redis 8。项目免费公开，客户、发票和金额均为虚构演示数据。
