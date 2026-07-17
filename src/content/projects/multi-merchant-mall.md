---
title: 多商户商城
description: 由移动端商城、平台与商户后台、后端 API 组成的多商户电商平台。
publishedAt: 2026-07-14
status: active
category: 电商平台
tech: [Vue 3, Vant, Element Plus, Laravel 12, PHP 8.3]
cover: /images/projects/multi-merchant-mall.png
screenshots:
  - src: /images/projects/multi-merchant-mall/home.png
    alt: 多商户商城移动端首页展示分类入口、营销活动和商品推荐
    title: 移动商城首页
    caption: 首页将商品分类、限时秒杀、拼团活动和新品推荐组织在同一条移动购物路径中。
    viewport: mobile
    width: 390
    height: 844
  - src: /images/projects/multi-merchant-mall/category.png
    alt: 多商户商城移动端分类页展示数码与家电商品分类
    title: 商品分类
    caption: 双栏分类导航帮助顾客从一级类目快速进入手机、摄影、影音和智能家居等场景。
    viewport: mobile
    width: 390
    height: 844
  - src: /images/projects/multi-merchant-mall/product-detail.png
    alt: 多商户商城移动端商品详情展示价格、库存、规格和购买操作
    title: 商品详情
    caption: 商品详情集中展示促销价、库存、规格、服务承诺和加购购买入口。
    viewport: mobile
    width: 390
    height: 844
  - src: /images/projects/multi-merchant-mall/products-admin.png
    alt: 多商户商城商户后台商品管理表格展示售价、库存和上架状态
    title: 商品管理
    caption: 商户可按状态筛选商品，并在同一列表核对售价、库存、启用与商城上架状态。
    viewport: desktop
    width: 1254
    height: 1108
  - src: /images/projects/multi-merchant-mall/orders-admin.png
    alt: 多商户商城商户后台订单管理展示脱敏买家和履约状态
    title: 商城订单
    caption: 订单列表按履约状态分组，展示脱敏买家信息、订单金额和发货处理入口。
    viewport: desktop
    width: 1254
    height: 1108
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

## 仓库与运行范围

三个组成仓库均提供独立的 GitHub 源码入口，便于按前台、后台和后端职责分别查看。
