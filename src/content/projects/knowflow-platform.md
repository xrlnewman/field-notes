---
title: KnowFlow 企业智能知识库
description: 文档全生命周期、RediSearch 混合检索、15 家大模型后台可配的 RAG 问答、知识图谱与 ClickHouse 行为看板一体化的开源企业知识库。
publishedAt: 2026-07-18T12:00:00+08:00
updatedAt: 2026-07-18T20:00:00+08:00
status: active
category: 企业官网
tech: [Go 1.25, Gin, MySQL 8.4, Redis 8, RediSearch, ClickHouse, Vue 3, TypeScript, Element Plus, Docker Compose]
cover: /images/projects/knowflow-platform/shot-5.png
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
  - src: /images/projects/knowflow-platform/shot-4.png
    alt: KnowFlow 行为数据看板
    title: 数据看板
    caption: 浏览、搜索、AI 调用流水写入 ClickHouse 按天分区大表，聚合下推后展示趋势、热词与活跃文档排行。
    viewport: desktop
    width: 1440
    height: 900
  - src: /images/projects/knowflow-platform/shot-5.png
    alt: KnowFlow AI 提供商后台配置页
    title: AI 提供商配置
    caption: 预置 15 家主流大模型，OpenAI 兼容与 Anthropic 原生双协议，后台填 Key 即用；启停、设默认、连通测试与密钥脱敏全在一页完成。
    viewport: desktop
    width: 1440
    height: 900
  - src: /images/projects/knowflow-platform/shot-6.png
    alt: KnowFlow ClickHouse 行为分析看板真数据
    title: 行为分析看板
    caption: ClickHouse 真实聚合：行为事件、活跃用户、每日趋势、事件类型与热门文档排行，写入走批量缓冲不阻塞业务。
    viewport: desktop
    width: 1440
    height: 900
  - src: /images/projects/knowflow-platform/shot-7.png
    alt: KnowFlow AI 问答引用来源与模型选择
    title: 问答引用溯源
    caption: RAG 回答逐条列出引用文档并可回跳原文，右上角提供商→模型二级选择，会话记录带模型徽标。
    viewport: desktop
    width: 1440
    height: 900
featured: true
draft: false
---

## 最新更新 · M5：15 家大模型后台可配 + ClickHouse 真接入

这一版把"接哪家大模型"从改代码/改环境变量，彻底变成后台一个页面的事：

- **15 家主流大模型开箱预置**：OpenAI、Claude、Gemini、Grok、通义千问、DeepSeek、Kimi、智谱 GLM、豆包、腾讯混元、百度文心、MiniMax、OpenRouter、Ollama 本地，外加免 Key 的演示 Mock。运营在「系统管理 → AI 提供商」填 Key、点启用，问答与写作立刻切换，**无需重启、无需发版**。
- **两种协议全覆盖**：Claude 走 Anthropic 原生、其余 13 家走 OpenAI 兼容，统一到一个 ChatClient 工厂；再多一家新模型基本只加一行配置。
- **密钥安全 + 连通测试**：API Key 只存数据库，列表 / 详情 / 审计日志一律脱敏为 `前4****后4`；每行"连通测试"按钮真实发起一次对话请求，回报耗时与上游原始错误，填错 Key 一眼可辨。
- **ClickHouse 真实接入**：浏览、搜索、AI 调用（带 provider 与耗时）逐条进按天分区大表，行为看板从占位切换为真实聚合，写入走批量缓冲、失败只降级看板绝不阻塞业务。

> 详细的设计取舍见文章：《把 15 家大模型做成后台可配置：一个 ChatClient 接口的两种方言》。

## 功能亮点

- **AI 提供商后台配置（M5）**：15 家大模型预置，填 Key 即用、启停、设默认、连通测试、密钥脱敏，OpenAI 兼容与 Anthropic 原生双协议统一到一个 ChatClient 工厂。
- **文档全生命周期**：草稿、审核、发布、归档、版本对比与审批流，全程操作留痕，发布即可被检索。
- **混合检索**：RediSearch 同一索引跑 BM25 全文与 HNSW 向量（1024 维）双路召回，Go 应用层 RRF 融合排序；FT.SUGGET 前缀联想，ZSET 热词榜。
- **RAG 问答**：召回片段带权限过滤进入上下文，答案附引用来源可回跳原文，会话与消息记录使用的提供商与模型。
- **AI 提供商后台配置**：预置 OpenAI / Claude / Gemini / Grok / 通义千问 / DeepSeek / Kimi / 智谱 GLM / 豆包 / 混元 / 文心 / MiniMax / OpenRouter / Ollama 共 15 家（含演示 Mock），后台填 Key 即用无需重启；OpenAI 兼容与 Anthropic 原生双协议统一到一个 ChatClient 工厂，密钥全链路脱敏，连通测试真发请求回报耗时与上游错误。
- **知识图谱**：MySQL 边表保存文档关系，Go BFS 取子图，前端以节点网络与边列表探索关联关系。
- **行为看板**：浏览、搜索、AI 调用流水进 ClickHouse 大表，按月分区；看板聚合全部下推，ClickHouse 不承载业务事实。

## 架构简述

模块化单体而非微服务：internal/app 按领域分包（document / search / rag / graph / analytics），依赖方向固定 transport → app → platform，不允许反向。数据分三层——MySQL 是唯一事实源，RediSearch 索引可随时全量重灌；Redis 8 承担缓存、Session、检索与热词等实时热数据；ClickHouse 专收行为流水与看板聚合。文档索引与向量化通过 Redis Stream 消费，分析写入失败只降级看板，不阻断业务。docker compose 一键拉起全部依赖。
