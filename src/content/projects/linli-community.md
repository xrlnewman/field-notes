---
title: 邻里社区服务平台
description: 由微信小程序、PC 后台和后端 API 组成的社区团购、同城跑腿与搭子服务平台。
publishedAt: 2026-07-14
status: active
category: 社区服务
tech: [uni-app, Vue 3, Element Plus, Laravel 12, PHP 8.3]
cover: /images/projects/linli-community.png
repoUrl: https://github.com/xrlnewman/linli-mp
repositories:
  - name: linli-mp
    role: frontend
    description: 面向居民与团长的微信小程序客户端，也可编译为 H5。
    tech: [uni-app, Vue 3, Vite, Pinia]
    url: https://github.com/xrlnewman/linli-mp
  - name: linli-admin
    role: admin
    description: 面向平台运营的 PC 后台管理端。
    tech: [Vue 3, Vite, Element Plus, ECharts]
    url: https://github.com/xrlnewman/linli-admin
  - name: linli-server
    role: backend
    description: 为小程序和后台管理端提供服务的后端 API。
    tech: [Laravel 12, PHP 8.3, MySQL, Redis]
    url: https://github.com/xrlnewman/linli-server
featured: true
draft: false
---

## 产品组成

产品由三个独立仓库组成：`linli-mp` 服务居民与团长，`linli-admin` 服务平台运营，`linli-server` 统一承载后端 API。

## 服务范围

现有源码围绕社区团购、同城跑腿与搭子服务组织功能，并覆盖居民端、团长端和运营后台。

## 技术实现

客户端基于 uni-app 与 Vue 3，可构建微信小程序和 H5；后台采用 Vue 3 与 Element Plus；后端采用 Laravel 12 与 PHP 8.3。
