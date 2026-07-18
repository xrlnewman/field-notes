---
title: ClickHouse 明细表与聚合表的建模实践
description: 从分区、排序键、索引粒度和物化视图出发，设计高吞吐写入与低延迟分析查询。
publishedAt: 2026-07-06
tags: [大数据, ClickHouse, OLAP, 数据库]
featured: false
draft: false
---

ClickHouse 擅长扫描大量列式数据，但表设计不当时，数据再多也会因为分区过多、排序键不匹配和小批量写入而变慢。

## 先确定查询路径

排序键应覆盖最常见的过滤和排序字段，通常把高选择性的租户、业务类型和时间字段组合起来。不要把所有字段都放进 ORDER BY，过长的排序键会增加写入和存储成本。

~~~sql
CREATE TABLE event_log
(
  tenant_id UInt64,
  event_time DateTime64(3),
  event_type LowCardinality(String),
  user_id UInt64,
  payload String
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(event_time)
ORDER BY (tenant_id, event_type, event_time, user_id);
~~~

分区主要用于生命周期管理和粗粒度裁剪，不应该按用户或订单创建成数百万个分区。大多数场景按月或按日即可。

## 明细与汇总分开

明细表保留审计和回放所需字段，聚合表服务于固定报表。物化视图可以把写入事件同步聚合到日表，但要关注重放、迟到事件和聚合结果修正。

如果查询维度变化频繁，不要为每个维度都建一张表。先保留可复用明细，再通过合理的聚合键和查询缓存控制成本。

## 写入要批量

大量单行 INSERT 会制造小 part，增加合并压力。应用或消息消费者应按数量或时间聚合后批量写入，并监控 part 数量、合并队列和磁盘使用。

## 数据跳过索引的边界

跳过索引适合帮助裁剪明显不匹配的数据块，不能替代排序键，也不能保证像 BTree 一样精准定位。是否有效要用真实数据和 EXPLAIN 测量。

## TTL 与删除

TTL 可以自动删除或迁移历史数据，但删除会产生合并压力。大批量更正优先通过新批次覆盖或重建分区，避免频繁 mutation。

ClickHouse 建模的验收指标包括扫描字节数、读放大、写入批量大小、合并延迟、查询 P95 和分区数量。只看一条 SQL 的执行时间，无法发现长期运行的存储问题。
