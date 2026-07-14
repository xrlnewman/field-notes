---
title: Web Scraper
description: 一个由用户主动打开并授权采集页面、通过可视化规则提取字段并导出表格的本地桌面工具。
publishedAt: 2026-07-07
status: completed
category: 数据与搜索
tech: [Electron, WebView, SheetJS]
cover: /images/projects/web-scraper.png
repoUrl: https://github.com/xrlnewman/web-scraper
featured: false
draft: false
---

## 项目目标

让一次性或小批量网页采集可以通过页面浏览和 CSS 选择器配置完成，不必为每个站点重新搭建命令行脚本。

## 核心能力

- 在内置网页视图中打开目标页面并配置多个字段规则；
- 按 CSS 选择器提取文本、HTML、链接、图片地址或指定 DOM 属性；
- 保存和载入规则集，支持下一页选择器或 URL 模板分页；
- 设置页面间隔，导出采集结果为 Excel，并可导出当前 Cookie。

## 技术实现

Electron 使用 WebView 承载用户主动打开的 HTTP(S) 目标页面，采集逻辑仅在用户试运行或批量采集时注入页面上下文并按规则读取 DOM。主进程在 webview 附加时强制关闭 Node 集成、启用上下文隔离、沙箱和 Web 安全，移除远程 preload；远程页面新窗口、非 HTTP(S) 导航和权限请求默认拒绝。渲染端负责规则编辑、分页调度和结果预览，主进程校验规则集名称后保存文件；SheetJS 把结构化结果写入工作簿。

## 工程取舍

CSS 选择器让规则保持直观，但页面结构变化后需要重新维护。分页采用显式的下一页元素或 URL 模板，没有实现绕过反爬机制；采集和 Cookie 导出都需要用户主动操作，使用者仍需确认自己有权访问和采集相关内容，并遵守目标站点的 robots 约定、服务条款和访问频率要求。
