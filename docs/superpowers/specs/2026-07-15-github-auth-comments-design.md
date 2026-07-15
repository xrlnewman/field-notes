# GitHub 登录评论恢复设计

## 目标

恢复博客上一版 Giscus 评论体验：访客可以在博客页面内阅读讨论，发布留言、评论和回复前必须登录 GitHub。留言板、文章详情和项目详情都使用同一套嵌入式评论组件。

## 方案选择

采用 Giscus + GitHub Discussions。仓库 `xrlnewman/field-notes` 已开启 Discussions，历史生产版本已验证以下公开配置：

- Repository ID: `R_kgDOTX84ug`
- Category: `General`
- Category ID: `DIC_kwDOTX84us4DBKfw`

不采用自建 GitHub OAuth + D1，因为它需要新增 OAuth App、会话与密钥管理，恢复成本和维护面都显著更大。也不保留仅由前端隐藏的匿名接口，因为绕过页面后仍可匿名提交。

## 数据与页面行为

- 留言板固定映射到 `global-guestbook` Discussion。
- 文章和项目使用稳定的 `pathname` 映射。
- Giscus iframe 嵌在当前博客页面，登录 GitHub 后原地发布和回复。
- 评论数据由 GitHub Discussions 保存；原 D1 评论数据不删除，但匿名 `/api/comments` 写入接口从部署中移除。
- Giscus 使用三套星空主题对应的深色主题，并监听 `cosmic-theme-change` 同步切换。

## 安全与失败处理

- 不再渲染昵称输入框或匿名提交表单。
- 删除 Pages Functions 评论接口，匿名 POST 请求应返回 404。
- Giscus 脚本仅从 `https://giscus.app/client.js` 加载。
- 公开仓库 ID 和分类 ID 直接作为项目默认配置，不属于密钥；仍允许通过 `PUBLIC_GISCUS_*` 环境变量覆盖。
- 脚本加载失败时保留明确的“评论区加载失败，请刷新重试”提示，不影响正文阅读。

## 验收标准

1. 首页继续展示三套可切换星空主题。
2. 留言板、文章和项目详情均包含 Giscus 宿主，不再包含匿名昵称表单。
3. GitHub 未登录用户只能阅读，点击 Giscus 登录后仍在当前页面发布或回复。
4. `/api/comments` 不再提供匿名写入。
5. 构建、类型检查、单元测试、产物冒烟测试和浏览器点测全部通过。
