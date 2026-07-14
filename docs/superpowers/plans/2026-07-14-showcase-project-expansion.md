# 个人博客项目源码展柜扩充 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将八个经过脱敏的本地项目源码、真实封面和项目详情加入个人博客，使线上达到九个公开项目，并让每个项目都能直达 GitHub 源码子目录。

**Architecture:** `showcase/` 保存可公开源码快照，`src/content/projects/` 保存展示元数据与详情，`public/images/projects/` 保存七张真实桌面截图和一张后端架构图。现有 Astro Content 集合自动生成首页、分类列表和详情页，测试负责锁定源码目录、敏感信息边界、封面与 GitHub 路径的一致性。

**Tech Stack:** Astro 7、TypeScript 6、Vitest 4、Electron renderer HTML/CSS/JavaScript、Laravel/PHP、GitHub、Cloudflare Pages。

## Global Constraints

- 新增八个项目：`toolkit-box`、`api-bench`、`db-snapshot-diff`、`web-scraper`、`bi-report`、`inventory-system`、`invoice-ocr`、`excel-analyzer`。
- 最终项目内容总数为十、公开项目数为九，`trend-product-lab` 保持草稿。
- 不复制 `.git`、`node_modules`、`vendor`、`dist`、日志、数据库、备份、真实 `.env`、Token、私钥或公司业务数据。
- 不修改六个现有项目的 Gitee 远端；只从本地读取源码快照。
- 七个桌面项目使用真实 renderer 界面截图；Inventory System 使用明确标注的系统架构 SVG。
- 项目源码地址统一为 `https://github.com/xrlnewman/field-notes/tree/main/showcase/<slug>`。
- 不虚构客户、收入、性能数字、安装量或已上线状态。
- 所有文件编辑使用 `apply_patch`；大量无语义源码复制可使用 PowerShell `Copy-Item`。

---

### Task 1: 建立源码展柜发布契约

**Files:**
- Create: `tests/showcase.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: 设计中的八个固定 slug、禁止公开文件规则与 GitHub 子目录规则。
- Produces: `expectedShowcaseProjects` 测试清单；后续源码、封面和内容任务必须满足该清单。

- [ ] **Step 1: 写失败的源码、封面和内容一致性测试**

创建 `tests/showcase.test.ts`，固定以下清单：

```ts
const expectedShowcaseProjects = [
  { slug: 'toolkit-box', category: '开发工具' },
  { slug: 'api-bench', category: '开发工具' },
  { slug: 'db-snapshot-diff', category: '数据与搜索' },
  { slug: 'web-scraper', category: '数据与搜索' },
  { slug: 'bi-report', category: '业务系统' },
  { slug: 'inventory-system', category: '业务系统' },
  { slug: 'invoice-ocr', category: 'AI 自动化' },
  { slug: 'excel-analyzer', category: '数据与搜索' },
] as const;

const forbiddenNames = new Set([
  '.git', '.env', '.gateway-token', 'memory.db', 'node_modules',
  'vendor', 'dist', 'logs', 'backups',
]);

const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bcfat_[A-Za-z0-9_-]{20,}\b/,
  /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bBearer\s+[A-Za-z0-9._-]{24,}\b/i,
];
```

测试必须断言：

1. `showcase/<slug>/README.md` 存在；
2. `public/images/projects/<slug>.png` 存在，Inventory 例外为 `.svg`；
3. `src/content/projects/<slug>.md` 存在；
4. Markdown 包含对应分类和精确 GitHub 子目录 URL；
5. 递归路径不包含 `forbiddenNames`；
6. `.js/.mjs/.ts/.json/.md/.php/.html/.css/.yml/.yaml/.example` 文本不匹配 `secretPatterns`；
7. `src/content/projects` 共十个文件，其中 `trend-product-lab.md` 仍为 `draft: true`。

- [ ] **Step 2: 把测试加入默认测试命令**

将 `package.json` 的 `test` 脚本末尾增加 `tests/showcase.test.ts`：

```json
"test": "vitest run tests/content.test.ts tests/brand.test.ts tests/projects.test.ts tests/comments.test.ts tests/comment-ui-state.test.ts tests/comments-api.test.ts tests/showcase.test.ts"
```

- [ ] **Step 3: 运行测试确认红灯**

Run: `npx vitest run tests/showcase.test.ts`

Expected: FAIL，明确报告 `showcase/toolkit-box/README.md` 等文件不存在。

- [ ] **Step 4: 提交发布契约**

```bash
git add package.json tests/showcase.test.ts
git commit -m "test(showcase): 锁定项目源码展柜发布契约"
```

---

### Task 2: 导入八个脱敏源码快照

**Files:**
- Create: `showcase/README.md`
- Create: `showcase/toolkit-box/**`
- Create: `showcase/api-bench/**`
- Create: `showcase/db-snapshot-diff/**`
- Create: `showcase/web-scraper/**`
- Create: `showcase/bi-report/**`
- Create: `showcase/inventory-system/**`
- Create: `showcase/invoice-ocr/**`
- Create: `showcase/excel-analyzer/**`

**Interfaces:**
- Consumes: `expectedShowcaseProjects` 与安全扫描规则。
- Produces: 八个不含原仓库元数据和运行时数据的公开源码目录。

- [ ] **Step 1: 为目标目录建立安全边界**

在 worktree 根目录创建空 `showcase/`，复制时仅使用以下来源：

```text
<workspace>/toolkit-box
<workspace>/api-bench
<workspace>/db-snapshot-diff
<workspace>/web-scraper
<workspace>/bi-report
<workspace>/inventory-system
<workspace>/invoice-ocr
<workspace>/excel-analyzer
```

对有 Git 的六个目录使用 `git -C <source> ls-files` 枚举已跟踪文件并逐个 `Copy-Item`；`package-lock.json` 若存在则额外复制。对 ToolkitBox 和 Excel Analyzer 只复制 `main.js`、`preload.js`、`renderer/`、`package.json`、`package-lock.json`、`.gitignore` 与 README。

不得使用递归复制整个源目录；Inventory System 也只复制 `git ls-files` 返回的文件。

- [ ] **Step 2: 补齐公开 README**

`showcase/README.md` 必须列出八个项目、分类和源码相对路径，并声明它们是从本机项目整理的可公开快照。

保留已有项目 README 的真实功能说明。Excel Analyzer 没有 README，新增内容必须包含：

````markdown
# Excel Analyzer

基于 Electron 与 SheetJS 的本地 Excel 分析工具，提供工作表预览、字段统计、空值检查和数据概览。文件只在本机处理。

## 运行

```bash
npm install
npm start
```
````

ToolkitBox README 保留离线处理说明；所有 README 删除 Gitee 地址、绝对磁盘路径和未经验证的商业数字。

- [ ] **Step 3: 让依赖锁文件可追踪**

每个 Electron 快照内的 `.gitignore` 删除 `package-lock.json` 这一行，保留：

```gitignore
node_modules/
dist/
*.log
*.local
```

- [ ] **Step 4: 运行源码安全子集测试**

Run: `npx vitest run tests/showcase.test.ts -t "源码"`

Expected: PASS 源码目录、README、禁止文件名和密钥格式；封面与内容测试仍可失败。

Run: `rg -n --hidden -i "cfat_|gh[pousr]_|BEGIN .*PRIVATE KEY|Bearer [A-Za-z0-9._-]{24,}" showcase`

Expected: 无输出。

- [ ] **Step 5: 提交源码快照**

```bash
git add showcase
git commit -m "feat(showcase): 收录八个脱敏项目源码"
```

---

### Task 3: 生成七张真实截图和一张架构封面

**Files:**
- Create: `public/images/projects/toolkit-box.png`
- Create: `public/images/projects/api-bench.png`
- Create: `public/images/projects/db-snapshot-diff.png`
- Create: `public/images/projects/web-scraper.png`
- Create: `public/images/projects/bi-report.png`
- Create: `public/images/projects/invoice-ocr.png`
- Create: `public/images/projects/excel-analyzer.png`
- Create: `public/images/projects/inventory-system.svg`

**Interfaces:**
- Consumes: 七个快照的 `renderer/index.html` 与现有项目卡 16:10 展示区域。
- Produces: 八个稳定、无隐私信息的仓库内封面路径。

- [ ] **Step 1: 阅读并使用浏览器控制技能**

读取 `browser:control-in-app-browser` 的 `SKILL.md`，使用应用内浏览器控制本地静态页面。不得绕过浏览器安全策略使用其他浏览器表面。

- [ ] **Step 2: 逐个启动静态 renderer 并截图**

对以下目录分别启动只绑定 `127.0.0.1` 的静态服务：

```text
showcase/toolkit-box/renderer
showcase/api-bench/renderer
showcase/db-snapshot-diff/renderer
showcase/web-scraper/renderer
showcase/bi-report/renderer
showcase/invoice-ocr/renderer
showcase/excel-analyzer/renderer
```

使用 1440×900 视口打开 `index.html`。只允许注入返回空数组、空对象或“未连接”状态的只读 `window.api` mock；禁止伪造压测结果、数据库数据、OCR 结果或客户数据。截图裁成 1440×900 PNG 并保存到对应目标路径。

- [ ] **Step 3: 创建 Inventory System 架构 SVG**

SVG 必须使用 `viewBox="0 0 1440 900"`，包含标题“进销存管理系统 API”和四层真实模块：

```text
Vue / React 管理端
Laravel 12 API + Sanctum + RBAC
采购 / 销售 / 库存 / 调拨 / 盘点 / 报表
MySQL 8 + Redis
```

右上角明确显示“系统架构”，不得画成虚构运行界面。

- [ ] **Step 4: 验证封面**

Run: `npx vitest run tests/showcase.test.ts -t "封面"`

Expected: PASS，七张 PNG 和一张 SVG 均存在。

使用 `view_image` 逐张检查 PNG；检查无本机用户名、路径、Token、真实数据库地址和客户数据。

- [ ] **Step 5: 提交封面**

```bash
git add public/images/projects
git commit -m "feat(showcase): 添加项目真实封面与架构图"
```

---

### Task 4: 发布八个项目详情

**Files:**
- Create: `src/content/projects/toolkit-box.md`
- Create: `src/content/projects/api-bench.md`
- Create: `src/content/projects/db-snapshot-diff.md`
- Create: `src/content/projects/web-scraper.md`
- Create: `src/content/projects/bi-report.md`
- Create: `src/content/projects/inventory-system.md`
- Create: `src/content/projects/invoice-ocr.md`
- Create: `src/content/projects/excel-analyzer.md`
- Modify: `tests/showcase.test.ts`
- Modify: `tests/build-smoke.test.ts`

**Interfaces:**
- Consumes: 八个源码目录与封面路径。
- Produces: Astro Content 可读取的八个公开项目，首页计数为 9、项目详情页总数增加 8。

- [ ] **Step 1: 扩展失败测试到精确项目元数据**

测试必须解析八个 Markdown 的 frontmatter，并断言以下映射：

```ts
const expectedMetadata = {
  'toolkit-box': { category: '开发工具', tech: ['Electron', 'JavaScript', 'SheetJS', 'PDF.js'] },
  'api-bench': { category: '开发工具', tech: ['Electron', 'Node.js', 'Chart.js'] },
  'db-snapshot-diff': { category: '数据与搜索', tech: ['Electron', 'MySQL', 'PostgreSQL'] },
  'web-scraper': { category: '数据与搜索', tech: ['Electron', 'WebView', 'SheetJS'] },
  'bi-report': { category: '业务系统', tech: ['Electron', 'MySQL', 'Chart.js'] },
  'inventory-system': { category: '业务系统', tech: ['Laravel 12', 'PHP 8.3', 'MySQL', 'Redis'] },
  'invoice-ocr': { category: 'AI 自动化', tech: ['Electron', 'Tesseract.js', 'SheetJS'] },
  'excel-analyzer': { category: '数据与搜索', tech: ['Electron', 'SheetJS', 'JavaScript'] },
} as const;
```

Run: `npx vitest run tests/showcase.test.ts -t "项目元数据"`

Expected: FAIL，因为 Markdown 尚不存在。

- [ ] **Step 2: 创建项目 frontmatter**

统一规则：`status: completed`、`draft: false`、`repoUrl` 指向 GitHub 子目录。发布时间从新到旧为：

```text
toolkit-box        2026-07-12 featured: true
invoice-ocr        2026-07-11 featured: true
inventory-system   2026-07-10 featured: true
api-bench          2026-07-09 featured: false
db-snapshot-diff   2026-07-08 featured: false
web-scraper        2026-07-07 featured: false
bi-report          2026-07-06 featured: false
excel-analyzer     2026-07-04 featured: false
```

每个 Markdown 正文必须使用四个明确小节：`项目目标`、`核心能力`、`技术实现`、`工程取舍`。内容只能来自 README 和实际源码，不写虚构数字。

- [ ] **Step 3: 扩展构建冒烟测试**

`tests/build-smoke.test.ts` 新增断言：

```ts
const expectedSlugs = [
  'toolkit-box',
  'api-bench',
  'db-snapshot-diff',
  'web-scraper',
  'bi-report',
  'inventory-system',
  'invoice-ocr',
  'excel-analyzer',
];

for (const slug of expectedSlugs) {
  expect(existsSync(`dist/projects/${slug}/index.html`)).toBe(true);
  const html = readFileSync(`dist/projects/${slug}/index.html`, 'utf8');
  expect(html).toContain(`/images/projects/${slug}.`);
  expect(html).toContain(`github.com/xrlnewman/field-notes/tree/main/showcase/${slug}`);
}
```

首页 HTML 必须包含 `data-project-count="9"`，项目索引必须包含八个新增标题。

- [ ] **Step 4: 运行内容和构建测试**

Run: `npx vitest run tests/showcase.test.ts tests/projects.test.ts`

Expected: PASS。

Run: `npm run test:build`

Expected: 24 pages built，构建冒烟测试全部 PASS。

- [ ] **Step 5: 提交项目内容**

```bash
git add src/content/projects tests/showcase.test.ts tests/build-smoke.test.ts
git commit -m "feat(projects): 发布八个本地项目详情"
```

---

### Task 5: 完成仓库说明与浏览器验收

**Files:**
- Modify: `README.md`
- Modify: `showcase/README.md`

**Interfaces:**
- Consumes: 九个公开项目、八个源码目录与构建产物。
- Produces: 可维护的源码展柜说明和桌面/移动浏览器验收证据。

- [ ] **Step 1: 更新根 README**

增加“源码展柜”章节，说明：

- `showcase/` 是公开项目源码快照；
- 项目卡源码按钮可直达对应子目录；
- 快照不包含安装包、运行时数据库或本地凭据；
- 根 MIT License 覆盖仓库内源码。

- [ ] **Step 2: 启动本地站点并点测**

Run: `npm run dev -- --host 127.0.0.1`

使用应用内浏览器完成：

1. 1440×900 首页显示 9 个公开项目计数，首屏后可见项目卡；
2. `/projects/` 五类计数为网站产品 1、业务系统 2、开发工具 2、数据与搜索 3、AI 自动化 1；
3. 分类按钮更新 `?category=` 且空状态不回归；
4. 390×844 下项目卡单列、分类横向滚动、源码按钮可点击；
5. 八个详情页打开正常；
6. 控制台无 error/warning。

- [ ] **Step 3: 检查 GitHub 子目录链接**

在推送前先验证本地一一对应：

```powershell
Get-ChildItem src/content/projects -Filter *.md |
  Select-String 'tree/main/showcase/'
```

Expected: 八条新增项目链接，每条 slug 都有对应 `showcase/<slug>`。

- [ ] **Step 4: 全量验证并提交文档**

Run: `npm run verify`

Expected: 所有单元/API/内容测试通过；Astro 0 errors、0 warnings、0 hints；24 pages built。

Run: `git diff --check`

Expected: 无输出。

```bash
git add README.md showcase/README.md
git commit -m "docs(showcase): 补充源码展柜使用说明"
```

---

### Task 6: 审查、合并、推送与生产验收

**Files:**
- Review range: `origin/main..feat/showcase-projects`

**Interfaces:**
- Consumes: 完成的功能分支和验证证据。
- Produces: GitHub `main` 与 Cloudflare Pages 生产站点中的九个公开项目。

- [ ] **Step 1: 请求整仓只读代码审查**

审查重点：源码泄密、公司信息、截图隐私、GitHub 路径、内容真实性、项目分类和测试可靠性。Critical/Important 必须修复并复审通过。

- [ ] **Step 2: 刷新索引并验证分支**

Run: `codegraph sync`

Run: `npm run verify && git diff --check && git status --short --branch`

Expected: 全部通过且工作树 clean。

- [ ] **Step 3: 合并并推送 main**

先执行 `git fetch origin`，确认 `origin/main` 未发生未处理变化。使用 squash 合并，提交：

```bash
git commit -m "feat(showcase): 上线八个本地项目源码展柜"
git push origin main
```

- [ ] **Step 4: 部署 Cloudflare Pages**

Run:

```powershell
$commit = git rev-parse HEAD
npx wrangler pages deploy dist --project-name field-notes --branch main --commit-hash $commit --commit-message "上线八个本地项目源码展柜" --commit-dirty=false
```

Expected: Production deployment complete。

- [ ] **Step 5: 生产 HTTP 验收**

验证：

- `/`、`/projects/` 与八个 `/projects/<slug>/` 均为 200；
- 首页 `data-project-count="9"`；
- 八个封面均为 200；
- 八个 GitHub `tree/main/showcase/<slug>` 地址均可访问；
- 站内评论 API 仍为 200；
- Cloudflare 部署 Source SHA 等于 GitHub `main` HEAD。
