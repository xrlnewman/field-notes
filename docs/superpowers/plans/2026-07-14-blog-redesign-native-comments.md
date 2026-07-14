# 个人博客作品集重构与原生评论 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将博客改造成项目优先、分类清晰的作品集，并用 Cloudflare D1 实现无需 GitHub、完全站内完成的评论与回复。

**Architecture:** Astro 继续静态生成内容页面；项目分类由共享纯函数提供统计和筛选数据；`Comments.astro` 在浏览器调用 Pages Function `/api/comments`；Function 校验输入、执行限流并读写 D1。文章、项目和留言板仅通过稳定的资源键共享评论能力。

**Tech Stack:** Astro 7、TypeScript 6、Vitest 4、Cloudflare Pages Functions、Cloudflare D1、原生浏览器 API、CSS

## Global Constraints

- 页面内容、文档和提交信息使用中文；代码标识符使用英文。
- 不增加前端框架、评论 SaaS、账号系统或付费依赖。
- 评论正文只能以纯文本写入 DOM，禁止 `innerHTML`。
- `COMMENT_HASH_SECRET` 只进入 Cloudflare Pages 环境，不写入文件、Git 或日志。
- 所有生产代码必须先有能正确失败的测试。
- 保留 Astro 静态内容、Pagefind、RSS、站点地图和深色模式。

---

### Task 1: 项目分类模型与分类入口

**Files:**
- Modify: `src/lib/projects.ts`
- Create: `src/components/ProjectCategoryGrid.astro`
- Modify: `src/components/ProjectGallery.astro`
- Modify: `src/content/projects/trend-product-lab.md`
- Test: `tests/projects.test.ts`

**Interfaces:**
- Produces: `projectCategories`，固定为 `网站产品 | 业务系统 | 开发工具 | 数据与搜索 | AI 自动化`。
- Produces: `getProjectCategoryStats(projects): Array<{ category: ProjectCategory; count: number }>`，始终返回五类。
- Produces: 首页分类链接 `/projects/?category=<encodeURIComponent(category)>`。
- Consumes: `ProjectCard` 的 `data-project-category` 属性。

- [ ] **Step 1: 写分类统计失败测试**

在 `tests/projects.test.ts` 增加：

```ts
it('returns every configured category with a public project count', () => {
  expect(getProjectCategoryStats([
    { data: { category: '网站产品' as const } },
    { data: { category: '网站产品' as const } },
  ])).toEqual([
    { category: '网站产品', count: 2 },
    { category: '业务系统', count: 0 },
    { category: '开发工具', count: 0 },
    { category: '数据与搜索', count: 0 },
    { category: 'AI 自动化', count: 0 },
  ]);
});
```

- [ ] **Step 2: 运行测试并确认因函数或分类缺失而失败**

Run: `npm test -- tests/projects.test.ts`

Expected: FAIL，错误包含 `getProjectCategoryStats` 未导出或分类值不匹配。

- [ ] **Step 3: 实现固定分类和统计函数**

```ts
export const projectCategories = ['网站产品', '业务系统', '开发工具', '数据与搜索', 'AI 自动化'] as const;

export function getProjectCategoryStats<T extends { data: { category: ProjectCategory } }>(projects: readonly T[]) {
  const counts = new Map<ProjectCategory, number>();
  projects.forEach(({ data }) => counts.set(data.category, (counts.get(data.category) ?? 0) + 1));
  return projectCategories.map((category) => ({ category, count: counts.get(category) ?? 0 }));
}
```

`ProjectGallery.astro` 始终渲染“全部”和五个分类，按钮包含数量；脚本从 `URLSearchParams` 恢复合法分类并在点击时使用 `history.replaceState` 更新查询参数。新建 `ProjectCategoryGrid.astro`，把五类渲染为首页分类卡片。

- [ ] **Step 4: 运行分类测试**

Run: `npm test -- tests/projects.test.ts`

Expected: PASS。

- [ ] **Step 5: 提交分类能力**

```bash
git add src/lib/projects.ts src/components/ProjectCategoryGrid.astro src/components/ProjectGallery.astro src/content/projects/trend-product-lab.md tests/projects.test.ts
git commit -m "feat(projects): 增加完整项目分类导航"
```

---

### Task 2: 首页、项目页和项目卡片视觉重构

**Files:**
- Modify: `src/styles/global.css`
- Modify: `src/pages/index.astro`
- Modify: `src/pages/projects/index.astro`
- Modify: `src/components/ProjectCard.astro`
- Modify: `src/components/SectionHeading.astro`
- Modify: `src/components/Header.astro`
- Test: `tests/brand.test.ts`
- Test: `tests/build-smoke.test.ts`

**Interfaces:**
- Consumes: `ProjectCategoryGrid` 和 `ProjectGallery`。
- Produces: `data-project-catalog`、`data-project-category-grid`、`data-project-count`，供构建测试和浏览器验收定位。

- [ ] **Step 1: 写页面结构失败测试**

在 `tests/build-smoke.test.ts` 增加对生成首页和项目页的断言：

```ts
expect(home).toContain('data-project-category-grid');
expect(home).toContain('公开项目');
expect(projects).toContain('data-project-catalog');
expect(projects).toContain('业务系统');
expect(projects).toContain('数据与搜索');
expect(projects).toContain('AI 自动化');
expect(projects).toContain('<h1');
```

- [ ] **Step 2: 运行构建测试并确认失败**

Run: `npm run test:build`

Expected: FAIL，首页缺少分类网格且项目页缺少新的目录结构。

- [ ] **Step 3: 实现紧凑首屏和产品目录**

首页首屏使用 `hero-studio` 双栏；右栏展示 `projects.length`、`projectCategories.length`、`7 年` 三项统计。分类网格紧跟首屏。项目卡片把截图区域提高为视觉主角，卡片正文缩短并固定操作区。项目页使用真实 `<h1>`、公开项目数和分类说明。

全局设计变量调整为暖白画布、深墨色文字、橙色主强调和蓝绿色辅助强调；深色模式提供对应变量。所有交互保留 `:focus-visible`，移动端不小于 44px。

- [ ] **Step 4: 运行构建和品牌测试**

Run: `npm test && npm run check && npm run test:build`

Expected: 全部 PASS，Astro 0 errors、0 warnings。

- [ ] **Step 5: 提交视觉重构**

```bash
git add src/styles/global.css src/pages/index.astro src/pages/projects/index.astro src/components/ProjectCard.astro src/components/SectionHeading.astro src/components/Header.astro tests/brand.test.ts tests/build-smoke.test.ts
git commit -m "feat(ui): 重构项目优先的作品集视觉"
```

---

### Task 3: 评论领域校验与回复组装

**Files:**
- Create: `src/lib/comments.ts`
- Create: `tests/comments.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `parseCommentResource(value: unknown): { type: 'article' | 'project' | 'guestbook'; id: string } | null`。
- Produces: `validateCommentSubmission(value: unknown): ValidationResult`。
- Produces: `buildCommentThreads(rows: CommentRow[]): CommentThread[]`，只保留已发布数据并组装一级回复。
- Produces: `CommentRow`、`CommentItem`、`CommentThread` 类型。

- [ ] **Step 1: 写资源、输入和回复失败测试**

`tests/comments.test.ts` 至少覆盖：

```ts
expect(parseCommentResource('article:redisearch-result-set')).toEqual({ type: 'article', id: 'redisearch-result-set' });
expect(parseCommentResource('unknown:anything')).toBeNull();
expect(validateCommentSubmission({ resource: 'guestbook:global', authorName: '许汝林', content: '你好' }).ok).toBe(true);
expect(validateCommentSubmission({ resource: 'guestbook:global', authorName: 'A', content: 'x' }).ok).toBe(false);
expect(buildCommentThreads([replyRow, parentRow])[0]?.replies).toHaveLength(1);
```

- [ ] **Step 2: 运行测试并确认模块缺失**

Run: `npx vitest run tests/comments.test.ts`

Expected: FAIL，无法导入 `src/lib/comments.ts`。

- [ ] **Step 3: 实现纯函数**

资源 ID 只接受小写字母、数字和连字符，`guestbook` 只接受 `global`。昵称和正文先 `trim()`；昵称 2–24 字符，正文 2–1000 字符。`buildCommentThreads` 使用 `Map` 一次组装，忽略孤立回复和嵌套回复。

- [ ] **Step 4: 运行评论单元测试**

Run: `npx vitest run tests/comments.test.ts`

Expected: PASS。

- [ ] **Step 5: 把评论测试纳入默认测试并提交**

将 `tests/comments.test.ts` 加入 `package.json` 的 `test` 脚本后运行 `npm test`，再提交：

```bash
git add src/lib/comments.ts tests/comments.test.ts package.json
git commit -m "feat(comments): 增加评论校验与回复模型"
```

---

### Task 4: D1 数据库和 Pages Function API

**Files:**
- Create: `migrations/0001_comments.sql`
- Create: `functions/api/comments.ts`
- Create: `tests/comments-api.test.ts`
- Create: `wrangler.jsonc`
- Modify: `package.json`

**Interfaces:**
- Consumes: Task 3 的资源与输入校验函数。
- Produces: `GET /api/comments?resource=<resource>`。
- Produces: `POST /api/comments`。
- Requires binding: `COMMENTS_DB`。
- Requires secret: `COMMENT_HASH_SECRET`。

- [ ] **Step 1: 写 API 失败测试**

使用内存 Fake D1 覆盖四个行为：合法 GET 返回线程；非法资源返回 400；合法 POST 返回 201；同一 IP 哈希 45 秒内再次 POST 返回 429。测试直接导入 `onRequestGet` 和 `onRequestPost`，传入最小 `request/env` 上下文。

- [ ] **Step 2: 运行 API 测试并确认入口缺失**

Run: `npx vitest run tests/comments-api.test.ts`

Expected: FAIL，无法导入 `functions/api/comments.ts`。

- [ ] **Step 3: 建立 D1 表结构**

迁移必须创建 `comments` 表、`idx_comments_resource_created`、`idx_comments_parent`、`idx_comments_ip_created`，并启用 `parent_id` 外键。`status` 仅允许 `published | hidden`。

- [ ] **Step 4: 实现 GET 和 POST**

GET 使用参数化查询。POST 先处理蜜罐，再校验资源和字段；校验父评论属于同一资源且自身没有父级；使用 `crypto.subtle.digest('SHA-256', secret + ':' + ip)` 生成哈希；检查 45 秒频率；使用 `crypto.randomUUID()` 生成 ID。所有错误按设计文档的 JSON 信封返回。

- [ ] **Step 5: 运行 API 与全量单元测试**

Run: `npx vitest run tests/comments-api.test.ts && npm test`

Expected: PASS。

- [ ] **Step 6: 创建 D1 并写入真实绑定**

Run: `npx wrangler d1 create field-notes-comments`

Expected: 输出数据库名和 `database_id`。把该真实 ID 写入 `wrangler.jsonc` 的 `d1_databases[0]`；不要使用示例值。

Run: `npx wrangler d1 migrations apply field-notes-comments --remote`

Expected: `0001_comments.sql` 成功应用。

- [ ] **Step 7: 提交 API 和基础设施声明**

```bash
git add migrations/0001_comments.sql functions/api/comments.ts tests/comments-api.test.ts wrangler.jsonc package.json
git commit -m "feat(comments): 接入 D1 原生评论接口"
```

---

### Task 5: 站内评论界面替换 Giscus

**Files:**
- Create: `src/components/Comments.astro`
- Modify: `src/pages/articles/[id].astro`
- Modify: `src/pages/projects/[id].astro`
- Modify: `src/pages/guestbook.astro`
- Modify: `src/layouts/ArticleLayout.astro`
- Modify: `src/layouts/ProjectLayout.astro`
- Delete: `src/components/GiscusComments.astro`
- Delete: `src/lib/giscus.ts`
- Delete: `tests/giscus.test.ts`
- Modify: `tests/build-smoke.test.ts`
- Modify: `package.json`

**Interfaces:**
- `Comments.astro` Props: `{ resource: `article:${string}` | `project:${string}` | 'guestbook:global'; title?: string }`。
- Consumes: Task 4 的 GET/POST JSON。
- Produces: `[data-comments-root]`、`[data-comment-form]`、`[data-comment-list]` 和回复按钮。

- [ ] **Step 1: 写静态输出失败测试**

更新 `tests/build-smoke.test.ts`：

```ts
expect(guestbook).toContain('data-comment-resource="guestbook:global"');
expect(article).toContain('data-comment-resource="article:redisearch-result-set"');
expect(project).toContain('data-comment-resource="project:field-notes"');
expect(guestbook).not.toContain('GitHub Discussions');
expect(guestbook).not.toContain('giscus.app');
```

- [ ] **Step 2: 运行构建测试并确认失败**

Run: `npm run test:build`

Expected: FAIL，页面仍输出 Giscus。

- [ ] **Step 3: 实现评论组件**

组件静态渲染标题、加载状态、空状态容器和昵称/正文表单。客户端脚本使用 `textContent`、`createElement`、`append` 渲染评论；发布时禁用提交按钮；成功后重新获取当前资源；失败时保留输入并显示中文错误。回复按钮在对应评论下展开同结构表单，`parentId` 只来自已加载评论 ID。

- [ ] **Step 4: 替换三类页面并删除 Giscus**

文章使用 `article:${entry.id}`，项目使用 `project:${entry.id}`，留言板固定 `guestbook:global`。删除所有 Giscus 配置和 GitHub Discussions 文案。

- [ ] **Step 5: 运行全量验证**

Run: `npm run verify`

Expected: 全部 PASS，Astro 0 errors、0 warnings。

- [ ] **Step 6: 提交站内评论界面**

```bash
git add -A
git commit -m "feat(comments): 将评论与留言完整留在站内"
```

---

### Task 6: 浏览器验收、部署和线上回归

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: 完整站点、D1 binding 和 Pages Function。
- Produces: Cloudflare Pages 线上版本。

- [ ] **Step 1: 更新说明**

README 说明项目分类、D1 评论、本地迁移和部署命令；删除 Giscus 配置说明。不得记录 secret 值。

- [ ] **Step 2: 运行提交前验证**

Run: `npm run verify`

Expected: 所有测试通过，构建成功，0 errors、0 warnings。

- [ ] **Step 3: 本地浏览器点测**

启动 `npx wrangler pages dev dist --d1 COMMENTS_DB=field-notes-comments --remote`，在 1440×900 与 390×844 验证：无横向溢出；五类可筛选且 URL 更新；首页截图和分类卡片清晰；文章/项目/留言板显示评论表单；评论与回复成功；控制台无 error/warning。

- [ ] **Step 4: 设置生产密钥**

生成至少 32 字节随机值，通过标准输入执行 `npx wrangler pages secret put COMMENT_HASH_SECRET --project-name field-notes`。随机值不能打印、保存或进入 shell 历史。

- [ ] **Step 5: 部署 Pages**

Run: `npx wrangler pages deploy dist --project-name field-notes --branch main`

Expected: 返回新的成功部署 URL，生产别名更新为 `https://field-notes-2fi.pages.dev`。

- [ ] **Step 6: 线上真实写入验收**

在留言板发布一条标记为验收的评论并回复一次，刷新确认持久化；随后使用 D1 参数化删除这两条验收数据。检查主页、项目页、文章页、留言板、RSS、站点地图和图片均为 200，控制台无错误。

- [ ] **Step 7: 提交文档并准备合并**

```bash
git add README.md
git commit -m "docs(readme): 补充 D1 评论与部署说明"
git fetch origin
git status --short --branch
```
