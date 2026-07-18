---
title: PostgreSQL 逻辑复制与 CDC：从复制槽到下游重放
description: 处理逻辑复制槽、WAL 保留、DDL 变化、重复事件和故障切换，构建可恢复的变更数据链路。
category: 数据工程
publishedAt: 2026-07-18
tags: [PostgreSQL, CDC, 逻辑复制, 数据同步]
featured: false
draft: false
---

把 PostgreSQL 变更同步到搜索、数仓或缓存，逻辑复制比定时扫表更及时，但它会把 WAL 生命周期和下游消费能力直接绑定。上线前必须把槽位、offset 和重放语义设计清楚。

## 复制槽是有代价的

逻辑复制槽会阻止必要的 WAL 被回收，消费者停摆时磁盘可能持续增长。监控 confirmed_flush_lsn、slot lag、WAL 目录大小和 oldest transaction；超过阈值自动告警，必要时暂停写入或清理失效槽位。

## 事件需要稳定语义

下游事件包含 table、primary_key、operation、commit_lsn、commit_timestamp 和 schema_version。消费者按 commit_lsn 持久化 offset，处理成功后再确认；重试可能产生重复，所以写入下游要用主键、版本号或幂等事件表去重。

## DDL 与删除不能遗漏

字段新增、类型变化和表重命名进入 schema registry，先兼容再切换消费者。删除事件必须区分软删和物理删；缓存、搜索和数仓都要有对应 tombstone，否则会留下幽灵数据。

## 故障切换与回放

主库切换前记录最后可用 LSN，下游确认新主库时间线后继续消费。恢复数据时从备份或快照开始，再按 LSN 回放增量，校验行数、校验和及抽样业务字段。不要把连接恢复当成数据已追平。

参考资料：[PostgreSQL 逻辑复制文档](https://www.postgresql.org/docs/current/logical-replication.html)。
