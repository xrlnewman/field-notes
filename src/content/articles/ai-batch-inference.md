---
title: AI 批量推理平台：让离线任务可暂停、可重试、可追踪
description: 设计数据分片、任务队列、幂等输出、断点续跑和成本统计，支撑大规模离线生成与分类。
category: AI 应用
publishedAt: 2026-07-18
tags: [批量推理, 数据管道, 任务调度, 成本]
featured: false
draft: false
---

一次性脚本适合验证模型，不适合处理数百万条内容。批量推理平台需要让输入、模型、提示词和输出都可复现，并且在机器中断或供应商限流后继续工作。

## 输入快照和分片

任务创建时固定输入快照、prompt_version、model_version 和输出 Schema。按租户、分区或哈希把输入切成分片，每个分片有 row_count、checksum 和状态，方便重试和对账。

## 幂等输出

输出主键由 task_id、input_id、model_version 和 prompt_version 组成，重复执行使用 upsert 或去重表。失败记录错误类型、重试次数和最后响应摘要，不把坏结果覆盖成功结果。

## 队列与背压

在线服务和批量任务分开队列，按供应商速率、GPU 资源和日预算控制并发。供应商返回限流时使用带抖动的退避，超过重试预算进入人工或延后队列。

## 质量和成本对账

任务结束后校验输入输出数量、缺失率、token、GPU 秒数和总成本。抽样结果进入评测集，异常分片可以单独回滚和重跑，不必重做整个任务。

参考资料：[OpenTelemetry 概念](https://opentelemetry.io/docs/concepts/)。
