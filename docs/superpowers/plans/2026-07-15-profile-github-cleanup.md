# GitHub 项目清理与博客个人品牌补全 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让博客首页与关于页完整展示许汝林的真实 GitHub 头像、7 年经验简介和联系入口，并让 GitHub 公开区只保留十个网站项目仓库。

**Architecture:** 个人资料集中在 `siteConfig.author`，新增单一职责的 `ProfileIdentity.astro` 供首页紧凑模式与关于页完整模式复用。GitHub 清理作为独立外部操作，在博客代码测试、部署完成后逐项执行并浏览器复核。

**Tech Stack:** Astro 7、TypeScript 6、Vitest 4、原生 CSS、GitHub 网页设置、Cloudflare Pages。

## Global Constraints

- 保留现有三种星空主题、站内 Giscus 评论与留言交互。
- 只删除八个远程工具仓库，不删除本地源码。
- 不修改十个网站项目仓库的源码和关联关系。
- 使用当前 GitHub 真实头像 `https://avatars.githubusercontent.com/u/74042040?v=4`，不生成虚构真人照片。
- 姓名、年龄、经验、头像、能力标签和社交链接只在 `src/config/site.ts` 定义一次。
- 不提交 GitHub 或 Cloudflare 令牌。

---

### Task 1: 个人资料契约与头像资产

**Files:**
- Create: `tests/profile-identity.test.ts`
- Modify: `src/config/site.ts`
- Create: `public/images/profile/xu-rulin-avatar.png`
- Delete: `public/images/projects/api-bench.png`
- Delete: `public/images/projects/bi-report.png`
- Delete: `public/images/projects/db-snapshot-diff.png`
- Delete: `public/images/projects/excel-analyzer.png`
- Delete: `public/images/projects/inventory-system.svg`
- Delete: `public/images/projects/invoice-ocr.png`
- Delete: `public/images/projects/toolkit-box.png`
- Delete: `public/images/projects/web-scraper.png`

**Interfaces:**
- Produces: `siteConfig.author.avatarSrc`, `siteConfig.author.availability`, `siteConfig.author.skills` and a local 420×420 PNG asset.
- Consumes: GitHub avatar source `https://avatars.githubusercontent.com/u/74042040?v=4`.

- [ ] **Step 1: Write the failing profile contract test**

```ts
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..');
const siteSource = readFileSync(resolve(root, 'src/config/site.ts'), 'utf8');

describe('personal profile contract', () => {
  it('keeps a real local avatar and structured profile copy', () => {
    expect(siteSource).toContain("avatarSrc: '/images/profile/xu-rulin-avatar.png'");
    expect(siteSource).toContain("availability: '可承接产品与复杂系统开发'");
    expect(siteSource).toContain('skills: [');
    expect(existsSync(resolve(root, 'public/images/profile/xu-rulin-avatar.png'))).toBe(true);
  });

  it('removes unused tool screenshots', () => {
    for (const file of ['api-bench.png', 'bi-report.png', 'db-snapshot-diff.png', 'excel-analyzer.png', 'inventory-system.svg', 'invoice-ocr.png', 'toolkit-box.png', 'web-scraper.png']) {
      expect(existsSync(resolve(root, 'public/images/projects', file))).toBe(false);
    }
  });
});
```

- [ ] **Step 2: Run the new test and verify failure**

Run: `npx vitest run tests/profile-identity.test.ts`

Expected: FAIL because the avatar fields, local asset and screenshot cleanup do not exist yet.

- [ ] **Step 3: Add structured author data**

Add to `siteConfig.author`:

```ts
avatarSrc: '/images/profile/xu-rulin-avatar.png',
availability: '可承接产品与复杂系统开发',
skills: ['PHP / Laravel', 'Go', 'Vue 3 / TypeScript', 'MySQL / Redis', '系统设计与交付'],
```

Download the existing 420×420 GitHub avatar bytes:

```powershell
New-Item -ItemType Directory -Force -Path public/images/profile | Out-Null
Invoke-WebRequest -Uri 'https://avatars.githubusercontent.com/u/74042040?v=4' -OutFile 'public/images/profile/xu-rulin-avatar.png'
```

Delete the eight listed unused screenshots with `apply_patch`. Do not alter the four website project galleries.

- [ ] **Step 4: Run the test and verify pass**

Run: `npx vitest run tests/profile-identity.test.ts`

Expected: 2 tests passed.

- [ ] **Step 5: Commit**

```bash
git add src/config/site.ts tests/profile-identity.test.ts public/images
git commit -m "feat(profile): 补齐个人资料与真实头像"
```

### Task 2: 可复用个人身份组件

**Files:**
- Create: `src/components/ProfileIdentity.astro`
- Modify: `tests/profile-identity.test.ts`

**Interfaces:**
- Consumes: `siteConfig.author`, `siteConfig.social`, optional `variant: 'compact' | 'full'`, optional `projectCount: number`.
- Produces: `[data-profile-identity]`, `[data-profile-avatar]`, `[data-profile-skills]`, GitHub 与留言入口。

- [ ] **Step 1: Extend the failing component contract test**

```ts
const componentSource = readFileSync(resolve(root, 'src/components/ProfileIdentity.astro'), 'utf8');

it('renders a reusable identity card with real actions', () => {
  expect(componentSource).toContain('data-profile-identity');
  expect(componentSource).toContain('data-profile-avatar');
  expect(componentSource).toContain('data-profile-skills');
  expect(componentSource).toContain('siteConfig.social.github');
  expect(componentSource).toContain('href="/guestbook/"');
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `npx vitest run tests/profile-identity.test.ts`

Expected: FAIL because `ProfileIdentity.astro` does not exist.

- [ ] **Step 3: Implement the component**

Create `ProfileIdentity.astro` with:

```astro
---
import { siteConfig } from '../config/site';

interface Props {
  variant?: 'compact' | 'full';
  projectCount?: number;
}

const { variant = 'compact', projectCount } = Astro.props;
const { author, social } = siteConfig;
---

<section class:list={['profile-identity', `profile-identity--${variant}`]} data-profile-identity={variant}>
  <img src={author.avatarSrc} alt={`${author.name}的头像`} width="420" height="420" loading={variant === 'compact' ? 'eager' : 'lazy'} data-profile-avatar />
  <div class="profile-identity__body">
    <p class="eyebrow">{author.availability}</p>
    <h2>{author.name}</h2>
    <p class="profile-identity__role">{author.role} · {author.experienceYears} 年经验</p>
    <p>{author.bio}</p>
    <ul data-profile-skills>{author.skills.map((skill) => <li>{skill}</li>)}</ul>
    {projectCount !== undefined && <p class="profile-identity__metric"><strong>{projectCount}</strong> 个网站产品</p>}
    <div class="button-row">
      <a class="button button--primary" href={social.github} target="_blank" rel="noreferrer">GitHub</a>
      <a class="button" href="/guestbook/">给我留言</a>
    </div>
  </div>
</section>
```

Add scoped CSS using existing tokens:

```css
.profile-identity {
  display: grid;
  gap: 24px;
  padding: clamp(24px, 3vw, 34px);
  border: 1px solid color-mix(in srgb, var(--accent) 26%, var(--border));
  border-radius: var(--radius-lg);
  background: linear-gradient(145deg, color-mix(in srgb, var(--surface) 92%, transparent), color-mix(in srgb, var(--accent) 8%, var(--surface)));
  box-shadow: 0 28px 80px color-mix(in srgb, var(--glow) 30%, transparent);
  backdrop-filter: blur(18px);
}

.profile-identity--compact { grid-template-columns: 112px minmax(0, 1fr); }
.profile-identity--full { grid-template-columns: minmax(220px, 0.72fr) minmax(0, 1.28fr); align-items: center; }
[data-profile-avatar] { width: 100%; aspect-ratio: 1; border: 1px solid var(--border); border-radius: 28%; object-fit: cover; }
.profile-identity h2 { margin: 0; font-size: clamp(1.8rem, 4vw, 3.4rem); }
.profile-identity__role { margin: 6px 0 12px; color: var(--accent-strong); font-weight: 700; }
.profile-identity__body > p:not(.eyebrow, .profile-identity__role, .profile-identity__metric) { margin: 0; color: var(--muted); }
[data-profile-skills] { display: flex; flex-wrap: wrap; gap: 8px; margin: 20px 0; padding: 0; list-style: none; }
[data-profile-skills] li { padding: 7px 10px; border: 1px solid var(--border); border-radius: 999px; color: var(--muted); font-size: 0.78rem; }
.profile-identity__metric { margin: 18px 0 0; color: var(--muted); }
.profile-identity__metric strong { color: var(--ink); font-size: 1.45rem; }

@media (max-width: 960px) {
  .profile-identity--full { grid-template-columns: 180px minmax(0, 1fr); }
}

@media (max-width: 760px) {
  .profile-identity--compact,
  .profile-identity--full { grid-template-columns: 1fr; }
  [data-profile-avatar] { width: min(160px, 48vw); }
}
```

- [ ] **Step 4: Run the test and verify pass**

Run: `npx vitest run tests/profile-identity.test.ts`

Expected: component contract passes.

- [ ] **Step 5: Commit**

```bash
git add src/components/ProfileIdentity.astro tests/profile-identity.test.ts
git commit -m "feat(profile): 新增可复用个人身份组件"
```

### Task 3: 首页与关于页接入

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/pages/about.astro`
- Modify: `tests/profile-identity.test.ts`

**Interfaces:**
- Consumes: `ProfileIdentity` compact/full variants.
- Produces: 首页首屏身份卡、关于页完整人物档案、可用 GitHub/留言操作。

- [ ] **Step 1: Add failing page integration assertions**

```ts
const homeSource = readFileSync(resolve(root, 'src/pages/index.astro'), 'utf8');
const aboutSource = readFileSync(resolve(root, 'src/pages/about.astro'), 'utf8');

it('uses the shared profile on home and about pages', () => {
  expect(homeSource).toContain("variant=\"compact\"");
  expect(homeSource).toContain('projectCount={projects.length}');
  expect(aboutSource).toContain("variant=\"full\"");
  expect(homeSource).toContain('了解我');
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `npx vitest run tests/profile-identity.test.ts`

Expected: FAIL because neither page imports the component.

- [ ] **Step 3: Integrate the compact home profile**

Import `ProfileIdentity`, replace `.hero-studio__stats` with:

```astro
<ProfileIdentity variant="compact" projectCount={projects.length} />
```

Change the second hero action from “阅读文章” to “了解我” linking to `/about/`. Keep the project catalog and open-source promise unchanged. Update only hero grid/style rules required for the card.

- [ ] **Step 4: Integrate the full about profile**

Import `ProfileIdentity` and place:

```astro
<ProfileIdentity variant="full" />
```

before `.profile-facts`. Retain the existing value proposition, facts, three capability sections and final contact panel; reduce the oversized heading so the avatar and key copy fit in the first desktop viewport.

- [ ] **Step 5: Run targeted and regression tests**

Run: `npx vitest run tests/profile-identity.test.ts tests/brand.test.ts tests/layout-contract.test.ts`

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/pages/index.astro src/pages/about.astro tests/profile-identity.test.ts
git commit -m "feat(profile): 首页与关于页接入个人档案"
```

### Task 4: 全量验证、部署与 GitHub 清理

**Files:**
- Modify: `package.json` only if the new test is not picked up by the existing test script.

**Interfaces:**
- Consumes: completed blog changes and authenticated GitHub/Cloudflare sessions.
- Produces: live blog, clean GitHub profile, ten remaining public website repositories.

- [ ] **Step 1: Include the new test in the standard suite**

Append `tests/profile-identity.test.ts` to the existing Vitest command in `package.json`. Run `npm test` and expect 400 tests or more with zero failures.

- [ ] **Step 2: Run static and production checks**

Run:

```bash
npm run check
npm run test:build
codegraph sync
git diff --check
```

Expected: Astro reports 0 errors/0 warnings/0 hints; production build and smoke tests pass; CodeGraph index is current; diff check is clean.

- [ ] **Step 3: Browser QA locally**

Start the existing Astro dev server in the worktree. In the in-app browser, verify `/` and `/about/` at desktop and mobile widths, switch all three cosmic themes, click GitHub/about/guestbook actions, and inspect the console. Expected: no overflow, broken image, clipping, console error or warning.

- [ ] **Step 4: Merge and deploy the blog**

Fetch remote `main`, verify no conflicts, fast-forward or merge the feature branch using a Chinese business commit message, push `main`, and deploy through the existing Cloudflare Pages workflow. Verify `https://field-notes-2fi.pages.dev/` and `/about/` after deployment.

- [ ] **Step 5: Update GitHub profile**

Set:

- Name: `许汝林`
- Bio: `7 年经验的产品型全栈工程师，专注把复杂业务做成稳定、可运行的产品。`
- Website: `https://field-notes-2fi.pages.dev`

Set pinned repositories to only `field-notes`, `linli-mp`, `mall-h5`, `skyboom-web`.

- [ ] **Step 6: Delete eight remote tool repositories**

Before each deletion, confirm a corresponding local source directory exists. Then delete only:

`toolkit-box`, `invoice-ocr`, `api-bench`, `db-snapshot-diff`, `excel-analyzer`, `bi-report`, `web-scraper`, `inventory-system`.

After every deletion, revisit the repositories page and confirm the count decreases by one. Expected final public repository count: 10.

- [ ] **Step 7: Final browser acceptance**

Visit `https://github.com/xrlnewman` and confirm the new name, bio, website, avatar, four project pins and ten repositories. Visit all four blog project pages and confirm their GitHub links point to retained repositories.

- [ ] **Step 8: Commit any final test-script change**

```bash
git add package.json
git commit -m "test(profile): 纳入个人档案回归验证"
```

Skip this commit when `package.json` did not change.
