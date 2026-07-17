---
title: SupplyFlow 采购供应链平台
description: 免费开源的采购申请、供应商询价、比价审批、到货验收与结算一体化供应链平台，适合成长型企业规范采购流程。
publishedAt: 2026-07-16T14:10:00-05:00
updatedAt: 2026-07-16T14:10:00-05:00
status: active
category: 采购供应链
tech: [Vite, Vue 3, TypeScript, Go 1.25, Gin, MySQL 8.4, Redis 8, Docker Compose]
cover: /images/projects/supplyflow-platform/shot-1.png
repoUrl: https://github.com/xrlnewman/supplyflow-admin
repositories:
  - name: supplyflow-miniapp
    role: frontend
    description: 采购员与仓库移动工作台，支持询价、到货拍照、验收和异常上报。
    tech: [Vite, TypeScript, Responsive UI]
    url: https://github.com/xrlnewman/supplyflow-miniapp
  - name: supplyflow-admin
    role: admin
    description: 采购后台与 Go Gin API，覆盖申请、供应商、询价、采购单、入库和结算。
    tech: [Vite, Go, Gin, MySQL 8.4, Redis 8]
    url: https://github.com/xrlnewman/supplyflow-admin
screenshots:
  - src: /images/projects/supplyflow-platform/shot-1.png
    alt: SupplyFlow 采购总览
    title: 采购总览
    caption: 采购预算、待审批申请、在途订单和供应商交付率用指标卡与趋势共同呈现。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/supplyflow-platform/shot-2.png
    alt: SupplyFlow 采购申请列表
    title: 申请与比价
    caption: 申请部门、预算、供应商报价和审批节点集中展示，方便采购主管快速决策。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/supplyflow-platform/shot-3.png
    alt: SupplyFlow 移动到货验收
    title: 到货验收
    caption: 仓库人员在现场扫码确认数量、拍照记录并提交异常，采购单实时回写状态。
    viewport: mobile
    width: 390
    height: 844
  - src: /images/projects/supplyflow-platform/shot-4.png
    alt: SupplyFlow 移动采购审批
    title: 移动审批
    caption: 负责人可以在手机上查看报价差异和预算占用，完成审批后自动进入执行阶段。
    viewport: mobile
    width: 390
    height: 844
featured: false
draft: false
---

## 完整闭环

采购申请 → 多供应商询价 → 比价审批 → 采购下单 → 到货验收 → 入库 → 发票结算；重复操作按业务键幂等，节点事件可追溯。

## 仓库关联与免费边界

`supplyflow-miniapp` 提供采购与仓库移动动作，`supplyflow-admin` 提供后台、Go API、MySQL 8.4 和 Redis 8。项目免费公开，供应商、报价和订单均为虚构演示数据。
