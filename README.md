# Field Notes

一个纯静态、可免费部署的个人博客，包含项目、文章、评论回复、全局留言、中文全文搜索、RSS 和深浅主题。

## 功能

- 项目列表与项目详情
- 文章列表、文章详情、标签聚合和阅读目录
- Pagefind 中文静态搜索
- Giscus 文章评论、项目评论和固定全局留言板
- RSS、站点地图、SEO 元信息和 404 页面
- 响应式导航、深浅主题、键盘操作和减少动效支持
- Markdown/MDX 内容模型与构建期字段校验

## 成本

| 服务 | 用途 | 费用 |
|---|---|---:|
| GitHub 公共仓库 | 代码、文章、项目和 Discussions | 0 元 |
| Cloudflare Pages | 静态网站托管、HTTPS、`pages.dev` 子域名 | 0 元 |
| Giscus | 评论和留言界面 | 0 元 |
| Pagefind | 本地全文搜索 | 0 元 |

网站不需要应用服务器、数据库和付费域名。

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

## 修改站点身份

统一编辑 `src/config/site.ts`：

```ts
export const siteConfig = {
  name: '你的站点名',
  brand: '你的字标',
  title: '站点标题',
  description: '站点描述',
  author: {
    name: '你的名字',
    bio: '一句个人介绍',
  },
  social: {
    github: 'https://github.com/your-name',
    email: 'mailto:you@example.com',
  },
  // 保留 nav 配置
};
```

同时把 `astro.config.mjs` 使用的 `SITE_URL` 设置成最终站点地址，并更新 `public/robots.txt` 中的站点地图地址。

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
tech: [Astro, TypeScript]
demoUrl: https://example.com
repoUrl: https://github.com/your-name/project
featured: true
draft: false
---

## 项目目标

这里开始写项目详情。
```

`status` 只能是 `active`、`completed` 或 `archived`。没有演示地址或源码地址时直接删除对应字段。

> `draft: true` 只会阻止生产页面生成。公开 GitHub 仓库仍然可以看到已经提交的草稿文件；真正的私密草稿不要提交到仓库。

## 配置评论和全局留言

1. 创建公开 GitHub 仓库并启用 Discussions。
2. 打开 [Giscus 配置页面](https://giscus.app/zh-CN)。
3. 输入仓库地址，选择一个允许 Giscus 创建讨论的分类。
4. 从生成配置中取得仓库名、仓库 ID、分类名和分类 ID。
5. 本地复制 `.env.example` 为 `.env`，或者在 Cloudflare Pages 中设置以下变量：

```text
PUBLIC_GISCUS_REPO=your-name/your-public-repo
PUBLIC_GISCUS_REPO_ID=R_your_repo_id
PUBLIC_GISCUS_CATEGORY=Comments
PUBLIC_GISCUS_CATEGORY_ID=DIC_your_category_id
```

文章和项目按页面路径建立独立讨论；`/guestbook/` 始终使用固定 term `global-guestbook`。缺少配置时页面会显示“评论区暂未启用”，正文仍然正常工作。

## 免费部署到 Cloudflare Pages

1. 把项目推送到 GitHub 公共仓库。
2. 登录 Cloudflare，进入 **Workers & Pages**。
3. 选择 **Create application → Pages → Connect to Git**。
4. 选择 GitHub 仓库。
5. 设置构建参数：

```text
Framework preset: Astro
Build command: npm run build
Build output directory: dist
Node.js version: 24
```

6. 在项目环境变量中加入 `SITE_URL` 和四个 `PUBLIC_GISCUS_*` 值。
7. 保存并部署，Cloudflare 会提供免费的 `项目名.pages.dev` HTTPS 地址。

后续每次推送到生产分支，Cloudflare Pages 都会自动重新构建。

## 备份与迁移

- 文章、项目、样式和配置都在 Git 仓库中，Clone 仓库就是完整备份。
- 评论和留言保存在 GitHub Discussions，可通过 GitHub API 另行导出。
- `dist/` 是标准静态文件，可迁移到 GitHub Pages 或其他静态托管平台。
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
tests/                      自动测试
```

## 许可证

代码使用 MIT License。文章和项目内容的版权由内容作者保留。
