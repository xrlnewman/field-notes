---
title: API Bench
description: 一个支持并发压测、场景编排与实时指标展示的本地 API 工具。
publishedAt: 2026-07-09
status: completed
category: 开发工具
tech: [Electron, Node.js, Chart.js]
cover: /images/projects/api-bench.png
repoUrl: https://github.com/xrlnewman/field-notes/tree/main/showcase/api-bench
featured: false
draft: false
---

## 项目目标

为开发阶段的接口基准测试提供一个可视化桌面入口，在本机配置请求、并发和持续时间，并及时看到 QPS、延迟与错误分布。

## 核心能力

- 配置请求方法、地址、请求头和请求体，按并发数、持续时间或目标 RPS 执行测试；
- 支持预热，并把预热请求排除在正式统计之外；
- 编排多步骤场景，从 JSON 响应中提取变量并用于后续请求；
- 展示 QPS、成功与失败数量、P50、P95、P99 和最大延迟，并保存或载入测试方案。

## 技术实现

Electron 主进程通过 Node.js 的 HTTP/HTTPS 模块直接发送请求，渲染端负责参数编辑、进度更新和结果展示。场景运行器按步骤执行请求，使用简单路径读取 JSON 字段，再完成变量替换；Chart.js 用于绘制 P50、P95、P99 延迟分位趋势。

## 工程取舍

直接从主进程发起请求避开了浏览器跨域限制，也意味着工具面向本地开发和自有服务测试。当前变量提取与模板替换保持轻量，没有引入完整脚本运行时；单次请求设置超时，避免异常连接无限占用测试任务。
