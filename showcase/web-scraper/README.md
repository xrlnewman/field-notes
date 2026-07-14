# Web Scraper

网页爬虫工作台，Electron 桌面应用。它面向用户主动打开、确认并授权采集的网页，通过内置 webview 可视化配置规则，不在后台静默抓取站点。

## 工作流

1. 输入起始 URL，在内置浏览器里打开
2. 在右侧"规则"面板配置 CSS 选择器：
   - **list selector**：每条记录的容器（如 `.product-item`）
   - **fields**：每个字段名 + 选择器（相对于 list selector）+ 提取方式（text / html / href / src / 自定义属性名）
3. 点"试运行" → 看到提取结果
4. 配置翻页：分页选择器或 URL 模板（`?page={n}`）
5. 点"批量爬取" → 自动翻页 + 累积结果
6. 导出 Excel

## 注意

- **遵守目标网站 robots.txt 和 ToS**。本工具不绕过反爬，遇到验证码/JS 加密接口需要你自己解决
- 只允许 webview 打开 `about:blank` 和 HTTP(S) 页面；远程页面不能打开新窗口，导航到本地文件、脚本或 data URL 会被阻止
- 远程页面的摄像头、麦克风、地理位置等权限请求默认拒绝；Cookie 仅在用户点击导出时读取当前 HTTP(S) 页面会话
- 规则集名称经过统一校验，不能通过相对路径把文件保存到规则目录之外
- 速率限制：默认每页 1s 间隔，可调整
- 登录态：在内置浏览器里登录后会保留会话

## 开发

```bash
npm install
npm start
```

MIT © xrlnewman
