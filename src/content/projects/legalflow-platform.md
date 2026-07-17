---
title: LegalFlow 法务案件协同平台
description: 免费开源的委托登记、立案、任务协同、节点提醒、材料归档与结案复盘一体化法务平台，适合企业法务和小型律所。
publishedAt: 2026-07-16T14:40:00-05:00
updatedAt: 2026-07-16T14:40:00-05:00
status: active
category: 法律服务
tech: [Vite, Vue 3, TypeScript, Go 1.25, Gin, MySQL 8.4, Redis 8, Docker Compose]
cover: /images/projects/legalflow-platform/shot-1.png
repoUrl: https://github.com/xrlnewman/legalflow-admin
repositories:
  - name: legalflow-miniapp
    role: frontend
    description: 律师与客户移动端，支持案件进度、待办节点、材料清单和沟通记录。
    tech: [Vite, TypeScript, Responsive UI]
    url: https://github.com/xrlnewman/legalflow-miniapp
  - name: legalflow-admin
    role: admin
    description: 法务后台与 Go Gin API，覆盖客户、案件、任务、材料、账期和结案归档。
    tech: [Vite, Go, Gin, MySQL 8.4, Redis 8]
    url: https://github.com/xrlnewman/legalflow-admin
screenshots:
  - src: /images/projects/legalflow-platform/shot-1.png
    alt: LegalFlow 案件总览
    title: 法务运营总览
    caption: 在办案件、临期节点、待补材料和本月结案用冷静的紫蓝色层次呈现。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/legalflow-platform/shot-2.png
    alt: LegalFlow 案件列表
    title: 案件与任务
    caption: 案件类型、负责人、阶段、下一节点和材料完整度集中展示，方便团队协同。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/legalflow-platform/shot-3.png
    alt: LegalFlow 移动案件进度
    title: 移动案件进度
    caption: 律师和客户可以在移动端查看阶段、待办和沟通记录，重要节点有明确提醒。
    viewport: mobile
    width: 390
    height: 844
  - src: /images/projects/legalflow-platform/shot-4.png
    alt: LegalFlow 移动材料清单
    title: 材料与结案
    caption: 材料清单、节点证明和结案确认按顺序组织，避免遗漏关键步骤。
    viewport: mobile
    width: 390
    height: 844
featured: false
draft: false
---

## 完整闭环

委托登记 → 立案 → 任务拆解 → 材料收集 → 节点提醒 → 客户确认 → 结案归档；案件状态推进和材料变更均写入事件记录。

## 仓库关联与免费边界

`legalflow-miniapp` 服务律师与客户移动协同，`legalflow-admin` 提供法务后台、Go API、MySQL 8.4 与 Redis 8。源码免费公开，案件、客户和材料均为虚构演示数据。
