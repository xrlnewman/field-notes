const $ = id => document.getElementById(id);
const logEl = $('log');
const log = (m, c = '') => { const d = document.createElement('div'); if (c) d.className = c; d.textContent = `[${new Date().toLocaleTimeString()}] ${m}`; logEl.appendChild(d); logEl.scrollTop = logEl.scrollHeight; };

(async () => {
  const cfg = await window.api.loadConfig();
  if (cfg.last) {
    fillForm('a', cfg.last.a || {});
    fillForm('b', cfg.last.b || {});
  }
})();

function fillForm(prefix, c) {
  if (c.type) $(`${prefix}-type`).value = c.type;
  if (c.host) $(`${prefix}-host`).value = c.host;
  if (c.port) $(`${prefix}-port`).value = c.port;
  if (c.user) $(`${prefix}-user`).value = c.user;
  if (c.database) $(`${prefix}-db`).value = c.database;
}
function readForm(prefix) {
  return {
    type: $(`${prefix}-type`).value, host: $(`${prefix}-host`).value, port: +$(`${prefix}-port`).value,
    user: $(`${prefix}-user`).value, password: $(`${prefix}-pass`).value, database: $(`${prefix}-db`).value,
  };
}
function storedConnection(conn) {
  return {
    type: conn.type, host: conn.host, port: conn.port, user: conn.user, database: conn.database,
  };
}

['a', 'b'].forEach(p => {
  $(`${p}-type`).onchange = () => { $(`${p}-port`).value = $(`${p}-type`).value === 'postgres' ? 5432 : 3306; };
  $(`${p}-test`).onclick = async () => {
    log(`${p.toUpperCase()} 测试连接…`, 'info');
    const r = await window.api.testConn(readForm(p));
    log(r.ok ? `✓ ${p.toUpperCase()} 连接成功` : `✗ ${p.toUpperCase()} 失败: ${r.error}`, r.ok ? 'ok' : 'err');
  };
});

$('save-cfg').onclick = async () => {
  const a = readForm('a'); const b = readForm('b');
  await window.api.saveConfig({ last: { a: storedConnection(a), b: storedConnection(b) } });
  log('配置已保存', 'ok');
};

let lastSnapshot = null; // { a: {conn, tables: {name: schema}}, b: {...} }

$('run-btn').onclick = async () => {
  const a = readForm('a'), b = readForm('b');
  const mode = $('mode').value;
  const requestedSampleSize = Number($('sample-size').value);
  const sampleSize = Number.isFinite(requestedSampleSize)
    ? Math.min(1000, Math.max(0, Math.trunc(requestedSampleSize)))
    : 100;
  try {
    log('拉取 A/B 表列表…', 'info');
    const [tA, tB] = await Promise.all([window.api.listTables(a), window.api.listTables(b)]);
    const setA = new Set(tA), setB = new Set(tB);
    const common = tA.filter(t => setB.has(t));
    const onlyA = tA.filter(t => !setB.has(t));
    const onlyB = tB.filter(t => !setA.has(t));

    $('k-a-tables').textContent = tA.length;
    $('k-b-tables').textContent = tB.length;
    $('k-only-a').textContent = onlyA.length;
    $('k-only-b').textContent = onlyB.length;
    $('result').hidden = false;

    log(`A: ${tA.length} 表，B: ${tB.length} 表，共有: ${common.length}`, 'info');

    let changed = 0;
    const schemaRows = [];
    const aSchemas = {}, bSchemas = {};
    for (const t of onlyA) { aSchemas[t] = await window.api.getTableSchema(a, t); schemaRows.push({ table: t, status: '仅 A 有', detail: '' }); }
    for (const t of onlyB) { bSchemas[t] = await window.api.getTableSchema(b, t); schemaRows.push({ table: t, status: '仅 B 有', detail: '' }); }
    for (const t of common) {
      const [sA, sB] = await Promise.all([window.api.getTableSchema(a, t), window.api.getTableSchema(b, t)]);
      aSchemas[t] = sA; bSchemas[t] = sB;
      const diffs = diffSchema(sA, sB);
      if (diffs.length) { changed++; schemaRows.push({ table: t, status: '结构有差异', detail: diffs.join('; ') }); }
    }
    $('k-changed').textContent = changed;
    renderSchema(schemaRows);
    lastSnapshot = { a: { conn: a, tables: aSchemas, onlyA, common }, b: { conn: b, tables: bSchemas, onlyB } };

    if (mode === 'both') {
      log('对比数据…', 'info');
      const dataRows = [];
      for (const t of common) {
        try {
          const [cA, cB] = await Promise.all([window.api.countRows(a, t), window.api.countRows(b, t)]);
          let detail = cA === cB ? `行数相同` : `行数差 ${cB - cA}`;
          if (sampleSize > 0) {
            const [rA, rB] = await Promise.all([window.api.sampleRows(a, t, sampleSize), window.api.sampleRows(b, t, sampleSize)]);
            const cs = compareSample(rA, rB);
            detail += `；采样 ${sampleSize}：${cs}`;
          }
          dataRows.push({ table: t, ra: cA, rb: cB, detail });
        } catch (e) { dataRows.push({ table: t, ra: '?', rb: '?', detail: '失败: ' + e.message }); }
      }
      renderData(dataRows);
    }
    log('完成', 'ok');
  } catch (e) { log('失败: ' + e.message, 'err'); }
};

function diffSchema(sA, sB) {
  const diffs = [];
  const mA = new Map(sA.map(c => [c.column_name || c.COLUMN_NAME, c]));
  const mB = new Map(sB.map(c => [c.column_name || c.COLUMN_NAME, c]));
  for (const [k, v] of mA) {
    if (!mB.has(k)) diffs.push(`- 字段 ${k}`);
    else {
      const t1 = String(v.column_type || v.COLUMN_TYPE || '').toLowerCase();
      const t2 = String(mB.get(k).column_type || mB.get(k).COLUMN_TYPE || '').toLowerCase();
      if (t1 !== t2) diffs.push(`${k}: ${t1} → ${t2}`);
    }
  }
  for (const k of mB.keys()) if (!mA.has(k)) diffs.push(`+ 字段 ${k}`);
  return diffs;
}

function compareSample(rA, rB) {
  if (!rA.length && !rB.length) return '空表';
  const colsA = rA.length ? Object.keys(rA[0]) : [];
  const colsB = rB.length ? Object.keys(rB[0]) : [];
  const colsCommon = colsA.filter(c => colsB.includes(c));
  const hashRow = r => colsCommon.map(c => String(r[c] ?? '')).join('|');
  const setA = new Set(rA.map(hashRow));
  const setB = new Set(rB.map(hashRow));
  let same = 0;
  for (const h of setA) if (setB.has(h)) same++;
  return `${same}/${Math.max(rA.length, rB.length)} 行内容一致`;
}

function renderSchema(rows) {
  $('schema-diff').querySelector('tbody').innerHTML = rows.map(r =>
    `<tr><td>${esc(r.table)}</td><td>${esc(r.status)}</td><td>${esc(r.detail)}</td></tr>`).join('') || '<tr><td colspan="3" class="muted">无差异</td></tr>';
}
function renderData(rows) {
  $('data-diff').querySelector('tbody').innerHTML = rows.map(r =>
    `<tr><td>${esc(r.table)}</td><td>${r.ra}</td><td>${r.rb}</td><td>${esc(r.detail)}</td></tr>`).join('');
}
// ========== 迁移 SQL ==========
$('gen-migration').onclick = async () => {
  if (!lastSnapshot) return log('请先运行一次对比', 'err');
  try {
    const sql = await window.api.generateMigration({
      sourceDialect: lastSnapshot.a.conn.type,
      targetDialect: lastSnapshot.b.conn.type,
      a: {
        tables: lastSnapshot.a.tables,
        onlyA: lastSnapshot.a.onlyA,
        common: lastSnapshot.a.common,
      },
      b: { tables: lastSnapshot.b.tables, onlyB: lastSnapshot.b.onlyB },
    });
    $('migration-sql').value = sql.length > 50000 ? sql.slice(0, 50000) + '\n-- ... 截断' : sql;
    log('✓ 迁移 SQL 已生成', 'ok');
  } catch (e) {
    log('迁移 SQL 生成失败: ' + e.message, 'err');
  }
};

$('copy-migration').onclick = () => {
  navigator.clipboard.writeText($('migration-sql').value).then(() => log('✓ 已复制', 'ok'));
};
$('save-migration').onclick = async () => {
  const out = await window.api.saveFile({ defaultPath: 'migration.sql', filters: [{ name: 'SQL', extensions: ['sql'] }] });
  if (!out) return;
  await window.api.writeFile(out, new TextEncoder().encode($('migration-sql').value).buffer);
  log('✓ ' + out, 'ok');
};

function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
