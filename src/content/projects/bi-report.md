---
title: BI Report
description: 一个连接 MySQL、配置聚合查询并生成图表与报表的本地 BI 工具。
publishedAt: 2026-07-06
status: completed
category: 业务系统
tech: [Electron, MySQL, Chart.js]
cover: /images/projects/bi-report.png
repoUrl: https://github.com/xrlnewman/bi-report
featured: false
draft: false
---

## 项目目标

为小型业务数据分析提供一条从数据库连接、指标配置到图表导出的短路径，让常用统计不必先搭建完整的 BI 平台。

## 核心能力

- 连接 MySQL，浏览数据表与字段；
- 选择数据表、X/Y 字段、聚合方式、排序和结果数量生成查询，也可直接执行自定义 SQL；
- 以柱状图、折线图、饼图或散点图展示结果，并组合本地仪表盘；
- 保存常用查询与不含密码的连接元数据，导出图表 PNG 或查询结果 Excel。

## 技术实现

Electron 主进程管理 MySQL 连接并执行查询，渲染端负责查询配置、结果表格和 Chart.js 图表。查询配置、已保存报表和不含密码的连接元数据写入应用数据目录时，会在支持 POSIX 权限的平台请求 `0600`；Windows 仍依赖 NTFS ACL、系统账户和目录权限。主进程会递归删除 `password` / `pass`，读取到含历史密码的旧配置后立即清理并重写，密码只在当前运行会话的内存中使用。Excel 导出使用 SheetJS，图表则从画布生成图片。

## 工程取舍

可视化配置器优先覆盖单表聚合场景：自动 SQL 会转义标识符、限定聚合白名单并限制返回行数；复杂关联需要显式切换到自定义 SQL，并由用户自行审阅。应用定位为本地轻量工具，没有实现大型 BI 平台的多人协作和复杂权限体系；数据库访问权限仍由连接账号本身控制，建议使用只读或最小权限账号。
