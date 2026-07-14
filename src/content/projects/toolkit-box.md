---
title: ToolkitBox
description: 一套面向日常开发与运营文件处理的本地桌面工具箱。
publishedAt: 2026-07-12
status: completed
category: 开发工具
tech: [Electron, JavaScript, SheetJS, PDF.js]
cover: /images/projects/toolkit-box.png
repoUrl: https://github.com/xrlnewman/field-notes/tree/main/showcase/toolkit-box
featured: true
draft: false
---

## 项目目标

把 PDF、Excel、批量重命名和日志分析这些高频零散操作集中到一个桌面应用中，让文件处理留在本机，也减少为单次任务反复寻找脚本或在线服务的成本。

## 核心能力

- 合并、拆分、提取 PDF 页面，添加文字水印，并把页面转换为图片；
- 合并、对比和拆分 Excel 工作表；
- 按正则、映射表或命名模板预览并执行批量重命名；
- 识别日志级别、时间、IP 和 URL，展示统计结果与趋势图。

## 技术实现

应用以 Electron 承载多个 iframe 工具页面。preload 只向主页面暴露受控的本地文件能力；工具页通过 `postMessage` 请求主页面代理，代理仅接受当前工具 iframe 且 origin 为 `null` 的本地文件页消息，并按方法白名单转发。主进程进一步把子 frame 导航限制在四个内置 `tool.html`，同时拒绝 `window.open`；响应因 `file:` opaque origin 仍使用 `*`，由 source、origin 与导航白名单共同收窄边界。工具页只接受父页面响应，并按对话框 30 分钟、文件 IO 10 分钟、路径运算 30 秒分级超时。PDF 流程组合使用 PDF.js 与 pdf-lib，表格处理使用 SheetJS，日志分析在渲染端完成解析与图表展示。

## 工程取舍

工具优先选择本地、离线处理，换取更直接的文件访问和更少的数据外传风险。各工具以单独页面组织，结构清楚但会产生少量重复界面代码；iframe 消息白名单用于收窄文件能力边界，并不宣称提供进程级隔离。批量重命名属于破坏性操作，因此必须先预览并再次确认。
