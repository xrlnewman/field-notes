---
title: eBPF 与 OpenTelemetry：低侵入构建统一可观测链路
description: 组合内核级网络观测与应用级 trace、metric、log，解决服务拓扑、采样和高基数标签的落地问题。
category: 云原生
publishedAt: 2026-07-18
tags: [eBPF, OpenTelemetry, 可观测性, Kubernetes]
featured: false
draft: false
---

传统埋点能解释业务函数，却经常漏掉未接入 SDK 的服务、内核网络和第三方依赖；eBPF 可以低侵入地补齐网络视角，但它不是可观测平台本身。更稳妥的做法是让 eBPF 负责发现和补充，OpenTelemetry 负责统一信号格式和导出。

## 先明确两层职责

eBPF 采集进程、连接、DNS、HTTP/gRPC 延迟和重传等运行时事实；应用 SDK 记录订单号、租户、业务阶段和异常语义。两者通过 service.name、pod.uid、container.id 等资源属性关联，避免依赖不稳定的 IP。

## Collector 是治理边界

节点或 DaemonSet 上的 Collector 接收 OTLP 与 eBPF 数据，完成批处理、尾部采样、属性脱敏、限流和路由，再发送到 traces、metrics、logs 后端。生产环境给每个信号设置队列和重试上限，后端不可用时要有明确丢弃或本地缓冲策略。

## 控制高基数和成本

URL、用户 ID、订单号不能直接做 metric label；先做路由模板化、哈希或只保留 trace 属性。采样策略按错误、慢请求和关键业务优先，正常流量按比例采样。每周查看 series 数、span 字节、Collector CPU 和丢弃率，防止“观测系统先把自己打挂”。

## 从服务地图开始验收

上线第一阶段只验证服务拓扑、P95 延迟、错误链路和网络重试是否能定位到责任服务。再逐步接入业务 span 和日志关联。不要一开始就开启所有协议解析，否则很难判断指标来自哪一层。

参考资料：[OpenTelemetry 概念与信号](https://opentelemetry.io/docs/concepts/)。
