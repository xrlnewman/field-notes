---
title: AI 语义缓存：降低重复推理成本但不牺牲正确性
description: 设计语义相似阈值、租户隔离、答案新鲜度和缓存失效，让缓存真正适合业务问答。
category: AI 应用
publishedAt: 2026-07-18
tags: [语义缓存, RAG, 缓存, 成本优化]
featured: false
draft: false
---

语义缓存可以复用相似问题的回答，但“相似”不等于“答案可以复用”。价格、库存、权限和时间敏感问题必须先判断可缓存性，再进入向量匹配。

## 缓存键和元数据

缓存记录 query_embedding、normalized_query、answer、citations、model_version、retriever_version、tenant_scope、created_at 和 expires_at。敏感回答默认不跨用户共享，引用权限变化时立即失效。

## 两阶段命中

先用规则过滤不可缓存问题和时间敏感实体，再做向量近邻搜索。相似度达到阈值后还要比较意图、实体、权限和版本；命中返回原始引用并重新校验权限，不直接把全文上下文暴露给新用户。

## 新鲜度策略

文档更新、价格变更、租户权限变更和模型回滚都触发对应缓存版本失效。缓存服务记录命中、误命中、节省 token 和命中延迟，误命中样本自动进入评测集。

## 成本收益验收

不能只看命中率，还要看重复追问率、引用正确率、答案过期率、每请求 token 和缓存存储成本。发现质量下降时先收紧阈值或缩短 TTL，再决定是否关闭某类缓存。

参考资料：[pgvector 官方实现](https://github.com/pgvector/pgvector)。
