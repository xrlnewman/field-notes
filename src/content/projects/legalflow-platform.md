---
title: LegalFlow 法务案件协同平台
description: 以案件别名为核心的法务案件协同平台，覆盖截止日看板、任务分配、文档 checksum 归档、事件审计与结案摘要。
publishedAt: 2026-07-16T14:40:00-05:00
updatedAt: 2026-07-16T14:40:00-05:00
status: active
category: 法律服务
tech: [Vite, JavaScript, Go 1.25, Gin, MySQL 8.4, Redis 8, Docker Compose]
cover: /images/projects/legalflow-platform/shot-1.png
repoUrl: https://github.com/xrlnewman/legalflow-admin
repositories:
  - name: legalflow-miniapp
    role: frontend
    description: 律师与客户移动端，支持案件进度、负责人任务、文档元数据和结案摘要确认。
    tech: [Vite, JavaScript, Responsive UI]
    url: https://github.com/xrlnewman/legalflow-miniapp
  - name: legalflow-admin
    role: admin
    description: 法务后台与 Go Gin API，提供案件队列、截止日看板、任务分配、文档归档和事件时间线。
    tech: [Vite, JavaScript, Go, Gin, MySQL 8.4, Redis 8]
    url: https://github.com/xrlnewman/legalflow-admin
screenshots:
  - src: /images/projects/legalflow-platform/shot-1.png
    alt: LegalFlow 案件协同截止日看板
    title: 案件协同与截止日看板
    caption: 案件别名、业务类型、优先级、负责人和截止日期集中展示，运营可以快速识别临期案件。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/legalflow-platform/shot-2.png
    alt: LegalFlow 案件详情与事件时间线
    title: 案件详情、任务与时间线
    caption: 负责人任务、已归档文档和真实事件时间线放在一个详情面板，所有写操作可追溯。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/legalflow-platform/shot-3.png
    alt: LegalFlow 移动端案件协同
    title: 移动端案件与负责人任务
    caption: 移动端只展示案件别名和截止日期，负责人可以领取协同任务并查看案件阶段。
    viewport: mobile
    width: 390
    height: 844
  - src: /images/projects/legalflow-platform/shot-4.png
    alt: LegalFlow 移动文档元数据与结案摘要
    title: 文档校验与结案摘要
    caption: 上传只记录名称、类型和 checksum；待结案案件提交结案摘要后才允许进入已结案。
    viewport: mobile
    width: 390
    height: 844
featured: false
draft: false
---

## 案件流程

案件状态固定为「待委托 → 已立案 → 协同中 → 待结案 → 已结案」。新建案件只接收 `subjectAlias`、`caseType`、`priority`、`deadline` 四个字段，拒绝身份证号、姓名、电话等真实客户敏感字段；截止日期必须是可解析日期。负责人分配会生成任务并推进到已立案，运营再推进协同中和待结案；只有待结案案件可以提交结案摘要。

文档归档接口只保存名称、类型与 checksum，不接收文件内容；同一案件重复 checksum 返回原文档并保持幂等。案件创建、分配、状态推进、归档文档与结案都写入按时间排序的事件时间线，便于审计和回放。

## API 与数据边界

- `GET /matters` 支持 `status`、`assignee`、分页筛选；`GET /matters/:id` 返回任务、文档元数据和事件时间线。
- `POST /matters` 创建 alias-only 案件；`POST /matters/:id/assign` 分配负责人；`POST /matters/:id/status` 推进协同状态。
- `POST /matters/:id/file` 归档 `{name,kind,checksum}`；`POST /matters/:id/close` 仅在待结案状态接受 `{result,actor}`。
- 写接口要求 `Idempotency-Key`；生产存储使用 MySQL 8.4，幂等锁与缓存使用 Redis 8，演示模式使用同构内存实现。

## 仓库关联与运行范围

`legalflow-miniapp` 服务律师与客户移动协同，`legalflow-admin` 提供法务后台、Go API、MySQL 8.4 与 Redis 8。两端共享案件状态、负责人任务、文档 checksum 和结案事件；仓库只放 alias-only 虚构演示数据，不接收或存储真实客户敏感信息。
