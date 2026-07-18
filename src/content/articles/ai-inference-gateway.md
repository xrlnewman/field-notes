---
title: AI 推理网关：用 Kubernetes 原生流量治理承接模型服务
description: 结合模型池、队列、优先级和 Gateway API 推理扩展，解决多模型路由与 GPU 服务发现问题。
category: AI 应用
publishedAt: 2026-07-18
tags: [推理服务, Kubernetes, Gateway API, 模型部署]
featured: false
draft: false
---

模型服务的流量不是普通 HTTP 流量：请求上下文长度不同、生成时间不同、显存状态不同。只用一个 Service 做轮询，容易把长请求集中到同一实例，导致尾延迟和显存抖动。

## 模型池和能力标签

为每个模型池声明模型名、版本、量化方式、上下文上限、GPU 类型和可接受任务。网关根据请求的模型、优先级和最大延迟选择池，不让业务直接感知 Pod 地址。

## 队列感知路由

推理网关读取队列深度、KV cache 占用、首 token 延迟和实例健康状态，选择最合适的池。交互请求与离线任务分队列，优先级高的请求拥有明确的配额，避免无限抢占。

## 发布和回滚

新模型先以影子流量接收请求但不影响响应，比较质量、token、GPU 利用率和 P95。灰度期间按租户逐步放量，路由配置和模型版本可单独回滚。

## 监控服务等级

同时监控 TTFT、TPOT、端到端延迟、排队时间、生成中断率、GPU 利用率和错误分类。模型池扩容成功的标准是尾延迟和积压下降，而不是 Pod 数量增加。

参考资料：[Kubernetes Gateway API Inference Extension](https://kubernetes.io/blog/2025/06/05/introducing-gateway-api-inference-extension/)。
