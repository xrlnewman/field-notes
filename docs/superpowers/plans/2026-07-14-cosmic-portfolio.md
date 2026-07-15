# 三主题星空作品集 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把现有 Astro 博客重做为三主题可切换、带鼠标事件的星空网站作品集，并只展示四个网站产品及其关联源码。

**Architecture:** 主题状态和星空计算保持在可单测的 TypeScript 纯函数中，Astro 组件只负责 DOM/Canvas 接线。所有页面通过 `BaseLayout` 共享主题启动脚本与固定星空背景；项目内容使用扩展后的 Astro Content Schema 表达一个产品的多个关联仓库。

**Tech Stack:** Astro 7、TypeScript 6、Vitest 4、Canvas 2D、CSS Custom Properties、`@fontsource-variable/inter@5.2.8`、`@fontsource-variable/noto-sans-sc@5.2.10`

## Global Constraints

- 主题标识只能是 `observatory`、`nebula`、`terminal`，默认 `observatory`，存储键固定为 `cosmic-theme`。
- 不引入 WebGL、Three.js 或第三方粒子运行库；星空使用 Canvas 2D。
- 中文使用 Noto Sans SC，英文/数字使用 Inter，只使用 400、500、600、700 标准字重。
- `prefers-reduced-motion: reduce` 必须停止循环动画、视差和卡片倾斜。
- 生产项目目录只能显示个人博客、商城、邻里和天舶四个网站产品。
- 多仓库产品必须在一张产品卡与一个详情页中聚合，不拆成多张作品卡。
- 个人博客必须突出“永久免费 · 零成本部署 · 完全开源”，评论与留言保留站内完成。
- 所有指针效果不得阻挡链接点击，键盘操作和无 JavaScript 内容阅读必须可用。

---

### Task 1: 主题领域模型与首屏启动

**Files:**
- Create: `src/lib/cosmic-theme.ts`
- Create: `tests/cosmic-theme.test.ts`
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `src/components/ThemeToggle.astro`

**Interfaces:**
- Produces: `CosmicTheme = 'observatory' | 'nebula' | 'terminal'`
- Produces: `COSMIC_THEME_STORAGE_KEY = 'cosmic-theme'`
- Produces: `cosmicThemes: readonly CosmicThemeOption[]`
- Produces: `isCosmicTheme(value: unknown): value is CosmicTheme`
- Produces: `resolveCosmicTheme(value: unknown): CosmicTheme`
- Emits: `CustomEvent('cosmic-theme-change', { detail: { theme } })`

- [ ] **Step 1: 写失败测试**

在 `tests/cosmic-theme.test.ts` 断言主题顺序为 observatory/nebula/terminal、非法保存值回落到 observatory、存储键固定，并读取 `BaseLayout.astro`/`ThemeToggle.astro` 断言启动脚本与三个可访问按钮存在。

- [ ] **Step 2: 确认红灯**

Run: `npx vitest run tests/cosmic-theme.test.ts`

Expected: FAIL，因为 `src/lib/cosmic-theme.ts` 不存在。

- [ ] **Step 3: 实现最小主题模型和切换器**

`cosmic-theme.ts` 使用下列公开数据形状：

```ts
export type CosmicTheme = 'observatory' | 'nebula' | 'terminal';

export interface CosmicThemeOption {
  id: CosmicTheme;
  label: string;
  shortLabel: string;
  description: string;
}

export const COSMIC_THEME_STORAGE_KEY = 'cosmic-theme';
export const DEFAULT_COSMIC_THEME: CosmicTheme = 'observatory';
```

三个选项中文名称依次为“深空观测站”“梦幻银河”“宇宙终端”。`BaseLayout` 的 head 内联脚本在首屏前读取 `cosmic-theme`，只接受三个值并设置 `document.documentElement.dataset.theme` 与 `colorScheme='dark'`。`ThemeToggle` 渲染 `role="group"` 的三个 button，使用 `aria-pressed` 表达当前值，点击后保存、更新按钮并派发事件。

- [ ] **Step 4: 验证绿灯和回归**

Run: `npx vitest run tests/cosmic-theme.test.ts tests/brand.test.ts`

Expected: 两个测试文件全部 PASS。

- [ ] **Step 5: 提交**

```bash
git add src/lib/cosmic-theme.ts tests/cosmic-theme.test.ts src/layouts/BaseLayout.astro src/components/ThemeToggle.astro
git commit -m "feat(theme): 增加三种星空主题切换"
```

### Task 2: 可测试星空引擎与全站 Canvas

**Files:**
- Create: `src/lib/starfield.ts`
- Create: `tests/starfield.test.ts`
- Create: `src/components/CosmicBackdrop.astro`
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `src/styles/global.css`

**Interfaces:**
- Consumes: `CosmicTheme`
- Produces: `Star`, `PointerState`, `Ripple`, `StarfieldPalette` interfaces
- Produces: `getAdaptiveStarCount(width, height, coarsePointer): number`
- Produces: `getThemePalette(theme): StarfieldPalette`
- Produces: `createStar(seed, width, height): Star`
- Produces: `getParallaxOffset(pointer, depth): { x: number; y: number }`
- Produces: `<CosmicBackdrop />`

- [ ] **Step 1: 写失败测试**

在 `tests/starfield.test.ts` 覆盖：桌面数量始终在 70–180、移动端在 45–90、三主题调色板不同、同一 seed 生成同一星点、视差深度越大位移越小、空指针位移为 0。

- [ ] **Step 2: 确认红灯**

Run: `npx vitest run tests/starfield.test.ts`

Expected: FAIL，因为 `src/lib/starfield.ts` 不存在。

- [ ] **Step 3: 实现纯函数和 Canvas 组件**

数量函数使用 `Math.round(width * height / 9000)` 后按设备上下限夹取。`createStar` 使用局部 mulberry32 伪随机数，不修改全局随机源。Canvas 组件必须：

- 固定定位、`aria-hidden="true"`、`pointer-events:none`；
- DPR 最高 2；resize 时重建星点；
- pointermove 更新视差与邻近连线；pointerdown 添加最长 900ms 的涟漪；
- observatory 绘制冰蓝星与连线，nebula 绘制紫粉光晕与星尘，terminal 绘制绿青星、网格和坐标；
- 监听 `cosmic-theme-change`；
- reduced motion 时只绘制一次静态帧并不启动 `requestAnimationFrame`；
- 页面隐藏时暂停，恢复时继续。

在 `BaseLayout` 的 skip link 前插入 `<CosmicBackdrop />`。全局 CSS 提供 `.cosmic-backdrop`、`.cosmic-noise`、`.cosmic-pointer-glow` 的层级，确保正文 z-index 更高。

- [ ] **Step 4: 验证绿灯**

Run: `npx vitest run tests/starfield.test.ts tests/cosmic-theme.test.ts`

Expected: 全部 PASS。

- [ ] **Step 5: 提交**

```bash
git add src/lib/starfield.ts tests/starfield.test.ts src/components/CosmicBackdrop.astro src/layouts/BaseLayout.astro src/styles/global.css
git commit -m "feat(cosmic): 增加交互星空背景"
```

### Task 3: 字体、主题令牌与全站材质

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/styles/global.css`
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `src/components/Header.astro`
- Modify: `src/components/Footer.astro`
- Modify: `tests/brand.test.ts`

**Interfaces:**
- Consumes: `data-theme` on `<html>`
- Produces: theme tokens `--space-*`, `--ink`, `--muted`, `--accent`, `--border`, `--surface`, `--glow`

- [ ] **Step 1: 改写视觉契约测试并确认红灯**

把 `tests/brand.test.ts` 的暖色工作室断言替换为：加载两套 Fontsource 字体；存在三个 `[data-theme]` token 块；不存在 `font-family: Geist`、字重 560/620/650/680/720 和中文负字距；焦点轮廓仍为 3px；Header 包含星空主题切换器。

Run: `npx vitest run tests/brand.test.ts`

Expected: FAIL，仍存在暖色 token 与 Geist。

- [ ] **Step 2: 安装固定字体版本**

Run: `npm install @fontsource-variable/inter@5.2.8 @fontsource-variable/noto-sans-sc@5.2.10`

Expected: package 与 lockfile 更新，npm audit 为 0 vulnerabilities。

- [ ] **Step 3: 实现三主题 CSS 令牌**

在 `BaseLayout.astro` frontmatter 中导入 `@fontsource-variable/inter/wght.css` 和 `@fontsource-variable/noto-sans-sc/wght.css`。默认 observatory 使用 `#050816` 背景、`#eef4ff` 正文、`#8fb7ff` 强调；nebula 使用 `#090412`、`#fff1ff`、`#e879f9`；terminal 使用 `#020806`、`#d8ffe9`、`#4dff9b`。正文 17px/1.75，移动端 16px/1.7。所有字重改为标准值，中文标题 `letter-spacing: normal`。

Header/Footer 改为半透明深色玻璃材质，Header 桌面端容纳三段主题按钮，移动端不遮挡菜单。

- [ ] **Step 4: 验证**

Run: `npx vitest run tests/brand.test.ts tests/cosmic-theme.test.ts && npm run check`

Expected: Vitest PASS；Astro 0 errors、0 warnings、0 hints。

- [ ] **Step 5: 提交**

```bash
git add package.json package-lock.json src/styles/global.css src/layouts/BaseLayout.astro src/components/Header.astro src/components/Footer.astro tests/brand.test.ts
git commit -m "style(brand): 建立三主题星空视觉与中文字体"
```

### Task 4: 网站产品内容模型与关联仓库

**Files:**
- Modify: `src/lib/projects.ts`
- Modify: `src/lib/project-schema.ts`
- Modify: `tests/projects.test.ts`
- Modify: `tests/content.test.ts`
- Modify: `src/content/projects/field-notes.md`
- Create: `src/content/projects/multi-merchant-mall.md`
- Create: `src/content/projects/linli-community.md`
- Create: `src/content/projects/skyboom-corporate.md`
- Delete: `src/content/projects/api-bench.md`
- Delete: `src/content/projects/bi-report.md`
- Delete: `src/content/projects/db-snapshot-diff.md`
- Delete: `src/content/projects/excel-analyzer.md`
- Delete: `src/content/projects/inventory-system.md`
- Delete: `src/content/projects/invoice-ocr.md`
- Delete: `src/content/projects/toolkit-box.md`
- Delete: `src/content/projects/web-scraper.md`
- Delete: `src/content/projects/trend-product-lab.md`
- Modify: `tests/showcase.test.ts`

**Interfaces:**
- Produces: `ProjectCategory = '个人品牌' | '电商平台' | '社区服务' | '企业官网'`
- Produces: `ProjectRepositoryRole = 'frontend' | 'admin' | 'backend' | 'content'`
- Produces: `repositories?: Array<{ name; role; description; tech; url }>`

- [ ] **Step 1: 写失败内容契约**

更新 `tests/projects.test.ts`：只接受四个网站分类；公开项目仍需 cover 和 repoUrl；repositories 的 url 必须是 GitHub HTTPS；商城、邻里、天舶各有 3 个唯一角色节点。更新 `tests/content.test.ts` 断言生产可见项目 id 精确为 `field-notes`、`multi-merchant-mall`、`linli-community`、`skyboom-corporate`，博客文案包含三项免费承诺。

- [ ] **Step 2: 确认红灯**

Run: `npx vitest run tests/projects.test.ts tests/content.test.ts`

Expected: FAIL，旧分类和三个新项目不存在。

- [ ] **Step 3: 扩展 Schema 并整理内容**

仓库节点 Schema 使用：

```ts
z.object({
  name: z.string().min(1),
  role: z.enum(['frontend', 'admin', 'backend', 'content']),
  description: z.string().min(1),
  tech: z.array(z.string().min(1)).min(1),
  url: z.url().refine((url) => url.startsWith('https://github.com/')),
})
```

field-notes 分类改为个人品牌并强化免费文案。新增三个产品内容，分别链接九个 `https://github.com/xrlnewman/<repo>` 地址。删除九份工具/趋势项目内容文件，使开发和生产目录都只包含四个网站产品；`showcase/` 源码快照及安全测试保留，但 `tests/showcase.test.ts` 移除“工具必须存在博客内容条目”和“博客共有十个项目”的旧耦合断言。

- [ ] **Step 4: 验证绿灯**

Run: `npx vitest run tests/projects.test.ts tests/content.test.ts`

Expected: 全部 PASS。

- [ ] **Step 5: 提交**

```bash
git add src/lib/projects.ts src/lib/project-schema.ts tests/projects.test.ts tests/content.test.ts src/content/projects
git commit -m "feat(projects): 聚合四个网站产品与关联源码"
```

### Task 5: 首页、项目卡和详情页星系化重做

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/pages/projects/index.astro`
- Modify: `src/components/ProjectCard.astro`
- Modify: `src/components/ProjectGallery.astro`
- Modify: `src/layouts/ProjectLayout.astro`
- Create: `src/components/RepositoryConstellation.astro`
- Create: `src/components/CosmicInteractions.astro`
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `tests/brand.test.ts`
- Modify: `tests/projects.test.ts`

**Interfaces:**
- Consumes: `project.data.repositories`
- Produces: `<RepositoryConstellation repositories={...} />`
- Produces: `data-cosmic-card`, `data-reveal`, `data-free-open-source`

- [ ] **Step 1: 写失败页面契约**

测试首页必须含免费开源标记、四产品计数、星空 hero 和 `data-cosmic-card`；项目详情必须渲染“产品全景”和每个关联仓库；卡片不再截断描述为单行；目录不再出现五类工具说明。

- [ ] **Step 2: 确认红灯**

Run: `npx vitest run tests/brand.test.ts tests/projects.test.ts`

Expected: FAIL，仍是暖色三列工具目录。

- [ ] **Step 3: 实现页面结构与交互**

首页首屏使用“把复杂业务，做成可运行的产品。”主标题，数据节点为“7 年经验 / 4 个网站产品 / 永久免费”。field-notes 卡片横跨两列，其他产品使用宽幅截图卡。`ProjectCard` 显示关联仓库数量；单仓库才提供卡片直达源码。

`RepositoryConstellation` 以语义列表输出仓库节点，每个节点包含中文角色、描述、技术和 GitHub 链接。`CosmicInteractions` 对 `[data-cosmic-card]` 绑定 pointermove/leave，把旋转限制在 ±2.5deg，把高光坐标写入 CSS 变量；reduced motion 或 coarse pointer 时不绑定倾斜；IntersectionObserver 为 `[data-reveal]` 添加 `is-visible`。

- [ ] **Step 4: 验证**

Run: `npx vitest run tests/brand.test.ts tests/projects.test.ts && npm run check`

Expected: PASS 且 Astro 检查无诊断。

- [ ] **Step 5: 提交**

```bash
git add src/pages/index.astro src/pages/projects/index.astro src/components/ProjectCard.astro src/components/ProjectGallery.astro src/layouts/ProjectLayout.astro src/components/RepositoryConstellation.astro src/components/CosmicInteractions.astro src/layouts/BaseLayout.astro tests/brand.test.ts tests/projects.test.ts
git commit -m "feat(portfolio): 重做星系化网站作品集"
```

### Task 6: 真实封面、完整回归与浏览器验收

**Files:**
- Create: `public/images/projects/multi-merchant-mall.png`
- Create: `public/images/projects/linli-community.png`
- Create: `public/images/projects/skyboom-corporate.png`
- Modify: `public/images/projects/field-notes.png`
- Modify: `tests/build-smoke.test.ts`
- Modify: `package.json`
- Modify: `README.md`

**Interfaces:**
- Consumes: 四个公开项目内容和三主题页面
- Produces: 生产构建中四个项目详情页及可匿名访问的真实封面

- [ ] **Step 1: 更新构建烟雾测试并确认红灯**

断言构建产物只生成四个公开项目详情页；首页存在三个主题按钮、永久免费文案和四个项目链接；三个聚合详情页含各自 3 个 GitHub 链接；旧工具项目详情不生成。

Run: `npm run build && npx vitest run tests/build-smoke.test.ts`

Expected: FAIL，旧项目仍生成且新封面不存在。

- [ ] **Step 2: 捕获并脱敏真实界面封面**

分别运行商城 H5、邻里小程序/H5、天舶官网并捕获 16:10 PNG；裁切为 1440×900，检查不含手机号、邮箱、令牌、账号密码。重新捕获改版后的博客首页作为 field-notes 封面。

- [ ] **Step 3: 更新构建契约与 README**

将 `tests/cosmic-theme.test.ts`、`tests/starfield.test.ts` 加入 `npm test`。README 说明三主题、四产品聚合、站内评论/留言和 Cloudflare 免费部署。

- [ ] **Step 4: 完整自动化验证**

Run: `npm run verify`

Expected: 全部 Vitest 通过；Astro 0 errors；构建成功；烟雾测试全部通过。

- [ ] **Step 5: 浏览器验收**

启动 `npm run dev -- --host 127.0.0.1`，使用本地浏览器依次检查 1440×900、768×1024、390×844：三主题切换并刷新记忆、星空鼠标移动/点击、卡片悬停、项目关联链接、评论和留言入口、减少动态效果。控制台 error/warning 必须为 0。

- [ ] **Step 6: 同步索引并提交**

```bash
codegraph sync .
git add public/images/projects tests/build-smoke.test.ts package.json README.md
git commit -m "test(portfolio): 补齐真实封面与全站验收"
```
