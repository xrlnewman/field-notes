const $ = id => document.getElementById(id);
const logEl = $('log');
const log = (m, c = '') => { const d = document.createElement('div'); if (c) d.className = c; d.textContent = `[${new Date().toLocaleTimeString()}] ${m}`; logEl.appendChild(d); logEl.scrollTop = logEl.scrollHeight; };

let currentId = null, latChart = null;
const latHistory = []; // {t, p50, p95, p99}

window.api.onProgress(({ id, stats, elapsed }) => {
  if (id !== currentId) return;
  update(stats, elapsed);
});
window.api.onDone(({ id, stats, elapsed }) => {
  if (id !== currentId) return;
  update(stats, elapsed);
  log(`完成 总 ${stats.sent} 请求 / ${(elapsed / 1000).toFixed(1)}s`, 'ok');
  $('start-btn').disabled = false;
  $('stop-btn').disabled = true;
  currentId = null;
});

$('bench-mode').onchange = () => { $('scenario-row').hidden = $('bench-mode').value !== 'scenario'; };

$('save-plan').onclick = async () => {
  const plan = {
    mode: $('bench-mode').value,
    url: $('url').value, method: $('method').value, headers: $('headers').value, body: $('body').value,
    scenario: $('scenario').value,
    concurrency: +$('concurrency').value, duration: +$('duration').value, rps: +$('rps').value, warmup: +$('warmup').value,
  };
  const out = await window.api.savePlan(JSON.stringify(plan, null, 2));
  if (out) log('✓ 计划已保存', 'ok');
};
$('load-plan').onclick = async () => {
  const text = await window.api.loadPlan();
  if (!text) return;
  const p = JSON.parse(text);
  $('bench-mode').value = p.mode || 'single'; $('bench-mode').onchange();
  if (p.url) $('url').value = p.url;
  if (p.method) $('method').value = p.method;
  if (p.headers) $('headers').value = p.headers;
  if (p.body) $('body').value = p.body;
  if (p.scenario) $('scenario').value = p.scenario;
  if (p.concurrency) $('concurrency').value = p.concurrency;
  if (p.duration) $('duration').value = p.duration;
  if (p.rps != null) $('rps').value = p.rps;
  if (p.warmup != null) $('warmup').value = p.warmup;
  log('✓ 计划已加载', 'ok');
};

$('start-btn').onclick = async () => {
  const mode = $('bench-mode').value;
  let opts;
  if (mode === 'scenario') {
    let scenario;
    try { scenario = JSON.parse($('scenario').value || '[]'); } catch (e) { return log('场景 JSON 解析失败: ' + e.message, 'err'); }
    if (!Array.isArray(scenario) || !scenario.length) return log('场景为空', 'err');
    opts = { mode, scenario,
      concurrency: +$('concurrency').value || 1,
      durationMs: (+$('duration').value || 1) * 1000,
      rps: +$('rps').value || 0, warmupMs: (+$('warmup').value || 0) * 1000 };
  } else {
    const url = $('url').value.trim();
    if (!url) return log('未填 URL', 'err');
    let headers = {};
    try { headers = JSON.parse($('headers').value || '{}'); } catch (e) { return log('Headers 不是合法 JSON', 'err'); }
    opts = {
      mode: 'single', url, method: $('method').value, headers, body: $('body').value || null,
      concurrency: +$('concurrency').value || 1,
      durationMs: (+$('duration').value || 1) * 1000,
      rps: +$('rps').value || 0,
      warmupMs: (+$('warmup').value || 0) * 1000,
    };
  }
  reset();
  log(`开始 [${mode}] 并发 ${opts.concurrency} | 时长 ${opts.durationMs / 1000}s${opts.warmupMs ? ` | 预热 ${opts.warmupMs / 1000}s` : ''}`, 'info');
  currentId = await window.api.start(opts);
  $('start-btn').disabled = true;
  $('stop-btn').disabled = false;
};
$('stop-btn').onclick = () => {
  if (currentId) window.api.stop(currentId);
};

function reset() {
  latHistory.length = 0;
  ['k-sent', 'k-ok', 'k-fail', 'k-qps', 'k-p50', 'k-p95', 'k-p99', 'k-max'].forEach(id => $(id).textContent = '0');
  if (latChart) { latChart.destroy(); latChart = null; }
  $('tbl-status').querySelector('tbody').innerHTML = '';
  $('tbl-err').querySelector('tbody').innerHTML = '';
}

function update(s, elapsed) {
  $('k-sent').textContent = s.sent;
  $('k-ok').textContent = s.ok;
  $('k-fail').textContent = s.fail;
  $('k-qps').textContent = elapsed ? (s.sent / (elapsed / 1000)).toFixed(1) : '0';
  $('k-p50').textContent = s.p50 + ' ms';
  $('k-p95').textContent = s.p95 + ' ms';
  $('k-p99').textContent = s.p99 + ' ms';
  $('k-max').textContent = s.max + ' ms';

  latHistory.push({ t: Math.round(elapsed / 1000), p50: s.p50, p95: s.p95, p99: s.p99 });
  if (latHistory.length > 200) latHistory.shift();
  renderChart();

  fillTable('tbl-status', Object.entries(s.statusCodes).sort((a, b) => b[1] - a[1]));
  fillTable('tbl-err', Object.entries(s.errors).sort((a, b) => b[1] - a[1]));
}

function renderChart() {
  const labels = latHistory.map(p => p.t + 's');
  const ds = (key, color) => ({ label: key, data: latHistory.map(p => p[key]), borderColor: color, backgroundColor: color + '33', tension: 0.25, fill: false });
  if (!latChart) {
    latChart = new Chart($('chart-lat'), {
      type: 'line',
      data: { labels, datasets: [ds('p50', '#0284c7'), ds('p95', '#d97706'), ds('p99', '#dc2626')] },
      options: { responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { position: 'top' } }, scales: { y: { title: { display: true, text: 'ms' } } } },
    });
  } else {
    latChart.data.labels = labels;
    latChart.data.datasets[0].data = latHistory.map(p => p.p50);
    latChart.data.datasets[1].data = latHistory.map(p => p.p95);
    latChart.data.datasets[2].data = latHistory.map(p => p.p99);
    latChart.update('none');
  }
}

function fillTable(id, pairs) {
  $(id).querySelector('tbody').innerHTML = pairs.length
    ? pairs.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${v}</td></tr>`).join('')
    : '<tr><td colspan="2" class="muted">无</td></tr>';
}
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
