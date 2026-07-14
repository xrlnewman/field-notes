---
title: Excel Analyzer
description: 一个在本地解析 Excel 与 CSV、生成字段统计和探索图表的桌面工具。
publishedAt: 2026-07-04
status: completed
category: 数据与搜索
tech: [Electron, SheetJS, JavaScript]
cover: /images/projects/excel-analyzer.png
repoUrl: https://github.com/xrlnewman/excel-analyzer
featured: false
draft: false
---

## 项目目标

为临时表格分析提供一个无需上传文件的桌面入口，在正式编写查询或分析脚本前，快速了解工作表结构、缺失情况、数值分布和字段关系。

## 核心能力

- 打开或拖入 Excel、CSV 文件，并在多个工作表之间切换；
- 预览数据，统计字段类型、空值、唯一值、最值、均值、中位数、标准差和高频值；
- 生成直方图、日期趋势、分类占比和分组均值图；
- 对数值字段绘制散点图，并对两个分类字段绘制组合频次热力图。

## 技术实现

Electron preload 负责本地文件选择和读取，渲染端使用 SheetJS 解析工作簿并把每个工作表转换成记录数组。统计计算与图表数据整理均在 JavaScript 中完成，Chart.js 负责可视化，文件内容不会发送到远端服务。

## 工程取舍

把解析、统计和绘图都放在渲染进程中让交互链路保持简单，也意味着大文件会占用更多本机内存并影响界面响应。当前版本专注探索与预览，没有把结果导出或复杂数据清洗纳入范围。
