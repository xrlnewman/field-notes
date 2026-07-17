---
title: SupplyFlow 采购供应链平台
description: 采购申请、供应商询价、比价审批、到货验收与结算一体化供应链平台，适合成长型企业规范采购流程。
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
modules:
  - name: 采购申请
    description: 把部门需求拆成可审批的 SKU 行项目和预算。
    features: [SKU 明细, 预算校验, 申请合并]
  - name: 询价比价
    description: 记录多家供应商报价、交期和评分，支持选择理由留痕。
    features: [供应商报价, 价格比较, 交期分析]
  - name: 收货与库存
    description: 从到货验收进入库存批次，并将异常回流给采购负责人。
    features: [收货登记, 质检判定, 批次入库]
roles:
  - name: 申请人
    scope: 创建采购申请并跟踪到货状态
  - name: 采购专员
    scope: 发起询价、比价下单和跟进供应商
  - name: 仓库质检
    scope: 收货、质检、处理不合格和确认入库
workflow:
  - label: 创建采购需求
    status: 草稿
  - label: 供应商询价
    status: 询价中
  - label: 采购审批
    status: 待审批
  - label: 生成采购单
    status: 已下单
  - label: 到货质检
    status: 已质检
  - label: 库存入账
    status: 已入库
metrics:
  - label: 本月采购额
    value: ¥184.7万
    trend: 预算执行 72%
  - label: 待审批申请
    value: '23'
    trend: 今日新增 5 条
  - label: 准时交付率
    value: 91.4%
    trend: 较上季 +4.8%
  - label: 质检合格率
    value: 97.6%
    trend: 本月 1,284 件
integrations: [MySQL 8.4, Redis 8, Docker Compose, CSV 导出]
featured: false
draft: false
---

## 采购流程

采购申请 → 多供应商询价 → 比价审批 → 采购下单 → 到货验收 → 入库 → 发票结算；重复操作按业务键幂等，节点事件可追溯。

## 仓库关联与运行范围

`supplyflow-miniapp` 提供采购与仓库移动动作，`supplyflow-admin` 提供后台、Go API、MySQL 8.4 和 Redis 8。两端共享申请、询价、审批、到货、质检和入库状态；供应商、报价和订单均为虚构演示数据。

## 业务模块

- **需求申请**：业务部门提交物料、数量、期望到货日和预算科目，系统汇总同类需求。
- **询价比价**：采购人员维护供应商报价、交期和付款条件，支持多供应商横向比较。
- **审批下单**：审批通过后生成采购单并锁定关键价格，供应商确认后进入到货计划。
- **收货质检**：仓库扫码收货，记录实收数量、批次和质检结果，不合格品进入异常处理。
- **入库结算**：合格数量写入库存，发票与采购单匹配后进入结算，所有差异可追溯。

## 数据与验收

申请、报价、采购单、收货批次、质检记录和入库流水均带业务编号。验收可完成“申请—询价—审批—下单—收货—质检—入库—结算”，重复收货不会重复增加库存。
