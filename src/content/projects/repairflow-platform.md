---
title: RepairFlow 售后维修协同平台
description: 报修、诊断、报价、派工、维修验收和回访一体化售后服务平台，适合设备与家电服务团队。
publishedAt: 2026-07-16T14:05:00-05:00
updatedAt: 2026-07-16T14:05:00-05:00
status: active
category: 售后服务
tech: [Vite, Vue 3, TypeScript, Go 1.25, Gin, MySQL 8.4, Redis 8, Docker Compose]
cover: /images/projects/repairflow-platform/shot-1.png
repoUrl: https://github.com/xrlnewman/repairflow-admin
repositories:
  - name: repairflow-miniapp
    role: frontend
    description: 客户与维修师傅移动端，支持报修描述、报价确认、上门签到和验收回访。
    tech: [Vite, TypeScript, Responsive UI]
    url: https://github.com/xrlnewman/repairflow-miniapp
  - name: repairflow-admin
    role: admin
    description: 售后后台与 Go Gin API，覆盖工单、客户、配件、师傅、SLA 和服务评价。
    tech: [Vite, Go, Gin, MySQL 8.4, Redis 8]
    url: https://github.com/xrlnewman/repairflow-admin
screenshots:
  - src: /images/projects/repairflow-platform/shot-1.png
    alt: RepairFlow 售后总览
    title: 售后服务总览
    caption: 服务请求、按时完成率、待报价工单和客户满意度形成一张运营脉搏图。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/repairflow-platform/shot-2.png
    alt: RepairFlow 维修工单列表
    title: 工单与派工
    caption: 故障类型、优先级、服务工程师和 SLA 同屏展示，调度动作清晰可追踪。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/repairflow-platform/shot-3.png
    alt: RepairFlow 移动报修页面
    title: 移动报修
    caption: 客户提交问题、上传描述并确认报价，整个售后过程不需要跳出产品。
    viewport: mobile
    width: 390
    height: 844
  - src: /images/projects/repairflow-platform/shot-4.png
    alt: RepairFlow 移动维修验收
    title: 维修验收与回访
    caption: 师傅提交维修结果后，客户直接验收并评分，服务数据回流到团队分析。
    viewport: mobile
    width: 390
    height: 844
modules:
  - name: 工单中心
    description: 汇总报修、设备信息、服务地址和 SLA 倒计时。
    features: [故障描述, 图片附件, SLA 预警]
  - name: 派工与报价
    description: 让调度员分派技师，并在上门前完成透明报价。
    features: [技师排班, 路线 ETA, 配件报价]
  - name: 验收与保修
    description: 记录客户验收、支付结果和后续保修责任。
    features: [服务报告, 客户签字, 保修登记]
roles:
  - name: 客户
    scope: 发起报修、确认报价和完成服务评价
  - name: 调度员
    scope: 分派技师、调整时段和处理超时工单
  - name: 技师
    scope: 接单上门、记录维修过程和提交服务报告
workflow:
  - label: 发起报修
    status: 待受理
  - label: 远程诊断
    status: 已诊断
  - label: 客户确认报价
    status: 待派工
  - label: 技师上门
    status: 上门中
  - label: 客户验收
    status: 待验收
  - label: 保修归档
    status: 已结案
metrics:
  - label: 今日工单
    value: '128'
    trend: 较昨日 +9.2%
  - label: SLA 达成率
    value: 94.6%
    trend: 本周 +3.4%
  - label: 平均响应
    value: 18分钟
    trend: 较上月 -6分钟
  - label: 客户好评率
    value: 98.1%
    trend: 最近 30 天
integrations: [MySQL 8.4, Redis 8, Docker Compose, 图片附件]
featured: false
draft: false
---

## 售后流程

客户报修 → 客服诊断 → 报价确认 → 派工上门 → 维修记录 → 客户验收 → 回访评价；配件与人工费用全部保留可审计节点。

## 仓库关联与运行范围

`repairflow-miniapp` 面向客户和一线师傅，`repairflow-admin` 负责售后运营、Go API、MySQL 8.4 与 Redis 8。两端共享诊断、报价、派工、验收和质保状态；设备、工单和费用均为虚构演示数据。

## 业务模块

- **报修受理**：客户选择设备、故障类型和上门时间，客服可以补充远程诊断结果与照片。
- **报价与派工**：系统按配件、工时和服务区域生成报价，客户确认后进入技师派工池。
- **维修过程**：技师接单、签到、记录检测和更换配件，支持追加报价并再次请求客户确认。
- **验收与质保**：客户验收后生成服务报告和质保期限，重复故障可关联原工单进入优先队列。

## 数据与验收

工单、设备、报价、配件、服务报告和质保记录使用同一业务编号。验收可从客户端创建报修，到后台派工、移动端提交维修记录，再到客户验收和回访评价。
