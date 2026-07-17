---
title: CreatorFlow 内容排期与数据平台
description: 免费开源的选题、脚本、制作、审核、发布、评论监控与数据复盘一体化内容团队平台，适合个人创作者和小型工作室。
publishedAt: 2026-07-16T14:35:00-05:00
updatedAt: 2026-07-16T14:35:00-05:00
status: active
category: 内容创作
tech: [Vite, Vue 3, TypeScript, Go 1.25, Gin, MySQL 8.4, Redis 8, Docker Compose]
cover: /images/projects/creatorflow-platform/shot-1.png
repoUrl: https://github.com/xrlnewman/creatorflow-admin
repositories:
  - name: creatorflow-miniapp
    role: frontend
    description: 创作者移动工作台，支持灵感记录、脚本批注、发布提醒和数据查看。
    tech: [Vite, TypeScript, Responsive UI]
    url: https://github.com/xrlnewman/creatorflow-miniapp
  - name: creatorflow-admin
    role: admin
    description: 内容团队后台与 Go Gin API，覆盖选题、排期、审核、渠道、评论和数据复盘。
    tech: [Vite, Go, Gin, MySQL 8.4, Redis 8]
    url: https://github.com/xrlnewman/creatorflow-admin
screenshots:
  - src: /images/projects/creatorflow-platform/shot-1.png
    alt: CreatorFlow 内容总览
    title: 内容运营总览
    caption: 本周发布、待审核选题、渠道表现和互动趋势放在一个可执行的内容看板中。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/creatorflow-platform/shot-2.png
    alt: CreatorFlow 内容排期
    title: 选题与排期
    caption: 内容阶段、负责人、渠道、发布时间和优先级集中呈现，减少临时沟通成本。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/creatorflow-platform/shot-3.png
    alt: CreatorFlow 移动脚本页面
    title: 移动脚本协作
    caption: 创作者可以在拍摄现场查看脚本、记录灵感并提交审核，状态实时同步。
    viewport: mobile
    width: 390
    height: 844
  - src: /images/projects/creatorflow-platform/shot-4.png
    alt: CreatorFlow 移动数据复盘
    title: 发布数据复盘
    caption: 播放、互动、收藏和转化指标按照内容与渠道拆解，帮助下一次选题更有依据。
    viewport: mobile
    width: 390
    height: 844
featured: false
draft: false
---

## 完整闭环

灵感记录 → 选题评审 → 脚本制作 → 审核排期 → 多渠道发布 → 评论互动 → 数据复盘；内容状态和发布动作可幂等重试。

## 仓库关联与免费边界

`creatorflow-miniapp` 面向创作者与编辑，`creatorflow-admin` 提供内容运营、Go API、MySQL 8.4 与 Redis 8。项目免费公开，账号、内容和指标均为虚构演示数据。
