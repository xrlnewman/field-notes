---
title: 天舶重工企业官网
description: 由多语言企业官网、内容管理后台和后端 API 组成的企业官网产品。
publishedAt: 2026-07-14
status: active
category: 企业官网
tech: [Vue 3, vue-i18n, Element Plus, Laravel, PHP 8.3]
cover: /images/projects/skyboom-corporate.png
repoUrl: https://github.com/xrlnewman/skyboom-web
repositories:
  - name: skyboom-web
    role: frontend
    description: 面向访客的响应式多语言企业官网前台。
    tech: [Vue 3, Vite, vue-i18n, Axios]
    url: https://github.com/xrlnewman/skyboom-web
  - name: skyboom-admin
    role: admin
    description: 管理官网产品、新闻、案例与询盘的内容管理后台。
    tech: [Vue 3, Vite, Element Plus, wangEditor]
    url: https://github.com/xrlnewman/skyboom-admin
  - name: skyboom-server
    role: backend
    description: 为官网前台和内容管理后台提供服务的后端 API。
    tech: [Laravel, PHP 8.3, MySQL, JWT]
    url: https://github.com/xrlnewman/skyboom-server
featured: true
draft: false
---

## 产品组成

产品由三个独立仓库组成：`skyboom-web` 提供企业官网前台，`skyboom-admin` 负责内容管理，`skyboom-server` 提供统一后端 API。

## 内容能力

现有源码覆盖产品、新闻、案例、单页、站点配置和询盘，并由后台维护多语言内容。

## 技术实现

官网与后台采用 Vue 3 和 Vite，官网使用 vue-i18n 管理语言切换，后台使用 Element Plus 与 wangEditor；后端采用 Laravel 与 PHP 8.3。
