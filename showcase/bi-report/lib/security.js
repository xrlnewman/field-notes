const fs = require('fs');
const path = require('path');

const POSIX_PRIVATE_FILE_MODE = 0o600;
const SECRET_KEYS = new Set(['password', 'pass']);
const ALLOWED_AGGREGATES = new Set(['SUM', 'COUNT', 'AVG', 'MAX', 'MIN']);

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

function quoteMysqlIdentifier(identifier) {
  if (typeof identifier !== 'string' || identifier.length === 0 || identifier.includes('\0')) {
    throw new TypeError('MySQL 标识符必须是非空且不含 NUL 的字符串');
  }
  return `\`${identifier.replace(/`/g, '``')}\``;
}

function normalizeLimit(value, fallback = 50, max = 1000) {
  const safeMax = Number.isFinite(Number(max)) ? Math.max(1, Math.trunc(Number(max))) : 1000;
  const fallbackNumber = Number(fallback);
  const safeFallback = Number.isFinite(fallbackNumber)
    ? Math.min(safeMax, Math.max(1, Math.trunc(fallbackNumber)))
    : Math.min(50, safeMax);

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

function normalizeAggregate(value) {
  const aggregate = String(value || '').toUpperCase();
  if (!ALLOWED_AGGREGATES.has(aggregate)) {
    throw new TypeError(`不支持的聚合函数: ${value}`);
  }
  return aggregate;
}

function normalizeOrder(value) {
  if (value === 'x') return 'x ASC';
  if (value === 'y') return 'y DESC';
  throw new TypeError(`不支持的排序方式: ${value}`);
}

function buildReportSql(spec = {}) {
  const customSql = typeof spec.customSql === 'string' ? spec.customSql.trim() : '';
  if (customSql) return customSql;

  const table = quoteMysqlIdentifier(spec.table);
  const xColumn = quoteMysqlIdentifier(spec.xColumn);
  const yColumn = quoteMysqlIdentifier(spec.yColumn);
  const aggregate = normalizeAggregate(spec.aggregate);
  const order = normalizeOrder(spec.order);
  const limit = normalizeLimit(spec.limit, 50, 1000);

  return `SELECT ${xColumn} AS x, ${aggregate}(${yColumn}) AS y FROM ${table} `
    + `GROUP BY ${xColumn} ORDER BY ${order} LIMIT ${limit}`;
}

module.exports = {
  ALLOWED_AGGREGATES,
  POSIX_PRIVATE_FILE_MODE,
  buildReportSql,
  containsSecrets,
  loadSafeConfigFile,
  normalizeAggregate,
  normalizeLimit,
  parseSafeConfig,
  quoteMysqlIdentifier,
  saveSafeConfigFile,
  stripSecrets,
};
