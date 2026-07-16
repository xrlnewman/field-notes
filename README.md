# 许汝林个人博客

一个以项目作品和开源源码为核心的个人博客。网站聚合七个完整网站产品，用于展示许汝林的产品实践、技术文章和完整交付能力；内容静态生成，评论通过 Giscus 嵌入站内并由 GitHub Discussions 保存，可以长期免费运行。

在线访问：[field-notes-2fi.pages.dev](https://field-notes-2fi.pages.dev)

## 功能

- 七个网站产品聚合展示，关联前台、运营后台、后端 API 与各自 GitHub 源码入口
- 文章列表、文章详情、标签聚合和阅读目录
- Pagefind 中文静态搜索
- GitHub 登录后的站内文章评论、项目评论、回复和固定全局留言板
- RSS、站点地图、SEO 元信息和 404 页面
- 深空观测站、梦幻银河、宇宙终端三套星空主题，支持主题记忆、响应式导航、键盘操作和减少动效
- Cloudflare Pages 免费托管，无需自购应用服务器
- Markdown/MDX 内容模型与构建期字段校验

## 成本

| 服务 | 用途 | 费用 |
|---|---|---:|
| GitHub 公共仓库 | 代码、文章和项目 | 0 元 |
| Cloudflare Pages | 静态网站、HTTPS 和 `pages.dev` 子域名 | 免费额度内 0 元 |
| GitHub Discussions / Giscus | 登录、评论、回复和全局留言 | 0 元 |
| Pagefind | 本地全文搜索 | 0 元 |

网站不需要自购应用服务器或付费域名；Cloudflare 分发静态页面，GitHub 保存讨论数据。

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
category: 个人品牌
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

`status` 只能是 `active`、`completed` 或 `archived`；`category` 只能选择个人品牌、电商平台、社区服务或企业官网。

公开项目必须同时提供站内封面图和 GitHub 仓库地址。项目封面放在 `public/images/projects/`，建议使用真实运行界面，而不是与成品不一致的效果图。

项目发布遵守以下约束：

- 单仓项目使用 `repoUrl` 记录唯一公开源码入口；多仓项目使用 `repositories` 列出用户前台、运营后台和服务端，并保留 `repoUrl` 作为首要仓库入口；
- 每个仓库 URL 必须指向实际公开位置，源码入口包含 README 和足以理解、运行核心功能的源码；配置方式写入文档，真实环境文件和凭据不入库；
- 发布前检查密钥、客户信息、内部地址、业务数据、构建产物和提交历史；子目录快照按文件白名单更新；
- 未完成源码整理或安全检查时保留 `draft: true`，不在作品库公开。

> `draft: true` 只会阻止生产页面生成。公开 GitHub 仓库仍然可以看到已经提交的草稿文件；真正的私密草稿不要提交到仓库。

## 源码展柜

`showcase/` 保留的是已隐藏工具项目的脱敏源码快照，用于维护历史实现与安全检查，不会出现在网站项目列表，也不作为当前七个网站产品的源码入口。

快照保留可审阅的核心实现和运行说明，不包含安装包、运行时数据库或本地凭据，也不复制依赖目录、Git 元数据和公司业务数据。更新快照时继续使用文件白名单，并在提交前复查目录映射与敏感信息。

根目录的 MIT License 覆盖仓库内源码，包括 `showcase/` 中的源码快照；文章和项目介绍等内容的版权仍由内容作者保留。

## 配置评论和全局留言

评论使用 Giscus。访客可以直接在博客页面内阅读讨论，发布或回复前必须登录 GitHub；文章和项目按路径映射，留言板固定映射到 `global-guestbook`。

仓库必须保持 Discussions 开启并安装 Giscus GitHub App。当前项目已经配置好以下公开参数，通常无需修改：

```dotenv
PUBLIC_GISCUS_REPO=xrlnewman/field-notes
PUBLIC_GISCUS_REPO_ID=R_kgDOTX84ug
PUBLIC_GISCUS_CATEGORY=General
PUBLIC_GISCUS_CATEGORY_ID=DIC_kwDOTX84us4DBKfw
```

这些值是 GitHub 公开标识，不是 OAuth 密钥。需要切换仓库或 Discussion 分类时，可以用同名 `PUBLIC_GISCUS_*` 环境变量覆盖项目默认值。

## 免费部署到 Cloudflare Pages

当前项目使用 Wrangler 直接部署，避免在控制台重复维护绑定。先完成验证：

```bash
npm run verify
```

再部署静态产物：

```bash
npx wrangler pages deploy dist --project-name field-notes --branch main
```

部署成功后检查三套主题、Giscus iframe、GitHub 登录入口以及留言和回复流程。

## 备份与迁移

- 文章、项目、样式和配置都在 Git 仓库中，Clone 仓库就是完整备份。
- 评论和留言保存在 GitHub Discussions，可通过仓库数据导出策略备份。
- `dist/` 是标准静态内容；迁移到其他静态托管平台时，只要允许加载 Giscus 即可继续使用评论。
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
src/components/GiscusComments.astro  GitHub 登录评论组件
wrangler.jsonc              Cloudflare Pages 部署配置
tests/                      自动测试
```

## 许可证

代码使用 MIT License。文章和项目内容的版权由内容作者保留。
