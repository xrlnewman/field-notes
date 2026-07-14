# Personal Brand and Project Gallery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 Field Notes 改造成以真实开源项目为核心的“许汝林个人博客”，完成个人品牌、项目分类与截图卡片、源码约束、关于页和首个 GitHub 仓库入口。

**Architecture:** 继续使用 Astro 静态内容集合。个人身份集中在 `siteConfig`；项目 schema 在构建期阻止没有封面或源码地址的公开项目；`ProjectCard` 负责单张作品卡，`ProjectGallery` 负责无后端分类筛选，首页与项目索引复用这些组件。项目源码坚持一项目一仓库，博客只保存项目元数据、截图和入口。

**Tech Stack:** Astro 7、TypeScript 6、Astro Content Collections、Vitest 4、原生浏览器 JavaScript、Pagefind、GitHub、Cloudflare Pages。

## Global Constraints

- 站点名必须是“许汝林个人博客”，定位为“产品型全栈工程师”。
- 公开信息使用 27 岁、7 年开发经验；不编造公司、职级、收入、用户量或性能数据。
- 公开业务统一表述为交易系统、运营平台、数据系统与复杂后台。
- 首页项目优先于文章；项目卡以真实界面截图为主视觉。
- 非草稿项目必须有仓库内封面和真实 GitHub 公开仓库地址。
- GitHub 账号固定为 `xrlnewman`；不公开邮箱。
- 不增加 UI 框架和客户端状态库；筛选使用原生 JavaScript。
- 深浅主题、RSS、搜索、Giscus、键盘操作和 390px 移动端继续工作。
- 每个任务遵循测试先行并独立提交，提交信息使用中文业务描述。

---

### Task 1: 统一个人品牌身份

**Files:**
- Create: `tests/brand.test.ts`
- Modify: `src/config/site.ts`
- Modify: `src/components/Header.astro`
- Modify: `public/favicon.svg`

**Interfaces:**
- Produces: `siteConfig.brandMark: '许'`、`siteConfig.author.role`、`siteConfig.author.age`、`siteConfig.author.experienceYears`。
- Consumed by: Header、Footer、首页、关于页和 BaseLayout SEO。

- [ ] **Step 1: 写品牌配置失败测试**

```ts
import { describe, expect, it } from 'vitest';

import { siteConfig } from '../src/config/site';

describe('personal brand configuration', () => {
  it('uses Xu Rulin identity and product engineer positioning', () => {
    expect(siteConfig.name).toBe('许汝林个人博客');
    expect(siteConfig.brand).toBe('许汝林 / PRODUCT ENGINEER');
    expect(siteConfig.brandMark).toBe('许');
    expect(siteConfig.author).toMatchObject({
      name: '许汝林',
      role: '产品型全栈工程师',
      age: 27,
      experienceYears: 7,
    });
  });

  it('publishes the authenticated GitHub profile without exposing email', () => {
    expect(siteConfig.social.github).toBe('https://github.com/xrlnewman');
    expect(siteConfig.social.email).toBe('');
  });
});
```

- [ ] **Step 2: 运行测试确认旧占位身份导致失败**

Run: `npx vitest run tests/brand.test.ts`

Expected: FAIL，提示站点名仍为 `Field Notes` 或缺少 `brandMark`。

- [ ] **Step 3: 写入集中品牌配置**

```ts
export const siteConfig = {
  name: '许汝林个人博客',
  brand: '许汝林 / PRODUCT ENGINEER',
  brandMark: '许',
  title: '许汝林个人博客｜产品型全栈工程师',
  description: '许汝林，27 岁，拥有 7 年开发经验的产品型全栈工程师。专注把复杂业务转化为稳定、易用、可持续迭代的产品。',
  author: {
    name: '许汝林',
    role: '产品型全栈工程师',
    age: 27,
    experienceYears: 7,
    bio: '我是一名拥有 7 年开发经验的产品型全栈工程师，能从需求梳理、系统设计、前后端开发一路做到部署交付与持续迭代。',
  },
  social: {
    github: 'https://github.com/xrlnewman',
    email: '',
  },
  nav: [
    { href: '/', label: '首页' },
    { href: '/projects/', label: '项目' },
    { href: '/articles/', label: '文章' },
    { href: '/guestbook/', label: '留言' },
    { href: '/about/', label: '关于' },
  ],
} as const;
```

把 `Header.astro` 中的硬编码 `Y` 改为 `{siteConfig.brandMark}`。把 favicon 的字形从 Y 改成简洁的 X 字母标记，保留现有深绿、白色和薄荷绿配色。

- [ ] **Step 4: 运行品牌测试**

Run: `npx vitest run tests/brand.test.ts`

Expected: 2 tests passed。

- [ ] **Step 5: 提交品牌身份**

```bash
git add tests/brand.test.ts src/config/site.ts src/components/Header.astro public/favicon.svg
git commit -m "feat(brand): 更新许汝林个人品牌身份"
```

### Task 2: 建立开源项目内容约束与分类逻辑

**Files:**
- Create: `tests/projects.test.ts`
- Create: `src/lib/projects.ts`
- Modify: `src/content.config.ts`
- Modify: `src/content/projects/field-notes.md`
- Modify: `src/content/projects/trend-product-lab.md`
- Modify: `package.json`

**Interfaces:**
- Produces: `ProjectCategory`、`projectCategories`、`getProjectCategories()`、`matchesProjectCategory()`。
- Produces content fields: `category: ProjectCategory`、`cover?: string`、`repoUrl?: URL`。
- Rule: 非草稿项目缺少 `cover` 或 `repoUrl` 时 `projectSchema.safeParse()` 必须失败。

- [ ] **Step 1: 写项目约束与分类失败测试**

```ts
import { describe, expect, it } from 'vitest';

import { projectSchema } from '../src/content.config';
import { getProjectCategories, matchesProjectCategory } from '../src/lib/projects';

const baseProject = {
  title: '示例工具',
  description: '解决一个明确问题。',
  publishedAt: '2026-07-14',
  status: 'completed' as const,
  category: '开发工具' as const,
  tech: ['TypeScript'],
  draft: false,
};

describe('project publishing rules', () => {
  it('rejects a public project without a cover and repository', () => {
    expect(projectSchema.safeParse(baseProject).success).toBe(false);
  });

  it('allows an incomplete project only while it remains a draft', () => {
    expect(projectSchema.safeParse({ ...baseProject, draft: true }).success).toBe(true);
  });

  it('accepts a public project with a local cover and GitHub repository', () => {
    const result = projectSchema.safeParse({
      ...baseProject,
      cover: '/images/projects/example.png',
      repoUrl: 'https://github.com/xrlnewman/example',
    });
    expect(result.success).toBe(true);
  });
});

describe('project category helpers', () => {
  const projects = [{ data: { category: '开发工具' } }, { data: { category: '数据工具' } }, { data: { category: '开发工具' } }];

  it('returns unique categories in configured order', () => {
    expect(getProjectCategories(projects)).toEqual(['全部', '开发工具', '数据工具']);
  });

  it('matches all or one category', () => {
    expect(matchesProjectCategory('开发工具', '全部')).toBe(true);
    expect(matchesProjectCategory('开发工具', '数据工具')).toBe(false);
  });
});
```

- [ ] **Step 2: 运行测试确认 schema 和工具函数尚未实现**

Run: `npx vitest run tests/projects.test.ts`

Expected: FAIL，提示缺少 `src/lib/projects.ts` 或 schema 不拒绝空源码项目。

- [ ] **Step 3: 实现分类类型与纯函数**

```ts
export const projectCategories = ['开发工具', '数据工具', 'AI 应用', '网站产品', '业务系统'] as const;
export type ProjectCategory = typeof projectCategories[number];
export type ProjectCategoryFilter = '全部' | ProjectCategory;

export function getProjectCategories<T extends { data: { category: ProjectCategory } }>(projects: readonly T[]): ProjectCategoryFilter[] {
  const present = new Set(projects.map((project) => project.data.category));
  return ['全部', ...projectCategories.filter((category) => present.has(category))];
}

export function matchesProjectCategory(category: ProjectCategory, filter: ProjectCategoryFilter): boolean {
  return filter === '全部' || category === filter;
}
```

在 `projectSchema` 中加入 `category: z.enum(projectCategories)`、`cover: z.string().startsWith('/').optional()`，保留 `repoUrl: z.url().optional()`，并用 `superRefine` 对 `draft === false` 的条目分别添加 `cover` 与 `repoUrl` 错误。

- [ ] **Step 4: 更新现有项目内容**

`field-notes.md` 使用：

```yaml
category: 网站产品
cover: /images/projects/field-notes.png
repoUrl: https://github.com/xrlnewman/field-notes
```

把 `trend-product-lab.md` 设置为 `draft: true` 并添加 `category: 网站产品`。它没有真实仓库前不得在生产构建公开。

把 `package.json` 的 `test` 脚本改为：

```json
"test": "vitest run tests/content.test.ts tests/giscus.test.ts tests/brand.test.ts tests/projects.test.ts"
```

- [ ] **Step 5: 运行新增测试和原有单元测试**

Run: `npm test`

Expected: 15 tests passed，0 failed。

- [ ] **Step 6: 提交内容约束**

```bash
git add tests/projects.test.ts src/lib/projects.ts src/content.config.ts src/content/projects package.json
git commit -m "feat(projects): 约束公开项目源码与分类"
```

### Task 3: 实现截图项目卡与无后端分类筛选

**Files:**
- Create: `src/components/ProjectCard.astro`
- Create: `src/components/ProjectGallery.astro`
- Modify: `src/pages/projects/index.astro`
- Modify: `tests/build-smoke.test.ts`

**Interfaces:**
- `ProjectCard` consumes: `href`, `title`, `description`, `cover`, `category`, `status`, `tech`, `repoUrl`。
- `ProjectGallery` consumes: `projects: CollectionEntry<'projects'>[]` and renders `.project-gallery` items with `data-project-category`。
- Filter buttons use `data-project-filter`, `aria-pressed`, and keep all filtering local.

- [ ] **Step 1: 先增加构建产物断言**

在项目构建测试中加入：

```ts
const projects = readFileSync('dist/projects/index.html', 'utf8');
expect(projects).toContain('data-project-filter');
expect(projects).toContain('data-project-category="网站产品"');
expect(projects).toContain('https://github.com/xrlnewman/field-notes');
expect(projects).toContain('/images/projects/field-notes.png');
```

- [ ] **Step 2: 运行现有构建测试确认新结构不存在**

Run: `npm run build && npx vitest run tests/build-smoke.test.ts`

Expected: FAIL，缺少 `data-project-filter`。

- [ ] **Step 3: 创建独立 ProjectCard**

卡片必须使用以下非嵌套链接结构：

```astro
<article class="project-card" data-project-category={category}>
  <a class="project-cover" href={href} aria-label={`查看项目：${title}`}>
    <img src={cover} alt={`${title} 界面截图`} width="960" height="600" loading="lazy" />
  </a>
  <div class="project-card__body">
    <div class="project-card__meta"><span>{category}</span><span>{statusLabel}</span></div>
    <h3><a href={href}>{title}</a></h3>
    <p>{description}</p>
    <TagList tags={tech.slice(0, 3)} />
    <div class="project-card__actions">
      <a href={href}>查看项目 →</a>
      <a href={repoUrl} target="_blank" rel="noopener noreferrer">GitHub 源码 ↗</a>
    </div>
  </div>
</article>
```

样式要求：桌面封面比例 `16 / 10`，卡片圆角和边框复用全局变量，图片使用 `object-fit: cover`，按钮层级清晰，hover 不产生布局跳动。

- [ ] **Step 4: 创建 ProjectGallery 分类组件**

服务端通过 `getProjectCategories(projects)` 渲染按钮；客户端脚本：

```js
const gallery = document.querySelector('[data-project-gallery]');
const buttons = document.querySelectorAll('[data-project-filter]');
const empty = document.querySelector('[data-project-empty]');

buttons.forEach((button) => {
  button.addEventListener('click', () => {
    const filter = button.getAttribute('data-project-filter') ?? '全部';
    let visible = 0;
    buttons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    gallery?.querySelectorAll('[data-project-category]').forEach((card) => {
      const matches = filter === '全部' || card.getAttribute('data-project-category') === filter;
      card.toggleAttribute('hidden', !matches);
      if (matches) visible += 1;
    });
    if (empty) empty.hidden = visible > 0;
  });
});
```

项目网格桌面 3 列、900px 以下 2 列、640px 以下 1 列。

- [ ] **Step 5: 项目索引切换到 ProjectGallery**

标题改为“项目作品”，说明改为“这里展示已经完成源码整理和安全检查的产品与工具。每个项目都可以查看实现过程和 GitHub 源码。”，移除旧 `ContentCard` 项目网格。传入卡片时使用 `repoUrl={project.data.repoUrl!}`；非空断言由 Task 2 的公开项目 schema 约束保证。

- [ ] **Step 6: 运行构建和产物测试**

Run: `npm run build && npx vitest run tests/build-smoke.test.ts`

Expected: 生产构建成功，项目筛选、封面和源码断言通过。

- [ ] **Step 7: 提交项目画廊**

```bash
git add src/components/ProjectCard.astro src/components/ProjectGallery.astro src/pages/projects/index.astro tests/build-smoke.test.ts
git commit -m "feat(projects): 实现截图卡片与分类作品库"
```

### Task 4: 重写项目优先首页与个人关于页

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/pages/about.astro`
- Modify: `tests/build-smoke.test.ts`

**Interfaces:**
- 首页 consumes `ProjectCard` for at most 6 projects and `ContentCard` only for articles。
- 关于页 consumes structured `siteConfig.author` facts。

- [ ] **Step 1: 写新首页和关于页产物断言**

```ts
const home = readFileSync('dist/index.html', 'utf8');
const about = readFileSync('dist/about/index.html', 'utf8');

expect(home).toContain('把复杂业务，做成真正可用的产品。');
expect(home.indexOf('项目作品')).toBeLessThan(home.indexOf('最近写下的内容'));
expect(about).toContain('我不只写代码，也负责让产品落地。');
expect(about).toContain('7 年');
expect(about).toContain('PHP/Laravel');
expect(home).not.toContain('Field Notes');
```

- [ ] **Step 2: 运行构建测试确认旧文案失败**

Run: `npm run build && npx vitest run tests/build-smoke.test.ts`

Expected: FAIL，首页仍含“做有用的东西”。

- [ ] **Step 3: 重写首页首屏和顺序**

首页精确文案：

```text
PRODUCT ENGINEER · BUILDER · WRITER
把复杂业务，做成真正可用的产品。
7 年持续交付
把工程经验转化为可复用的产品、工具和文章，持续记录从需求判断到上线交付的完整过程。
```

项目区标题使用“项目作品”，放在文章区之前，最多展示 6 个 `ProjectCard`。传入卡片时使用 `repoUrl={project.data.repoUrl!}`；非空断言由公开项目 schema 约束保证。首屏缩短为紧凑版本，但保留主次按钮和当前关注卡。

- [ ] **Step 4: 重写关于页**

顶部使用：

```text
ABOUT XU RULIN
我不只写代码，也负责让产品落地。
```

新增事实栏：`27 / 当前年龄`、`7 年 / 开发经验`、`全栈 / 交付边界`。三项能力卡精确覆盖“从需求到交付”“解决复杂业务”“技术与产品并重”，技术栈列出 PHP/Laravel、Go、Vue 3/TypeScript、MySQL、Redis、RabbitMQ、ClickHouse 与对象存储。底部行动区标题改为“有产品想法，或者复杂问题，可以聊聊。”

- [ ] **Step 5: 运行构建产物测试**

Run: `npm run build && npx vitest run tests/build-smoke.test.ts`

Expected: 所有断言通过，旧品牌文案不再出现。

- [ ] **Step 6: 提交首页和关于页**

```bash
git add src/pages/index.astro src/pages/about.astro tests/build-smoke.test.ts
git commit -m "feat(home): 突出项目作品与全栈交付能力"
```

### Task 5: 增加真实项目封面和详情页大图

**Files:**
- Create: `public/images/projects/field-notes.png`
- Modify: `src/layouts/ProjectLayout.astro`
- Modify: `tests/build-smoke.test.ts`

**Interfaces:**
- ProjectLayout consumes `data.cover` and renders a meaningful `<img>` only when present。
- Build smoke verifies the screenshot asset is shipped。

- [ ] **Step 1: 增加详情页封面产物断言**

```ts
expect(existsSync('dist/images/projects/field-notes.png')).toBe(true);
const project = readFileSync('dist/projects/field-notes/index.html', 'utf8');
expect(project).toContain('field-notes.png');
expect(project).toContain('GitHub 源码');
```

- [ ] **Step 2: 在 ProjectLayout 头部增加封面**

在按钮区域之后渲染：

```astro
{data.cover && (
  <figure class="project-cover-shot">
    <img src={data.cover} alt={`${data.title} 项目界面`} width="1440" height="900" />
  </figure>
)}
```

封面使用 `aspect-ratio: 16 / 10`、`object-fit: cover`、项目现有圆角、边框和阴影变量；移动端保持全宽。

- [ ] **Step 3: 构建并启动本地预览**

Run: `npm run build && npm run preview -- --host 127.0.0.1 --port 4321`

Expected: `http://127.0.0.1:4321/about/` 返回 200。

- [ ] **Step 4: 使用真实品牌页面生成项目截图**

```powershell
New-Item -ItemType Directory -Force -Path 'public/images/projects' | Out-Null
& 'C:\Program Files\Google\Chrome\Application\chrome.exe' --headless --disable-gpu --hide-scrollbars --window-size=1440,900 --screenshot='E:\project\field-notes\.worktrees\personal-brand\public\images\projects\field-notes.png' 'http://127.0.0.1:4321/about/'
```

Expected: 生成 1440×900 的真实博客页面截图，不使用用户参考图或第三方商城素材。

- [ ] **Step 5: 重新构建并验证封面**

Run: `npm run build && npx vitest run tests/build-smoke.test.ts`

Expected: 图片随静态站点发布，项目详情断言通过。

- [ ] **Step 6: 提交项目截图与详情页**

```bash
git add public/images/projects/field-notes.png src/layouts/ProjectLayout.astro tests/build-smoke.test.ts
git commit -m "feat(projects): 增加真实项目截图与详情展示"
```

### Task 6: 完整验证、浏览器验收和 GitHub 发布准备

**Files:**
- Modify: `README.md`
- Verify: all changed files and generated output

**Interfaces:**
- Produces a clean `feature/personal-brand` branch ready to merge。
- After merge, repository URL must become `https://github.com/xrlnewman/field-notes` and match all public links。

- [ ] **Step 1: 更新 README 个人身份与项目发布规范**

README 开头改为“许汝林个人博客”，说明项目优先结构。增加“公开新项目”流程：安全检查、补 README/License、验证、创建公开仓库、填写 `category/cover/repoUrl`、取消草稿、运行 `npm run verify`。

- [ ] **Step 2: 刷新代码索引并运行完整验证**

Run: `codegraph sync && npm run verify && git diff --check`

Expected: 15 个单元测试、Astro check、16 个静态页面和构建烟测全部通过；0 errors、0 warnings。

- [ ] **Step 3: 真实浏览器桌面验收**

在 1280px 视口检查：

- 首页首屏、项目优先顺序和 GitHub 入口。
- 项目分类按钮切换、空状态和键盘可操作性。
- 项目详情封面、源码按钮和评论降级。
- 深浅主题切换。
- 搜索 `Redis` 返回结果。
- 控制台无 error/warning，页面无横向溢出。

- [ ] **Step 4: 真实浏览器移动端验收**

临时设置 390×844 视口，检查导航菜单、品牌名、事实栏、分类筛选横向布局、单列项目卡和项目详情；完成后重置视口。

- [ ] **Step 5: 提交文档并收口分支**

```bash
git add README.md docs/superpowers/plans/2026-07-14-personal-brand-project-gallery.md
git commit -m "docs(projects): 补充开源项目发布流程"
git status --short
```

Expected: 工作区为空。

- [ ] **Step 6: 合并后创建并推送真实 GitHub 仓库**

在本地 `main` 快进合并并再次执行 `npm run verify`。随后通过已登录 GitHub 账号创建公开仓库 `xrlnewman/field-notes`，启用 Discussions，再执行：

```bash
git remote add origin https://github.com/xrlnewman/field-notes.git
git push -u origin main
```

最后打开 `https://github.com/xrlnewman/field-notes`，确认 README 与源码存在，博客内源码链接不再返回 404。
