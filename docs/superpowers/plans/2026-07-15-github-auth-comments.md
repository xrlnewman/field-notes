# GitHub 登录评论恢复 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 恢复 Giscus，让留言、文章评论和项目评论必须登录 GitHub 后在博客页面内发布。

**Architecture:** 使用静态 Astro 组件挂载 Giscus iframe，公开仓库配置由项目默认值提供并允许环境变量覆盖。删除原生匿名评论 Pages Function 和前端表单，使匿名写入入口在服务端也不存在。

**Tech Stack:** Astro 7、TypeScript、Vitest、Giscus、GitHub Discussions、Cloudflare Pages

## Global Constraints

- 保留 `observatory`、`nebula`、`terminal` 三套星空主题。
- 不删除原 D1 数据库，只移除部署绑定和匿名 API。
- 评论必须在博客页面内完成，发布和回复由 GitHub 登录鉴权。
- 使用测试先行；每次行为修改先看到目标测试失败。

---

### Task 1: 锁定 Giscus 配置与构建契约

**Files:**
- Create: `tests/giscus.test.ts`
- Modify: `tests/build-smoke.test.ts`

**Interfaces:**
- Consumes: Astro 静态构建产物 `dist/**/*.html`
- Produces: `readGiscusConfig()`、`defaultGiscusConfig`、`resolveGiscusTheme()` 的行为契约

- [ ] **Step 1: 写失败测试**

断言完整配置可读取、缺省时使用 `xrlnewman/field-notes` 的公开 ID、三种星空主题映射到合法 Giscus 深色主题；构建产物包含 `data-giscus-host`、`giscus.app/client.js` 和 GitHub 登录说明，不包含 `data-comment-form`。

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run tests/giscus.test.ts tests/build-smoke.test.ts`

Expected: FAIL，原因是 Giscus 文件和宿主尚未恢复，当前产物仍包含匿名评论表单。

### Task 2: 恢复嵌入式 GitHub 登录评论

**Files:**
- Create: `src/lib/giscus.ts`
- Create: `src/components/GiscusComments.astro`
- Modify: `.env.example`
- Modify: `src/env.d.ts`
- Modify: `src/pages/guestbook.astro`
- Modify: `src/layouts/ArticleLayout.astro`
- Modify: `src/layouts/ProjectLayout.astro`

**Interfaces:**
- Consumes: `PUBLIC_GISCUS_REPO`、`PUBLIC_GISCUS_REPO_ID`、`PUBLIC_GISCUS_CATEGORY`、`PUBLIC_GISCUS_CATEGORY_ID` 可选覆盖值和 `cosmic-theme-change` 事件
- Produces: `<GiscusComments mapping="pathname | specific" term? title? />`

- [ ] **Step 1: 实现最小配置模块**

实现公开默认配置、环境变量校验和星空主题映射；不引入 OAuth 密钥。

- [ ] **Step 2: 恢复组件并适配三主题**

组件懒加载 `https://giscus.app/client.js`，通过 `postMessage` 在 `cosmic-theme-change` 后同步 Giscus 主题；加载失败时展示重试提示。

- [ ] **Step 3: 替换三类页面入口**

留言板使用 `specific + global-guestbook`；文章和项目使用 `pathname`。删除昵称输入与“无需登录”文案。

- [ ] **Step 4: 运行目标测试确认通过**

Run: `npx vitest run tests/giscus.test.ts`

Expected: PASS。

### Task 3: 撤销匿名写入面

**Files:**
- Delete: `src/components/Comments.astro`
- Delete: `src/lib/comments.ts`
- Delete: `src/lib/comment-ui-state.ts`
- Delete: `src/lib/comment-pagination.ts`
- Delete: `functions/api/comments.ts`
- Delete: `tests/comments.test.ts`
- Delete: `tests/comment-ui-state.test.ts`
- Delete: `tests/comments-api.test.ts`
- Modify: `package.json`
- Modify: `wrangler.jsonc`
- Modify: `src/components/Footer.astro`
- Modify: `src/content/projects/field-notes.md`

**Interfaces:**
- Consumes: Task 2 的 Giscus 页面入口
- Produces: 无匿名评论 Pages Function 的静态部署

- [ ] **Step 1: 删除匿名前端、API 和专属测试**

移除原生匿名评论实现，测试脚本改为执行 `tests/giscus.test.ts`。

- [ ] **Step 2: 移除 D1 部署绑定并更新文案**

从 `wrangler.jsonc` 移除 `COMMENTS_DB` 绑定，页脚与项目说明改为 GitHub Discussions；不删除外部 D1 数据库。

- [ ] **Step 3: 构建并运行冒烟测试**

Run: `npm run build && npx vitest run tests/build-smoke.test.ts`

Expected: PASS，构建产物有三个 Giscus 宿主类型且无匿名表单。

### Task 4: 全量验证与部署

**Files:**
- Modify only if verification exposes a scoped defect.

**Interfaces:**
- Consumes: Tasks 1-3 的完整实现
- Produces: Cloudflare Pages 生产部署

- [ ] **Step 1: 全量验证**

Run: `npm run verify`

Expected: 所有 Vitest 测试通过，Astro 0 errors / 0 warnings / 0 hints，静态构建成功。

- [ ] **Step 2: 浏览器点测**

验证三个主题按钮、留言板 Giscus iframe、文章/项目评论宿主、控制台无 error；未登录时由 Giscus 展示 GitHub 登录入口。

- [ ] **Step 3: 提交、合并并部署**

提交格式：`fix(comments): 恢复 GitHub 登录评论`。合并到 `main` 后使用 Wrangler 从项目根目录部署 `dist`，确保 `functions/` 已不存在。

- [ ] **Step 4: 生产验收**

验证 `https://field-notes-2fi.pages.dev/` 有三套主题，`/guestbook/` 有 Giscus，`POST /api/comments` 返回 404。
