---
title: FeeFlow 企业费控平台
description: 免费开源的申请、审批、报销、付款与归档一体化费控系统，适合小团队快速建立可追踪的费用流程。
publishedAt: 2026-07-16T13:05:00-05:00
updatedAt: 2026-07-16T13:05:00-05:00
status: active
category: 财务管理
tech: [uni-app, Vue 3, TypeScript, Go 1.25, Gin, MySQL 8.4, Redis 8, Docker Compose]
cover: /images/projects/feeflow-platform/shot-1.png
repoUrl: https://github.com/xrlnewman/feeflow-admin
repositories:
  - name: feeflow-miniapp
    role: frontend
    description: 员工移动报销端，支持新建申请、查看审批进度和补充票据说明。
    tech: [uni-app, Vue 3, TypeScript]
    url: https://github.com/xrlnewman/feeflow-miniapp
  - name: feeflow-admin
    role: admin
    description: 费控后台与 Go Gin API，覆盖费用申请、审批、付款确认、预算与归档。
    tech: [Vite, Go, Gin, MySQL 8.4, Redis 8]
    url: https://github.com/xrlnewman/feeflow-admin
screenshots:
  - src: /images/projects/feeflow-platform/shot-1.png
    alt: FeeFlow 费用运营总览
    title: 费用运营总览
    caption: 用青绿色表达已归档，用琥珀色提示待审批，预算、待办和本月费用在首屏形成完整叙事。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/feeflow-platform/shot-2.png
    alt: FeeFlow 费用审批列表
    title: 费用审批
    caption: 列表保留申请人、金额、预算科目和审批节点，便于财务快速定位风险。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/feeflow-platform/shot-3.png
    alt: FeeFlow 员工移动报销页
    title: 移动报销
    caption: 移动端以金额和审批状态为核心，提交后可继续补充说明，降低沟通成本。
    viewport: mobile
    width: 390
    height: 844
  - src: /images/projects/feeflow-platform/shot-4.png
    alt: FeeFlow 移动审批页
    title: 审批进度
    caption: 小屏卡片展示审批链路和下一步动作，避免把财务术语堆在一个页面里。
    viewport: mobile
    width: 390
    height: 844
featured: false
draft: false
---

## 产品定位

FeeFlow 适合没有专职财务产品团队的小企业，先把费用规则、预算和审批轨迹建立起来，再逐步接入真实系统。

## 完整闭环

费用申请 → 多级审批 → 报销补充 → 付款确认 → 凭证归档；幂等写入、审计日志和 Redis 锁避免重复付款。

## 两个仓库如何关联

`feeflow-miniapp` 负责员工端，`feeflow-admin` 负责管理端、API 与 Compose 基础设施，二者共享统一分页响应和状态枚举。

## 免费边界

MIT 友好的源码示例可免费自部署；金额、员工和票据均为虚构演示数据。
