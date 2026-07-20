---
title: 从零做一个企业知识库，我在这几个地方做了取舍
description: KnowFlow 复盘——模块化单体、三层存储分工、RRF 去重、ClickHouse 连不上的坑，以及一个开源项目该有的诚实边界。
category: AI 应用
publishedAt: 2026-07-19
tags: [知识库, RAG, 架构取舍, 复盘, Go]
featured: true
draft: false
---

KnowFlow 是我从零做的一个开源企业知识库（[github.com/xrlnewman/knowflow](https://github.com/xrlnewman/knowflow)）：文档全生命周期、RediSearch 混合检索、RAG 问答、知识图谱、ClickHouse 行为看板。先说清楚——它是个人项目、演示级数据，没有真实生产流量。这篇不讲功能清单，讲我做每个决策时在权衡什么，以及踩过的几个坑。检索选型和多模型网关我另有两篇细讲，这里补的是架构层的取舍和 debug 现场。

## 一个二进制，不是十个微服务

第一个决策就是不上微服务。一个人维护的项目，注册发现、配置中心、链路追踪这套基建的运维成本换不回收益。我选了模块化单体：`internal/app` 按领域分包（document / search / rag / graph / analytics），依赖方向锁死 `transport → app → platform`，不允许反向。边界靠包结构和依赖规则约束，部署就是一个二进制加一份 docker compose。真到要拆服务的那天，这些包边界就是现成的服务边界——先把边界划清，比过早拆分重要得多。

## 三层存储，各管一段

数据分三层是想清楚了才定的，不是堆技术栈：

- **MySQL 是唯一事实源**：文档、版本、审批流、图谱边表。所有别的存储都是它的投影。
- **Redis 8 管实时热数据**：检索索引（RediSearch）、联想词典、热词榜、Session。
- **ClickHouse 只进不改**：浏览、搜索、AI 调用逐条进按天分区大表，看板聚合全下推 CH，应用层不扫大集。

这样分层的好处是故障预案极简：CH 挂了只丢看板，Redis 挂了从 MySQL 全量重灌索引即可，真正要认真备份的只有 MySQL 一个。RediSearch 索引我特意做成"可以随时重建"——升级 schema 不心疼，这是把它当投影而非事实源的直接收益。

## 踩坑：ClickHouse 25.6 的 default 用户连不上

接 CH 时卡了一下。新版镜像（25.6）的 `default` 用户默认**只允许容器内访问**，从宿主机连直接 `Authentication failed`。日志里一句 `password is incorrect, or there is no user` 很有迷惑性——让你以为是密码错，其实是这个用户压根不对外开。解法是 compose 里显式建应用账号（`CLICKHOUSE_USER` / `CLICKHOUSE_PASSWORD`）并同步 DSN。这种"报错信息指向 A、真因是 B"的坑，只有真跑起来才会遇到。

## RRF 融合，和"同文档去重"那个坑

混合检索是 BM25 全文一路、向量 KNN 一路，各取前 50，用 RRF（倒数排名融合）合并：每路排名 r 的文档记 `1/(k+r)` 分，k 取 60。RRF 只看排名不看原始分，天然回避了 BM25 分数和余弦相似度量纲对不齐的问题。

但第一版 RAG 引用有个问题：同一篇文档被切成多个 chunk，混合检索后前几名可能全是同一篇的不同分块，引用列表里同一篇文档出现三四次。改法是**融合后按文档去重、同文档只保留最优分块**，再取 Top-K 进上下文。细节不处理，问答的"引用来源"看着就很外行。

## RediSearch 的内存账

RediSearch 索引全部驻内存，所以不能无脑把正文全塞进去。我只索引标题、标签、摘要，正文按可配上限截断（默认 8KB）后入索引——够召回定位，又把内存占用摁住。真正的正文留在 MySQL。这也是"索引是投影"这个决策的延续：RediSearch 存的从来不是完整数据，丢了随时能从 MySQL 重灌。

## 诚实的边界

这个架构不是万能的，写出来才可信：

- **检索**：十万级文档、栈里有 Redis 8 的场景，RediSearch 是更优解；到了亿级文档、TB 级语料，内存账算不过来，仍该回 ES/OpenSearch。
- **图谱**：MySQL 边表 + Go BFS 取 N 度子图，规模内够用；真到复杂图算法、超大图，才值得上 Neo4j。
- **规模**：演示级数据下一切都快，但我没有真实高并发数据来背书——这点我不装。

做这个项目最大的收获不是学会了几个中间件，是每加一层存储、每引一个组件之前，先问一句"它到底解决我哪个具体问题、故障了影响谁"。想清楚这个，架构图才不是技术堆砌。

代码和详细文档在 GitHub：[github.com/xrlnewman/knowflow](https://github.com/xrlnewman/knowflow)。

参考资料：[Redis Query Engine 官方文档](https://redis.io/docs/latest/develop/interact/search-and-query/)。
