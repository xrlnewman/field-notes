# GitHub Profile Only Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 撤销博客中越界加入的个人档案组件，恢复上一版首页与关于页，并把新的专业头像只更新到 GitHub。

**Architecture:** 以 `e6560e2` 作为博客个人档案功能引入前的基线，只还原个人档案相关页面和配置，同时保留之后的项目截图变更。头像作为独立工作区产物生成并上传 GitHub，不进入博客静态资源和页面依赖。

**Tech Stack:** Astro、TypeScript、Vitest、Cloudflare Pages、GitHub Profile、内置 ImageGen

## Global Constraints

- 首页右侧必须恢复 `7 年经验 / 4 个网站产品 / 永久免费`。
- GitHub 头像不得重新出现在博客页面。
- 项目截图、三主题、Giscus 评论留言和永久免费说明保持不变。
- 不新增依赖，不修改无关项目内容。

---

### Task 1: 锁定博客范围回退契约

**Files:**
- Modify: `tests/profile-identity.test.ts`
- Modify: `tests/brand.test.ts`
- Modify: `tests/layout-contract.test.ts`

**Interfaces:**
- Consumes: `src/pages/index.astro`、`src/pages/about.astro`、`src/config/site.ts` 的源码文本。
- Produces: 证明博客不再包含个人档案组件、首页恢复三项数据的回归契约。

- [ ] **Step 1: 先写失败测试**

将 `tests/profile-identity.test.ts` 改为读取首页、关于页、站点配置和组件路径，并断言：

```ts
expect(homeSource).not.toContain('ProfileIdentity');
expect(homeSource).toContain('class="hero-studio__stats"');
expect(homeSource).toContain('7 年经验');
expect(homeSource).toContain('永久免费');
expect(aboutSource).not.toContain('ProfileIdentity');
expect(siteSource).not.toContain('avatarSrc');
expect(existsSync(profileComponentPath)).toBe(false);
```

- [ ] **Step 2: 运行测试并确认按预期失败**

Run: `npx vitest run tests/profile-identity.test.ts`

Expected: FAIL，原因是当前首页和关于页仍包含 `ProfileIdentity`，组件文件仍存在。

- [ ] **Step 3: 提交测试红灯证据前不修改生产代码**

记录失败断言，确认失败与本次范围错误一致。

### Task 2: 恢复上一版博客布局

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/pages/about.astro`
- Modify: `src/config/site.ts`
- Delete: `src/components/ProfileIdentity.astro`
- Delete: `public/images/profile/xu-rulin-avatar.png`
- Modify: `tests/brand.test.ts`
- Modify: `tests/layout-contract.test.ts`

**Interfaces:**
- Consumes: Task 1 的失败契约和 Git 基线 `e6560e2`。
- Produces: 不再依赖个人档案组件的首页与关于页。

- [ ] **Step 1: 最小恢复首页右侧**

首页使用上一版结构：

```astro
<ul class="hero-studio__stats" aria-label="工作室数据">
  <li><strong>7 年经验</strong><span>持续交付真实业务</span></li>
  <li aria-label={`${projects.length} 个网站产品`}><strong data-project-count={projects.length}>{projects.length}</strong><span>个网站产品</span></li>
  <li><strong>永久免费</strong><span>个人博客与源码</span></li>
</ul>
```

同时恢复“阅读文章”按钮和 `.hero-studio__stats` 的桌面、平板、手机样式。

- [ ] **Step 2: 移除关于页个人档案卡片**

删除 `ProfileIdentity` 导入和渲染，恢复上一版标题字号与简介间距：

```css
header h1 { margin: 0; font-size: clamp(3.4rem, 9vw, 7.4rem); line-height: 0.97; }
header > p:last-child { max-width: 620px; margin: 28px 0 0; color: var(--muted); font-size: 1.2rem; }
```

- [ ] **Step 3: 删除博客专用档案资源**

删除组件和博客头像文件，并从 `siteConfig.author` 移除：

```ts
avatarSrc
availability
skills
```

- [ ] **Step 4: 运行定向测试确认绿灯**

Run: `npx vitest run tests/profile-identity.test.ts tests/brand.test.ts tests/layout-contract.test.ts`

Expected: PASS，且无错误或警告。

- [ ] **Step 5: 提交博客范围修正**

```bash
git add src/pages/index.astro src/pages/about.astro src/config/site.ts tests/profile-identity.test.ts tests/brand.test.ts tests/layout-contract.test.ts
git add -u src/components/ProfileIdentity.astro public/images/profile/xu-rulin-avatar.png
git commit -m "fix(profile): 恢复博客上一版个人信息布局"
```

### Task 3: 生成并更新 GitHub 专用头像

**Files:**
- Create: `E:/project/artifacts/github-profile/xu-rulin-github-avatar.png`

**Interfaces:**
- Consumes: 设计规格中的头像方向。
- Produces: 1024×1024 PNG，供 GitHub 头像上传。

- [ ] **Step 1: 使用内置 ImageGen 生成头像**

Prompt:

```text
Use case: logo-brand
Asset type: GitHub profile avatar
Primary request: create a premium minimal XR monogram identity mark for a senior full-stack product engineer
Style/medium: crisp geometric brand mark with subtle dimensional depth, not pixel art
Composition/framing: centered square, oversized simple mark, safe inside a circular crop, legible at 32px
Lighting/mood: restrained and professional
Color palette: deep navy, midnight blue, ice blue, a small white highlight
Constraints: no human portrait, no scenery, no slogan, no watermark, no tiny details, no extra letters
Avoid: orange, beige, retro pixels, mascots, gaming style, busy gradients
```

- [ ] **Step 2: 检查并保存最终 PNG**

检查圆形裁剪安全区、32px 可读性、无多余字符和水印，将最终文件保存到指定工作区产物路径。

- [ ] **Step 3: 上传 GitHub 并核验公开资料**

在 GitHub 个人资料设置中仅替换头像，不修改昵称、简介、博客链接和公开仓库可见性。核验公开资料页显示新头像、昵称“许汝林”、既有简介和博客链接。

### Task 4: 全量验证、PR 与上线

**Files:**
- No new production files.

**Interfaces:**
- Consumes: Task 2 的博客代码和 Task 3 的 GitHub 头像结果。
- Produces: 已合并、已部署、已验收的范围修正。

- [ ] **Step 1: 同步 CodeGraph 并运行完整验证**

Run: `codegraph sync && npm run verify && git diff --check`

Expected: 396 项现有测试按调整后的实际数量全部通过，Astro 0 errors / 0 warnings / 0 hints，构建烟测全部通过。

- [ ] **Step 2: 浏览器验收本地页面**

在 1440×900 和 390×844 检查首页与关于页：无个人档案卡片、首页三项数据可见、无横向溢出、字体已加载、控制台无错误。

- [ ] **Step 3: 推送分支并通过 PR 合并**

```bash
git push -u origin fix/github-profile-only
```

创建 PR，合并到 `main` 后删除远程分支。

- [ ] **Step 4: 部署 Cloudflare Pages 生产环境**

Run: `npx wrangler pages deploy dist --project-name field-notes --branch main --commit-dirty=true`

Expected: 部署成功并更新 `https://field-notes-2fi.pages.dev/`。

- [ ] **Step 5: 线上最终验收**

复查首页、关于页、项目页、留言页和 GitHub 公开资料；确认本次只改变博客个人档案范围与 GitHub 头像。
