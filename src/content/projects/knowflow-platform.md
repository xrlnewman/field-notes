---
title: KnowFlow 企业智能知识库
description: 文档全生命周期、RediSearch 混合检索、15 家大模型后台可配的 RAG 问答、知识图谱与 ClickHouse 行为看板一体化的开源企业知识库。
publishedAt: 2026-07-18T12:00:00+08:00
updatedAt: 2026-07-18T20:00:00+08:00
status: active
category: 企业官网
tech: [Go 1.25, Gin, MySQL 8.4, Redis 8, RediSearch, ClickHouse, Vue 3, TypeScript, Element Plus, Docker Compose]
cover: /images/projects/knowflow-platform/shot-8.png
repoUrl: https://github.com/xrlnewman/knowflow
repositories:
  - name: knowflow
    role: backend
    description: Go Gin API 与 Vue 3 前端同仓，覆盖文档生命周期、混合检索、RAG 问答、知识图谱与行为看板全部模块。
    tech: [Go 1.25, Gin, MySQL 8.4, Redis 8, ClickHouse, Vue 3, TypeScript, Element Plus]
    url: https://github.com/xrlnewman/knowflow
screenshots:
  - src: /images/projects/knowflow-platform/shot-8.png
    alt: KnowFlow AI 提供商后台配置页
    title: AI 提供商配置
    caption: 预置 15 家主流大模型（OpenAI/Claude/Gemini/Grok/通义/DeepSeek/Kimi/GLM/豆包/混元/文心/MiniMax/OpenRouter/Ollama），OpenAI 兼容与 Anthropic 原生双协议，后台填 Key 即用；启停、设默认、连通测试与密钥脱敏全在一页。
    viewport: desktop
    width: 1440
    height: 900
  - src: /images/projects/knowflow-platform/shot-7.png
    alt: KnowFlow AI 问答引用来源与模型选择
    title: RAG 智能问答
    caption: 基于混合检索召回的流式问答，答案逐条列出引用文档可回跳原文；右上角提供商→模型二级选择，多轮会话左侧留存。
    viewport: desktop
    width: 1440
    height: 900
  - src: /images/projects/knowflow-platform/shot-6.png
    alt: KnowFlow 全文混合搜索结果
    title: 混合搜索
    caption: RediSearch 同一索引 BM25 全文与向量 KNN 双路召回、RRF 融合排序，命中词高亮、相关度评分、热词榜与语义开关一屏可见。
    viewport: desktop
    width: 1440
    height: 900
  - src: /images/projects/knowflow-platform/shot-9.png
    alt: KnowFlow 知识图谱关联网络
    title: 知识图谱
    caption: MySQL 边表存文档-分类-标签关系，Go BFS 取 N 度子图，从一篇文档 2 跳展开 29 个节点 44 条边，附最短路径查询与边数据浏览。
    viewport: desktop
    width: 1440
    height: 900
  - src: /images/projects/knowflow-platform/shot-10.png
    alt: KnowFlow ClickHouse 行为分析看板
    title: 行为分析看板
    caption: 浏览、搜索、AI 调用逐条写入 ClickHouse 按天分区大表，看板真实聚合行为事件、活跃用户、每日趋势、事件类型与热门文档。
    viewport: desktop
    width: 1440
    height: 900
  - src: /images/projects/knowflow-platform/shot-2.png
    alt: KnowFlow 文档中心列表与生命周期状态
    title: 文档中心
    caption: 草稿、审核、发布、归档状态与版本、可见范围同屏展示，分类树与标签筛选、导入入口，一眼看清每篇文档所处阶段。
    viewport: desktop
    width: 1440
    height: 900
  - src: /images/projects/knowflow-platform/shot-4.png
    alt: KnowFlow 文档详情与版本
    title: 文档详情
    caption: Markdown 正文渲染、状态与标签、发布/更新时间，配版本时间线与评论区，支持导出与在线预览入口。
    viewport: desktop
    width: 1440
    height: 900
  - src: /images/projects/knowflow-platform/shot-3.png
    alt: KnowFlow Markdown 文档编辑器
    title: Markdown 编辑
    caption: 标题、分类、标签、摘要与 Markdown 正文分区录入，底部内置 AI 写作助手（生成摘要/大纲、润色、扩写），存草稿或直接提交审核。
    viewport: desktop
    width: 1440
    height: 900
  - src: /images/projects/knowflow-platform/shot-5.png
    alt: KnowFlow 文档审批中心
    title: 审批中心
    caption: 待审核 / 已通过 / 已驳回分页管理，展示提交人、提交时间与审核意见，审批动作直接落审计并通知文档作者。
    viewport: desktop
    width: 1440
    height: 900
  - src: /images/projects/knowflow-platform/shot-11.png
    alt: KnowFlow 角色与权限管理
    title: RBAC 权限
    caption: 超级管理员 / 编辑 / 审核员 / 访客四类角色，每个写接口独立权限点，可按角色分配到操作按钮级。
    viewport: desktop
    width: 1440
    height: 900
  - src: /images/projects/knowflow-platform/shot-12.png
    alt: KnowFlow 操作审计日志
    title: 操作审计
    caption: 所有写操作留痕——操作人、动作、资源、资源 ID 与时间，行可展开看前后值 JSON，支持按动作与资源检索。
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
