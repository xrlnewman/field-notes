# 关联网站源码公开规格

## 目标

把三组本地网站产品的前台、后台和服务端安全公开到 `xrlnewman` GitHub 账号，并让个人博客按“一个产品、多端源码”的关系展示它们。

## 公开仓库清单

| 产品 | 角色 | 本地目录 | GitHub 仓库 |
|---|---|---|---|
| 多商户 SaaS 商城 | 用户商城 | `E:\project\mall-h5` | `xrlnewman/mall-h5` |
| 多商户 SaaS 商城 | 商家后台 | `E:\project\mall-admin` | `xrlnewman/mall-admin` |
| 多商户 SaaS 商城 | 服务端 | `E:\project\mall-system` | `xrlnewman/mall-system` |
| 邻里社区服务平台 | 小程序/H5 | `E:\project\linli-mp` | `xrlnewman/linli-mp` |
| 邻里社区服务平台 | 运营后台 | `E:\project\linli-admin` | `xrlnewman/linli-admin` |
| 邻里社区服务平台 | 服务端 | `E:\project\linli-server` | `xrlnewman/linli-server` |
| 天舶重工多语言官网 | 企业官网 | `E:\project\skyboom-web` | `xrlnewman/skyboom-web` |
| 天舶重工多语言官网 | 内容后台 | `E:\project\skyboom-admin` | `xrlnewman/skyboom-admin` |
| 天舶重工多语言官网 | 服务端 | `E:\project\skyboom-server` | `xrlnewman/skyboom-server` |

个人博客 `xrlnewman/field-notes` 已经公开，不重复创建。

## 公开前安全门禁

每个仓库必须逐项通过：

1. 工作树状态和最近提交确认，不覆盖未提交用户修改；
2. `.env`、私钥、证书、云令牌、数据库密码、JWT 密钥、真实账号和第三方 API key 扫描；
3. SQL dump、SQLite 数据库、日志、上传文件、缓存、构建目录和依赖目录扫描；
4. Git 历史敏感信息扫描；发现真实密钥时停止该仓库发布并先轮换，不只删除当前文件；
5. `.gitignore` 覆盖本地环境文件、运行产物和依赖；
6. `.env.example` 只保留无效占位值；
7. README 说明产品角色、关联仓库、启动方式、演示数据边界和许可证；
8. 代码归属明确，不发布第三方克隆、企业项目或无权公开的素材；
9. 前端构建或后端测试至少运行一个可重复验证命令；
10. 发布前输出仓库级审计结论。

## Git 与远端策略

- 保留现有 Gitee `origin`，新增名为 `github` 的远端；
- GitHub 仓库设为 public，默认分支沿用本地 `master`；
- 不强推，不改写现有历史；
- 首次推送使用 `git push -u github master`；
- 发布后通过 GitHub API 或网页确认仓库可公开访问、默认分支正确、README 可显示；
- 如果同名 GitHub 仓库已经存在，先比对归属和历史，禁止直接覆盖。

## 关联说明

每个仓库 README 顶部加入同产品的关联仓库链接：

- 商城：H5 / Admin / API；
- 邻里：Mini Program & H5 / Admin / API；
- 天舶：Web / CMS / API。

博客不把九个仓库渲染为九张项目卡。项目详情页的关联源码节点分别链接到对应 GitHub 仓库。

## 展示素材

- 项目封面必须来自实际运行界面或现有真实截图；
- 不使用模板商城截图冒充本项目；
- 每个产品只选一张能代表主要场景的封面，详情页可追加多张真实截图；
- 截图不得包含真实手机号、邮箱、访问令牌、客户隐私或管理账号密码。

## 排除项

- `wloc-pwa` 属于工具，不进入本轮博客项目目录；
- `fxsite` 是未整理的旧 WordPress 目录，不进入本轮公开清单；
- `slots*`、`game*`、`india*` 和任何企业 GitLab 仓库不公开；
- 已公开的八个工具仓库不删除，但博客中隐藏。

## 验收标准

- 九个 GitHub 仓库均为 public 且可匿名访问；
- 每个仓库通过安全门禁，README 标明角色与关联仓库；
- 每个仓库保留 Gitee 远端并新增 GitHub 远端；
- 对应技术栈可从仓库清单与 README 得到验证；
- 博客只展示四个网站产品，并正确链接十个源码仓库（含个人博客）；
- 任何公开页面、Git 历史增量和截图中都不存在密钥或个人隐私。
