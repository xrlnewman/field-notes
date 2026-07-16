---
title: RetailFlow 门店经营平台
description: 免费开源的商品、订单、备货、配送、自提、会员与日结一体化门店经营系统，适合零售和餐饮小店。
publishedAt: 2026-07-16T13:35:00-05:00
updatedAt: 2026-07-16T13:35:00-05:00
status: active
category: 零售餐饮
tech: [Vite, Vue 3, TypeScript, Go 1.25, Gin, MySQL 8.4, Redis 8, Docker Compose]
cover: /images/projects/retailflow-platform/shot-1.png
repoUrl: https://github.com/xrlnewman/retailflow-admin
repositories:
  - name: retailflow-miniapp
    role: frontend
    description: 顾客与店员移动端，支持点单、订单跟踪、会员权益和自提核销。
    tech: [Vite, TypeScript, Responsive UI]
    url: https://github.com/xrlnewman/retailflow-miniapp
  - name: retailflow-admin
    role: admin
    description: 门店后台与 Go Gin API，覆盖商品、库存、订单、配送、自提和日结。
    tech: [Vite, Go, Gin, MySQL 8.4, Redis 8]
    url: https://github.com/xrlnewman/retailflow-admin
screenshots:
  - src: /images/projects/retailflow-platform/shot-1.png
    alt: RetailFlow 门店经营总览
    title: 门店经营总览
    caption: 订单、销售额、库存预警和会员复购按经营优先级排列，森林绿与橙色形成可靠又有温度的门店感。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/retailflow-platform/shot-2.png
    alt: RetailFlow 订单备货列表
    title: 订单与备货
    caption: 订单状态、取货方式和备货动作一目了然，减少店员在多个页面来回切换。
    viewport: desktop
    width: 1440
    height: 960
  - src: /images/projects/retailflow-platform/shot-3.png
    alt: RetailFlow 移动点单页面
    title: 移动点单
    caption: 顾客可以快速选择商品、优惠和配送方式，页面留白足够避免促销信息抢主任务。
    viewport: mobile
    width: 390
    height: 844
  - src: /images/projects/retailflow-platform/shot-4.png
    alt: RetailFlow 移动订单页面
    title: 订单跟踪
    caption: 订单从已下单到完成配送或自提核销都有清晰状态，适合真实门店日常使用。
    viewport: mobile
    width: 390
    height: 844
featured: false
draft: false
---

## 完整闭环

商品上架 → 顾客下单 → 店员备货 → 配送或自提 → 会员积分 → 日结复盘；库存和订单更新使用幂等写入。

## 仓库关联与免费边界

`retailflow-miniapp` 提供顾客/店员移动端，`retailflow-admin` 提供后台、API、MySQL 8.4 和 Redis 8。项目免费公开，商品、订单和金额全部是演示数据。
