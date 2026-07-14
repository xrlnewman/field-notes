---
title: DB Snapshot Diff
description: 一个支持跨 MySQL/PostgreSQL 比较结构与数据快照、并为同引擎目标生成迁移 SQL 的桌面工具。
publishedAt: 2026-07-08
status: completed
category: 数据与搜索
tech: [Electron, MySQL, PostgreSQL]
cover: /images/projects/db-snapshot-diff.png
repoUrl: https://github.com/xrlnewman/field-notes/tree/main/showcase/db-snapshot-diff
featured: false
draft: false
---

## 项目目标

把数据库版本或环境之间的结构差异集中呈现出来，并生成可复核的迁移 SQL，降低人工逐表核对字段存在性、字段类型和样例数据的成本。

## 核心能力

- 连接 MySQL 或 PostgreSQL，并保存不含密码的常用连接元数据；
- 采集表与字段结构快照，以及表行数和样例数据；
- 对比两个快照中的表、字段存在性与字段类型变化；
- 任意组合对比 MySQL/PostgreSQL 快照并展示样本差异；仅在两端引擎相同时，按目标 B 库方言生成迁移 DDL。

## 技术实现

Electron 主进程分别使用 MySQL 与 PostgreSQL 驱动查询 information_schema 和系统目录，把统一后的快照返回渲染端。差异计算在本地完成；迁移生成器把源、目标引擎作为信任边界，跨引擎会立即拒绝，同引擎则严格使用目标 B 库方言。连接元数据写入应用数据目录时会在支持 POSIX 权限的平台请求 `0600`；Windows 仍依赖 NTFS ACL、系统账户和目录权限。主进程会递归删除 `password` / `pass`，读取到含历史密码的旧配置后立即清理并重写，密码与当前快照都只在本次运行的内存中保留；生成的 SQL 只作为文本结果交给用户检查。

## 工程取舍

工具不会自动执行生成的迁移 SQL，跨引擎也只做差异展示，避免不可靠的类型转换或差异判断直接变成数据库写操作；代价是跨引擎迁移需要用户使用专门迁移流程，同引擎 SQL 也必须人工审阅并在自己的发布流程中执行。数据对比基于抽样与行内容集合，适合快速定位差异，不等同于全量数据校验；密码不持久化也意味着每次启动都需要重新输入。
