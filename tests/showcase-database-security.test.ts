import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

import { describe, expect, it } from 'vitest';

type SecurityModule = Record<string, unknown>;
type PreloadApi = Record<string, (...args: unknown[]) => unknown>;

const require = createRequire(import.meta.url);

function loadSecurityModule(modulePath: string): SecurityModule {
  try {
    return require(modulePath) as SecurityModule;
  } catch {
    return {};
  }
}

function getFunction(module: SecurityModule, name: string): (...args: any[]) => any {
  expect(module[name], `${name} 必须是可调用的安全 helper`).toBeTypeOf('function');
  return module[name] as (...args: any[]) => any;
}

function createConfigIo(readResult: string | Error) {
  const calls = {
    readFile: [] as unknown[][],
    mkdir: [] as unknown[][],
    writeFile: [] as unknown[][],
    chmod: [] as unknown[][],
  };
  const io = {
    readFile: async (...args: unknown[]) => {
      calls.readFile.push(args);
      if (readResult instanceof Error) throw readResult;
      return readResult;
    },
    mkdir: async (...args: unknown[]) => { calls.mkdir.push(args); },
    writeFile: async (...args: unknown[]) => { calls.writeFile.push(args); },
    chmod: async (...args: unknown[]) => { calls.chmod.push(args); },
  };

  return { calls, io };
}

function executePreload(preloadPath: string) {
  const invokeCalls: unknown[][] = [];
  const invokeResult = { delivered: true };
  let exposedName = '';
  let exposedApi: PreloadApi | undefined;

  runInNewContext(readFileSync(preloadPath, 'utf8'), {
    require: (moduleName: string) => {
      if (moduleName !== 'electron') throw new Error(`不允许 preload 加载模块: ${moduleName}`);
      return {
        contextBridge: {
          exposeInMainWorld: (name: string, api: PreloadApi) => {
            exposedName = name;
            exposedApi = api;
          },
        },
        ipcRenderer: {
          invoke: async (...args: unknown[]) => {
            invokeCalls.push(args);
            return invokeResult;
          },
        },
      };
    },
  }, { filename: preloadPath });

  if (!exposedApi) throw new Error(`${preloadPath} 未通过 contextBridge 暴露 API`);
  return { exposedApi, exposedName, invokeCalls, invokeResult };
}

const dbSecurity = loadSecurityModule('../showcase/db-snapshot-diff/lib/security.js');
const biSecurity = loadSecurityModule('../showcase/bi-report/lib/security.js');

describe('database showcase security helpers', () => {
  it.each([
    ['DB Snapshot Diff', dbSecurity],
    ['BI Report', biSecurity],
  ])('%s 递归删除任意层级的 password/pass', (_name, security) => {
    const stripSecrets = getFunction(security, 'stripSecrets');
    const source = {
      host: '127.0.0.1',
      password: 'top-level',
      PASS: 'case-insensitive',
      nested: {
        pass: 'nested',
        keep: 'value',
        items: [{ Password: 'array-secret', compass: 'preserved' }],
      },
    };

    expect(stripSecrets(source)).toEqual({
      host: '127.0.0.1',
      nested: {
        keep: 'value',
        items: [{ compass: 'preserved' }],
      },
    });
    expect(source.password).toBe('top-level');
  });

  it.each([
    ['DB Snapshot Diff', dbSecurity],
    ['BI Report', biSecurity],
  ])('%s 读取旧配置时不返回历史密码', (_name, security) => {
    const parseSafeConfig = getFunction(security, 'parseSafeConfig');
    const legacy = JSON.stringify({
      conn: { user: 'reader', pass: 'old-pass' },
      queries: [{ name: '保留', nested: { password: 'old-password' } }],
    });

    expect(parseSafeConfig(legacy, { conn: null })).toEqual({
      conn: { user: 'reader' },
      queries: [{ name: '保留', nested: {} }],
    });
  });

  it.each([
    ['DB Snapshot Diff', dbSecurity],
    ['BI Report', biSecurity],
  ])('%s 保存配置时清理密码并请求 POSIX 私有权限', async (_name, security) => {
    const saveSafeConfigFile = getFunction(security, 'saveSafeConfigFile');
    const calls = {
      mkdir: [] as unknown[][],
      writeFile: [] as unknown[][],
      chmod: [] as unknown[][],
    };
    const io = {
      mkdir: async (...args: unknown[]) => { calls.mkdir.push(args); },
      writeFile: async (...args: unknown[]) => { calls.writeFile.push(args); },
      chmod: async (...args: unknown[]) => { calls.chmod.push(args); },
    };

    await saveSafeConfigFile(
      'C:\\app-data\\config.json',
      { conn: { user: 'reader', password: 'secret' }, nested: [{ pass: 'secret', keep: true }] },
      io,
    );

    expect(calls.writeFile).toHaveLength(1);
    expect(JSON.parse(String(calls.writeFile[0]?.[1]))).toEqual({
      conn: { user: 'reader' },
      nested: [{ keep: true }],
    });
    expect(calls.writeFile[0]?.[2]).toEqual({ encoding: 'utf8', mode: 0o600 });
    expect(calls.chmod).toEqual([['C:\\app-data\\config.json', 0o600]]);
  });

  it.each([
    ['DB Snapshot Diff', dbSecurity],
    ['BI Report', biSecurity],
  ])('%s 读取含历史密码的旧配置后立即安全重写', async (_name, security) => {
    const loadSafeConfigFile = getFunction(security, 'loadSafeConfigFile');
    const filePath = 'C:\\app-data\\config.json';
    const { calls, io } = createConfigIo(JSON.stringify({
      conn: { user: 'reader', password: 'top-secret' },
      nested: [{ PASS: 'nested-secret', keep: true }],
    }));

    await expect(loadSafeConfigFile(filePath, { fallback: true }, io)).resolves.toEqual({
      conn: { user: 'reader' },
      nested: [{ keep: true }],
    });
    expect(calls.writeFile).toHaveLength(1);
    expect(JSON.parse(String(calls.writeFile[0]?.[1]))).toEqual({
      conn: { user: 'reader' },
      nested: [{ keep: true }],
    });
    expect(calls.writeFile[0]?.[2]).toEqual({ encoding: 'utf8', mode: 0o600 });
    expect(calls.chmod).toEqual([[filePath, 0o600]]);
  });

  it.each([
    ['DB Snapshot Diff', dbSecurity],
    ['BI Report', biSecurity],
  ])('%s 读取无密码配置时只迁移私有权限', async (_name, security) => {
    const loadSafeConfigFile = getFunction(security, 'loadSafeConfigFile');
    const filePath = 'C:\\app-data\\config.json';
    const config = { conn: { user: 'reader' }, nested: [{ keep: true }] };
    const { calls, io } = createConfigIo(JSON.stringify(config));

    await expect(loadSafeConfigFile(filePath, { fallback: true }, io)).resolves.toEqual(config);
    expect(calls.writeFile).toHaveLength(0);
    expect(calls.chmod).toEqual([[filePath, 0o600]]);
  });

  it.each([
    ['DB Snapshot Diff', dbSecurity],
    ['BI Report', biSecurity],
  ])('%s 遇到损坏配置时不以兜底值覆盖原文件', async (_name, security) => {
    const loadSafeConfigFile = getFunction(security, 'loadSafeConfigFile');
    const filePath = 'C:\\app-data\\config.json';
    const fallback = { conn: { user: 'fallback', password: 'must-not-leak' } };
    const { calls, io } = createConfigIo('{ damaged json');

    await expect(loadSafeConfigFile(filePath, fallback, io)).resolves.toEqual({
      conn: { user: 'fallback' },
    });
    expect(calls.writeFile).toHaveLength(0);
    expect(calls.chmod).toEqual([[filePath, 0o600]]);
  });

  it.each([
    ['mysql', 'odd`name; DROP TABLE audit;--', '`odd``name; DROP TABLE audit;--`'],
    ['postgres', 'odd"name; DROP TABLE audit;--', '"odd""name; DROP TABLE audit;--"'],
  ])('DB Snapshot Diff 按 %s 方言成对转义恶意标识符', (dialect, identifier, expected) => {
    const quoteIdentifier = getFunction(dbSecurity, 'quoteIdentifier');

    expect(quoteIdentifier(dialect, identifier)).toBe(expected);
  });

  it.each([
    ['mysql', 'orders`; DROP TABLE audit;--', '`orders``; DROP TABLE audit;--`'],
    ['postgres', 'orders"; DROP TABLE audit;--', '"orders""; DROP TABLE audit;--"'],
  ])('DB Snapshot Diff 的 %s count/sample SQL 复用安全标识符和限界', (dialect, table, quoted) => {
    const buildCountRowsSql = getFunction(dbSecurity, 'buildCountRowsSql');
    const buildSampleRowsSql = getFunction(dbSecurity, 'buildSampleRowsSql');

    expect(buildCountRowsSql(dialect, table)).toBe(`SELECT COUNT(*) AS c FROM ${quoted}`);
    expect(buildSampleRowsSql(dialect, table, '10; DROP TABLE audit')).toBe(
      `SELECT * FROM ${quoted} LIMIT 100`,
    );
    expect(buildSampleRowsSql(dialect, table, 999999)).toBe(`SELECT * FROM ${quoted} LIMIT 1000`);
  });

  it('DB Snapshot Diff 将采样 limit 解析为 1 到 1000 的整数', () => {
    const normalizeLimit = getFunction(dbSecurity, 'normalizeLimit');

    expect(normalizeLimit(-20, 100, 1000)).toBe(1);
    expect(normalizeLimit(12.9, 100, 1000)).toBe(12);
    expect(normalizeLimit('25', 100, 1000)).toBe(25);
    expect(normalizeLimit('25; SELECT 1', 100, 1000)).toBe(100);
    expect(normalizeLimit(50000, 100, 1000)).toBe(1000);
  });

  it.each([
    ['mysql', 'new`table;--', 'odd`column;--', '`new``table;--`', '`odd``column;--`'],
    ['postgres', 'new"table;--', 'odd"column;--', '"new""table;--"', '"odd""column;--"'],
  ])('DB Snapshot Diff 的 %s 迁移 SQL 复用方言标识符转义', (
    dialect,
    table,
    column,
    quotedTable,
    quotedColumn,
  ) => {
    const generateMigrationSql = getFunction(dbSecurity, 'generateMigrationSql');
    const sql = generateMigrationSql({
      dialect,
      a: {
        onlyA: [table],
        common: [],
        tables: {
          [table]: [{ column_name: column, column_type: 'integer', is_nullable: 'NO' }],
        },
      },
      b: { onlyB: [], tables: {} },
    }, '2026-07-14T00:00:00.000Z');

    expect(sql).toContain(`CREATE TABLE ${quotedTable} (`);
    expect(sql).toContain(`${quotedColumn} integer NOT NULL`);
    expect(sql).not.toContain(`CREATE TABLE ${table} (`);
  });

  it('DB Snapshot Diff 精确比较类型并为字面量或语法大小写差异生成源类型原文', () => {
    const generateMigrationSql = getFunction(dbSecurity, 'generateMigrationSql');
    const sql = generateMigrationSql({
      dialect: 'mysql',
      a: {
        onlyA: [],
        common: ['payments'],
        tables: {
          payments: [
            { column_name: 'status', column_type: "enum('Pending','Paid')" },
            { column_name: 'roles', column_type: "set('Admin','Editor')" },
            { column_name: 'title', column_type: 'VARCHAR(20)' },
          ],
        },
      },
      b: {
        onlyB: [],
        tables: {
          payments: [
            { column_name: 'status', column_type: "enum('pending','paid')" },
            { column_name: 'roles', column_type: "set('admin','editor')" },
            { column_name: 'title', column_type: 'varchar(20)' },
          ],
        },
      },
    }, '2026-07-14T00:00:00.000Z');

    expect(sql).toContain("MODIFY COLUMN `status` enum('Pending','Paid');");
    expect(sql).toContain("MODIFY COLUMN `roles` set('Admin','Editor');");
    expect(sql).toContain('MODIFY COLUMN `title` VARCHAR(20);');
  });

  it.each([
    ['mysql', 'postgres'],
    ['postgres', 'mysql'],
  ])('DB Snapshot Diff 拒绝从 %s 向 %s 生成跨引擎迁移 SQL', (sourceDialect, targetDialect) => {
    const generateMigrationSql = getFunction(dbSecurity, 'generateMigrationSql');

    expect(() => generateMigrationSql({
      sourceDialect,
      targetDialect,
      a: { onlyA: [], common: [], tables: {} },
      b: { onlyB: [], tables: {} },
    }, '2026-07-14T00:00:00.000Z')).toThrow(/仅支持相同数据库引擎/);
  });

  it.each([
    ['mysql', '`orders`'],
    ['postgres', '"orders"'],
  ])('DB Snapshot Diff 同引擎迁移使用目标 %s 方言', (dialect, quotedTable) => {
    const generateMigrationSql = getFunction(dbSecurity, 'generateMigrationSql');
    const sql = generateMigrationSql({
      sourceDialect: dialect,
      targetDialect: dialect,
      a: {
        onlyA: ['orders'],
        common: [],
        tables: { orders: [{ column_name: 'id', column_type: 'integer', is_nullable: 'NO' }] },
      },
      b: { onlyB: [], tables: {} },
    }, '2026-07-14T00:00:00.000Z');

    expect(sql).toContain(`CREATE TABLE ${quotedTable}`);
  });

  it('BI 自动查询安全转义表和 X/Y 字段、白名单聚合并限制行数', () => {
    const buildReportSql = getFunction(biSecurity, 'buildReportSql');

    expect(buildReportSql({
      customSql: '',
      table: 'sales`; DROP TABLE audit;--',
      xColumn: 'region`--',
      yColumn: 'amount`; SELECT 1;--',
      aggregate: 'sum',
      order: 'y',
      limit: 50000,
    })).toBe(
      'SELECT `region``--` AS x, SUM(`amount``; SELECT 1;--`) AS y '
      + 'FROM `sales``; DROP TABLE audit;--` GROUP BY `region``--` ORDER BY y DESC LIMIT 1000',
    );
  });

  it('BI 自动查询拒绝非白名单聚合与排序', () => {
    const buildReportSql = getFunction(biSecurity, 'buildReportSql');
    const base = {
      customSql: '', table: 'sales', xColumn: 'region', yColumn: 'amount', limit: 50,
    };

    expect(() => buildReportSql({ ...base, aggregate: 'sum) FROM users;--', order: 'x' })).toThrow();
    expect(() => buildReportSql({ ...base, aggregate: 'sum', order: 'x; DROP TABLE audit' })).toThrow();
  });

  it('BI 自定义 SQL 仍按用户显式输入执行', () => {
    const buildReportSql = getFunction(biSecurity, 'buildReportSql');
    const customSql = 'SELECT * FROM custom_view WHERE enabled = 1';

    expect(buildReportSql({
      customSql: `  ${customSql}  `,
      table: 'ignored',
      xColumn: 'ignored',
      yColumn: 'ignored',
      aggregate: 'not-validated-for-custom-sql',
      order: 'ignored',
      limit: 'ignored',
    })).toBe(customSql);
  });

  it('两个主进程在 IPC 信任边界复用安全 helper', () => {
    const dbMain = readFileSync('showcase/db-snapshot-diff/main.js', 'utf8');
    const biMain = readFileSync('showcase/bi-report/main.js', 'utf8');

    expect(dbMain).toContain("require('./lib/security')");
    expect(dbMain).toContain('loadSafeConfigFile(CFG_FILE');
    expect(dbMain).toContain('saveSafeConfigFile(CFG_FILE, cfg)');
    expect(dbMain).toContain('buildCountRowsSql(conn.type, tableName)');
    expect(dbMain).toContain('buildSampleRowsSql(conn.type, tableName, limit)');
    expect(dbMain).toContain('generateMigrationSql(snapshot');

    expect(biMain).toContain("require('./lib/security')");
    expect(biMain).toContain('loadSafeConfigFile(CFG_FILE');
    expect(biMain).toContain('saveSafeConfigFile(CFG_FILE, cfg)');
    expect(biMain).toContain('buildReportSql(spec)');
  });

  it.each([
    [
      'DB Snapshot Diff',
      'showcase/db-snapshot-diff/preload.js',
      'generateMigration',
      'generate-migration',
      { dialect: 'mysql', a: { common: ['payments'] } },
    ],
    [
      'BI Report',
      'showcase/bi-report/preload.js',
      'buildReportSql',
      'build-report-sql',
      { table: 'sales', aggregate: 'sum' },
    ],
  ])('%s preload 执行后把 API 调用原样转发到正确 IPC 通道', async (
    _name,
    preloadPath,
    method,
    channel,
    payload,
  ) => {
    const { exposedApi, exposedName, invokeCalls, invokeResult } = executePreload(preloadPath);
    const exposedMethod = exposedApi[method];

    expect(exposedName).toBe('api');
    if (typeof exposedMethod !== 'function') throw new Error(`preload 未暴露方法: ${method}`);
    await expect(exposedMethod(payload)).resolves.toBe(invokeResult);
    expect(invokeCalls).toEqual([[channel, payload]]);
  });

  it('两个 renderer 保存连接元数据时不发送 password/pass', () => {
    const dbRenderer = readFileSync('showcase/db-snapshot-diff/renderer/app.js', 'utf8');
    const biRenderer = readFileSync('showcase/bi-report/renderer/app.js', 'utf8');

    expect(dbRenderer).toContain("window.api.saveConfig({ last: { a: storedConnection(a), b: storedConnection(b) } })");
    expect(dbRenderer).not.toContain('pass: a.password');
    expect(dbRenderer).not.toContain('pass: b.password');
    expect(dbRenderer).not.toContain('if (c.pass)');

    expect(biRenderer).toContain('conn: storedConnection(conn)');
    expect(biRenderer).not.toContain('pass: conn.password');
    expect(biRenderer).not.toContain("pass: $('pass').value");
    expect(biRenderer).not.toContain('Object.entries(cfg.conn)');
  });

  it('两个 Electron 构建均包含安全 helper', () => {
    for (const packagePath of [
      'showcase/db-snapshot-diff/package.json',
      'showcase/bi-report/package.json',
    ]) {
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
      expect(packageJson.build.files).toContain('lib/**/*');
    }
  });
});
