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
screenshots:
  - src: /images/projects/skyboom-corporate/home-desktop.png
    alt: 天舶重工企业官网桌面端首页
    title: 企业官网首页
    caption: 以品牌视觉、核心产品与企业能力构成官网首屏，建立面向客户的专业形象。
    viewport: desktop
    width: 1440
    height: 900
  - src: /images/projects/skyboom-corporate/products-desktop.png
    alt: 天舶重工企业官网中文产品展示页
    title: 产品中心
    caption: 按清晰的内容层级展示重工产品信息，帮助客户快速了解产品范围。
    viewport: desktop
    width: 1440
    height: 900
  - src: /images/projects/skyboom-corporate/about-desktop.png
    alt: 天舶重工企业官网中文关于我们页面
    title: 关于企业
    caption: 集中呈现企业介绍与品牌实力，为客户建立可信的合作背景认知。
    viewport: desktop
    width: 1440
    height: 900
  - src: /images/projects/skyboom-corporate/contact-desktop.png
    alt: 天舶重工企业官网桌面端联系我们页面
    title: 联系我们
    caption: 将联系方式与询盘入口整合在同一页面，缩短潜在客户的咨询路径。
    viewport: desktop
    width: 1440
    height: 900
  - src: /images/projects/skyboom-corporate/home-mobile.png
    alt: 天舶重工企业官网移动端联系页面
    title: 移动端联系页
    caption: 在 390 像素移动画布上完整呈现联系信息、地图占位与在线留言入口，验证官网的响应式体验。
    viewport: mobile
    width: 390
    height: 844
featured: true
draft: false
---

## 产品组成

产品由三个独立仓库组成：`skyboom-web` 提供企业官网前台，`skyboom-admin` 负责内容管理，`skyboom-server` 提供统一后端 API。

## 内容能力

现有源码覆盖产品、新闻、案例、单页、站点配置和询盘，并由后台维护多语言内容。

## 技术实现

官网与后台采用 Vue 3 和 Vite，官网使用 vue-i18n 管理语言切换，后台使用 Element Plus 与 wangEditor；后端采用 Laravel 与 PHP 8.3。
