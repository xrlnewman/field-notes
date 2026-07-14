# API Bench

API 压测小工具，Electron 桌面应用。Node.js http/https 模块直发请求，不走 fetch，避免浏览器同源/限流。

## 功能

- HTTP / HTTPS 任意 method
- 自定义 headers 和 body（JSON / form / raw）
- **并发数** + **持续时间** 或 **目标 QPS**
- 实时指标：QPS、成功率、P50/P95/P99 延迟、错误分类
- 实时延迟趋势图
- 状态码分布表格

## 用法

1. 填 URL（如 `https://api.example.com/users`）
2. 设置 method/headers/body
3. 选择并发数和持续时长
4. 点"开始" → 实时看图表，结束后查报告

## 注意

- **不要压测不属于你的服务**。这是给本地服务和你自己的 API 准备的
- 高并发会消耗本机端口和带宽，注意系统连接数限制

## 开发

```bash
npm install
npm start
```

MIT © xrlnewman
