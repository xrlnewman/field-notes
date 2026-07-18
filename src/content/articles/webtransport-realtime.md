---
title: WebTransport 实时系统：在 WebSocket 之外选择可靠性
description: 对比 WebSocket 与 WebTransport 的连接、流、无序数据报和重连模型，为协同、游戏和实时看板选择合适传输层。
category: 实时系统
publishedAt: 2026-07-18
tags: [WebTransport, 实时通信, QUIC, 浏览器]
featured: false
draft: false
---

WebSocket 适合有序双向消息，但一个慢消息可能阻塞后续内容，也很难让不同数据流拥有不同可靠性。WebTransport 建立在 HTTP/3 之上，提供双向流、单向流和 datagram，适合需要多路并发和可选择可靠性的实时应用。

## 先按消息语义分流

房间状态、支付结果和协同操作使用可靠、有序的 stream；鼠标位置、音视频辅助数据或过期即失效的状态可以使用 datagram。服务端必须给每类消息定义序列号、过期时间和幂等策略，不能把“丢包可接受”当成业务默认。

## 连接管理是产品能力

客户端保存 session_id、last_seen_sequence 和订阅列表，网络切换后重新握手并补发缺口。服务端按连接设置空闲超时、最大并发流和消息配额，避免一个客户端耗尽资源。重连期间 UI 要展示同步中，而不是继续假设本地状态完整。

## 安全与可观测性

使用 HTTPS、Origin 校验和用户授权令牌；datagram 也要做大小限制、速率限制和租户隔离。记录连接建立、握手失败、流关闭原因、重传、RTT 和每类消息丢弃率，按 session 关联业务操作。

## 逐步上线

先用 WebSocket 保留业务协议，在特定低延迟场景增加 WebTransport 通道；灰度比较端到端延迟、断线恢复时间、CPU 和移动网络表现。浏览器不支持时回退到 WebSocket，但两套传输必须共享序列化和权限逻辑。

参考资料：[W3C WebTransport Working Draft](https://www.w3.org/TR/webtransport/)。
