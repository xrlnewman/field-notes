---
title: 多商户商城
description: 由移动端商城、平台与商户后台、后端 API 组成的多商户电商平台。
publishedAt: 2026-07-14
status: active
category: 电商平台
tech: [Vue 3, Vant, Element Plus, Laravel 12, PHP 8.3]
cover: /images/projects/field-notes.png
repoUrl: https://github.com/xrlnewman/mall-h5
repositories:
  - name: mall-h5
    role: frontend
    description: 面向用户的移动端商城，支持 H5、微信内置浏览器和 PWA。
    tech: [Vue 3, Vite, Vant, Pinia]
    url: https://github.com/xrlnewman/mall-h5
  - name: mall-admin
    role: admin
    description: 平台与商户共用的后台管理端。
    tech: [Vue 3, Vite, Element Plus, Pinia]
    url: https://github.com/xrlnewman/mall-admin
  - name: mall-system
    role: backend
    description: 为商城前台和后台提供服务的后端 API。
    tech: [Laravel 12, PHP 8.3, MySQL, Redis]
    url: https://github.com/xrlnewman/mall-system
featured: true
draft: false
---

## 产品组成

产品由三个独立仓库组成：`mall-h5` 承载用户侧移动端商城，`mall-admin` 提供平台与商户后台，`mall-system` 提供统一后端 API。

## 技术实现

前台和后台均采用 Vue 3 与 Vite，分别使用 Vant 和 Element Plus；后端采用 Laravel 12 与 PHP 8.3。

## 开源方式

三个组成仓库均提供独立的 GitHub 源码入口，便于按前台、后台和后端职责分别查看。
