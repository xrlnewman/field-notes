---
title: 许汝林个人博客
description: 一个以项目作品和开源源码为核心、接入站内评论的个人博客。
publishedAt: 2026-07-13
status: active
category: 网站产品
tech: [Astro, TypeScript, Pagefind, Cloudflare D1]
cover: /images/projects/field-notes.png
demoUrl: https://field-notes-2fi.pages.dev
repoUrl: https://github.com/xrlnewman/field-notes
featured: true
draft: false
---

## 项目目标

把项目、文章和公开交流放到一个真正属于自己的空间，同时把长期费用和维护成本降到最低。

## 解决方案

网站由 Astro 在构建阶段生成静态 HTML。文章和项目直接使用 Markdown 管理，Pagefind 在构建完成后生成中文搜索索引，站内评论和回复保存到 Cloudflare D1。

正文继续由 Cloudflare Pages 静态分发，只有读取或发布评论时才会访问 Pages Functions 和 D1。

## 关键能力

- 类型安全的文章和项目内容模型；
- 项目分类、真实截图、详情页和 GitHub 源码入口；
- 文章、标签和中文全文搜索页面；
- 深色模式和移动端导航；
- 文章及项目评论；
- 固定全局留言板；
- RSS、站点地图和完整部署说明。

## 取舍

评论无需账号，降低了参与门槛；同时需要通过频率限制、蜜罐字段和内容管理应对垃圾信息，并持续维护 D1 数据备份。

