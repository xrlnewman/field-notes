# Field Notes Personal Blog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete static personal blog with projects, articles, replies/comments, a global guestbook, Chinese search, RSS, responsive themes, and a zero-cost Cloudflare Pages deployment path.

**Architecture:** Astro generates every content route from typed Markdown collections at build time. Pagefind adds a static search index after Astro builds, while Giscus embeds GitHub Discussions for article/project comments and the fixed guestbook thread; no application server or database is used.

**Tech Stack:** Astro 7, TypeScript strict mode, Astro Content Collections, native CSS, Pagefind, Giscus, Vitest, Astro Check, Cloudflare Pages.

## Global Constraints

- Output is fully static; do not add the Cloudflare SSR adapter, a database, user accounts, analytics, or paid services.
- Default visual style is Editorial Green: `#F8FAF7` canvas, `#10201A` primary text, `#0B9873` accent, with a matched dark theme.
- Article prose width is at most 760px and must support a desktop right-hand table of contents.
- Content and exported symbols use English names; documentation, sample copy, commits, and user-facing UI use Chinese.
- Components accept explicit props; only pages query content collections.
- Draft entries are excluded from production builds but are never treated as private content.
- Giscus must degrade without blocking the page when its public environment variables are absent.
- Every interactive control must be keyboard accessible and respect `prefers-reduced-motion`.
- Work in a dedicated Git worktree and commit each task with a Chinese business description.

## File Map

```text
field-notes/
├── astro.config.mjs                 # static build, MDX, sitemap
├── package.json                     # build/check/test scripts
├── public/                          # favicon and social image
├── src/
│   ├── content.config.ts            # article/project schemas
│   ├── config/site.ts               # single site identity source
│   ├── content/articles/*.md        # sample articles
│   ├── content/projects/*.md        # sample projects
│   ├── components/                  # navigation, cards, tags, search, comments
│   ├── layouts/                     # base/article/project layouts
│   ├── lib/content.ts               # sorting, draft filtering, reading time
│   ├── pages/                       # static routes and endpoints
│   └── styles/global.css            # tokens and shared responsive rules
├── tests/content.test.ts            # pure content utility tests
├── tests/giscus.test.ts             # comment configuration tests
├── .env.example                     # Giscus public settings
└── README.md                        # authoring and deployment guide
```

---

### Task 1: Static Astro foundation and typed content contracts

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `.env.example`
- Create: `src/content.config.ts`, `src/config/site.ts`, `src/env.d.ts`
- Create: `src/lib/content.ts`, `tests/content.test.ts`

**Interfaces:**
- Produces: `siteConfig`, `ArticleData`, `ProjectData`, `estimateReadingTime(body)`, `sortByPublishedAt(entries)`, `isVisibleEntry(entry, isProduction)`.

- [ ] **Step 1: Write failing utility tests**

```ts
import { describe, expect, it } from 'vitest';
import { estimateReadingTime, isVisibleEntry, sortByPublishedAt } from '../src/lib/content';

describe('content helpers', () => {
  it('counts mixed Chinese and English text with a minimum of one minute', () => {
    expect(estimateReadingTime('这是中文内容 Astro static site')).toBe(1);
  });

  it('sorts newest content first', () => {
    const entries = [
      { data: { publishedAt: new Date('2025-01-01') } },
      { data: { publishedAt: new Date('2026-01-01') } },
    ];
    expect(sortByPublishedAt(entries)[0].data.publishedAt.getFullYear()).toBe(2026);
  });

  it('hides drafts only in production', () => {
    expect(isVisibleEntry({ data: { draft: true } }, true)).toBe(false);
    expect(isVisibleEntry({ data: { draft: true } }, false)).toBe(true);
  });
});
```

- [ ] **Step 2: Install dependencies and prove the tests fail**

Run: `npm install && npm test -- --run tests/content.test.ts`

Expected: FAIL because `src/lib/content.ts` does not exist.

- [ ] **Step 3: Implement the foundation**

Use these scripts and integrations:

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build && pagefind --site dist",
    "preview": "astro preview",
    "check": "astro check",
    "test": "vitest run"
  }
}
```

Define collections with the current Astro loader API:

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const base = {
  title: z.string().min(1),
  description: z.string().min(1),
  publishedAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  draft: z.boolean().default(false),
  featured: z.boolean().default(false),
};

const articles = defineCollection({
  loader: glob({ base: './src/content/articles', pattern: '**/*.{md,mdx}' }),
  schema: z.object({ ...base, tags: z.array(z.string()).default([]), cover: z.string().optional() }),
});

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    ...base,
    status: z.enum(['active', 'completed', 'archived']),
    tech: z.array(z.string()).default([]),
    demoUrl: z.string().url().optional(),
    repoUrl: z.string().url().optional(),
  }),
});

export const collections = { articles, projects };
```

Implement mixed-language reading time with 300 Chinese characters or 200 Latin words per minute, clone before sorting, and apply production draft filtering.

- [ ] **Step 4: Verify and commit**

Run: `npm test -- --run tests/content.test.ts && npm run check`

Expected: all tests PASS and Astro Check reports zero errors.

Commit: `feat(blog): 建立静态站点与内容模型`

### Task 2: Editorial Green shell, responsive navigation, and themes

**Files:**
- Create: `src/styles/global.css`
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/components/Header.astro`, `Footer.astro`, `ThemeToggle.astro`, `MobileMenu.astro`
- Create: `src/pages/index.astro`, `src/pages/404.astro`

**Interfaces:**
- Consumes: `siteConfig`.
- Produces: `BaseLayout` props `{ title, description?, image?, type? }` and shared CSS tokens/classes.

- [ ] **Step 1: Add a failing production build smoke check**

Create `tests/build-smoke.test.ts`:

```ts
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('static shell', () => {
  it('builds the home and 404 pages with the theme initializer', () => {
    expect(existsSync('dist/index.html')).toBe(true);
    expect(existsSync('dist/404.html')).toBe(true);
    expect(readFileSync('dist/index.html', 'utf8')).toContain('data-theme-toggle');
  });
});
```

- [ ] **Step 2: Implement shell and theme behavior**

`BaseLayout` must render canonical/Open Graph metadata, an inline head script that applies stored/system theme before paint, skip link, header, main slot, and footer. `ThemeToggle` cycles light/dark while writing `localStorage.theme`. Mobile menu uses a real button with `aria-expanded` and closes on Escape.

Define the exact core tokens:

```css
:root {
  --canvas: #f8faf7; --surface: #fff; --ink: #10201a;
  --muted: #66756e; --accent: #0b9873; --border: #dce8e2;
  --content: 1180px; --prose: 760px;
}
[data-theme='dark'] {
  --canvas: #08110e; --surface: #0e1b17; --ink: #eaf7f1;
  --muted: #9db1a8; --accent: #42d3a7; --border: #243b33;
}
```

- [ ] **Step 3: Build, run the smoke test, and commit**

Run: `npm run build && npm test -- --run tests/build-smoke.test.ts`

Expected: PASS; `dist/index.html` and `dist/404.html` exist.

Commit: `feat(ui): 完成全局视觉与主题导航`

### Task 3: Sample content, cards, home, and project routes

**Files:**
- Create: `src/content/articles/redisearch-result-set.md`, `src/content/articles/git-worktree-guide.md`
- Create: `src/content/projects/trend-product-lab.md`, `src/content/projects/field-notes.md`
- Create: `src/components/ContentCard.astro`, `TagList.astro`, `SectionHeading.astro`
- Create: `src/layouts/ProjectLayout.astro`
- Create: `src/pages/projects/index.astro`, `src/pages/projects/[id].astro`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `getCollection('projects')`, `sortByPublishedAt`, `isVisibleEntry`.
- Produces: project cards and statically generated `/projects/[id]` routes.

- [ ] **Step 1: Add project route expectations to the build smoke test**

```ts
expect(existsSync('dist/projects/index.html')).toBe(true);
expect(existsSync('dist/projects/field-notes/index.html')).toBe(true);
expect(readFileSync('dist/projects/index.html', 'utf8')).toContain('Field Notes');
```

- [ ] **Step 2: Implement project content and pages**

The home page queries content and displays at most three featured projects and five recent articles. The project index uses a two-column responsive grid. `[id].astro` uses `getStaticPaths()`, passes the rendered content to `ProjectLayout`, and only shows demo/repository buttons when URLs exist.

Each card must include a textual type label, title, summary, date/status, and tags; it must not rely on cover imagery to convey meaning.

- [ ] **Step 3: Verify and commit**

Run: `npm run check && npm run build && npm test -- --run tests/build-smoke.test.ts`

Expected: PASS and both sample project routes exist.

Commit: `feat(projects): 增加项目展示与详情页面`

### Task 4: Article, tag, prose, and reading navigation routes

**Files:**
- Create: `src/layouts/ArticleLayout.astro`
- Create: `src/components/TableOfContents.astro`, `ProseEnhancements.astro`, `ArticleNav.astro`
- Create: `src/pages/articles/index.astro`, `src/pages/articles/[id].astro`, `src/pages/tags/[tag].astro`
- Modify: `src/styles/global.css`, `tests/build-smoke.test.ts`

**Interfaces:**
- Consumes: `render(entry)`, rendered `headings`, sorted visible article entries, `estimateReadingTime(entry.body)`.
- Produces: article and tag routes plus code-copy enhancement.

- [ ] **Step 1: Add failing article/tag route assertions**

```ts
expect(existsSync('dist/articles/redisearch-result-set/index.html')).toBe(true);
expect(existsSync('dist/tags/git/index.html')).toBe(true);
expect(readFileSync('dist/articles/redisearch-result-set/index.html', 'utf8')).toContain('文章目录');
```

- [ ] **Step 2: Implement article and tag pages**

Generate every visible article with `getStaticPaths()`. Build a deduplicated, URL-safe tag list. `ArticleLayout` renders metadata, a 760px prose column, right-side headings with depth 2–3, previous/next links, related entries, and the comment slot. `ProseEnhancements` adds copy buttons to `pre` blocks and announces success through an `aria-live` region.

- [ ] **Step 3: Verify and commit**

Run: `npm run check && npm run build && npm test -- --run tests/build-smoke.test.ts`

Expected: PASS; article and tag pages exist and include their navigation landmarks.

Commit: `feat(articles): 完成文章阅读与标签体系`

### Task 5: Static Chinese search, RSS, sitemap, and About

**Files:**
- Create: `src/components/SearchPanel.astro`
- Create: `src/pages/search.astro`, `src/pages/rss.xml.ts`, `src/pages/about.astro`
- Modify: `astro.config.mjs`, `tests/build-smoke.test.ts`

**Interfaces:**
- Consumes: Pagefind browser API from `/pagefind/pagefind.js`; visible article entries for RSS.
- Produces: static search UI, `/rss.xml`, sitemap files, about page.

- [ ] **Step 1: Add failing output assertions**

```ts
expect(existsSync('dist/search/index.html')).toBe(true);
expect(existsSync('dist/about/index.html')).toBe(true);
expect(existsSync('dist/rss.xml')).toBe(true);
expect(existsSync('dist/pagefind/pagefind.js')).toBe(true);
```

- [ ] **Step 2: Implement search and feeds**

On input focus, dynamically import Pagefind. On query, render result type, title, excerpt, and URL; show explicit initial, loading, empty, failure, and development-index-missing states. Add `@astrojs/sitemap` to Astro config and `@astrojs/rss` endpoint using only visible articles.

- [ ] **Step 3: Verify and commit**

Run: `npm run build && npm test -- --run tests/build-smoke.test.ts`

Expected: PASS; Pagefind reports indexed pages and all four output assertions pass.

Commit: `feat(discovery): 增加搜索订阅与站点索引`

### Task 6: Giscus article/project comments and fixed guestbook

**Files:**
- Create: `src/lib/giscus.ts`, `tests/giscus.test.ts`
- Create: `src/components/GiscusComments.astro`, `src/pages/guestbook.astro`
- Modify: `src/layouts/ArticleLayout.astro`, `src/layouts/ProjectLayout.astro`, `.env.example`

**Interfaces:**
- Produces: `readGiscusConfig(env): GiscusConfig | null`; `GiscusComments` props `{ mapping: 'pathname' | 'specific', term?: string }`.

- [ ] **Step 1: Write failing configuration tests**

```ts
import { describe, expect, it } from 'vitest';
import { readGiscusConfig } from '../src/lib/giscus';

describe('giscus configuration', () => {
  it('returns null when any required public value is absent', () => {
    expect(readGiscusConfig({ PUBLIC_GISCUS_REPO: 'owner/repo' })).toBeNull();
  });

  it('returns a complete validated configuration', () => {
    const config = readGiscusConfig({
      PUBLIC_GISCUS_REPO: 'owner/repo', PUBLIC_GISCUS_REPO_ID: 'R_1',
      PUBLIC_GISCUS_CATEGORY: 'Comments', PUBLIC_GISCUS_CATEGORY_ID: 'DIC_1',
    });
    expect(config?.repo).toBe('owner/repo');
  });
});
```

- [ ] **Step 2: Prove failure, implement, and integrate**

Run before implementation: `npm test -- --run tests/giscus.test.ts`

Expected: FAIL because `src/lib/giscus.ts` is missing.

Implement lazy iframe script insertion with `IntersectionObserver`. Article/project layouts pass `mapping="pathname"`; guestbook passes `mapping="specific" term="global-guestbook"`. When config is absent, render the documented non-blocking message. Theme changes call `postMessage({ giscus: { setConfig: { theme } } }, 'https://giscus.app')`.

- [ ] **Step 3: Verify and commit**

Run: `npm test -- --run tests/giscus.test.ts && npm run check && npm run build`

Expected: PASS; guestbook output includes `global-guestbook`; article/project pages include `data-giscus-host`.

Commit: `feat(comments): 接入评论回复与全局留言`

### Task 7: Accessibility, deployment documentation, and end-to-end verification

**Files:**
- Create: `README.md`, `public/favicon.svg`, `public/social-card.svg`, `public/robots.txt`
- Modify: `src/styles/global.css`, `src/config/site.ts`, `tests/build-smoke.test.ts`

**Interfaces:**
- Produces: complete authoring/deployment instructions and final deployable `dist/`.

- [ ] **Step 1: Document exact free deployment and authoring workflow**

README must cover:

```text
1. Edit src/config/site.ts.
2. Add Markdown under src/content/articles or src/content/projects.
3. Enable GitHub Discussions and install giscus for the public repository.
4. Copy the four public values into Cloudflare Pages environment variables.
5. Connect the repository in Cloudflare Pages.
6. Build command: npm run build; output directory: dist.
```

Include local commands, content field examples, draft privacy warning, Giscus setup, Cloudflare Pages setup, and migration/backup notes.

- [ ] **Step 2: Run complete automated verification**

Run: `npm test && npm run check && npm run build`

Expected: all Vitest tests pass, Astro Check reports zero errors, Pagefind indexes the built pages, and Astro completes without warnings.

- [ ] **Step 3: Run browser verification**

Start: `npm run preview -- --host 127.0.0.1`

Verify at desktop and mobile widths: every route, navigation, theme persistence, search query, code copy, article TOC, Giscus fallback, guestbook term, keyboard focus, console, and absence of horizontal scrolling. Record screenshots and correct every console error/warning.

- [ ] **Step 4: Inspect Git and commit**

Run: `git status --short && git diff --check`

Expected: only intended project files are modified and `git diff --check` is silent.

Commit: `docs(deploy): 完善免费部署与使用说明`

