---
title: Kubernetes 事件驱动扩缩容：HPA 与 KEDA 的边界怎么划
description: 以 CPU、队列长度和业务事件为信号设计自动扩缩容，处理冷启动、下游容量和缩容抖动。
category: 云原生
publishedAt: 2026-07-18
tags: [Kubernetes, HPA, KEDA, 弹性]
featured: false
draft: false
---

只按 CPU 扩容对在线 API 很直观，但对消息消费、异步图片处理和定时任务往往不够。生产系统要先回答“扩容信号是什么、扩容后多久生效、下游能承受多少”，再选择控制器。

## HPA 适合资源和稳定指标

HPA 根据 CPU、内存或自定义指标调整 Deployment 副本数。设置 requests/limits、最小和最大副本、scaleUp/scaleDown 行为后，控制器才能做出稳定决策。CPU 高不一定代表积压高，业务队列还要暴露可采集的外部指标。

## KEDA 适合事件和队列

KEDA 将 Kafka lag、RabbitMQ backlog、Redis list length、定时窗口等事件转换成扩缩容信号。缩到零能节省资源，但第一次拉起会有镜像、连接池和缓存预热成本，必须把冷启动纳入 SLA，并为关键任务保留 minReplicaCount。

~~~text
队列积压 -> KEDA ScaledObject -> HPA
                         -> Pod 启动 -> 消费速率提升
                         -> lag 下降 -> 渐进缩容
~~~

## 防止抖动和击穿

扩容阈值按目标处理时延倒推，不要直接照搬 CPU 百分比。设置 cooldown、稳定窗口和每次扩容上限；消费者要有并发上限、分区分配和下游限流。发布时先压测“积压增长—扩容—恢复—缩容”全链路。

## 指标与验收

同时看 queue lag、oldest message age、每副本吞吐、启动耗时、下游错误率和单任务成本。扩容成功的标准不是 Pod 数增加，而是积压在预算时间内下降且没有把数据库、第三方 API 推入过载。

参考资料：[Kubernetes HPA](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/)；[KEDA 扩缩容概念](https://keda.sh/docs/2.20/concepts/scaling-deployments/)。
