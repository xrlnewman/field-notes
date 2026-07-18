---
title: KnowFlow 企业智能知识库
description: 文档全生命周期、RediSearch 混合检索、可切换大模型的 RAG 问答、知识图谱与 ClickHouse 行为看板一体化的开源企业知识库。
publishedAt: 2026-07-18T12:00:00+08:00
updatedAt: 2026-07-18T12:00:00+08:00
status: active
category: 企业官网
tech: [Go 1.25, Gin, MySQL 8.4, Redis 8, RediSearch, ClickHouse, Vue 3, TypeScript, Element Plus, Docker Compose]
cover: /images/projects/knowflow-platform/shot-1.png
repoUrl: https://github.com/xrlnewman/knowflow
repositories:
  - name: knowflow
    role: backend
    description: Go Gin API 与 Vue 3 前端同仓，覆盖文档生命周期、混合检索、RAG 问答、知识图谱与行为看板全部模块。
    tech: [Go 1.25, Gin, MySQL 8.4, Redis 8, ClickHouse, Vue 3, TypeScript, Element Plus]
    url: https://github.com/xrlnewman/knowflow
screenshots:
  - src: /images/projects/knowflow-platform/shot-1.png
    alt: KnowFlow 文档中心列表与生命周期状态
    title: 文档中心
    caption: 草稿、审核、发布、归档状态与版本入口同屏展示，审批动作紧邻状态标签，一眼看清每篇文档所处阶段。
    viewport: desktop
    width: 1440
    height: 900
  - src: /images/projects/knowflow-platform/shot-2.png
    alt: KnowFlow 混合搜索结果页
    title: 混合搜索
    caption: BM25 全文与向量召回经 RRF 融合统一排序，左侧标签过滤，输入框实时联想，热词榜引导高频查询。
    viewport: desktop
    width: 1440
    height: 900
  - src: /images/projects/knowflow-platform/shot-3.png
    alt: KnowFlow AI 问答界面与引用来源
    title: AI 问答
    caption: 基于混合检索召回的 RAG 问答，答案附引用文档可跳转原文，通义千问与 DeepSeek 可在会话内切换。
    viewport: desktop
    width: 1440
    height: 900
  - src: /images/projects/knowflow-platform/shot-4.png
    alt: KnowFlow 行为数据看板
    title: 数据看板
    caption: 浏览、搜索、AI 调用流水写入 ClickHouse 按天分区大表，聚合下推后展示趋势、热词与活跃文档排行。
    viewport: desktop
    width: 1440
    height: 900
featured: true
draft: false
---

## 功能亮点

- **文档全生命周期**：草稿、审核、发布、归档、版本对比与审批流，全程操作留痕，发布即可被检索。
- **混合检索**：RediSearch 同一索引跑 BM25 全文与 HNSW 向量（1024 维）双路召回，Go 应用层 RRF 融合排序；FT.SUGGET 前缀联想，ZSET 热词榜。
- **RAG 问答**：召回片段带权限过滤进入上下文，通义千问 / DeepSeek 模型可切换，答案附引用来源可回跳原文。
- **知识图谱**：MySQL 边表保存文档关系，Go BFS 取子图，前端以节点网络与边列表探索关联关系。
- **行为看板**：浏览、搜索、AI 调用流水进 ClickHouse 大表，按月分区；看板聚合全部下推，ClickHouse 不承载业务事实。

## 架构简述

模块化单体而非微服务：internal/app 按领域分包（document / search / rag / graph / analytics），依赖方向固定 transport → app → platform，不允许反向。数据分三层——MySQL 是唯一事实源，RediSearch 索引可随时全量重灌；Redis 8 承担缓存、Session、检索与热词等实时热数据；ClickHouse 专收行为流水与看板聚合。文档索引与向量化通过 Redis Stream 消费，分析写入失败只降级看板，不阻断业务。docker compose 一键拉起全部依赖。
