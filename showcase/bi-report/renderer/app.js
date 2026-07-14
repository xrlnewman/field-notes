const $ = id => document.getElementById(id);
const logEl = $('log');
const log = (m, c = '') => { const d = document.createElement('div'); if (c) d.className = c; d.textContent = `[${new Date().toLocaleTimeString()}] ${m}`; logEl.appendChild(d); logEl.scrollTop = logEl.scrollHeight; };

let conn = null, currentData = null, currentSql = null, chart = null;
let savedQueries = [];   // { name, sql, chartType, table, xCol, yCol, agg }
let dashboard = [];      // 同样的形状，但已"运行"，存渲染数据

(async () => {
  const cfg = await window.api.loadConfig();
  if (cfg.conn) {
    for (const key of ['host', 'port', 'user', 'db']) {
      if (cfg.conn[key] != null) $(key).value = cfg.conn[key];
    }
  }
  savedQueries = cfg.queries || [];
  refreshSavedSelect();
})();

function refreshSavedSelect() {
  $('saved-queries').innerHTML = '<option value="">— 已保存查询 —</option>' +
    savedQueries.map((q, i) => `<option value="${i}">${esc(q.name)}</option>`).join('');
}

function readConn() {
  return { host: $('host').value, port: +$('port').value, user: $('user').value, password: $('pass').value, database: $('db').value };
}
function storedConnection(connection) {
  return {
    host: connection.host, port: connection.port, user: connection.user, db: connection.database,
  };
}

$('connect-btn').onclick = async () => {
  conn = readConn();
  const r = await window.api.testConn(conn);
  if (!r.ok) return log('连接失败: ' + r.error, 'err');
  await window.api.saveConfig({ conn: storedConnection(conn) });
  log('✓ 连接成功', 'ok');
  const tables = await window.api.listTables(conn);
  $('table').innerHTML = tables.map(t => `<option>${esc(t)}</option>`).join('');
  loadCols();
};

$('table').onchange = loadCols;
async function loadCols() {
  if (!conn || !$('table').value) return;
  const cols = await window.api.listColumns(conn, $('table').value);
  const opts = cols.map(c => `<option value="${esc(c.name)}">${esc(c.name)} (${esc(c.type)})</option>`).join('');
  $('x-col').innerHTML = opts;
  $('y-col').innerHTML = opts;
}

$('run-btn').onclick = async () => {
  if (!conn) return log('未连接', 'err');
  try {
    const sql = await window.api.buildReportSql({
      customSql: $('custom-sql').value,
      table: $('table').value,
      xColumn: $('x-col').value,
      yColumn: $('y-col').value,
      aggregate: $('agg').value,
      order: $('order').value,
      limit: $('limit').value,
    });
    log('运行: ' + sql, 'info');
    const rows = await window.api.runQuery(conn, sql);
    currentData = rows;
    currentSql = sql;
    renderTable(rows);
    renderChart(rows);
    log(`✓ 返回 ${rows.length} 行`, 'ok');
  } catch (e) { log('查询失败: ' + e.message, 'err'); }
};

$('save-query').onclick = async () => {
  if (!currentSql) return log('未运行查询', 'err');
  const name = prompt('查询名称', $('table').value + '_' + $('y-col').value);
  if (!name) return;
  savedQueries.push({
    name, sql: currentSql, chartType: $('chart-type').value,
    table: $('table').value, xCol: $('x-col').value, yCol: $('y-col').value, agg: $('agg').value,
  });
  await persist();
  refreshSavedSelect();
  log(`✓ 已保存 "${name}"`, 'ok');
};

$('load-query').onclick = async () => {
  const idx = $('saved-queries').value;
  if (idx === '') return;
  const q = savedQueries[idx];
  if (q.table) { $('table').value = q.table; await loadCols(); }
  if (q.xCol) $('x-col').value = q.xCol;
  if (q.yCol) $('y-col').value = q.yCol;
  if (q.agg) $('agg').value = q.agg;
  if (q.chartType) $('chart-type').value = q.chartType;
  $('custom-sql').value = q.sql || '';
  log(`✓ 已加载 "${q.name}"`, 'ok');
};

$('add-to-dashboard').onclick = () => {
  if (!currentData) return log('未运行查询', 'err');
  const name = prompt('图表名称', $('table').value + ' ' + ($('y-col').value || ''));
  if (!name) return;
  const item = {
    name, data: currentData, chartType: $('chart-type').value,
    table: $('table').value, xCol: $('x-col').value, yCol: $('y-col').value, agg: $('agg').value,
  };
  dashboard.push(item);
  renderDashboard();
};

$('clear-dash').onclick = () => { dashboard = []; renderDashboard(); };

function renderDashboard() {
  $('dash-count').textContent = `${dashboard.length} 个图表`;
  $('dashboard').innerHTML = '';
  dashboard.forEach((item, idx) => {
    const card = document.createElement('div');
    card.style.cssText = 'background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:12px';
    card.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
      <strong>${esc(item.name)}</strong>
      <button class="danger" data-idx="${idx}" style="padding:2px 8px;font-size:11px">×</button>
    </div><canvas height="200"></canvas>`;
    $('dashboard').appendChild(card);
    const canvas = card.querySelector('canvas');
    const rows = item.data;
    if (!rows.length) return;
    const cols = Object.keys(rows[0]);
    const xKey = cols[0], yKey = cols[1] || cols[0];
    const labels = rows.map(r => String(r[xKey]));
    const data = rows.map(r => Number(r[yKey]) || 0);
    const type = item.chartType;
    const cfg = type === 'pie'
      ? { type: 'pie', data: { labels, datasets: [{ data, backgroundColor: palette(data.length) }] } }
      : { type, data: { labels, datasets: [{ label: yKey, data, backgroundColor: 'rgba(59,130,246,0.7)', borderColor: '#3b82f6' }] } };
    cfg.options = { responsive: true, maintainAspectRatio: false };
    new Chart(canvas, cfg);
  });
  $('dashboard').addEventListener('click', e => {
    const b = e.target.closest('button[data-idx]');
    if (b) { dashboard.splice(+b.dataset.idx, 1); renderDashboard(); }
  }, { once: true });
}

async function persist() {
  await window.api.saveConfig({
    conn: storedConnection(readConn()),
    queries: savedQueries,
  });
}

$('chart-type').onchange = () => { if (currentData) renderChart(currentData); };

function renderChart(rows) {
  if (chart) chart.destroy();
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const xKey = cols[0], yKey = cols[1] || cols[0];
  const labels = rows.map(r => String(r[xKey]));
  const data = rows.map(r => Number(r[yKey]) || 0);
  const type = $('chart-type').value;
  const cfg = type === 'pie'
    ? { type: 'pie', data: { labels, datasets: [{ data, backgroundColor: palette(data.length) }] } }
    : type === 'scatter'
      ? { type: 'scatter', data: { datasets: [{ label: yKey, data: rows.map((r, i) => ({ x: i, y: Number(r[yKey]) || 0 })), backgroundColor: '#3b82f6' }] } }
      : { type, data: { labels, datasets: [{ label: yKey, data, backgroundColor: 'rgba(59,130,246,0.7)', borderColor: '#3b82f6' }] } };
  cfg.options = { responsive: true, maintainAspectRatio: false };
  chart = new Chart($('chart'), cfg);
}

function renderTable(rows) {
  if (!rows.length) { $('data-table').innerHTML = '<tr><td class="muted">无数据</td></tr>'; return; }
  const cols = Object.keys(rows[0]);
  const head = '<thead><tr>' + cols.map(c => `<th>${esc(c)}</th>`).join('') + '</tr></thead>';
  const body = rows.slice(0, 100).map(r => '<tr>' + cols.map(c => `<td>${esc(formatCell(r[c]))}</td>`).join('') + '</tr>').join('');
  $('data-table').innerHTML = head + '<tbody>' + body + '</tbody>';
}
function formatCell(v) { if (v == null) return ''; if (v instanceof Date) return v.toISOString(); return String(v); }

$('export-png').onclick = async () => {
  if (!chart) return log('无图表', 'err');
  const dataUrl = chart.toBase64Image('image/png', 1);
  const out = await window.api.saveFile({ defaultPath: 'chart.png', filters: [{ name: 'PNG', extensions: ['png'] }] });
  if (!out) return;
  const ab = Uint8Array.from(atob(dataUrl.split(',')[1]), c => c.charCodeAt(0)).buffer;
  await window.api.writeFile(out, ab);
  log('✓ ' + out, 'ok');
};

$('export-xlsx').onclick = async () => {
  if (!currentData) return log('无数据', 'err');
  const out = await window.api.saveFile({ defaultPath: 'report.xlsx', filters: [{ name: 'Excel', extensions: ['xlsx'] }] });
  if (!out) return;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(currentData), 'data');
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  await window.api.writeFile(out, buf);
  log('✓ ' + out, 'ok');
};

function palette(n) { const c = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']; return Array.from({ length: n }, (_, i) => c[i % c.length]); }
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function palette(n) { const c = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']; return Array.from({ length: n }, (_, i) => c[i % c.length]); }
