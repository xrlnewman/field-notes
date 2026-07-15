# 关联网站源码公开 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 安全公开商城、邻里和天舶三组共九个本地仓库，并让每组 README 清楚表达前台、后台和服务端关系。

**Architecture:** 每组产品独立完成“现状确认 → 敏感信息扫描 → README/忽略规则最小修正 → 构建测试 → GitHub 公开”闭环。保留 Gitee `origin`，GitHub 统一使用 `github` 远端；博客只消费公开 URL，不复制九个仓库源码。

**Tech Stack:** Git、GitHub、Gitleaks 或等价历史扫描、npm、Composer/PHP、Markdown

## Global Constraints

- 仅公开规格列出的九个本地仓库，禁止包含 `slots*`、`game*`、`india*`、企业 GitLab、第三方克隆或旧 WordPress 目录。
- 发现真实密钥、客户隐私、数据库 dump 或私有素材时停止对应仓库发布，先移除并轮换，不得带病公开。
- 保留现有 Gitee `origin`，新增 `github` 远端；禁止强推和重写历史。
- GitHub 仓库 owner 固定为 `xrlnewman`、visibility 固定为 public、默认分支统一为 `main`。
- README 必须链接同产品另外两个关联仓库，并明确当前仓库角色。
- 不覆盖任何未提交用户修改；出现 dirty worktree 时只提交本任务明确涉及的 README、`.gitignore`、`.env.example` 或安全修复文件。

---

### Task 1: 多商户 SaaS 商城三仓审计与公开

**Files:**
- Modify when required: `../mall-h5/README.md`, `.gitignore`, `.env.example`
- Modify when required: `../mall-admin/README.md`, `.gitignore`, `.env.example`
- Modify when required: `../mall-system/README.md`, `.gitignore`, `.env.example`

**Interfaces:**
- Produces: `https://github.com/xrlnewman/mall-h5`
- Produces: `https://github.com/xrlnewman/mall-admin`
- Produces: `https://github.com/xrlnewman/mall-system`

- [ ] **Step 1: 记录状态并扫描当前树与历史**

对三个目录运行 `git status -sb`、`git remote -v`、`git log -1 --oneline`、tracked file 清单、敏感模式扫描和历史扫描。输出审计报告，结论必须逐仓为 PASS 才进入下一步。

- [ ] **Step 2: 最小修正文档与忽略规则**

README 顶部统一列出：商城 H5（Vue 3/Vant）、商家后台（Vue 3/Element Plus）、服务端（Laravel 12/MySQL/Redis/Reverb/Elasticsearch）。`.env.example` 中所有值必须为无效占位符。

- [ ] **Step 3: 运行验证**

前端仓按锁文件执行 `npm ci && npm run build`；Laravel 仓执行 `composer install --no-interaction` 后运行现有测试或 `php artisan test`。失败必须定位并修复，不能跳过。

- [ ] **Step 4: 提交最小修正并公开**

提交格式 `docs(public): 补充商城关联仓库与公开说明`。创建三个 public GitHub 仓库，添加 `github` 远端，把无历史安全快照推送到 `main`，随后匿名确认 README 和默认分支。

### Task 2: 邻里社区服务平台三仓审计与公开

**Files:**
- Modify when required: `../linli-mp/README.md`, `.gitignore`, `.env.example`
- Modify when required: `../linli-admin/README.md`, `.gitignore`, `.env.example`
- Modify when required: `../linli-server/README.md`, `.gitignore`, `.env.example`

**Interfaces:**
- Produces: `https://github.com/xrlnewman/linli-mp`
- Produces: `https://github.com/xrlnewman/linli-admin`
- Produces: `https://github.com/xrlnewman/linli-server`

- [ ] **Step 1: 记录状态并扫描当前树与历史**

复用 Task 1 的十项安全门禁，但报告独立保存。重点检查微信小程序 AppID、测试手机号、JWT 密钥、支付配置和 SQLite 数据文件。

- [ ] **Step 2: 最小修正文档与忽略规则**

README 顶部统一列出：小程序/H5（uni-app/Vue 3）、运营后台（Vue 3/Element Plus）、服务端（Laravel 12/JWT/RBAC）。测试账号只能使用明确标注的演示值，不得出现真实用户信息。

- [ ] **Step 3: 运行验证并提交**

两个前端执行锁文件对应安装与 build；服务端运行现有 Laravel 测试。提交格式 `docs(public): 补充邻里关联仓库与公开说明`。

- [ ] **Step 4: 创建 public 仓库并推送**

创建三个同名仓库，添加 `github` 远端并把无历史安全快照推送到 `main`，匿名确认可访问和三仓互链。

### Task 3: 天舶重工多语言官网三仓审计与公开

**Files:**
- Modify when required: `../skyboom-web/README.md`, `.gitignore`, `.env.example`
- Modify when required: `../skyboom-admin/README.md`, `.gitignore`, `.env.example`
- Modify when required: `../skyboom-server/README.md`, `.gitignore`, `.env.example`

**Interfaces:**
- Produces: `https://github.com/xrlnewman/skyboom-web`
- Produces: `https://github.com/xrlnewman/skyboom-admin`
- Produces: `https://github.com/xrlnewman/skyboom-server`

- [ ] **Step 1: 记录状态并扫描当前树与历史**

复用安全门禁，重点检查企业联系人、真实后台账号、生产 API 凭据、上传目录、产品素材版权和数据库备份。

- [ ] **Step 2: 最小修正文档与公开边界**

README 顶部统一列出：多语言官网（Vue 3/Vite/i18n）、内容后台（Vue 3/Element Plus/wangEditor）、服务端（Laravel 12/MySQL/JWT/RBAC）。说明仓库用于技术展示，不声称公开素材可用于商业传播。

- [ ] **Step 3: 运行验证并提交**

两个前端运行 build，服务端运行现有 Laravel 测试。提交格式 `docs(public): 补充天舶关联仓库与公开说明`。

- [ ] **Step 4: 创建 public 仓库并推送**

创建三个同名仓库，添加 `github` 远端并把无历史安全快照推送到 `main`，匿名确认可访问和三仓互链。

### Task 4: 九仓发布复核与博客链接门禁

**Files:**
- Create: `docs/public-website-repositories-audit.md` in the field-notes feature worktree
- Modify: `tests/projects.test.ts` in the field-notes feature worktree

**Interfaces:**
- Consumes: 九个公开 GitHub URL
- Produces: 仓库存在性与博客关联链接的自动化契约

- [ ] **Step 1: 写失败链接检查**

在 `tests/projects.test.ts` 增加九个 URL 精确集合断言，并增加每个产品恰好三个唯一关联仓库的断言。

- [ ] **Step 2: 确认博客测试通过数据契约**

Run: `npx vitest run tests/projects.test.ts`

Expected: 九个 URL 和三组关系全部 PASS；若失败，修正内容数据而不是放宽测试。

- [ ] **Step 3: 外部匿名复核**

对九个 URL 执行匿名 HTTP GET 或 GitHub connector `get_repo`，确认 visibility 为 public、默认分支为 `main`、README 可读。

- [ ] **Step 4: 写审计总表并提交**

总表逐仓记录当前树扫描、历史扫描、构建/测试、公开 URL、默认分支和匿名访问结论，不记录任何密钥值。

```bash
git add docs/public-website-repositories-audit.md tests/projects.test.ts
git commit -m "docs(public): 记录九个网站仓库公开审计"
```
