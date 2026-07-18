---
title: 十万级文档的知识库，为什么用 RediSearch 而不是 Elasticsearch
description: 知识库场景下用 RediSearch 替代 Elasticsearch 的五条理由，以及它扛不住的边界。
category: AI 应用
publishedAt: 2026-07-18
tags: [RediSearch, 知识库, RAG, Go, 混合检索]
featured: true
draft: false
---

企业知识库的检索层，第一反应往往是 Elasticsearch。但在文档量级只有万到十万篇、技术栈里本就有 Redis 8 的场景下，直接用 Redis 8 内置的 Query Engine（RediSearch）反而是更划算的选择。这篇把不上 ES 的五条理由，以及 RediSearch 扛不住的边界，一次讲清。

## 为什么不用 Elasticsearch

第一，栈里本来就有 Redis 8。缓存、Session、热数据已经离不开它，而 Redis 8 把 Query Engine 收进了默认发行版，检索能力等于白捡；不引入 ES，就省掉一整套吃内存的 JVM 集群，以及随之而来的版本升级、分片规划和快照运维。

第二，规模要匹配。企业知识库的文档量级是万到十万篇，ES 的强项在 PB 级日志、亿级商品这种规模。把它压到十万篇文档上，付出的是全额的运维复杂度，换不回对应的收益。选型先看规模匹配，再看功能清单。

第三，写入可见性。RediSearch 随写同步建索引，HSET 返回时文档已经可以被搜到；ES 是 near-real-time，默认 refresh 间隔约 1 秒。对"点了发布，马上回到列表页搜自己刚发的文档"这种知识库的基本体验，同步索引更贴。何况知识库的写入频率本来就低，一天几百次编辑，同步建索引的写放大可以忽略。

第四，一个引擎闭环。全文（TEXT，BM25 打分，配中文分词）、向量（VECTOR，HNSW，1024 维）、标签过滤（TAG）在同一个索引、同一条查询里完成。RAG 召回不需要跨两个系统各查一遍再对齐权限和分页，链路短一截，故障面也小一截。建索引和查询大概长这样：

~~~text
FT.CREATE idx:doc ON HASH PREFIX 1 doc:
  SCHEMA title TEXT WEIGHT 5 content TEXT
         tags TAG SEPARATOR ","
         embedding VECTOR HNSW 6 TYPE FLOAT32
                   DIM 1024 DISTANCE_METRIC COSINE

FT.SEARCH idx:doc "@tags:{published} 索引 迁移" LIMIT 0 10
~~~

第五，延迟。索引驻内存，单次查询通常是毫秒级。普通列表页感知不明显，但搜索联想是每敲一个字发一次请求的高频小查询，几毫秒和几十毫秒的差距会被输入速度放大成"跟手"与"卡顿"的体感差。

边界也要说清楚：索引全部驻内存，亿级文档、TB 级语料的内存账算不过来，那个规模仍然该用 ES/OpenSearch；复杂聚合 DSL 和 Kibana 生态，RediSearch 也没有对应物。所以结论是"十万级文档的知识库场景，RediSearch 是更优解"，不是"RediSearch 全面取代 ES"。

## 混合检索与 RRF 怎么落地

同一个索引跑两路召回：BM25 全文一路，向量 KNN 一路，各取前 50。两路都在召回前用 TAG 条件过滤掉未发布和无权限的文档，而不是召回后再剔除——过滤在前，排名和分页才是准的。融合不调权重玄学，用 RRF（倒数排名融合）：每路里排名 r 的文档记 1/(k+r) 分（k 取 60），两路分数加权求和后重排，取前 10 进 RAG 上下文。RRF 只看排名不看原始分，天然回避了 BM25 分数与余弦相似度量纲对不齐的问题，应用层三十行就能写完。

联想词用 FT.SUGADD 在文档发布时喂标题短语，输入框每次击键 FT.SUGGET 做前缀匹配；热词榜单独一个 ZSET，搜索命中就 ZINCRBY，看板直接 ZREVRANGE 取前十。

## MySQL、Redis、ClickHouse 各管一段

配套的存储分工也因此清晰。MySQL 是唯一事实源：文档、版本、审批流、图谱边表全在这里。RediSearch 索引只是投影，任何时候可以从 MySQL 全量重灌，所以索引可以大胆重建，升级 schema 不心疼。Redis 管实时热数据：检索索引、联想词典、热词榜、Session。ClickHouse 收行为流水：浏览、搜索、AI 调用逐条进大表，按天分区、批量写入，看板的聚合全部下推 CH，应用层不扫大集。三层的故障预案也因此简单：CH 挂了丢的是看板，Redis 挂了重灌索引即可，只有 MySQL 需要认真做备份。

写路径靠 Redis Stream 串异步：发布事件落 Stream，索引同步与向量化由消费者处理，失败可通过重建接口兜底，主请求不直接等待索引计算。ClickHouse 行为事件独立写入，失败只影响分析看板。

参考资料：[Redis Query Engine 官方文档](https://redis.io/docs/latest/develop/interact/search-and-query/)。
