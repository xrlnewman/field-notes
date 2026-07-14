const fs = require('fs');
const path = require('path');

const POSIX_PRIVATE_FILE_MODE = 0o600;
const SECRET_KEYS = new Set(['password', 'pass']);

function containsSecrets(value) {
  if (Array.isArray(value)) return value.some(containsSecrets);
  if (!value || typeof value !== 'object') return false;

  return Object.entries(value).some(
    ([key, child]) => SECRET_KEYS.has(key.toLowerCase()) || containsSecrets(child),
  );
}

function stripSecrets(value) {
  if (Array.isArray(value)) return value.map(stripSecrets);
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !SECRET_KEYS.has(key.toLowerCase()))
      .map(([key, child]) => [key, stripSecrets(child)]),
  );
}

function parseSafeConfig(text, fallback) {
  try {
    return stripSecrets(JSON.parse(text));
  } catch {
    return stripSecrets(fallback);
  }
}

async function loadSafeConfigFile(filePath, fallback, io = fs.promises) {
  let text;
  try {
    text = await io.readFile(filePath, 'utf8');
  } catch {
    return stripSecrets(fallback);
  }

  let config;
  try {
    config = JSON.parse(text);
  } catch {
    await io.chmod(filePath, POSIX_PRIVATE_FILE_MODE);
    return stripSecrets(fallback);
  }

  const hadSecrets = containsSecrets(config);
  const safeConfig = stripSecrets(config);
  if (hadSecrets) {
    await saveSafeConfigFile(filePath, safeConfig, io);
  } else {
    await io.chmod(filePath, POSIX_PRIVATE_FILE_MODE);
  }
  return safeConfig;
}

async function saveSafeConfigFile(filePath, config, io = fs.promises) {
  const safeConfig = stripSecrets(config);
  await io.mkdir(path.dirname(filePath), { recursive: true });
  await io.writeFile(filePath, JSON.stringify(safeConfig, null, 2), {
    encoding: 'utf8',
    mode: POSIX_PRIVATE_FILE_MODE,
  });
  await io.chmod(filePath, POSIX_PRIVATE_FILE_MODE);
  return safeConfig;
}

function quoteIdentifier(dialect, identifier) {
  if (typeof identifier !== 'string' || identifier.length === 0 || identifier.includes('\0')) {
    throw new TypeError('数据库标识符必须是非空且不含 NUL 的字符串');
  }
  if (dialect === 'mysql') return `\`${identifier.replace(/`/g, '``')}\``;
  if (dialect === 'postgres') return `"${identifier.replace(/"/g, '""')}"`;
  throw new TypeError(`不支持的数据库方言: ${dialect}`);
}

function normalizeLimit(value, fallback = 100, max = 1000) {
  const safeMax = Number.isFinite(Number(max)) ? Math.max(1, Math.trunc(Number(max))) : 1000;
  const fallbackNumber = Number(fallback);
  const safeFallback = Number.isFinite(fallbackNumber)
    ? Math.min(safeMax, Math.max(1, Math.trunc(fallbackNumber)))
    : Math.min(100, safeMax);

  let parsed;
  if (typeof value === 'number') {
    parsed = value;
  } else if (typeof value === 'string' && /^[+-]?\d+(?:\.\d+)?$/.test(value.trim())) {
    parsed = Number(value.trim());
  } else {
    return safeFallback;
  }

  if (!Number.isFinite(parsed)) return safeFallback;
  return Math.min(safeMax, Math.max(1, Math.trunc(parsed)));
}

function buildCountRowsSql(dialect, tableName) {
  return `SELECT COUNT(*) AS c FROM ${quoteIdentifier(dialect, tableName)}`;
}

function buildSampleRowsSql(dialect, tableName, limit) {
  return `SELECT * FROM ${quoteIdentifier(dialect, tableName)} LIMIT ${normalizeLimit(limit, 100, 1000)}`;
}

function columnName(column) {
  return column.column_name || column.COLUMN_NAME;
}

function columnType(column) {
  return column.column_type || column.COLUMN_TYPE || column.data_type || column.DATA_TYPE;
}

function migrationDialects(snapshot) {
  const legacyDialect = snapshot?.dialect;
  const sourceDialect = snapshot?.sourceDialect || legacyDialect;
  const targetDialect = snapshot?.targetDialect || legacyDialect;

  // 在生成任何 SQL 前完成方言校验，避免输出一半后才发现目标引擎不兼容。
  quoteIdentifier(sourceDialect, 'dialect_check');
  quoteIdentifier(targetDialect, 'dialect_check');
  if (sourceDialect !== targetDialect) {
    throw new TypeError(`迁移 SQL 仅支持相同数据库引擎: ${sourceDialect} → ${targetDialect}`);
  }
  return { sourceDialect, targetDialect };
}

function generateMigrationSql(snapshot, generatedAt) {
  const { targetDialect: dialect } = migrationDialects(snapshot);
  const source = snapshot?.a || {};
  const target = snapshot?.b || {};
  const quote = identifier => quoteIdentifier(dialect, identifier);
  const timestamp = String(generatedAt || '').replace(/[\r\n]+/g, ' ');
  let sql = `-- Migration SQL (A → B)\n-- 把 A 库结构同步到 B 库\n-- 生成时间: ${timestamp}\n\n`;

  for (const tableName of source.onlyA || []) {
    const columns = source.tables?.[tableName] || [];
    sql += '-- 新增仅源库存在的表\n';
    sql += `CREATE TABLE ${quote(tableName)} (\n`;
    sql += columns.map((column) => {
      const nullable = (column.is_nullable || column.IS_NULLABLE) === 'YES' ? '' : ' NOT NULL';
      return `  ${quote(columnName(column))} ${columnType(column)}${nullable}`;
    }).join(',\n');
    sql += '\n);\n\n';
  }

  for (const tableName of target.onlyB || []) {
    sql += '-- 删除仅目标库存在的表（建议先备份）\n';
    sql += `DROP TABLE ${quote(tableName)};\n\n`;
  }

  for (const tableName of source.common || []) {
    const sourceColumns = source.tables?.[tableName] || [];
    const targetColumns = target.tables?.[tableName] || [];
    const sourceByName = new Map(sourceColumns.map(column => [columnName(column), column]));
    const targetByName = new Map(targetColumns.map(column => [columnName(column), column]));
    const adds = [];
    const drops = [];
    const changes = [];

    for (const [name, column] of sourceByName) {
      if (!targetByName.has(name)) {
        adds.push({ name, type: columnType(column) });
        continue;
      }
      const sourceType = String(columnType(column) || '');
      const targetType = String(columnType(targetByName.get(name)) || '');
      if (sourceType !== targetType) {
        changes.push({ name, newType: sourceType });
      }
    }
    for (const name of targetByName.keys()) {
      if (!sourceByName.has(name)) drops.push(name);
    }

    if (adds.length || drops.length || changes.length) {
      sql += '-- 同名表结构差异\n';
      for (const column of adds) {
        sql += `ALTER TABLE ${quote(tableName)} ADD COLUMN ${quote(column.name)} ${column.type};\n`;
      }
      for (const name of drops) {
        sql += `ALTER TABLE ${quote(tableName)} DROP COLUMN ${quote(name)};\n`;
      }
      for (const change of changes) {
        if (dialect === 'mysql') {
          sql += `ALTER TABLE ${quote(tableName)} MODIFY COLUMN ${quote(change.name)} ${change.newType};\n`;
        } else {
          sql += `ALTER TABLE ${quote(tableName)} ALTER COLUMN ${quote(change.name)} TYPE ${change.newType};\n`;
        }
      }
      sql += '\n';
    }
  }

  return sql;
}

module.exports = {
  POSIX_PRIVATE_FILE_MODE,
  buildCountRowsSql,
  buildSampleRowsSql,
  containsSecrets,
  generateMigrationSql,
  loadSafeConfigFile,
  migrationDialects,
  normalizeLimit,
  parseSafeConfig,
  quoteIdentifier,
  saveSafeConfigFile,
  stripSecrets,
};
