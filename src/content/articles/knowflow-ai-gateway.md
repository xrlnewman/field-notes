---
title: 把 15 家大模型做成后台可配置：一个 ChatClient 接口的两种方言
description: KnowFlow M5 实录：OpenAI 兼容与 Anthropic 原生双协议的抽象、数据库里的密钥脱敏，以及一个"真发请求"的连通测试。
category: AI 应用
publishedAt: 2026-07-18
tags: [AI网关, 多模型, Go, RAG, KnowFlow]
featured: false
draft: false
---

KnowFlow 的 RAG 问答最初只接了两家模型，配置写在环境变量里。想换模型要改 env 重启服务，想加一家要发版——这对一个"知识库产品"来说太重了。M5 把这件事做成了后台配置：预置 15 家提供商（OpenAI、Claude、Gemini、Grok、通义千问、DeepSeek、Kimi、智谱 GLM、豆包、混元、文心、MiniMax、OpenRouter、Ollama 本地，外加一个演示 Mock），运营在管理页填 Key、点启用，问答立刻切换，全程不碰服务器。

## 两种方言就够了

接 15 家听起来要写 15 个客户端，实际只要两个。国内外主流厂商几乎都提供 OpenAI 兼容端点：通义的 dashscope compatible-mode、DeepSeek、Kimi、GLM、豆包方舟、混元、千帆、MiniMax、Grok、Gemini 的 openai 路径、OpenRouter、Ollama——同一套 `/chat/completions` 请求体加 Bearer 鉴权，差异只在 base_url 和模型名。唯一的例外是 Anthropic：原生 Messages API 用 `x-api-key` 加 `anthropic-version` 头，system 提示词是独立字段，SSE 事件结构也不同。

所以数据表里只存一个 `dialect` 字段（openai | anthropic），工厂函数按它挑实现：

~~~text
kb_ai_providers(provider_key, dialect, base_url, api_key,
                default_model, models_json, enabled, is_default, ...)

ClientFactory(dialect, baseURL, key, timeout) -> ChatClient
~~~

两个实现都落在同一个 `ChatClient` 接口上（非流式 + SSE 流式），RAG 链路不感知任何厂商差异。以后再冒出一家新模型，大概率是 OpenAI 兼容——加一行种子数据就接完了，一行 Go 都不用写。

## 配置进数据库，密钥必须脱敏

密钥从环境变量搬进数据库，换来的是"填 Key 即用、无需重启"，代价是必须把泄露面管住。三个出口全部脱敏：列表与详情接口回显 `前4****后4`；审计日志记录变更前后值时同样打码；应用日志从不输出 Key 字段。编辑接口约定"apiKey 传空 = 不修改"，前端密码框留空提交就不会覆盖已有密钥——这个小约定省掉了"回显明文再存回去"的老问题。

## 连通测试要真发请求

配置页每行有个"连通测试"按钮。它不是检查表单格式，而是用该行配置真实发起一条最小对话请求，10 秒超时，返回耗时和上游原始错误。验收时我们故意给通义填了一个假 Key：测试按钮 227ms 后返回上游的 401 原文——这才叫连通测试。填完 Key 点一下，绿了再启用，运营不需要任何抓包知识就能定位"Key 错了"还是"网络不通"。

## Mock 是第 15 家提供商

演示环境没有任何真实 Key 也要能跑通整条链路，所以 Mock 不是测试代码里的桩，而是正经的一行提供商配置：默认启用、默认全局兜底，走同一个工厂、同一个接口。种子数据灌完，RAG 问答开箱即答（检索、融合、引用都是真的，只有生成是回显式的）。想换真模型，后台点两下，Mock 退位。

配套的 ClickHouse 行为看板也在 M5 接了真数据：AI 调用带着 provider 与耗时进按天分区的大表，看板能直接回答"这周谁在用哪家模型、平均多慢"。代码在 GitHub：[github.com/xrlnewman/knowflow](https://github.com/xrlnewman/knowflow)。

参考资料：[Anthropic Messages API 文档](https://docs.anthropic.com/en/api/messages)。
