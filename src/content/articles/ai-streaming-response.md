---
title: AI 流式响应：从首 token 到可取消的产品体验
description: 设计 SSE 流、增量事件、断线重连、取消和最终一致性，避免用户看到半截答案却无法判断状态。
category: AI 应用
publishedAt: 2026-07-18
tags: [流式响应, SSE, 交互, 实时系统]
featured: false
draft: false
---

流式输出让用户更快看到结果，但也带来断线、重复、半截 Markdown、工具调用中间态和取消竞态。协议层要把“正在生成”和“已完成”区分开。

## 事件模型

事件至少包含 run_id、sequence、type、delta、usage 和 finish_reason。文本、引用、工具状态和错误使用不同 type，客户端按 sequence 去重，不能用字符串拼接猜测是否结束。

## 连接和重连

客户端保存最后 sequence，断线后携带 run_id 和 last_event_id 请求补发。服务端只保留有限时间的事件缓存，过期时返回快照或要求重新执行。连接超时不等于任务失败，任务状态仍以服务端为准。

## 取消和超时

取消请求写入任务状态并向模型、工具和检索器传播取消信号。已经完成的副作用必须靠幂等键保护，取消后的迟到事件被客户端丢弃。系统设置总超时、单步超时和空闲超时。

## 终态对账

流结束后返回一条 final 事件，包含结果摘要、引用、usage 和持久化状态。客户端在收到 final 前显示生成中，收到 error 时提供重试入口而不是把半截文本当成成功。

参考资料：[W3C WebTransport 规范](https://www.w3.org/TR/webtransport/)。
