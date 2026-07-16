# HomeFlow 多色彩系统实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 HomeFlow 小程序、管理后台和博客展示截图统一到深青蓝、暖橙、薄荷绿和中性灰阶的语义色彩系统，消除“全页面绿色”的模板感。

**Architecture:** 小程序继续通过 `theme.scss` 暴露全局令牌，页面只引用令牌或明确的语义色；管理后台在 `styles.css` 顶部建立同名 CSS 变量，并只替换品牌、行动、状态和图表的关键入口；博客只更新 HomeFlow 首页截图资源与 frontmatter 尺寸，业务数据和路由不变。

**Tech Stack:** uni-app、Vue 3、SCSS、Vue 3 管理后台、Astro、Vitest、Astro check、Cloudflare Pages。

## Global Constraints

- 主色使用 `#183B43`，行动色使用 `#F08A5D`，成功色使用 `#3C9B79`，画布使用 `#F7F8F5`。
- 绿色只表示成功、已完成、可用状态，不作为所有按钮、价格和背景的默认色。
- 不改变业务流程、接口、数据结构、路由、字体或图标库。
- 密钥只通过环境变量传递，不进入仓库。
- 每个仓库改动后运行该仓库已有测试；博客提交前运行 `npm test`、`npm run check`、`npm run build`。

### Task 1: 小程序全局色彩令牌

**Files:**
- Modify: `E:/project/homeflow-miniapp/.worktrees/feature-homeflow/src/styles/theme.scss`
- Test: `E:/project/homeflow-miniapp/.worktrees/feature-homeflow/tests/theme.test.ts`

**Interfaces:**
- Produces CSS variables `--ink`, `--ink-soft`, `--muted`, `--brand`, `--brand-soft`, `--action`, `--action-dark`, `--success`, `--success-soft`, `--warning`, `--danger`, `--canvas`, `--card`, `--line` for all page styles.

- [ ] **Step 1: Write the failing token test**

```ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const theme = readFileSync(resolve(__dirname, '../src/styles/theme.scss'), 'utf8')

describe('HomeFlow 色彩令牌', () => {
  it('暴露品牌、行动、成功和中性令牌', () => {
    expect(theme).toContain('--brand: #183B43')
    expect(theme).toContain('--action: #F08A5D')
    expect(theme).toContain('--success: #3C9B79')
    expect(theme).toContain('--canvas: #F7F8F5')
  })
})
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- tests/theme.test.ts`

Expected: FAIL because the four new token values are absent.

- [ ] **Step 3: Replace the existing `:root` declaration**

```scss
:root {
  --ink: #183B43; --ink-soft: #42626A; --muted: #718087;
  --brand: #183B43; --brand-soft: #E7F0F0;
  --action: #F08A5D; --action-dark: #C9653E;
  --success: #3C9B79; --success-soft: #E6F5EF;
  --warning: #D49A3A; --danger: #C85C5C;
  --line: #E3E9E8; --canvas: #F7F8F5; --card: #FFFFFF;
}
```

Update `.primary-btn` to `background: var(--action);`, `.ghost-btn` to use `var(--brand-soft)` and `var(--brand)`, `.pill` to use `var(--success-soft)` and `var(--success)`, and `.card` shadow to use a neutral rgba value.

- [ ] **Step 4: Run the focused test and full checks**

Run: `npm test -- tests/theme.test.ts && npm test && npm run build`

Expected: focused test passes, all existing tests pass, and the uni-app build completes.

- [ ] **Step 5: Commit**

```bash
git add src/styles/theme.scss tests/theme.test.ts
git commit -m "refactor(theme): 建立 HomeFlow 多色彩令牌"
```

### Task 2: 小程序页面语义色替换

**Files:**
- Modify: `E:/project/homeflow-miniapp/.worktrees/feature-homeflow/src/pages/index/index.vue`
- Modify: `E:/project/homeflow-miniapp/.worktrees/feature-homeflow/src/pages/booking/booking.vue`
- Modify: `E:/project/homeflow-miniapp/.worktrees/feature-homeflow/src/pages/orders/orders.vue`
- Modify: `E:/project/homeflow-miniapp/.worktrees/feature-homeflow/src/pages/workbench/workbench.vue`
- Modify: `E:/project/homeflow-miniapp/.worktrees/feature-homeflow/src/pages/profile/profile.vue`
- Test: `E:/project/homeflow-miniapp/.worktrees/feature-homeflow/tests/color-usage.test.ts`

**Interfaces:** 页面继续消费 Task 1 的 CSS 变量，不新增组件参数或接口字段。

- [ ] **Step 1: Add a source-level color usage test**

```ts
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const home = readFileSync('src/pages/index/index.vue', 'utf8')
describe('首页语义色', () => {
  it('行动和价格使用橙色令牌，绿色只保留状态语义', () => {
    expect(home).toContain('var(--action)')
    expect(home).not.toContain('background:#173b32')
  })
})
```

- [ ] **Step 2: Run it to verify the current hard-coded palette fails**

Run: `npm test -- tests/color-usage.test.ts`

Expected: FAIL because the home page still contains hard-coded green hero and button colors.

- [ ] **Step 3: Replace page-level hard-coded colors**

Use these mappings in the page styles:

```scss
.hero { background: var(--brand); }
.hero-btn { background: var(--action); color: #fff; }
.hero-shape { background: #2D5962; color: #9ACFC0; }
.accent, .quick-icon { color: var(--brand); }
.quick-icon.orange, .price { color: var(--action-dark); }
```

In booking, orders, workbench and profile, replace active controls with `var(--brand)` or `var(--action)`, completed states with `var(--success)`, pending states with `var(--warning)`, and error/cancel states with `var(--danger)`.

- [ ] **Step 4: Run page tests and build**

Run: `npm test -- tests/color-usage.test.ts && npm test && npm run build`

Expected: all tests pass and the generated app has no page-level hard-coded green hero or action button.

- [ ] **Step 5: Commit**

```bash
git add src/pages tests/color-usage.test.ts
git commit -m "fix(ui): 统一 HomeFlow 小程序语义色"
```

### Task 3: 管理后台品牌、操作与图表配色

**Files:**
- Modify: `E:/project/homeflow-admin/.worktrees/feature-homeflow/web/src/styles.css`
- Modify: `E:/project/homeflow-admin/.worktrees/feature-homeflow/web/src/App.vue`
- Test: `E:/project/homeflow-admin/.worktrees/feature-homeflow/web/tests/color-usage.test.js`

**Interfaces:** Reactivity、API 调用、后台登录状态和离线演示数据保持不变。

- [ ] **Step 1: Add a CSS token assertion**

```js
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8')
describe('后台色彩系统', () => {
  it('声明品牌、行动和状态令牌', () => {
    expect(css).toContain('--brand: #183B43')
    expect(css).toContain('--action: #F08A5D')
    expect(css).toContain('--success: #3C9B79')
  })
})
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- tests/color-usage.test.js`

Expected: FAIL because the stylesheet has no shared tokens.

- [ ] **Step 3: Add tokens and update key selectors**

Add to `:root`:

```css
--brand: #183B43; --brand-soft: #E7F0F0;
--action: #F08A5D; --action-dark: #C9653E;
--success: #3C9B79; --warning: #D49A3A; --danger: #C85C5C;
--canvas: #F7F8F5; --line: #E3E9E8;
```

Use `var(--action)` for `.primary-button`, `.auth-submit`, and dispatch confirmation; use `var(--brand)` for active navigation and headings; preserve green only for `.state-serving`, `.state-completed`, successful toasts and completion charts. Replace the single green chart series with blue plus orange, leaving green for completed orders.

- [ ] **Step 4: Run frontend checks**

Run: `npm test && npm run build`

Expected: existing backend-independent frontend tests pass and the admin build completes.

- [ ] **Step 5: Commit**

```bash
git add web/src web/tests
git commit -m "fix(web): 统一后台多色彩视觉系统"
```

### Task 4: 更新博客 HomeFlow 首页展示截图

**Files:**
- Create: `E:/project/field-notes/.worktrees/homeflow-color-next/public/images/projects/homeflow-platform/home-mobile-v4.png`
- Modify: `E:/project/field-notes/.worktrees/homeflow-color-next/src/content/projects/homeflow-platform.md`
- Test: `E:/project/field-notes/.worktrees/homeflow-color-next/tests/project-screenshots.test.ts`

**Interfaces:** frontmatter 继续使用 `viewport`, `width`, `height`，只替换首页截图资源和尺寸。

- [ ] **Step 1: Generate a palette-adjusted screenshot from `home-mobile-v3.png`**

Use the existing screenshot as the edit source. Preserve every Chinese label, card layout and navigation item. Change only the visual tokens: deep petrol hero `#183B43`, warm orange action and price `#F08A5D`, light mint/sky/peach service tiles, warm-white canvas, and deep petrol active tab. Do not add a phone frame or second home indicator.

- [ ] **Step 2: Inspect dimensions and text**

Run: `Add-Type -AssemblyName System.Drawing; $i=[System.Drawing.Image]::FromFile('public/images/projects/homeflow-platform/home-mobile-v4.png'); "$($i.Width)x$($i.Height)"`

Expected: portrait ratio remains close to `853x1844`; all three service cards and four navigation labels are legible.

- [ ] **Step 3: Update frontmatter and test the asset**

Set `src` to `/images/projects/homeflow-platform/home-mobile-v4.png` and set `width`/`height` to the inspected dimensions. Run `npm test -- tests/project-screenshots.test.ts`.

Expected: screenshot asset exists, dimensions match frontmatter, and the gallery test passes.

- [ ] **Step 4: Run blog verification**

Run: `npm test && npm run check && npm run build`

Expected: 400+ tests pass, Astro reports 0 errors/warnings/hints, and 20 pages build successfully.

- [ ] **Step 5: Commit, push and deploy**

```bash
git add public/images/projects/homeflow-platform/home-mobile-v4.png src/content/projects/homeflow-platform.md
git commit -m "fix(blog): 更新 HomeFlow 多色彩展示截图"
git push origin feat/homeflow-color-next
npx wrangler pages deploy dist --project-name field-notes --commit-dirty=true
```

### Task 5: 交付检查

**Files:**
- Verify: `E:/project/field-notes/.worktrees/homeflow-color-next/src/content/projects/homeflow-platform.md`
- Verify: `E:/project/homeflow-miniapp/.worktrees/feature-homeflow/src/styles/theme.scss`
- Verify: `E:/project/homeflow-admin/.worktrees/feature-homeflow/web/src/styles.css`

- [ ] **Step 1: Confirm git state**

Run `git status --short` in all three repositories. Expected: clean worktrees after commits.

- [ ] **Step 2: Confirm production references the new screenshot**

Request `https://field-notes-2fi.pages.dev/projects/homeflow-platform/` and verify the HTML contains `home-mobile-v4.png` and the asset returns HTTP 200.

- [ ] **Step 3: Record the next product boundary**

Do not modify the existing Linli repositories in this plan. After HomeFlow color delivery, create a separate spec and plan for the new StoreFlow appointment/operations product so its product decisions and commits remain independent.
