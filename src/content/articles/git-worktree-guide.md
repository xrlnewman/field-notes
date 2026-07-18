---
title: Git Worktree 和复制项目文件夹有什么区别？
description: 两种多分支并行方式看起来相似，但在对象复用、分支安全和维护成本上完全不同。
category: 工程实践
publishedAt: 2026-07-08
tags: [Git, Worktree, 工程实践]
featured: true
draft: false
---

同时处理两个需求时，最直接的办法是复制一份项目目录，再切换到另一个分支。Git Worktree 也会创建另一个工作目录，所以两者看上去很像。

## 核心区别

复制项目通常意味着复制整个 `.git` 数据库；Worktree 则让多个工作目录共享同一个 Git 对象库，每个目录只保存自己的文件、暂存区和 HEAD。

```text
同一个仓库
├── 主工作区          main
└── .worktrees/blog   feature/blog
```

Git 会阻止同一分支同时被两个 Worktree 检出，减少两个目录互相覆盖分支状态的风险。

## Worktree 的优势

- 不重复下载完整仓库历史；
- 分支、提交和远程引用天然同步；
- 可以明确看到所有附属工作区；
- 删除工作区时由 Git 清理关联元数据；
- 适合在主项目之外并行运行测试或开发需求。

常见命令如下：

```bash
git worktree add .worktrees/blog -b feature/blog
git worktree list
git worktree remove .worktrees/blog
```

## Worktree 的限制

依赖目录通常仍要分别安装，数据库文件和本地环境配置也不会自动隔离。部分编辑器或旧脚本默认 `.git` 一定是目录，而 Worktree 中 `.git` 实际是指向主仓库的文本文件，这些工具可能需要调整。

此外，不应该直接删除 Worktree 文件夹；优先使用 `git worktree remove`，避免留下需要 `git worktree prune` 清理的记录。

## 什么时候直接复制

如果需要彻底独立的 Git 历史、不同远程仓库，或要把目录交给无法访问原仓库的人，独立 Clone 更清晰。仅仅为了并行开发不同分支，Worktree 通常更轻、更安全。

