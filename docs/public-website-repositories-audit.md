# 网站项目公开仓库审计

审计日期：2026-07-14

本页记录个人博客中三个多仓网站产品的公开发布门禁。九个仓库均只发布当前源码快照，不公开原 Gitee 提交历史；这样既保留本地原始开发记录，也不会把历史提交中的个人邮箱元数据复制到 GitHub。

## 发布结果

| 仓库 | 产品角色 | GitHub `main` | 构建 / 测试 | 依赖与已知问题 |
|---|---|---:|---|---|
| [`mall-h5`](https://github.com/xrlnewman/mall-h5) | 多商户商城用户端 | `ebfffbf` | 生产构建通过 | `npm audit` 0 |
| [`mall-admin`](https://github.com/xrlnewman/mall-admin) | 多商户商城运营后台 | `f87f004` | 生产构建通过 | ECharts 1 条中危需主版本升级；`xlsx` 1 个高危依赖含两项无上游修复公告 |
| [`mall-system`](https://github.com/xrlnewman/mall-system) | 多商户商城后端 | `1020d07` | Composer 校验通过；PHPUnit 7 通过、12 失败 | 失败来自缺少 Factory、旧短信接口断言及测试数据重复插入，不能声明测试全绿 |
| [`linli-mp`](https://github.com/xrlnewman/linli-mp) | 邻里社区小程序 | `318421a` | H5 与微信小程序构建通过 | pnpm 审计端点返回 410，未得到依赖审计结论 |
| [`linli-admin`](https://github.com/xrlnewman/linli-admin) | 邻里社区运营后台 | `3d056d8` | 生产构建通过 | pnpm 审计端点返回 410；保留包体积和第三方注释告警 |
| [`linli-server`](https://github.com/xrlnewman/linli-server) | 邻里社区后端 | `693e779` | Composer 校验、2 项测试、资源构建与 SQLite 迁移通过 | `composer audit` 0 |
| [`skyboom-web`](https://github.com/xrlnewman/skyboom-web) | 企业官网前台 | `b006d02` | 生产构建通过 | pnpm 审计端点返回 410，未得到依赖审计结论 |
| [`skyboom-admin`](https://github.com/xrlnewman/skyboom-admin) | 企业官网 CMS | `47c717b` | 生产构建通过 | pnpm 审计端点返回 410；保留第三方注释和大 chunk 告警 |
| [`skyboom-server`](https://github.com/xrlnewman/skyboom-server) | 企业官网 API | `cb01d5e` | Composer 2 项测试与资源构建通过 | 前端资源没有 npm lockfile，未声明 npm 审计结论 |

## 安全与公开门禁

- 对当前跟踪文件和全部可达历史执行私钥、云密钥、GitHub / Cloudflare Token、JWT 字面量、带凭据 URL、真实环境文件与个人信息扫描；未发现需要公开的真实凭据。
- `.env` 仅保留示例或公开前端 API 地址；`linli-admin` 已删除被跟踪的本地 `.env`，所有仓库继续忽略真实环境文件。
- 演示账号、演示邮箱和演示手机号只用于本地种子数据或文档，并已明确不能直接用于生产环境。
- 九个 GitHub `main` 都是无父提交的源码快照；匿名 GitHub API 验证 `private=false`、默认分支为 `main`。
- 九个 README 与 LICENSE 均可匿名访问并返回 HTTP 200；三仓之间的前台、后台、后端链接互相可达。
- 所有仓库都保留原 Gitee `origin`，新增独立 `github` remote；GitHub 发布没有重写或强推原历史。
- 代码采用仓库内声明的 MIT 或 BSD-3-Clause 许可证；第三方依赖遵循各自许可证，品牌标识、产品图片与界面截图不自动纳入代码许可证。

## 结论

九个仓库满足“源码可匿名查看、README 可运行、许可证明确、原个人历史不外泄”的公开要求。上表保留的依赖公告、测试债务和构建告警属于后续维护事项，不应被描述为已经解决，也不影响读者审阅当前源码快照。
