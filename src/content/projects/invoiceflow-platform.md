---
title: InvoiceFlow 企业开票与收款平台
description: 开票申请、审核、收款核销、对账与归档一体化企业财务平台，适合中小团队建立可追踪的回款流程。
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
modules:
  - name: 开票中心
    description: 管理客户抬头、税率、明细和审核队列。
    features: [开票申请, 税务校验, 红冲作废]
  - name: 回款核销
    description: 把回款流水与发票余额关联，处理部分回款和差额。
    features: [回款登记, 自动匹配, 差额提醒]
  - name: 对账归档
    description: 汇总客户、合同和发票状态，形成可追溯的月度账册。
    features: [月度对账, 凭证附件, 导出归档]
roles:
  - name: 销售
    scope: 提交开票申请和查看客户回款进度
  - name: 财务专员
    scope: 审核发票、登记回款和执行核销
  - name: 财务主管
    scope: 复核异常、锁定账期和查看审计事件
workflow:
  - label: 提交申请
    status: 草稿
  - label: 财务审核
    status: 待审核
  - label: 开具发票
    status: 已开具
  - label: 登记回款
    status: 部分回款
  - label: 自动核销
    status: 已核销
  - label: 月度归档
    status: 已归档
metrics:
  - label: 本月开票额
    value: ¥286.4万
    trend: 较上月 +18.6%
  - label: 待核销笔数
    value: '18'
    trend: 今日减少 6 笔
  - label: 平均回款周期
    value: 12.4天
    trend: 较上季 -2.1天
  - label: 对账完成率
    value: 96.8%
    trend: 本月已锁账
integrations: [MySQL 8.4, Redis 8, Docker Compose, CSV 导出]
featured: false
draft: false
---

## 财务流程

开票申请 → 财务审核 → 开票登记 → 收款确认 → 自动核销 → 对账归档；重复提交使用幂等键，状态变化写入财务事件。

## 仓库关联与运行范围

`invoiceflow-miniapp` 提供销售与财务移动体验，`invoiceflow-admin` 提供后台、Go API、MySQL 8.4 和 Redis 8。两端共享开票、回款、核销和对账状态；客户、发票和金额均为虚构演示数据。
