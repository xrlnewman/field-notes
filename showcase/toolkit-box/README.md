# ToolkitBox

个人提效工具箱，基于 Electron 的 Windows 桌面应用。把日常重复的文件处理任务整合到一个 GUI 里，拖入文件即可处理，不需要联网、不上传数据。

![status](https://img.shields.io/badge/status-completed-brightgreen) ![license](https://img.shields.io/badge/license-MIT-blue) ![platform](https://img.shields.io/badge/platform-Windows-blue)

## 首期工具

| 工具 | 功能 |
|---|---|
| 📄 PDF 批处理 | 合并多个 PDF / 按 N 页拆分 / 按页码范围提取 / 加文字水印 / PDF → PNG/JPEG |
| 📊 Excel 批处理 | 两表按 key 列 join / 找差异（仅A、仅B、值不同） / 按列拆分（多 sheet 或多文件）|
| 📝 文件批量改名 | 正则查找替换 / Excel 映射表批改 / 序号+日期模板（含预览） |
| 📈 日志分析器 | 自动识别级别和时间 / 按级别画趋势图 / Top 错误消息 / Top IP / Top URL |

## 开发

```bash
npm install
npm start
```

## 打包

```bash
npm run build
```

输出在 `dist/`，NSIS 安装包 `ToolkitBox Setup x.x.x.exe`。

国内网络下载 Electron 二进制慢，可用淘宝镜像：

```bash
ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/ npm run build
```

## 项目结构

```
toolkit-box/
├── main.js              Electron 主进程 + IPC (文件读写/选择/重命名)
├── preload.js           安全桥
├── renderer/
│   ├── index.html       侧边栏壳
│   ├── shell.js         工具切换
│   ├── tool-api-host.js 主页面的受限 API 消息代理
│   ├── tool-api-bridge.js 工具页共享 API bridge
│   ├── style.css        外壳样式
│   ├── common.css       工具页共享样式
│   └── tools/
│       ├── pdf/         PDF 工具
│       ├── excel/       Excel 工具
│       ├── rename/      改名工具
│       └── log/         日志分析器
└── package.json
```

每个工具使用单独的 iframe 页面组织界面与脚本。Electron preload 默认只向主页面暴露 `window.api`，工具 iframe 不直接获得这组能力；主页面的消息代理只接收当前 `#tool-frame.contentWindow` 且 `origin === "null"` 的本地 `file:` 页面请求，并按方法白名单调用 preload API。由于 `file:` 页面的 opaque origin 无法作为定向响应目标，响应仍使用 `*`，但请求来源、origin 和主进程导航白名单会共同限制边界。主进程只允许 iframe 导航到现有 PDF、Excel、批量改名和日志分析四个本地 `tool.html`，拒绝其他 frame 导航并禁止 `window.open`。

工具页共享 bridge 只接受 `parent` 返回的响应。文件/目录选择与保存对话框最长等待 30 分钟，文件 IO 最长等待 10 分钟，纯路径运算最长等待 30 秒；完成或失败后都会清理 pending 请求。这个边界限制了工具页可调用的方法与可加载页面，但不等同于进程级隔离。

加新工具需要：

1. 在 `renderer/tools/<name>/` 下放 `tool.html` + `tool.js`
2. 在 `tool.js` 前加载 `../../tool-api-bridge.js`
3. 在 `renderer/index.html` 的 nav 里加一项 `<button class="nav-item" data-tool="<name>">...</button>`

若新工具需要现有白名单之外的本地能力，应同时补充主进程 IPC、preload API、父页面与工具页的白名单及相应测试，不要把任意 IPC 通道直接透传给 iframe。

## 后续计划

- [ ] PDF ↔ Word 转换
- [ ] 图片批量压缩/水印/转格式
- [ ] JSON/CSV/SQL 互转
- [ ] 二维码批量生成
- [ ] 数据库快照对比
- [ ] API 压测小工具
- [ ] 二进制签名（去掉 SmartScreen 警告）

欢迎提 Issue 或 PR。

## License

MIT © xrlnewman
