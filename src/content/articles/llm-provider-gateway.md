---
title: 把 15 家大模型做成后台可配置：一个 ChatClient 接口的两种方言
description: 多模型网关的设计——OpenAI 兼容与 Anthropic 原生双协议的抽象、数据库里的密钥脱敏，以及一个"真发请求"的连通测试。
category: AI 应用
publishedAt: 2026-07-18
tags: [AI网关, 多模型, LLM, Go, 密钥安全]
featured: true
draft: false
---

一个 RAG 应用最初往往只接一两家模型，配置写在环境变量里。想换模型要改 env 重启服务，想加一家要发版——这对需要频繁试模型的产品来说太重了。把"接哪家大模型"从代码里搬到后台配置，运营填 Key、点启用即可切换，是一件投入不大、收益很直接的事。这篇讲怎么用一个接口、两种协议把主流大模型统一进来。

## 两种方言就够了

接十几家听起来要写十几个客户端，实际只要两个。国内外主流厂商几乎都提供 OpenAI 兼容端点：通义的 dashscope compatible-mode、DeepSeek、Kimi、GLM、豆包方舟、混元、千帆、MiniMax、Grok、Gemini 的 openai 路径、OpenRouter、Ollama——同一套 `/chat/completions` 请求体加 Bearer 鉴权，差异只在 base_url 和模型名。唯一的例外是 Anthropic：原生 Messages API 用 `x-api-key` 加 `anthropic-version` 头，system 提示词是独立字段，SSE 事件结构也不同。

所以配置表里只存一个 `dialect` 字段（openai | anthropic），工厂函数按它挑实现：

~~~text
ai_providers(provider_key, dialect, base_url, api_key,
             default_model, models_json, enabled, is_default, ...)

ClientFactory(dialect, baseURL, key, timeout) -> ChatClient
~~~

两个实现都落在同一个 `ChatClient` 接口上（非流式 + SSE 流式），上层的 RAG 与写作链路不感知任何厂商差异。以后再冒出一家新模型，大概率是 OpenAI 兼容——加一行配置就接完了，一行业务代码都不用写。

## 配置进数据库，密钥必须脱敏

密钥从环境变量搬进数据库，换来的是"填 Key 即用、无需重启"，代价是必须把泄露面管住。三个出口全部脱敏：列表与详情接口回显 `前4****后4`；审计日志记录变更前后值时同样打码；应用日志从不输出 Key 字段。编辑接口约定"apiKey 传空 = 不修改"，前端密码框留空提交就不会覆盖已有密钥——这个小约定省掉了"回显明文再存回去"的老问题。

## 连通测试要真发请求

配置页每行都该有个"连通测试"按钮。它不是检查表单格式，而是用该行配置真实发起一条最小对话请求，设一个 10 秒超时，返回耗时和上游原始错误。测过一个反例：给某家填了假 Key，测试按钮 227ms 后返回上游的 401 原文——这才叫连通测试。填完 Key 点一下，绿了再启用，运营不需要任何抓包知识就能区分"Key 错了"还是"网络不通"。

## 留一个免 Key 的兜底

演示环境或本地开发没有任何真实 Key 也要能跑通整条链路，所以值得留一个 Mock 提供商：它不是测试代码里的桩，而是正经的一行配置，默认启用、默认全局兜底，走同一个工厂、同一个接口。这样检索、融合、引用都是真的，只有生成是回显式的，换真模型时后台点两下即可退位。

配套的行为分析也顺势受益：把 AI 调用带着 provider 与耗时写进按天分区的大表，看板就能直接回答"这周谁在用哪家模型、平均多慢"。

参考资料：[Anthropic Messages API 文档](https://docs.anthropic.com/en/api/messages)。
