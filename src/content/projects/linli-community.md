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
screenshots:
  - src: /images/projects/linli-community/home-mobile.png
    alt: 邻里社区小程序首页的社区团购与便民服务入口
    title: 居民端首页
    caption: 聚合社区团购、同城跑腿和搭子服务，让居民从一个移动入口发现附近服务。
    viewport: mobile
    width: 390
    height: 844
  - src: /images/projects/linli-community/groupbuy-detail-mobile.png
    alt: 邻里社区小程序的社区团购商品详情页
    title: 团购详情
    caption: 在移动端集中呈现团购商品、价格与购买信息，承接居民从浏览到下单的决策。
    viewport: mobile
    width: 390
    height: 844
  - src: /images/projects/linli-community/leader-dashboard-mobile.png
    alt: 邻里社区团长工作台的数据概览页面
    title: 团长工作台
    caption: 汇总订单、销售与佣金等经营指标，帮助团长掌握社区团购进度。
    viewport: mobile
    width: 390
    height: 844
  - src: /images/projects/linli-community/products-admin.png
    alt: 邻里社区运营后台的商品管理列表
    title: 商品管理
    caption: 支持运营人员集中查看和维护社区团购商品，衔接居民端的商品供给。
    viewport: desktop
    width: 1440
    height: 900
  - src: /images/projects/linli-community/orders-admin.png
    alt: 邻里社区运营后台包含真实业务数据的订单管理列表
    title: 订单管理
    caption: 通过有数据的订单列表展示运营筛选、履约跟进与订单状态管理能力。
    viewport: desktop
    width: 1440
    height: 900
featured: true
draft: false
---

## 产品组成

产品由三个独立仓库组成：`linli-mp` 服务居民与团长，`linli-admin` 服务平台运营，`linli-server` 统一承载后端 API。

## 服务范围

现有源码围绕社区团购、同城跑腿与搭子服务组织功能，并覆盖居民端、团长端和运营后台。

## 技术实现

客户端基于 uni-app 与 Vue 3，可构建微信小程序和 H5；后台采用 Vue 3 与 Element Plus；后端采用 Laravel 12 与 PHP 8.3。

## 业务模块

- **社区团购**：运营人员创建团购活动、商品和截单时间，团长分享后居民下单，后台按团统计备货量。
- **同城跑腿**：居民发布取送需求，平台按区域分派骑手，支持接单、取件、送达和异常报备。
- **搭子服务**：居民发布活动与报名信息，平台维护名额、审核和取消记录，避免重复占位。
- **团长经营**：团长工作台展示销售额、订单数、佣金和待处理异常，结算前可查看明细。

## 数据与验收

活动、商品、订单、配送单、报名记录和佣金结算都有独立编号。验收可从居民端选购开始，经过团长确认、备货、配送/自提和结算，后台筛选条件与小程序状态保持一致。
