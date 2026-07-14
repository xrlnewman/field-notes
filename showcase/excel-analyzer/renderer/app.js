/* global XLSX, Chart */

const els = {
  pickBtn: document.getElementById('pick-btn'),
  dropZone: document.getElementById('drop-zone'),
  sheetSelect: document.getElementById('sheet-select'),
  status: document.getElementById('status'),
  report: document.getElementById('report'),
  overview: document.getElementById('overview'),
  columnsTable: document.getElementById('columns-table'),
  previewTable: document.getElementById('preview-table'),
  charts: document.getElementById('charts'),
};

let workbook = null;
const chartInstances = [];

// ---------- file load ----------
els.pickBtn.addEventListener('click', async () => {
  const f = await window.api.pickFile();
  if (!f) return;
  loadWorkbook(f.buffer, f.name);
});

['dragenter', 'dragover'].forEach(ev =>
  els.dropZone.addEventListener(ev, e => { e.preventDefault(); els.dropZone.classList.add('dragover'); })
);
['dragleave', 'drop'].forEach(ev =>
  els.dropZone.addEventListener(ev, e => { e.preventDefault(); els.dropZone.classList.remove('dragover'); })
);
els.dropZone.addEventListener('drop', async e => {
  const file = e.dataTransfer.files[0];
  if (!file) return;
  const filePath = window.api.getDroppedPath(file);
  if (filePath) {
    const data = await window.api.readDropped(filePath);
    loadWorkbook(data.buffer, data.name);
  } else {
    const buf = await file.arrayBuffer();
    loadWorkbook(buf, file.name);
  }
});

els.sheetSelect.addEventListener('change', () => {
  if (workbook) analyzeSheet(workbook.Sheets[els.sheetSelect.value], els.sheetSelect.value);
});

function loadWorkbook(arrayBuffer, fileName) {
  try {
    workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
  } catch (err) {
    els.status.textContent = '解析失败: ' + err.message;
    return;
  }
  const names = workbook.SheetNames;
  els.sheetSelect.innerHTML = names.map(n => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join('');
  els.sheetSelect.hidden = names.length < 2;
  els.status.textContent = `已加载: ${fileName} (${names.length} 个工作表)`;
  analyzeSheet(workbook.Sheets[names[0]], names[0]);
}

// ---------- analysis ----------
function analyzeSheet(sheet, sheetName) {
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: true });
  if (!rows.length) {
    els.status.textContent += ' / 空表';
    els.report.hidden = true;
    return;
  }
  const columns = Object.keys(rows[0]);
  const colStats = columns.map(c => inferColumn(c, rows));
  renderOverview(rows, columns, colStats, sheetName);
  renderColumnsTable(colStats);
  renderPreview(rows.slice(0, 20), columns);
  renderCharts(rows, colStats);
  els.report.hidden = false;
}

function inferColumn(name, rows) {
  const values = rows.map(r => r[name]);
  const nonNull = values.filter(v => v !== null && v !== undefined && v !== '');
  const total = values.length;
  const nullCount = total - nonNull.length;

  let kind = 'cat';
  let numericValues = [];
  if (nonNull.length) {
    if (nonNull.every(v => v instanceof Date)) {
      kind = 'date';
    } else {
      const nums = nonNull.map(v => typeof v === 'number' ? v : Number(v)).filter(v => Number.isFinite(v));
      if (nums.length / nonNull.length >= 0.8) {
        kind = 'num';
        numericValues = nums;
      }
    }
  }

  const stat = { name, kind, total, nullCount, nonNullCount: nonNull.length };
  if (kind === 'num') {
    numericValues.sort((a, b) => a - b);
    const sum = numericValues.reduce((s, v) => s + v, 0);
    const mean = sum / numericValues.length;
    const variance = numericValues.reduce((s, v) => s + (v - mean) ** 2, 0) / numericValues.length;
    stat.min = numericValues[0];
    stat.max = numericValues[numericValues.length - 1];
    stat.mean = mean;
    stat.std = Math.sqrt(variance);
    stat.median = quantile(numericValues, 0.5);
    stat.values = numericValues;
  } else {
    const counts = new Map();
    for (const v of nonNull) {
      const k = v instanceof Date ? v.toISOString() : String(v);
      counts.set(k, (counts.get(k) || 0) + 1);
    }
    stat.uniqueCount = counts.size;
    stat.top = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }
  return stat;
}

function quantile(sortedArr, q) {
  const pos = (sortedArr.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sortedArr[base + 1] !== undefined) {
    return sortedArr[base] + rest * (sortedArr[base + 1] - sortedArr[base]);
  }
  return sortedArr[base];
}

// ---------- render: overview & tables ----------
function renderOverview(rows, columns, colStats, sheetName) {
  const numCount = colStats.filter(c => c.kind === 'num').length;
  const catCount = colStats.filter(c => c.kind === 'cat').length;
  const dateCount = colStats.filter(c => c.kind === 'date').length;
  els.overview.innerHTML = kpis([
    ['当前工作表', sheetName],
    ['行数', rows.length.toLocaleString()],
    ['列数', columns.length],
    ['数值列', numCount],
    ['分类列', catCount],
    ['日期列', dateCount],
  ]);
}
function kpis(pairs) {
  return pairs.map(([l, v]) => `<div class="kpi"><div class="label">${escapeHtml(l)}</div><div class="value">${escapeHtml(String(v))}</div></div>`).join('');
}

function renderColumnsTable(colStats) {
  const head = `<thead><tr>
    <th>列名</th><th>类型</th><th>非空</th><th>空值</th>
    <th>唯一</th><th>min</th><th>max</th><th>mean</th><th>median</th><th>std</th>
  </tr></thead>`;
  const body = colStats.map(c => {
    const tag = `<span class="tag ${c.kind}">${c.kind}</span>`;
    const num = c.kind === 'num';
    return `<tr>
      <td>${escapeHtml(c.name)}</td>
      <td>${tag}</td>
      <td>${c.nonNullCount}</td>
      <td>${c.nullCount ? `<span class="tag null">${c.nullCount}</span>` : 0}</td>
      <td>${c.uniqueCount ?? '-'}</td>
      <td>${num ? fmt(c.min) : '-'}</td>
      <td>${num ? fmt(c.max) : '-'}</td>
      <td>${num ? fmt(c.mean) : '-'}</td>
      <td>${num ? fmt(c.median) : '-'}</td>
      <td>${num ? fmt(c.std) : '-'}</td>
    </tr>`;
  }).join('');
  els.columnsTable.innerHTML = head + '<tbody>' + body + '</tbody>';
}

function renderPreview(rows, columns) {
  const head = '<thead><tr>' + columns.map(c => `<th>${escapeHtml(c)}</th>`).join('') + '</tr></thead>';
  const body = rows.map(r => '<tr>' + columns.map(c => `<td>${escapeHtml(formatCell(r[c]))}</td>`).join('') + '</tr>').join('');
  els.previewTable.innerHTML = head + '<tbody>' + body + '</tbody>';
}

// ---------- charts ----------
function renderCharts(rows, colStats) {
  chartInstances.forEach(c => c.destroy());
  chartInstances.length = 0;
  els.charts.innerHTML = '';

  const nums = colStats.filter(c => c.kind === 'num');
  const cats = colStats.filter(c => c.kind === 'cat' && c.uniqueCount > 1 && c.uniqueCount <= 50);
  const dates = colStats.filter(c => c.kind === 'date');

  // 1. histogram for each numeric column (cap at 4)
  nums.slice(0, 4).forEach(c => addChart('bar', `${c.name} 分布直方图`, '数值分箱', histogramConfig(c)));

  // 2. line chart: each date col × numeric col (cap)
  dates.slice(0, 1).forEach(dc => {
    nums.slice(0, 2).forEach(nc => addChart('line', `${nc.name} 随 ${dc.name} 变化`, '折线趋势', lineConfig(rows, dc, nc)));
  });

  // 3. pie for top categorical columns (cap at 3)
  cats.slice(0, 3).forEach(c => addChart('pie', `${c.name} 占比 (Top 10)`, '饼图', pieConfig(c)));

  // 4. bar of category × numeric mean (first cat × first num)
  if (cats[0] && nums[0]) {
    addChart('bar', `按 ${cats[0].name} 看 ${nums[0].name} 均值`, '分组聚合', groupedBarConfig(rows, cats[0], nums[0]));
  }

  // 5. scatter for first two numeric columns
  if (nums.length >= 2) {
    addChart('scatter', `${nums[0].name} vs ${nums[1].name}`, '散点 / 相关性', scatterConfig(rows, nums[0], nums[1]));
  }

  // 6. heatmap (matrix) for two categorical columns count
  if (cats.length >= 2 && Chart.registry?.controllers?.get?.('matrix')) {
    addChart('matrix', `${cats[0].name} × ${cats[1].name} 频次热力`, '热力图', heatmapConfig(rows, cats[0], cats[1]));
  }

  if (!els.charts.children.length) {
    els.charts.innerHTML = '<div class="chart-card"><div class="title">暂无可生成的图表</div><div class="sub">需要至少 1 个数值列或分类列</div></div>';
  }
}

function addChart(type, title, sub, config) {
  const card = document.createElement('div');
  card.className = 'chart-card';
  card.innerHTML = `<div class="title">${escapeHtml(title)}</div><div class="sub">${escapeHtml(sub)}</div><canvas></canvas>`;
  els.charts.appendChild(card);
  const ctx = card.querySelector('canvas').getContext('2d');
  const chart = new Chart(ctx, { type, ...config });
  chartInstances.push(chart);
}

function histogramConfig(col) {
  const bins = 12;
  const min = col.min, max = col.max;
  const step = (max - min) / bins || 1;
  const buckets = new Array(bins).fill(0);
  for (const v of col.values) {
    let idx = Math.floor((v - min) / step);
    if (idx >= bins) idx = bins - 1;
    if (idx < 0) idx = 0;
    buckets[idx]++;
  }
  const labels = buckets.map((_, i) => `${fmt(min + i * step)}~${fmt(min + (i + 1) * step)}`);
  return {
    data: { labels, datasets: [{ label: col.name, data: buckets, backgroundColor: 'rgba(59,130,246,0.7)' }] },
    options: chartOptions(),
  };
}

function lineConfig(rows, dateCol, numCol) {
  const pairs = rows
    .map(r => [r[dateCol.name], r[numCol.name]])
    .filter(([d, v]) => d instanceof Date && Number.isFinite(Number(v)))
    .sort((a, b) => a[0] - b[0]);
  return {
    data: {
      labels: pairs.map(p => p[0].toISOString().slice(0, 10)),
      datasets: [{ label: numCol.name, data: pairs.map(p => Number(p[1])), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.15)', tension: 0.25, fill: true }],
    },
    options: chartOptions(),
  };
}

function pieConfig(col) {
  const top = col.top.slice(0, 10);
  return {
    data: {
      labels: top.map(([k]) => k),
      datasets: [{ data: top.map(([, v]) => v), backgroundColor: palette(top.length) }],
    },
    options: { ...chartOptions(), plugins: { legend: { position: 'right' } } },
  };
}

function groupedBarConfig(rows, catCol, numCol) {
  const groups = new Map();
  for (const r of rows) {
    const k = r[catCol.name];
    const v = Number(r[numCol.name]);
    if (k === null || k === undefined || k === '' || !Number.isFinite(v)) continue;
    const key = k instanceof Date ? k.toISOString() : String(k);
    const g = groups.get(key) || { sum: 0, n: 0 };
    g.sum += v; g.n++;
    groups.set(key, g);
  }
  const entries = [...groups.entries()].map(([k, g]) => [k, g.sum / g.n]).sort((a, b) => b[1] - a[1]).slice(0, 20);
  return {
    data: {
      labels: entries.map(e => e[0]),
      datasets: [{ label: `mean(${numCol.name})`, data: entries.map(e => e[1]), backgroundColor: 'rgba(16,185,129,0.7)' }],
    },
    options: chartOptions(),
  };
}

function scatterConfig(rows, xCol, yCol) {
  const pts = rows.map(r => ({ x: Number(r[xCol.name]), y: Number(r[yCol.name]) }))
    .filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));
  return {
    data: { datasets: [{ label: `${xCol.name} vs ${yCol.name}`, data: pts, backgroundColor: 'rgba(244,114,182,0.6)' }] },
    options: { ...chartOptions(), scales: { x: { title: { display: true, text: xCol.name } }, y: { title: { display: true, text: yCol.name } } } },
  };
}

function heatmapConfig(rows, cA, cB) {
  const xs = cA.top.slice(0, 12).map(([k]) => k);
  const ys = cB.top.slice(0, 12).map(([k]) => k);
  const counts = new Map();
  let maxV = 0;
  for (const r of rows) {
    const a = r[cA.name]; const b = r[cB.name];
    if (a == null || b == null) continue;
    const ka = a instanceof Date ? a.toISOString() : String(a);
    const kb = b instanceof Date ? b.toISOString() : String(b);
    if (!xs.includes(ka) || !ys.includes(kb)) continue;
    const key = ka + '||' + kb;
    const v = (counts.get(key) || 0) + 1;
    counts.set(key, v);
    if (v > maxV) maxV = v;
  }
  const data = [];
  for (const x of xs) for (const y of ys) {
    data.push({ x, y, v: counts.get(x + '||' + y) || 0 });
  }
  return {
    data: {
      datasets: [{
        label: '频次',
        data,
        backgroundColor: ctx => {
          const v = ctx.raw?.v ?? 0;
          const alpha = maxV ? v / maxV : 0;
          return `rgba(59,130,246,${alpha.toFixed(2)})`;
        },
        borderWidth: 1,
        borderColor: '#e2e8f0',
        width: ({ chart }) => (chart.chartArea?.width || 0) / xs.length - 2,
        height: ({ chart }) => (chart.chartArea?.height || 0) / ys.length - 2,
      }],
    },
    options: {
      ...chartOptions(),
      scales: {
        x: { type: 'category', labels: xs, offset: true, grid: { display: false } },
        y: { type: 'category', labels: ys, offset: true, grid: { display: false }, reverse: true },
      },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { title: () => '', label: ctx => `${ctx.raw.x} × ${ctx.raw.y}: ${ctx.raw.v}` } },
      },
    },
  };
}

function chartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true, labels: { boxWidth: 12 } } },
  };
}

// ---------- utils ----------
const palette = n => {
  const base = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];
  return Array.from({ length: n }, (_, i) => base[i % base.length]);
};
function fmt(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return '-';
  if (typeof v !== 'number') return String(v);
  if (Math.abs(v) >= 1000 || Number.isInteger(v)) return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return v.toFixed(3);
}
function formatCell(v) {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString().slice(0, 19).replace('T', ' ');
  return String(v);
}
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
