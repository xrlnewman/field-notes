# 许汝林个人博客

一个以项目作品和开源源码为核心的个人博客。网站用于展示许汝林的产品实践、技术文章和完整交付能力；内容静态生成，评论由 Cloudflare Pages Functions 与 D1 提供，可以长期免费运行。

在线访问：[field-notes-2fi.pages.dev](https://field-notes-2fi.pages.dev)

## 功能

- 项目分类筛选、截图卡片、项目详情和 GitHub 源码入口
- 文章列表、文章详情、标签聚合和阅读目录
- Pagefind 中文静态搜索
- 无需账号的站内文章评论、项目评论、一级回复和固定全局留言板
- RSS、站点地图、SEO 元信息和 404 页面
- 响应式导航、深浅主题、键盘操作和减少动效支持
- Markdown/MDX 内容模型与构建期字段校验

## 成本

| 服务 | 用途 | 费用 |
|---|---|---:|
| GitHub 公共仓库 | 代码、文章和项目 | 0 元 |
| Cloudflare Pages / Functions | 静态网站、评论接口、HTTPS 和 `pages.dev` 子域名 | 免费额度内 0 元 |
| Cloudflare D1 | 评论与留言数据 | 免费额度内 0 元 |
| Pagefind | 本地全文搜索 | 0 元 |

网站不需要自购应用服务器或付费域名；Cloudflare 负责运行接口与数据库。

## 本地运行

需要 Node.js 22.12 或更高版本。

```bash
npm install
npm run dev
```

生产构建和完整检查：

```bash
npm test
npm run check
npm run build
npm run preview
```

`npm run build` 会先生成 Astro 静态页面，再由 Pagefind 在 `dist/pagefind` 中生成中文搜索索引。

也可以从干净目录一次执行全部单元测试、类型检查、生产构建和构建产物烟测：

```bash
npm run verify
```

## 站点身份

姓名、定位、简介、导航和社交链接统一维护在 `src/config/site.ts`。公开部署前需要同步设置 `SITE_URL`，并更新 `public/robots.txt` 中的站点地图地址。

当前公开定位为“产品型全栈工程师”：强调从需求梳理、系统设计、前后端开发到部署迭代的完整交付过程。

## 发布文章

在 `src/content/articles/` 新建 Markdown 或 MDX：

```md
---
title: 文章标题
description: 一句话摘要
publishedAt: 2026-07-13
updatedAt: 2026-07-14
tags: [Astro, 工程实践]
featured: false
draft: false
---

这里开始写正文。
```

字段不符合 `src/content.config.ts` 时构建会直接失败并指出问题。

## 发布项目

在 `src/content/projects/` 新建 Markdown 或 MDX：

```md
---
title: 项目名称
description: 项目解决什么问题
publishedAt: 2026-07-13
status: active
category: 网站产品
tech: [Astro, TypeScript]
cover: /images/projects/project-name.png
demoUrl: https://example.com
repoUrl: https://github.com/your-name/project
featured: true
draft: false
---

## 项目目标

这里开始写项目详情。
```

`status` 只能是 `active`、`completed` 或 `archived`；`category` 只能选择网站产品、业务系统、开发工具、数据与搜索或 AI 自动化。

公开项目必须同时提供站内封面图和 GitHub 仓库地址。项目封面放在 `public/images/projects/`，建议使用真实运行界面，而不是与成品不一致的效果图。

项目发布遵守以下约束：

- 一个项目对应一个独立公开仓库；
- 仓库包含可运行源码、README、许可证和必要的环境变量示例；
- 发布前检查密钥、客户信息、内部地址、业务数据和提交历史；
- 未完成源码整理或安全检查时保留 `draft: true`，不在作品库公开。

> `draft: true` 只会阻止生产页面生成。公开 GitHub 仓库仍然可以看到已经提交的草稿文件；真正的私密草稿不要提交到仓库。

## 配置评论和全局留言

评论使用 Cloudflare D1，不要求访客注册账号。文章、项目和留言板分别使用稳定资源键，回复最多一层。

首次部署时创建数据库并应用迁移：

```bash
npx wrangler d1 create field-notes-comments
npx wrangler d1 migrations apply field-notes-comments --remote
```

把命令返回的真实数据库 ID 写入 `wrangler.jsonc` 的 `d1_databases`，然后设置只存在于 Cloudflare 的哈希密钥：

```bash
node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))" | npx wrangler pages secret put COMMENT_HASH_SECRET --project-name field-notes
```

密钥用于把访问 IP 转换为不可逆的限流标识。不要把密钥写入 `.env.example`、Git、日志或部署输出。

本地联调评论接口时，先执行 `npm run build`，再用 Wrangler Pages 开发服务器加载 D1 绑定；本地密钥放在 Git 忽略的 `.dev.vars` 中。

## 免费部署到 Cloudflare Pages

当前项目使用 Wrangler 直接部署，避免在控制台重复维护绑定。先完成验证：

```bash
npm run verify
```

再把静态产物与 Pages Functions 一起部署：

```bash
npx wrangler pages deploy dist --project-name field-notes --branch main
```

`wrangler.jsonc` 声明 D1 绑定；生产环境还必须存在 `COMMENT_HASH_SECRET`。部署成功后检查评论 GET、发布、回复和刷新持久化。

## 备份与迁移

- 文章、项目、样式和配置都在 Git 仓库中，Clone 仓库就是完整备份。
- 评论和留言保存在 Cloudflare D1，可使用 `wrangler d1 export` 定期导出；导出文件可能包含公开留言，不要提交到仓库。
- `dist/` 是标准静态内容；迁移到不支持 Pages Functions/D1 的平台时，需要替换评论接口。
- 如果不购买独立域名，迁移托管平台时免费二级域名会改变。

## 目录

```text
src/config/site.ts          站点身份
src/content.config.ts       内容字段规则
src/content/articles/       文章
src/content/projects/       项目
src/components/             UI 与交互组件
src/layouts/                页面布局
src/pages/                  路由
functions/api/comments.ts   评论接口
migrations/                 D1 数据库迁移
wrangler.jsonc              Pages 与 D1 绑定
tests/                      自动测试
```

## 许可证

代码使用 MIT License。文章和项目内容的版权由内容作者保留。
