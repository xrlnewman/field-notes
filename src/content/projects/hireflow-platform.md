---
title: HireFlow 招聘协同平台
description: 招聘协同工作台，把职位、候选人、面试反馈、Offer 与入职确认串成一条可追踪的人才流程。
publishedAt: 2026-07-16T13:00:00-05:00
updatedAt: 2026-07-16T13:00:00-05:00
status: active
category: 人力资源
tech: [uni-app, Vue 3, TypeScript, Go 1.25, Gin, MySQL 8.4, Redis 8, Docker Compose]
cover: /images/projects/hireflow-platform/shot-1.png
repoUrl: https://github.com/xrlnewman/hireflow-admin
repositories:
  - name: hireflow-miniapp
    role: frontend
    description: 招聘移动工作台，查看候选人、推进筛选、提交面试反馈并确认 Offer。
    tech: [uni-app, Vue 3, TypeScript]
    url: https://github.com/xrlnewman/hireflow-miniapp
  - name: hireflow-admin
    role: admin
    description: 招聘后台与 Go Gin API，提供职位、候选人、面试、Offer 和入职状态管理。
    tech: [Vite, Go, Gin, MySQL 8.4, Redis 8]
    url: https://github.com/xrlnewman/hireflow-admin
screenshots:
  - src: /images/projects/hireflow-platform/shot-1.png
    alt: HireFlow 招聘运营总览
    title: 招聘运营总览
    caption: 以招聘漏斗、入职数与待办提醒为主视觉，紫色强调人才阶段，数据密度适合日常运营。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/hireflow-platform/shot-2.png
    alt: HireFlow 招聘后台数据页
    title: 候选人协同
    caption: 职位、候选人、面试反馈和 Offer 节点集中管理，状态动作有清晰的主次层级。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/hireflow-platform/shot-3.png
    alt: HireFlow 招聘移动端首页
    title: 移动招聘工作台
    caption: 移动端首屏突出今日面试与待处理候选人，适合招聘人员在路上快速推进流程。
    viewport: mobile
    width: 390
    height: 844
  - src: /images/projects/hireflow-platform/shot-4.png
    alt: HireFlow 招聘移动端列表
    title: 候选人列表
    caption: 通过轻量卡片与标签呈现候选人状态，避免在小屏中出现表格拥挤。
    viewport: mobile
    width: 390
    height: 844
featured: false
draft: false
---

## 产品定位

HireFlow 面向中小企业和招聘团队，重点解决“候选人多、反馈散、Offer 容易漏跟”的高频问题。

## 招聘流程

发布职位 → 收集候选人 → 筛选 → 面试反馈 → 发放 Offer → 确认入职；每次写操作都带幂等键并留下审计事件。

## 两个仓库如何关联

`hireflow-miniapp` 是招聘人员移动端，`hireflow-admin` 提供后台、Go Gin API、MySQL 8.4 与 Redis 8 Compose。未配置 API 时仍可使用虚构数据预览。

## 运行范围

源码公开、可自部署；演示数据不包含真实简历、身份证或第三方招聘平台账号。

## 业务模块

- **职位与渠道**：创建职位、岗位要求、招聘人数和渠道预算，发布后记录来源转化。
- **候选人池**：按阶段、负责人和标签筛选候选人，保留简历摘要、沟通记录和面试安排。
- **面试与 Offer**：面试官填写结构化反馈，招聘人员汇总评分后发起 Offer，候选人确认或拒绝都会留下原因。
- **入职复盘**：入职后转为员工待办，统计各渠道到面率、Offer 接受率和平均招聘周期。

## 数据与验收

职位、候选人、面试、反馈、Offer 和入职任务通过候选人编号关联。验收流程为“发布职位—录入候选人—安排面试—提交反馈—发 Offer—确认入职”，每个阶段都有负责人和下一步提醒。
