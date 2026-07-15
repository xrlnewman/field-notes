# 项目真实截图画廊 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为四个公开网站项目补齐 4～6 张真实页面截图，并在项目详情页提供响应式、可键盘操作的截图画廊与大图查看。

**Architecture:** 在项目 frontmatter 中加入强类型 `screenshots` 数组，`ProjectScreenshots.astro` 只负责截图呈现和渐进增强交互，`ProjectLayout.astro` 负责把画廊插入现有项目叙事。截图全部作为仓库内静态资源发布；卡片封面仍由独立 `cover` 字段控制，不与画廊顺序耦合。

**Tech Stack:** Astro 7、TypeScript、Astro Content Collections、原生 `<dialog>`、Vitest、Cloudflare Pages

## Global Constraints

- 每个公开项目必须包含 4～6 张来自真实网站源码的页面截图。
- 截图字段固定为 `src`、`alt`、`title`、`caption`、`viewport`、`width`、`height`。
- `viewport` 只能是 `desktop` 或 `mobile`；`width` 与 `height` 必须为正整数。
- 不生成虚构 UI，不拉伸或裁掉截图主体，不引入第三方轮播依赖。
- 三种星空主题共用现有 CSS 变量；Giscus、项目筛选、仓库链接和星空交互不得回归。
- 所有交互目标最小 44px；`prefers-reduced-motion` 下不执行切换动画。

---

### Task 1: 建立截图内容模型

**Files:**
- Modify: `src/lib/project-schema.ts`
- Modify: `tests/projects.test.ts`

**Interfaces:**
- Consumes: 现有 `projectSchema` 与项目 frontmatter。
- Produces: `ProjectData['screenshots']`，元素类型为 `{ src: string; alt: string; title: string; caption: string; viewport: 'desktop' | 'mobile'; width: number; height: number }`。

- [ ] **Step 1: 写失败测试**

在 `tests/projects.test.ts` 增加：

```ts
const screenshot = {
  src: '/images/projects/example/home.png',
  alt: '示例网站首页',
  title: '网站首页',
  caption: '展示网站的主要入口。',
  viewport: 'desktop' as const,
  width: 1440,
  height: 900,
};

it('accepts four to six typed project screenshots when provided', () => {
  const publicProject = {
    ...baseProject,
    cover: '/images/projects/example.png',
    repoUrl: 'https://github.com/xrlnewman/example',
  };

  expect(projectSchema.safeParse(publicProject).success).toBe(true);
  expect(projectSchema.safeParse({
    ...publicProject,
    screenshots: Array.from({ length: 4 }, (_, index) => ({
      ...screenshot,
      src: `/images/projects/example/screen-${index + 1}.png`,
    })),
  }).success).toBe(true);
  expect(projectSchema.safeParse({
    ...publicProject,
    screenshots: Array.from({ length: 7 }, () => screenshot),
  }).success).toBe(false);
});

it('rejects malformed screenshot metadata', () => {
  const screenshots = Array.from({ length: 4 }, () => screenshot);
  const publicProject = {
    ...baseProject,
    cover: '/images/projects/example.png',
    repoUrl: 'https://github.com/xrlnewman/example',
  };

  expect(projectSchema.safeParse({
    ...publicProject,
    screenshots: [{ ...screenshot, viewport: 'tablet' }, ...screenshots.slice(1)],
  }).success).toBe(false);
  expect(projectSchema.safeParse({
    ...publicProject,
    screenshots: [{ ...screenshot, width: 0 }, ...screenshots.slice(1)],
  }).success).toBe(false);
});
```

- [ ] **Step 2: 运行测试确认 RED**

Run: `npx vitest run tests/projects.test.ts`

Expected: FAIL，`screenshots` 还未进入 schema，错误 `viewport` 与零宽度仍可能通过。

- [ ] **Step 3: 实现最小内容模型**

在 `src/lib/project-schema.ts` 增加：

```ts
const projectScreenshotSchema = z.object({
  src: z.string().startsWith('/'),
  alt: z.string().min(1),
  title: z.string().min(1),
  caption: z.string().min(1),
  viewport: z.enum(['desktop', 'mobile']),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});
```

在 `projectSchema` 主对象加入：

```ts
screenshots: z.array(projectScreenshotSchema).min(4).max(6).optional(),
```

- [ ] **Step 4: 运行测试确认 GREEN**

Run: `npx vitest run tests/projects.test.ts`

Expected: `tests/projects.test.ts` 全部 PASS。

- [ ] **Step 5: 提交**

```bash
git add src/lib/project-schema.ts tests/projects.test.ts
git commit -m "feat(projects): 建立真实截图发布契约"
```

---

### Task 2: 实现响应式截图画廊与大图对话框

**Files:**
- Create: `src/components/ProjectScreenshots.astro`
- Modify: `src/layouts/ProjectLayout.astro`
- Create: `tests/project-screenshots.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `screenshots: NonNullable<ProjectData['screenshots']>` 与 `projectTitle: string`。
- Produces: `[data-project-screenshots]` 画廊、`[data-screenshot-dialog]` 大图对话框及无脚本静态截图列表。

- [ ] **Step 1: 写失败测试**

创建 `tests/project-screenshots.test.ts`：

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

describe('project screenshot gallery', () => {
  it('renders a progressive gallery with captions, thumbnails, and dialog controls', () => {
    const gallery = read('src/components/ProjectScreenshots.astro');
    const layout = read('src/layouts/ProjectLayout.astro');

    expect(gallery).toContain('data-project-screenshots');
    expect(gallery).toContain('data-screenshot-stage');
    expect(gallery).toContain('aria-current');
    expect(gallery).toContain('<dialog');
    expect(gallery).toContain('aria-label="上一张截图"');
    expect(gallery).toContain('aria-label="下一张截图"');
    expect(gallery).toContain('aria-label="关闭大图"');
    expect(gallery).toContain('<noscript>');
    expect(gallery).toContain('min-height: 44px;');
    expect(gallery).toContain('@media (prefers-reduced-motion: reduce)');
    expect(layout).toContain('<ProjectScreenshots');
    expect(layout.indexOf('<ProjectScreenshots')).toBeLessThan(layout.indexOf('project-panorama'));
  });
});
```

并在 `package.json` 的 `test` 命令中加入 `tests/project-screenshots.test.ts`。

- [ ] **Step 2: 运行测试确认 RED**

Run: `npx vitest run tests/project-screenshots.test.ts`

Expected: FAIL，`ProjectScreenshots.astro` 尚不存在。

- [ ] **Step 3: 写最小可用组件**

创建 `src/components/ProjectScreenshots.astro`。服务端渲染第一张主图、所有缩略图与 `<noscript>` 静态列表；脚本将每个截图对象序列化到 `data-*`，提供以下行为：

```ts
const selectScreenshot = (index: number) => {
  currentIndex = (index + screenshots.length) % screenshots.length;
  const item = screenshots[currentIndex];
  stageImage.src = item.src;
  stageImage.alt = item.alt;
  stageImage.width = item.width;
  stageImage.height = item.height;
  stage.dataset.viewport = item.viewport;
  title.textContent = item.title;
  caption.textContent = item.caption;
  progress.textContent = `${String(currentIndex + 1).padStart(2, '0')} / ${String(screenshots.length).padStart(2, '0')}`;
  thumbnailButtons.forEach((button, buttonIndex) => {
    button.setAttribute('aria-current', String(buttonIndex === currentIndex));
  });
};
```

对话框行为固定为：主预览的“查看大图”按钮执行 `dialog.showModal()`；关闭按钮执行 `dialog.close()`；上一张和下一张复用 `selectScreenshot`；点击 `dialog` 背景时关闭。主布局使用 `grid-template-columns: minmax(220px, 4fr) minmax(0, 8fr)`，移动端在 `760px` 改为单列；移动截图容器最大宽度 `390px`，图片始终 `width: 100%; height: auto; object-fit: contain`。

- [ ] **Step 4: 接入项目布局**

在 `src/layouts/ProjectLayout.astro` 导入：

```astro
import ProjectScreenshots from '../components/ProjectScreenshots.astro';
```

在现有 `project-showcase` 之后、`project-panorama` 之前加入：

```astro
{data.screenshots && (
  <ProjectScreenshots screenshots={data.screenshots} projectTitle={data.title} />
)}
```

- [ ] **Step 5: 运行测试确认 GREEN**

Run: `npx vitest run tests/project-screenshots.test.ts tests/layout-contract.test.ts`

Expected: 两个测试文件全部 PASS。

- [ ] **Step 6: 提交**

```bash
git add package.json src/components/ProjectScreenshots.astro src/layouts/ProjectLayout.astro tests/project-screenshots.test.ts
git commit -m "feat(gallery): 增加项目截图浏览与大图查看"
```

---

### Task 3: 迁入邻里社区和天舶重工真实截图

**Files:**
- Create: `public/images/projects/linli-community/home-mobile.png`
- Create: `public/images/projects/linli-community/groupbuy-detail-mobile.png`
- Create: `public/images/projects/linli-community/leader-dashboard-mobile.png`
- Create: `public/images/projects/linli-community/products-admin.png`
- Create: `public/images/projects/linli-community/orders-admin.png`
- Create: `public/images/projects/skyboom-corporate/home-desktop.png`
- Create: `public/images/projects/skyboom-corporate/products-desktop.png`
- Create: `public/images/projects/skyboom-corporate/about-desktop.png`
- Create: `public/images/projects/skyboom-corporate/contact-desktop.png`
- Create: `public/images/projects/skyboom-corporate/home-mobile.png`
- Modify: `public/images/projects/linli-community.png`
- Modify: `src/content/projects/linli-community.md`
- Modify: `src/content/projects/skyboom-corporate.md`
- Modify: `tests/projects.test.ts`

**Interfaces:**
- Consumes: Task 1 的 `screenshots` 内容模型。
- Produces: 两个项目各五张真实截图，邻里社区使用有数据的后台订单页作为列表封面。

- [ ] **Step 1: 写失败测试**

在 `tests/projects.test.ts` 增加：

```ts
it.each(['linli-community', 'skyboom-corporate'])(
  '%s publishes five existing real screenshots',
  (slug) => {
    const frontmatter = readProjectFrontmatter(slug);
    const screenshots = frontmatter.screenshots as Array<{ src: string; width: number; height: number }>;

    expect(screenshots).toHaveLength(5);
    for (const screenshot of screenshots) {
      expect(existsSync(`public${screenshot.src}`), screenshot.src).toBe(true);
      expect(screenshot.width).toBeGreaterThan(0);
      expect(screenshot.height).toBeGreaterThan(0);
    }
  },
);
```

- [ ] **Step 2: 运行测试确认 RED**

Run: `npx vitest run tests/projects.test.ts`

Expected: FAIL，两个 frontmatter 尚无 `screenshots`。

- [ ] **Step 3: 复制经视觉检查的原始截图**

使用 `Copy-Item` 保留原文件字节，不做拉伸：

```powershell
$mainRepository = (Resolve-Path (Join-Path (git rev-parse --path-format=absolute --git-common-dir) '..')).Path
$workspace = Split-Path $mainRepository -Parent
Copy-Item (Join-Path $workspace 'linli-mp\docs\screenshots\mp-02-home.png') public\images\projects\linli-community\home-mobile.png
Copy-Item (Join-Path $workspace 'linli-mp\docs\screenshots\mp-04-groupbuy-detail.png') public\images\projects\linli-community\groupbuy-detail-mobile.png
Copy-Item (Join-Path $workspace 'linli-mp\docs\screenshots\mp-leader-01-dashboard.png') public\images\projects\linli-community\leader-dashboard-mobile.png
Copy-Item (Join-Path $workspace 'linli-admin\docs\screenshots\admin-06-products.png') public\images\projects\linli-community\products-admin.png
Copy-Item (Join-Path $workspace 'linli-admin\docs\screenshots\admin-08-orders.png') public\images\projects\linli-community\orders-admin.png
Copy-Item (Join-Path $workspace 'linli-admin\docs\screenshots\admin-08-orders.png') public\images\projects\linli-community.png -Force
Copy-Item public\images\projects\skyboom-corporate.png public\images\projects\skyboom-corporate\home-desktop.png
Copy-Item (Join-Path $workspace 'skyboom-web\docs\screenshots\qa-02-products-zh-desktop.png') public\images\projects\skyboom-corporate\products-desktop.png
Copy-Item (Join-Path $workspace 'skyboom-web\docs\screenshots\qa-10-about-zh-desktop.png') public\images\projects\skyboom-corporate\about-desktop.png
Copy-Item (Join-Path $workspace 'skyboom-web\docs\screenshots\web-polish-contact-desktop.png') public\images\projects\skyboom-corporate\contact-desktop.png
Copy-Item (Join-Path $workspace 'skyboom-web\docs\screenshots\qa-21-home-mobile-390.png') public\images\projects\skyboom-corporate\home-mobile.png
```

复制前用图片查看器确认每张图不是加载中、空态、报错态或隐私数据页面。

- [ ] **Step 4: 填写 frontmatter**

为两个项目加入五项 `screenshots`，每项写真实像素宽高、具体 `alt`、场景 `title` 和能力 `caption`。邻里移动页标记 `viewport: mobile`，后台页和天舶桌面页标记 `desktop`，天舶移动首页标记 `mobile`。

- [ ] **Step 5: 运行测试确认 GREEN**

Run: `npx vitest run tests/projects.test.ts`

Expected: `tests/projects.test.ts` 全部 PASS。

- [ ] **Step 6: 提交**

```bash
git add public/images/projects src/content/projects/linli-community.md src/content/projects/skyboom-corporate.md tests/projects.test.ts
git commit -m "feat(showcase): 补齐社区与企业官网真实截图"
```

---

### Task 4: 补齐博客与多商户商城真实截图

**Files:**
- Create: `public/images/projects/field-notes/home.png`
- Create: `public/images/projects/field-notes/projects.png`
- Create: `public/images/projects/field-notes/project-detail.png`
- Create: `public/images/projects/field-notes/guestbook.png`
- Create: `public/images/projects/multi-merchant-mall/home.png`
- Create: `public/images/projects/multi-merchant-mall/category.png`
- Create: `public/images/projects/multi-merchant-mall/product-detail.png`
- Create: `public/images/projects/multi-merchant-mall/products-admin.png`
- Create: `public/images/projects/multi-merchant-mall/orders-admin.png`
- Modify: `src/content/projects/field-notes.md`
- Modify: `src/content/projects/multi-merchant-mall.md`
- Modify: `tests/projects.test.ts`

**Interfaces:**
- Consumes: Task 1 的截图内容模型和 Task 2 的混合宽屏/移动端呈现。
- Produces: 博客四张、商城五张真实截图。

- [ ] **Step 1: 扩展失败测试**

把 Task 3 的参数化测试改为四个项目，并按项目断言数量：

```ts
it.each([
  ['field-notes', 4],
  ['linli-community', 5],
  ['multi-merchant-mall', 5],
  ['skyboom-corporate', 5],
] as const)('%s publishes its complete real screenshot set', (slug, count) => {
  const frontmatter = readProjectFrontmatter(slug);
  const screenshots = frontmatter.screenshots as Array<{ src: string }>;

  expect(screenshots).toHaveLength(count);
  screenshots.forEach(({ src }) => expect(existsSync(`public${src}`), src).toBe(true));
});
```

- [ ] **Step 2: 运行测试确认 RED**

Run: `npx vitest run tests/projects.test.ts`

Expected: FAIL，博客和商城还没有完整截图集合。

- [ ] **Step 3: 捕获真实页面**

博客使用当前本地构建或生产地址捕获 `/`、`/projects/`、`/projects/field-notes/`、`/guestbook/`，桌面画布统一为 1440×900。商城运行 `mall-h5` 与 `mall-admin` 本地源码，使用演示数据捕获 `/#/home`、`/#/category`、`/#/product/1`、后台商品管理与后台订单管理；截图中不得出现接口报错、空白加载区或真实账号信息。

每次截图后必须打开原文件检查页面状态，再复制到上述固定资源路径。已有 `multi-merchant-mall.png` 可作为首页截图源，但不能重复充当其他场景。

- [ ] **Step 4: 填写 frontmatter**

为 `field-notes.md` 加入四项 `screenshots`；为 `multi-merchant-mall.md` 加入五项。商城 H5 页面按实际画布标记 `mobile` 或 `desktop`，后台页面标记 `desktop`；每项宽高必须与 PNG 文件头一致。

- [ ] **Step 5: 运行测试确认 GREEN**

Run: `npx vitest run tests/projects.test.ts`

Expected: `tests/projects.test.ts` 全部 PASS。

- [ ] **Step 6: 提交**

```bash
git add public/images/projects src/content/projects/field-notes.md src/content/projects/multi-merchant-mall.md tests/projects.test.ts
git commit -m "feat(showcase): 补齐博客与商城真实截图"
```

---

### Task 5: 构建契约、浏览器验收与上线

**Files:**
- Modify: `src/lib/project-schema.ts`
- Modify: `tests/projects.test.ts`
- Modify: `tests/build-smoke.test.ts`
- Modify: `tests/layout-contract.test.ts`

**Interfaces:**
- Consumes: 四个项目完整截图和 `ProjectScreenshots` 组件。
- Produces: 静态构建回归保障及上线后的可视验收记录。

- [ ] **Step 1: 写构建失败测试**

在 `tests/projects.test.ts` 增加最终发布约束：

```ts
it('rejects a public project without screenshots while drafts may omit them', () => {
  const publicProject = {
    ...baseProject,
    cover: '/images/projects/example.png',
    repoUrl: 'https://github.com/xrlnewman/example',
  };

  expect(projectSchema.safeParse(publicProject).success).toBe(false);
  expect(projectSchema.safeParse({ ...publicProject, draft: true }).success).toBe(true);
});
```

在 `tests/build-smoke.test.ts` 的项目详情循环中增加：

```ts
expect(detail).toContain('data-project-screenshots');
expect(detail).toContain('data-screenshot-dialog');
expect(detail.match(/data-screenshot-thumbnail/g)?.length).toBeGreaterThanOrEqual(4);
```

在 `tests/layout-contract.test.ts` 增加：

```ts
it('keeps screenshot galleries readable on desktop and mobile', () => {
  const gallery = read('src/components/ProjectScreenshots.astro');

  expect(gallery).toContain('grid-template-columns: minmax(220px, 4fr) minmax(0, 8fr);');
  expect(gallery).toContain('max-width: 390px;');
  expect(gallery).toMatch(/@media \(max-width: 760px\)[\s\S]*grid-template-columns: 1fr;/);
  expect(gallery).toContain('overflow-x: auto;');
});
```

- [ ] **Step 2: 运行测试确认 RED**

Run: `npx vitest run tests/projects.test.ts tests/layout-contract.test.ts`

Expected: FAIL，公开项目缺少截图时仍被接受。

- [ ] **Step 3: 收紧公开项目发布约束**

在 `src/lib/project-schema.ts` 的 `superRefine` 公开项目分支加入：

```ts
if (!project.screenshots) {
  context.addIssue({
    code: 'custom',
    path: ['screenshots'],
    message: '公开项目必须提供 4 到 6 张真实页面截图',
  });
}
```

同步把旧的“accepts a public project”和公开仓库 URL 测试数据补入四张合法截图，使它们只验证各自原有职责。

- [ ] **Step 4: 运行完整验证**

Run: `npm run verify`

Expected: Vitest 全部 PASS；Astro check 为 0 errors / 0 warnings；构建与 19 页冒烟检查通过。

- [ ] **Step 5: 刷新代码图并检查改动**

Run: `codegraph sync`

Expected: 索引同步成功。随后运行 `git diff --check`，Expected: 无输出。

- [ ] **Step 6: 浏览器验收**

使用站内浏览器检查四个项目详情：

- 1440×900：画廊 4/8 分栏，无横向溢出，缩略图可切换，大图对话框可打开、前后切换、关闭。
- 390×844：单列布局，移动图不拉伸，缩略图仅自身横向滚动，页面无横向溢出。
- 分别切换 `observatory`、`nebula`、`terminal`：当前缩略图、按钮、对话框边界均清晰。
- 按 Esc：对话框关闭；控制台 error/warning 为空。
- Giscus iframe、项目筛选与 GitHub 仓库链接仍存在。

- [ ] **Step 7: 请求代码复核并修复所有 Critical / Important 问题**

复核范围固定为 Task 1～5 的代码、内容与静态资源；再次运行 `npm run verify` 和核心页面浏览器验收，直到无 Critical / Important。

- [ ] **Step 8: 提交验收契约**

```bash
git add src/lib/project-schema.ts tests/projects.test.ts tests/build-smoke.test.ts tests/layout-contract.test.ts
git commit -m "test(showcase): 覆盖多截图构建与响应式布局"
```

- [ ] **Step 9: 合并并部署**

```bash
git fetch origin
git switch main
git merge --ff-only feat/project-screenshot-gallery
git push origin main
npm run build
npx wrangler pages deploy dist --project-name field-notes --branch main
```

Expected: Cloudflare Pages 返回新部署 URL；访问 `https://field-notes-2fi.pages.dev/projects/field-notes/` 能看到新的真实截图画廊。
