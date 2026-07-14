---
title: 许汝林个人博客
description: 一个以项目作品和开源源码为核心、无需服务器和数据库的个人博客。
publishedAt: 2026-07-13
status: active
category: 网站产品
tech: [Astro, TypeScript, Pagefind, Giscus]
cover: /images/projects/field-notes.png
demoUrl: https://field-notes-2fi.pages.dev
repoUrl: https://github.com/xrlnewman/field-notes
featured: true
draft: false
---

## 项目目标

把项目、文章和公开交流放到一个真正属于自己的空间，同时把长期费用和维护成本降到最低。

## 解决方案

网站由 Astro 在构建阶段生成静态 HTML。文章和项目直接使用 Markdown 管理，Pagefind 在构建完成后生成中文搜索索引，Giscus 将评论和回复保存在 GitHub Discussions。

这意味着访问正文时不需要应用服务器，也不需要数据库连接。Cloudflare Pages 只负责分发静态资源。

## 关键能力

- 类型安全的文章和项目内容模型；
- 项目分类、真实截图、详情页和 GitHub 源码入口；
- 文章、标签和中文全文搜索页面；
- 深色模式和移动端导航；
- 文章及项目评论；
- 固定全局留言板；
- RSS、站点地图和完整部署说明。

## 取舍

评论者需要 GitHub 账号，内容仓库需要公开。换来的好处是没有评论服务费用，也不必自己处理账号、垃圾信息和数据库备份。

