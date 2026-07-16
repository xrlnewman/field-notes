---
title: EduFlow 教培课程与学员管理平台
description: 面向小型教培机构的免费开源课程与学员管理产品，包含学员小程序、Vue 教务后台与 Go Gin API。
publishedAt: 2026-07-16
updatedAt: 2026-07-16
status: active
category: 教育培训
tech: [uni-app, Vue 3, TypeScript, Go 1.25, Gin, MySQL 8.4, Redis 8, Docker Compose]
cover: /images/projects/eduflow-platform/admin-dashboard.png
repoUrl: https://github.com/xrlnewman/eduflow-admin
repositories:
  - name: eduflow-miniapp
    role: frontend
    description: 面向学员和家长的 uni-app 客户端，覆盖学习首页、课程中心、课表签到、学习任务和个人资料。
    tech: [uni-app, Vue 3, TypeScript, Vite]
    url: https://github.com/xrlnewman/eduflow-miniapp
  - name: eduflow-admin
    role: admin
    description: Vue 教务后台与 Go Gin API 单仓库，包含课程、排课、学员、考勤、任务和 MySQL 8.4 / Redis 8 Compose 基础设施。
    tech: [Vue 3, Vite, Go, Gin, MySQL 8.4, Redis 8]
    url: https://github.com/xrlnewman/eduflow-admin
screenshots:
  - src: /images/projects/eduflow-platform/admin-dashboard.png
    alt: EduFlow 教务后台学习总览，展示今日课程、学员进度、待完成任务和签到入口
    title: 学习总览
    caption: 四张指标卡快速呈现今日课程、学员平均进度、待完成任务和连续学习天数，并在同一屏处理课程签到。
    viewport: desktop
    width: 1045
    height: 1224
  - src: /images/projects/eduflow-platform/courses.png
    alt: EduFlow 课程中心，展示英语、编程、艺术和数学课程卡片
    title: 课程中心
    caption: 课程卡片用紫色、青绿色、珊瑚色和琥珀色区分学习方向，同时展示老师、课时、已加入人数和容量。
    viewport: desktop
    width: 1045
    height: 1224
  - src: /images/projects/eduflow-platform/schedules.png
    alt: EduFlow 排课管理页面，展示课程时间、教室、老师和签到状态
    title: 排课管理
    caption: 运营人员可以按日期查看教室和老师安排，并直接在列表中标记签到，状态变化使用青绿色完成态。
    viewport: desktop
    width: 1045
    height: 1224
  - src: /images/projects/eduflow-platform/students.png
    alt: EduFlow 学员档案页面，展示学员年级、联系方式、学习进度和状态
    title: 学员档案
    caption: 学员档案保留学习进度、课程数和续费状态，演示姓名与联系方式均为虚构数据。
    viewport: desktop
    width: 1045
    height: 1224
featured: true
draft: false
---

## 产品定位

EduFlow 是一套免费开源、可自部署的教培课程与学员管理底座，面向小型培训机构、工作室和个人老师。它把“课程—排课—学员—考勤—学习任务”串成一条清晰的教务工作流，先解决每天最容易遗漏的沟通和跟进动作。

## 两个仓库如何关联

产品拆成两个公开仓库：`eduflow-miniapp` 负责学员和家长使用的移动端工作台，`eduflow-admin` 负责教务后台、Go Gin API 与 Docker Compose 基础设施。两个仓库通过 `/api/v1` 契约关联，未配置 API 时仍可用内置演示数据完整预览。

## 核心能力

- 课程中心：维护课程分类、老师、课时、学习阶段和班级容量。
- 排课管理：按日期、时间、教室和老师查看课程安排，直接标记签到。
- 学员档案：查看年级、课程数、学习进度和待续费状态。
- 学习任务：追踪作业、复习计划、截止时间和完成进度。
- 数据边界：接口统一响应信封，列表分页，报名与签到使用 `Idempotency-Key` 防止重复提交。

## 技术实现

小程序使用 uni-app、Vue 3 与 TypeScript，可构建 H5 与微信小程序；后台采用 Vue 3 与 Vite；后端采用 Go 1.25、Gin、JWT。MySQL 8.4 与 Redis 8 通过 Docker Compose 预留真实部署边界，当前演示模式默认使用内存数据，重启后清空。

## 免费承诺

EduFlow 源码公开、允许自部署，不依赖商业账号才能查看演示。仓库中的姓名、课程、进度和状态均为虚构演示数据；支付、直播、短信、未成年人画像和商业收费不在首版范围内。
