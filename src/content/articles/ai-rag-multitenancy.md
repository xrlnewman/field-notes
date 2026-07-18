---
title: 多租户 RAG：把权限过滤放在召回之前
description: 设计租户隔离、文档 ACL、向量索引和缓存键，避免相似度检索把别的客户资料带进回答。
category: AI 应用
publishedAt: 2026-07-18
tags: [RAG, 多租户, ACL, 数据隔离]
featured: false
draft: false
---

多租户知识库最严重的事故不是回答不准，而是把 A 客户的合同引用给 B 客户。相似度排序不能替代权限模型，权限必须在检索候选集形成前就生效。

## 权限随文档和切片继承

文档记录 tenant_id、owner、部门、密级和 ACL，切片、向量、关键词索引和缓存都继承同一组权限版本。权限变更产生新的 acl_version，旧缓存立即失效。

## 两种过滤策略

小规模租户可以在数据库查询条件中先过滤 tenant_id 和可见资源，再做向量排序；大规模场景可以按租户或安全域分区索引。无论哪种方式，都要验证 SQL、向量和全文检索的过滤条件一致。

## 缓存键不能省略租户

语义缓存键至少包含 tenant_id、user_scope、query_hash、retriever_version 和 acl_version。共享热门问题也只能共享模型计算结果，不能共享带有客户资料的上下文和引用。

## 用攻击样本验收

准备跨租户诱导、权限刚撤销、用户换部门和文档复制等样本，检查召回列表和最终引用。审计记录保存检索策略、权限版本和返回文档 ID，发生泄露时可以快速追踪。

参考资料：[NIST 生成式 AI 风险画像](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf)。
