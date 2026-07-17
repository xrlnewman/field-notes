---
title: 许汝林个人博客
description: 面向项目作品、技术文章和站内交流的个人作品集，支持项目分类、源码关联、全文检索与 GitHub 登录评论留言。
publishedAt: 2026-07-13
status: active
category: 个人品牌
tech: [Astro, TypeScript, Pagefind, Giscus]
cover: /images/projects/field-notes.png
screenshots:
  - src: /images/projects/field-notes/home.png
    alt: 许汝林个人博客首页展示工程师定位、项目目录和站内互动入口
    title: 个人首页
    caption: 星空主题首屏集中呈现七年工程经验、网站项目入口、文章入口和站内互动入口。
    viewport: desktop
    width: 1440
    height: 900
  - src: /images/projects/field-notes/projects.png
    alt: 许汝林个人博客项目目录按类别展示七个网站产品
    title: 项目分类目录
    caption: 按个人品牌、电商平台、社区服务和企业官网筛选完整网站产品。
    viewport: desktop
    width: 1440
    height: 900
  - src: /images/projects/field-notes/project-detail.png
    alt: 许汝林个人博客项目详情展示技术栈和 GitHub 源码入口
    title: 项目详情
    caption: 项目详情明确展示产品状态、技术栈、在线体验和 GitHub 源码入口。
    viewport: desktop
    width: 1440
    height: 900
  - src: /images/projects/field-notes/guestbook.png
    alt: 许汝林个人博客全局留言页内嵌 GitHub 登录评论区
    title: 站内全局留言
    caption: 访客登录 GitHub 后可直接在博客内发布留言、回复并参与讨论。
    viewport: desktop
    width: 1254
    height: 1108
demoUrl: https://field-notes-2fi.pages.dev
repoUrl: https://github.com/xrlnewman/field-notes
featured: true
draft: false
---

## 项目目标

把项目、文章和公开交流放到一个可持续维护的个人工作台，让访客能从项目概览一路查看功能、截图、技术栈、源码和讨论记录。

## 解决方案

网站由 Astro 在构建阶段生成静态 HTML。文章和项目直接使用 Markdown 管理，Pagefind 在构建完成后生成中文搜索索引，评论和回复保存到 GitHub Discussions，并通过 Giscus 嵌入博客页面。

正文由 Cloudflare Pages 静态分发；访客登录 GitHub 后，可以直接在文章、项目和留言板页面发布评论或回复，评论和留言都在站内完成。

## 关键能力

- 类型安全的文章和项目内容模型；
- 项目分类、真实截图、详情页和 GitHub 源码入口；
- 文章、标签和中文全文搜索页面；
- 深色模式和移动端导航；
- 文章及项目评论；
- 固定全局留言板；
- RSS、站点地图和完整部署说明。

## 运行边界

评论依赖 GitHub 登录，减少匿名垃圾内容；讨论数据由 GitHub Discussions 保存，博客本身不维护用户密码、会话或评论数据库。项目详情页展示前台、后台和接口仓库的职责边界，演示账号与示例数据不代表真实客户数据。

