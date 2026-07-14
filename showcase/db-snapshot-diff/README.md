# DB Snapshot Diff

数据库快照对比工具，Electron 桌面应用。支持任意组合对比 MySQL 和 PostgreSQL；迁移 SQL 仅在 A、B 使用同一数据库引擎时生成。

## 功能

- **结构 diff**：对比两个库的表结构
  - 仅 A 有 / 仅 B 有的表
  - 同名表的字段差异（新增/删除/字段类型变化）
- **数据采样 diff**：对每张共有表
  - 行数对比
  - 各抽样 N 行（默认 100 行），按共有列组成的行集合比较内容
- **迁移 SQL**：A、B 同为 MySQL 或同为 PostgreSQL 时，根据 A → B 的结构差异，使用目标 B 库的方言生成 SQL，可复制或保存为 `.sql` 文件

## 用法

1. 配置两个数据库连接（host/port/user/password/database）
2. 选择对比模式：结构 / 数据 / 全部
3. 点"开始对比"查看结构和数据采样结果
4. A、B 引擎相同时，可生成迁移 SQL，再复制或保存到文件；跨引擎对比只展示差异，不生成迁移 SQL

## 安全

- 仅将类型、地址、端口、用户名和数据库名保存在本地 `%APPDATA%/db-snapshot-diff/connections.json`
- 密码不落盘，只在当前运行会话的内存中使用；应用退出后需要重新输入
- 主进程读写配置时会递归删除 `password` / `pass`；读取到含历史密码的旧配置后会立即清理并安全重写，也不会回填到界面
- 在支持 POSIX 权限的平台，配置文件写入与读取迁移会请求 `0600`；Windows 仍需依赖 NTFS ACL、系统账户和应用数据目录权限
- **本工具不修改任何表！** 只跑 SELECT / INFORMATION_SCHEMA 查询
- 生成的迁移 SQL 只供检查、复制和保存，不会自动执行

## 开发

```bash
npm install
npm start
```

mysql2 和 pg 是 native module（含 prebuilt），首次安装可能要 2-3 分钟。

MIT © xrlnewman
