---
title: Invoice OCR
description: 一个在本地识别发票图片、校对字段并导出 Excel 的桌面工具。
publishedAt: 2026-07-11
status: completed
category: AI 自动化
tech: [Electron, Tesseract.js, SheetJS]
cover: /images/projects/invoice-ocr.png
repoUrl: https://github.com/xrlnewman/field-notes/tree/main/showcase/invoice-ocr
featured: true
draft: false
---

## 项目目标

把多张发票图片中的常用字段先转换为可编辑表格，减少逐张查看和手工录入的重复工作，同时让原始识别文本保留在导出结果中便于复核。

## 核心能力

- 批量选择发票图片并在本地执行 OCR；
- 从识别文本中提取金额、日期、发票号码、抬头和税号候选值；
- 展示识别置信度，允许直接修改每一行字段；
- 按规则匹配费用分类，将结构化结果和完整 OCR 文本导出到 Excel。

## 技术实现

渲染端使用 Tesseract.js worker 逐张识别图片，再通过规则表达式整理字段候选值并计算结果置信度。分类规则和识别结果在界面中维护，Electron preload 提供文件选择与保存能力，SheetJS 负责生成包含结果表和原始文本表的工作簿。

## 工程取舍

所有识别和整理都在本机完成，不需要把票据上传到外部服务；相应地，识别速度与准确度会受到设备性能、图片清晰度和版式影响。字段提取采用可解释规则而不是票据专用模型，因此结果必须经过人工校对，不能直接作为财务入账依据。
