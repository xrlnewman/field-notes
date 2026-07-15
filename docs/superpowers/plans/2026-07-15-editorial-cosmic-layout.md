# 编辑型星空作品集布局 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把现有星空博客重排为更紧凑、项目优先、三主题一致的编辑型作品集，同时保留项目分类与 Giscus 站内评论留言。

**Architecture:** 继续使用现有 Astro 页面与组件，不新增运行时依赖。先用源码布局契约测试锁定标题上限、网格、卡片比例和 Giscus 保留规则，再分别收敛全局节奏、项目目录与详情/留言布局；主题只通过现有 CSS 变量换色。

**Tech Stack:** Astro 7、TypeScript 6、Vitest 4、CSS Grid、Giscus、Cloudflare Pages

## Global Constraints

- 必须保留 `observatory`、`nebula`、`terminal` 三套主题及现有主题切换逻辑。
- 必须保留 Giscus GitHub 登录后在本网站评论、回复和留言；不得恢复匿名评论 API。
- 首页和项目目录必须只展示四个网站项目及其公开 GitHub 仓库，不展示工具类项目。
- 项目图片必须保持 `width="1440" height="900"`、`aspect-ratio: 16 / 10` 与 `object-fit: contain`。
- 桌面页面主标题不得超过 72px；760px 以下主标题不得超过 44px；390px 宽度不得横向滚动。
- 所有筛选、按钮和主题控件最小触控高度不得低于 44px。
- 不新增字体、UI 框架、图标库或运行时依赖。

---

### Task 1: 建立布局契约并收敛全局排版

**Files:**
- Create: `tests/layout-contract.test.ts`
- Modify: `package.json`
- Modify: `src/styles/global.css`
- Modify: `src/components/Header.astro`
- Modify: `src/components/ThemeToggle.astro`

**Interfaces:**
- Consumes: 现有 `--content`、`--header-height`、三主题 token 与 Vitest 源码契约测试模式。
- Produces: `--content-narrow`、统一标题换行规则、68px 顶部导航和供后续任务复用的 `tests/layout-contract.test.ts`。

- [ ] **Step 1: 写入失败的全局布局契约测试**

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

describe('editorial cosmic layout', () => {
  it('defines the compact global rhythm and typography contract', () => {
    const globalStyles = read('src/styles/global.css');
    const header = read('src/components/Header.astro');

    expect(globalStyles).toContain('--content-narrow: 960px;');
    expect(globalStyles).toContain('--header-height: 68px;');
    expect(globalStyles).toContain('text-wrap: balance;');
    expect(globalStyles).toContain('overflow-wrap: anywhere;');
    expect(header).toContain('min-height: 44px;');
  });
});
```

- [ ] **Step 2: 运行测试并确认因新布局 token 缺失而失败**

Run: `npx vitest run tests/layout-contract.test.ts`

Expected: FAIL，至少包含 `--content-narrow: 960px;` 未找到。

- [ ] **Step 3: 实现最小全局排版与导航收敛**

```css
:root {
  --content: 1200px;
  --content-narrow: 960px;
  --header-height: 68px;
}

h1,
h2,
h3 {
  overflow-wrap: anywhere;
  text-wrap: balance;
}

p,
li {
  text-wrap: pretty;
}
```

在 `Header.astro` 中保持现有结构，把导航链接和主题按钮的最小高度统一为 44px；把品牌和主题切换的 padding、gap 各收敛 2-4px，不改变可访问名称和三主题脚本。

- [ ] **Step 4: 将新测试加入标准测试命令并确认通过**

```json
"test": "vitest run tests/content.test.ts tests/brand.test.ts tests/layout-contract.test.ts tests/cosmic-theme.test.ts tests/cosmic-interactions.test.ts tests/starfield.test.ts tests/projects.test.ts tests/giscus.test.ts tests/showcase.test.ts tests/showcase-database-security.test.ts tests/showcase-toolkit-bridge.test.ts tests/showcase-inventory-install.test.ts tests/showcase-web-security.test.ts tests/showcase-runtime.test.ts"
```

Run: `npx vitest run tests/layout-contract.test.ts tests/brand.test.ts tests/cosmic-theme.test.ts`

Expected: PASS，且三主题与字体契约仍通过。

- [ ] **Step 5: 提交**

```bash
git add tests/layout-contract.test.ts package.json src/styles/global.css src/components/Header.astro src/components/ThemeToggle.astro
git commit -m "test(layout): 建立编辑型作品集布局契约"
```

### Task 2: 重排首页与项目目录

**Files:**
- Modify: `tests/layout-contract.test.ts`
- Modify: `src/pages/index.astro`
- Modify: `src/pages/projects/index.astro`
- Modify: `src/components/ProjectGallery.astro`
- Modify: `src/components/ProjectCard.astro`

**Interfaces:**
- Consumes: Task 1 的全局排版 token、现有 `ProjectCard` props 与分类筛选脚本。
- Produces: 首页紧凑 7/5 首屏、统一双列项目卡、紧凑项目目录和不超过 290px 的卡片正文区。

- [ ] **Step 1: 添加首页和项目卡失败契约**

```ts
it('keeps the home hero compact and every product in one shared grid', () => {
  const home = read('src/pages/index.astro');
  const card = read('src/components/ProjectCard.astro');

  expect(home).toContain('max-height: 620px;');
  expect(home).toContain('grid-template-columns: minmax(0, 7fr) minmax(320px, 5fr);');
  expect(home).toContain('font-size: clamp(3.25rem, 5vw, 4rem);');
  expect(card).not.toContain('grid-column: 1 / -1;');
  expect(card).toContain('min-height: 280px;');
});

it('keeps project directory cards in the same two-column editorial grid', () => {
  const page = read('src/pages/projects/index.astro');
  const gallery = read('src/components/ProjectGallery.astro');

  expect(page).toContain('grid-template-columns: minmax(0, 1fr) auto;');
  expect(gallery).toContain('grid-template-columns: repeat(2, minmax(0, 1fr));');
});
```

- [ ] **Step 2: 运行测试并确认精选卡横跨规则导致失败**

Run: `npx vitest run tests/layout-contract.test.ts`

Expected: FAIL，包含 `grid-column: 1 / -1;` 仍存在或 620px 首屏规则缺失。

- [ ] **Step 3: 实现首页紧凑首屏和统一项目卡**

```css
.hero-studio {
  min-height: 540px;
  max-height: 620px;
  grid-template-columns: minmax(0, 7fr) minmax(320px, 5fr);
  gap: clamp(44px, 6vw, 88px);
  align-items: center;
  padding-block: clamp(72px, 8vw, 104px);
}

.hero-studio h1 {
  max-width: 760px;
  font-size: clamp(3.25rem, 5vw, 4rem);
  line-height: 1.08;
}

.home-grid--projects,
.project-gallery {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.project-card__body {
  min-height: 280px;
  padding: clamp(22px, 2.4vw, 30px);
}
```

删除 `ProjectCard.astro` 的精选卡跨列布局，但保留 `featured` 数据属性所需结构兼容；图片仍使用 16:10 和 contain。

- [ ] **Step 4: 实现紧凑项目目录头和筛选区**

```css
.page-shell { padding-block: clamp(64px, 8vw, 96px) 96px; }
.project-catalog__hero {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  margin-bottom: 40px;
  padding-bottom: 36px;
}
.project-catalog__count { min-height: 0; min-width: 160px; }
.project-catalog__count strong { font-size: clamp(3rem, 6vw, 4.5rem); }
.project-filters { margin-bottom: 24px; }
```

- [ ] **Step 5: 运行布局、品牌和项目测试**

Run: `npx vitest run tests/layout-contract.test.ts tests/brand.test.ts tests/projects.test.ts`

Expected: PASS，项目分类、四个网站项目、图片比例与新布局契约同时通过。

- [ ] **Step 6: 提交**

```bash
git add tests/layout-contract.test.ts src/pages/index.astro src/pages/projects/index.astro src/components/ProjectGallery.astro src/components/ProjectCard.astro
git commit -m "feat(portfolio): 重排首页与项目目录"
```

### Task 3: 重排项目详情与留言评论区

**Files:**
- Modify: `tests/layout-contract.test.ts`
- Modify: `src/layouts/ProjectLayout.astro`
- Modify: `src/components/RepositoryConstellation.astro`
- Modify: `src/pages/guestbook.astro`
- Modify: `src/components/GiscusComments.astro`

**Interfaces:**
- Consumes: 现有项目 frontmatter、`RepositoryConstellation` 输入和 `GiscusComments` 的 `mapping`/`term` 接口。
- Produces: 项目详情 8/4 首屏、紧凑仓库网格、正文同宽评论区和留言页 4/8 双栏。

- [ ] **Step 1: 添加详情与留言失败契约**

```ts
it('uses a restrained split project hero and prose-aligned comments', () => {
  const layout = read('src/layouts/ProjectLayout.astro');

  expect(layout).toContain('grid-template-columns: minmax(0, 8fr) minmax(280px, 4fr);');
  expect(layout).toContain('font-size: clamp(3.25rem, 6vw, 4.5rem);');
  expect(layout).toContain('max-width: var(--prose);');
  expect(layout).toContain('<GiscusComments mapping="pathname" />');
});

it('integrates the guestbook explanation and GitHub discussion in one split layout', () => {
  const guestbook = read('src/pages/guestbook.astro');
  const comments = read('src/components/GiscusComments.astro');

  expect(guestbook).toContain('grid-template-columns: minmax(240px, 4fr) minmax(0, 8fr);');
  expect(guestbook).toContain('font-size: clamp(3rem, 5vw, 4rem);');
  expect(guestbook).toContain('mapping="specific" term="global-guestbook"');
  expect(comments).toContain('登录 GitHub 后即可参与');
});
```

- [ ] **Step 2: 运行测试并确认旧大标题布局失败**

Run: `npx vitest run tests/layout-contract.test.ts`

Expected: FAIL，包含 8/4 项目首屏或 4/8 留言布局缺失。

- [ ] **Step 3: 实现项目详情 8/4 首屏**

将 `project-hero` 内部整理为 `.project-hero__grid`，左侧包含标题、简介、按钮，右侧为元信息；截图保持在网格之后。

```css
.project-hero { padding-block: clamp(72px, 8vw, 104px) 72px; }
.project-hero__grid {
  display: grid;
  grid-template-columns: minmax(0, 8fr) minmax(280px, 4fr);
  gap: clamp(40px, 6vw, 80px);
  align-items: end;
}
.project-hero h1 {
  max-width: 820px;
  font-size: clamp(3.25rem, 6vw, 4.5rem);
  line-height: 1.05;
}
.project-meta { grid-template-columns: 1fr; margin: 0; }
.project-showcase { margin-top: 48px; }
```

- [ ] **Step 4: 收敛产品全景、正文和评论**

```css
.project-panorama {
  grid-template-columns: minmax(220px, 0.3fr) minmax(0, 0.7fr);
  gap: clamp(36px, 5vw, 72px);
  padding-block: clamp(64px, 8vw, 88px);
}
.repository-node article { min-height: 260px; padding: 22px; }
.project-body-grid { grid-template-columns: 72px minmax(0, var(--prose)); padding-block: 72px 88px; }
.comments-slot { max-width: var(--prose); padding-bottom: 88px; }
```

- [ ] **Step 5: 实现留言页 4/8 一体式布局**

```astro
<div class="container guestbook-page" data-pagefind-body>
  <div class="guestbook-intro">
    <header>...</header>
    <div class="guestbook-rules">...</div>
  </div>
  <GiscusComments mapping="specific" term="global-guestbook" title="全局留言" />
</div>
```

```css
.guestbook-page {
  max-width: var(--content-narrow);
  display: grid;
  grid-template-columns: minmax(240px, 4fr) minmax(0, 8fr);
  gap: clamp(40px, 6vw, 72px);
  align-items: start;
  padding-block: clamp(72px, 9vw, 104px) 96px;
}
.guestbook-page header h1 { font-size: clamp(3rem, 5vw, 4rem); line-height: 1.02; }
.guestbook-rules { grid-template-columns: 1fr; gap: 14px; margin-top: 36px; }
@media (max-width: 760px) {
  .guestbook-page { grid-template-columns: 1fr; }
}
```

- [ ] **Step 6: 运行评论、布局和完整验证**

Run: `npx vitest run tests/layout-contract.test.ts tests/projects.test.ts tests/giscus.test.ts`

Expected: PASS，Giscus 配置、项目仓库与新布局契约同时通过。

Run: `npm run verify`

Expected: 14 个测试文件全部通过，Astro 0 errors、0 warnings、0 hints，静态构建与 Pagefind 成功。

- [ ] **Step 7: 同步 CodeGraph 并提交**

Run: `codegraph sync`

Expected: 索引完成且无错误。

```bash
git add tests/layout-contract.test.ts src/layouts/ProjectLayout.astro src/components/RepositoryConstellation.astro src/pages/guestbook.astro src/components/GiscusComments.astro
git commit -m "feat(layout): 优化项目详情与留言区"
```

### Task 4: 响应式浏览器验收与发布准备

**Files:**
- Modify only if verification exposes a defect: files already listed in Tasks 1-3

**Interfaces:**
- Consumes: 完整静态构建与本地预览。
- Produces: 桌面/手机、三主题、项目筛选和 Giscus 嵌入的验收证据。

- [ ] **Step 1: 启动本地预览**

Run: `npm run dev -- --host 127.0.0.1 --port 4321`

Expected: 本地站点可访问且无启动错误。

- [ ] **Step 2: 在 1440×900 与 390×844 检查四个核心页面**

检查 `/`、`/projects/`、`/projects/field-notes/`、`/guestbook/`：无横向滚动，项目卡对齐，标题不遮挡，Giscus 位于站内布局中。

- [ ] **Step 3: 检查三个主题和核心交互**

依次切换深空观测站、梦幻银河、宇宙终端；验证项目分类筛选、主导航、项目 GitHub 链接和评论区加载。不得发布测试评论。

- [ ] **Step 4: 检查浏览器控制台并完成最终验证**

Run: `npm run verify`

Expected: 全部测试、类型检查、构建通过，浏览器控制台无 error/warning。

- [ ] **Step 5: 如无修复则不创建空提交；如有修复则提交**

```bash
git add <only-files-fixed-during-qa>
git commit -m "fix(layout): 修正响应式布局验收问题"
```

