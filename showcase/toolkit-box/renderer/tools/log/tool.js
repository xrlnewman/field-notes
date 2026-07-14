const $ = id => document.getElementById(id);
const logEl = $('log');
const log = (msg, cls = '') => {
  const line = document.createElement('div');
  if (cls) line.className = cls;
  line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  logEl.appendChild(line);
  logEl.scrollTop = logEl.scrollHeight;
};

let file = null;
let trendChart = null;

$('pick-btn').onclick = async () => {
  const fs = await window.api.pickFiles({ filters: [{ name: 'Log', extensions: ['log', 'txt', 'out', '*'] }] });
  if (!fs[0]) return;
  file = fs[0];
  $('file-name').textContent = `${file.name} (${fmtSize(file.size)})`;
};

$('analyze-btn').onclick = async () => {
  if (!file) return log('未选文件', 'err');
  try {
    log('读取文件…', 'info');
    const text = await window.api.readText(file.path, 'utf-8');
    log(`已读取 ${text.length} 字符，开始解析`, 'info');
    const result = analyze(text, $('time-fmt').value, $('bucket').value);
    renderResult(result);
    log(`完成：总计 ${result.total} 行`, 'ok');
  } catch (e) { log('分析失败: ' + e.message, 'err'); }
};

function analyze(text, timeFmt, bucket) {
  const lines = text.split(/\r?\n/);
  const counts = { ERROR: 0, WARN: 0, INFO: 0, DEBUG: 0, OTHER: 0 };
  const trend = new Map(); // bucketKey -> {ERROR, WARN, INFO, OTHER}
  const errorMsgs = new Map();
  const ips = new Map();
  const urls = new Map();
  let minTime = null, maxTime = null;
  const ipRe = /\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/;
  const urlRe = /"(?:GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+([^\s"]+)\s+HTTP/i;
  const altUrl = /\b(\/[\w\-./%?=&]+)\b/;

  for (const raw of lines) {
    if (!raw.trim()) continue;
    const line = raw;
    const lvl = detectLevel(line);
    counts[lvl] = (counts[lvl] || 0) + 1;

    const t = detectTime(line, timeFmt);
    if (t) {
      if (!minTime || t < minTime) minTime = t;
      if (!maxTime || t > maxTime) maxTime = t;
      const key = bucketKey(t, bucket);
      const slot = trend.get(key) || { ERROR: 0, WARN: 0, INFO: 0, OTHER: 0 };
      slot[lvl === 'DEBUG' ? 'OTHER' : (lvl === 'ERROR' || lvl === 'WARN' || lvl === 'INFO' ? lvl : 'OTHER')]++;
      trend.set(key, slot);
    }

    if (lvl === 'ERROR') {
      const norm = normalizeMsg(line);
      errorMsgs.set(norm, (errorMsgs.get(norm) || 0) + 1);
    }
    const ipM = line.match(ipRe);
    if (ipM) ips.set(ipM[1], (ips.get(ipM[1]) || 0) + 1);

    const um = line.match(urlRe) || line.match(altUrl);
    if (um) {
      const u = um[1].split('?')[0];
      if (u && u.length > 1 && u.length < 200) urls.set(u, (urls.get(u) || 0) + 1);
    }
  }

  return {
    total: lines.length,
    counts,
    trend: [...trend.entries()].sort((a, b) => a[0].localeCompare(b[0])),
    topErrors: topN(errorMsgs, 20),
    topIps: topN(ips, 20),
    topUrls: topN(urls, 20),
    minTime, maxTime,
  };
}

function detectLevel(line) {
  if (/\b(ERROR|ERR|FATAL|CRITICAL|EXCEPTION)\b/i.test(line)) return 'ERROR';
  if (/\bWARN(ING)?\b/i.test(line)) return 'WARN';
  if (/\bINFO\b/i.test(line)) return 'INFO';
  if (/\bDEBUG\b/i.test(line)) return 'DEBUG';
  return 'OTHER';
}

function detectTime(line, fmt) {
  let m;
  if (fmt === 'iso' || fmt === 'auto') {
    m = line.match(/(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})/);
    if (m) return new Date(m[1] + 'T' + m[2]);
  }
  if (fmt === 'cn' || fmt === 'auto') {
    m = line.match(/(\d{4})\/(\d{2})\/(\d{2}) (\d{2}:\d{2}:\d{2})/);
    if (m) return new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}`);
  }
  if (fmt === 'apache' || fmt === 'auto') {
    m = line.match(/\[(\d{2})\/([A-Za-z]{3})\/(\d{4}):(\d{2}:\d{2}:\d{2})/);
    if (m) {
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const mo = months.indexOf(m[2]);
      if (mo >= 0) return new Date(+m[3], mo, +m[1], +m[4].slice(0, 2), +m[4].slice(3, 5), +m[4].slice(6, 8));
    }
  }
  return null;
}

function bucketKey(t, b) {
  const Y = t.getFullYear(), Mo = pad(t.getMonth() + 1), D = pad(t.getDate());
  const H = pad(t.getHours()), Mi = t.getMinutes();
  if (b === '1d') return `${Y}-${Mo}-${D}`;
  if (b === '1h') return `${Y}-${Mo}-${D} ${H}:00`;
  if (b === '5m') return `${Y}-${Mo}-${D} ${H}:${pad(Math.floor(Mi / 5) * 5)}`;
  return `${Y}-${Mo}-${D} ${H}:${pad(Mi)}`;
}
function pad(n) { return String(n).padStart(2, '0'); }

function normalizeMsg(line) {
  let s = line.replace(/^.*?(ERROR|ERR|FATAL|EXCEPTION)[:\s-]*/i, '');
  s = s.replace(/\b\d{4}-\d{2}-\d{2}[T ]?\d{0,2}:?\d{0,2}:?\d{0,2}\b/g, '<TIME>');
  s = s.replace(/\b0x[0-9a-f]+\b/gi, '<HEX>');
  s = s.replace(/\b\d{4,}\b/g, '<NUM>');
  s = s.replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '<UUID>');
  s = s.replace(/\b(\d{1,3}\.){3}\d{1,3}\b/g, '<IP>');
  s = s.replace(/[^\x20-\x7e一-鿿]/g, ' ');
  return s.trim().slice(0, 200);
}

function topN(map, n) {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

function renderResult(r) {
  $('result').hidden = false;
  $('k-total').textContent = r.total.toLocaleString();
  $('k-error').textContent = (r.counts.ERROR || 0).toLocaleString();
  $('k-warn').textContent = (r.counts.WARN || 0).toLocaleString();
  $('k-info').textContent = (r.counts.INFO || 0).toLocaleString();
  $('k-span').textContent = r.minTime && r.maxTime ? `${fmtTime(r.minTime)} ~ ${fmtTime(r.maxTime)}` : '未识别时间';

  if (trendChart) trendChart.destroy();
  const labels = r.trend.map(([k]) => k);
  const ds = (key, color) => ({ label: key, data: r.trend.map(([, v]) => v[key] || 0), borderColor: color, backgroundColor: color + '33', tension: 0.25, fill: false });
  trendChart = new Chart($('chart-trend'), {
    type: 'line',
    data: { labels, datasets: [ds('ERROR', '#dc2626'), ds('WARN', '#d97706'), ds('INFO', '#0284c7'), ds('OTHER', '#94a3b8')] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } },
  });

  fillTable('top-error', r.topErrors);
  fillTable('top-ip', r.topIps);
  fillTable('top-url', r.topUrls);
}
function fillTable(id, pairs) {
  document.querySelector(`#${id} tbody`).innerHTML = pairs.length
    ? pairs.map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td>${v.toLocaleString()}</td></tr>`).join('')
    : '<tr><td colspan="2" class="muted">无数据</td></tr>';
}
function fmtSize(n) { const u = ['B', 'KB', 'MB', 'GB']; let i = 0; while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; } return n.toFixed(i ? 1 : 0) + ' ' + u[i]; }
function fmtTime(t) { return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())} ${pad(t.getHours())}:${pad(t.getMinutes())}`; }
function escapeHtml(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
