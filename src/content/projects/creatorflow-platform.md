---
title: CreatorFlow 内容排期与数据平台
description: 内容团队从选题、脚本、制作、审核、发布到数据复盘的协同工作台，按负责人和渠道拆解每一次内容交付。
publishedAt: 2026-07-16T14:35:00-05:00
updatedAt: 2026-07-16T14:35:00-05:00
status: active
category: 内容创作
tech: [Vite, JavaScript, Go 1.25, Gin, MySQL 8.4, Redis 8, Docker Compose]
cover: /images/projects/creatorflow-platform/shot-1.png
repoUrl: https://github.com/xrlnewman/creatorflow-admin
repositories:
  - name: creatorflow-miniapp
    role: frontend
    description: 创作者移动工作台，支持选题创建、脚本编辑、审核提交、发布确认和指标复盘。
    tech: [Vite, JavaScript, Responsive UI]
    url: https://github.com/xrlnewman/creatorflow-miniapp
  - name: creatorflow-admin
    role: admin
    description: 内容团队后台与 Go Gin API，提供 Kanban 排期、审核队列、发布确认、指标时间线和负责人筛选。
    tech: [Vite, JavaScript, Go, Gin, MySQL 8.4, Redis 8]
    url: https://github.com/xrlnewman/creatorflow-admin
screenshots:
  - src: /images/projects/creatorflow-platform/shot-1.png
    alt: CreatorFlow 内容总览
    title: 内容流水线 Kanban
    caption: 六列状态看板按渠道、负责人和计划时间聚合内容，选中卡片即可打开脚本、发布与指标详情。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/creatorflow-platform/shot-2.png
    alt: CreatorFlow 内容排期
    title: 发布确认与活动时间线
    caption: 待审核内容在后台填写发布时间和审核人，发布动作与脚本、审核事件按时间顺序留痕。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/creatorflow-platform/shot-3.png
    alt: CreatorFlow 移动脚本页面
    title: 移动端脚本编辑
    caption: 移动端选中制作中内容后可编辑脚本、保存草稿并提交审核，事件时间线同步展示每次推进。
    viewport: mobile
    width: 390
    height: 844
  - src: /images/projects/creatorflow-platform/shot-4.png
    alt: CreatorFlow 移动数据复盘
    title: 移动端指标卡与复盘
    caption: 发布后录入阅读、点赞、评论和分享数据，内容状态进入已复盘并保留完整操作时间线。
    viewport: mobile
    width: 390
    height: 844
featured: false
draft: false
---

## 内容流程

CreatorFlow 的主状态固定为：`待选题 → 写作中 → 制作中 → 待审核 → 已发布 → 已复盘`。选题创建后由负责人填写脚本，第二次保存脚本进入制作中；制作完成提交审核，主编确认发布时间后发布，运营再记录阅读量、点赞、评论和分享完成复盘。每次推进都写入 `actor`、动作、前后状态和时间，重复写操作通过 `Idempotency-Key` 返回首次结果，不重复追加事件。

## API 与模块边界

- 查询：`GET /api/v1/content-items`（支持 `status`、`owner`、`plannedAt`、`publishedAt`、分页）、`GET /api/v1/content-items/:id`、`GET /api/v1/content-items/:id/events`。
- 选题与脚本：`POST /api/v1/content-items`（标题、渠道、负责人必填）、`POST /api/v1/content-items/:id/script`（保存脚本并推进写作/制作）。
- 审核与发布：`POST /api/v1/content-items/:id/submit-review`（审核人）、`POST /api/v1/content-items/:id/publish`（发布时间、发布人）。
- 复盘：`POST /api/v1/content-items/:id/metrics`（views、likes、comments、shares 均不可为负）。

后台 Kanban 负责按状态查看和筛选内容，详情页提供脚本、发布确认、指标卡和事件时间线；移动端提供高频的创建、编辑、提交审核、发布和复盘动作。MySQL 8.4 保存主实体、脚本、发布记录、指标和事件，Redis 8 负责写操作幂等键与短锁；未配置外部依赖时使用内存演示数据。

## 仓库关联与运行范围

`creatorflow-miniapp` 面向创作者与编辑，`creatorflow-admin` 提供内容运营、Go Gin API、MySQL 8.4 与 Redis 8。两端共享选题、脚本、审核、发布和数据复盘状态；账号、内容、发布记录和指标均为虚构演示数据。可在对应仓库本地启动 Go API 与 Vite 页面，博客只展示源码边界和可复现的本地流程，不提供公网 API。
