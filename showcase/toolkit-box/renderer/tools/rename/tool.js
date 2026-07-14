const $ = id => document.getElementById(id);
const logEl = $('log');
const log = (msg, cls = '') => {
  const line = document.createElement('div');
  if (cls) line.className = cls;
  line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  logEl.appendChild(line);
  logEl.scrollTop = logEl.scrollHeight;
};

document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x === t));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.dataset.panel === t.dataset.tab));
}));

let srcDir = null;
let files = []; // {path, name, mtime}
let preview = []; // {from, to, ok, reason}

$('pick-dir').onclick = async () => {
  const d = await window.api.pickDir({ title: '选择源目录' });
  if (!d) return;
  srcDir = d;
  $('dir-name').textContent = d;
  await rescan();
};
$('recursive').onchange = () => rescan();
async function rescan() {
  if (!srcDir) return;
  files = await window.api.listDir(srcDir, $('recursive').checked);
  $('kpi-total').textContent = files.length;
  $('kpi-matched').textContent = 0;
  preview = []; renderPreview();
}

// mapping Excel
let mapData = null;
$('m-pick').onclick = async () => {
  const fs = await window.api.pickFiles({ filters: [{ name: 'Excel', extensions: ['xlsx', 'xls', 'csv'] }] });
  if (!fs[0]) return;
  const buf = await window.api.readFile(fs[0].path);
  const wb = XLSX.read(buf, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: null });
  const cols = rows.length ? Object.keys(rows[0]) : [];
  mapData = { rows, cols };
  $('m-file').textContent = `${fs[0].name} (${rows.length} 行)`;
  $('m-col-old').innerHTML = cols.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  $('m-col-new').innerHTML = cols.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  if (cols.length >= 2) $('m-col-new').value = cols[1];
};

$('preview-btn').onclick = () => {
  if (!srcDir) return log('未选目录', 'err');
  const activeTab = document.querySelector('.tab.active').dataset.tab;
  preview = [];
  const used = new Set();
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    let newName = null, reason = '';
    try {
      if (activeTab === 'regex') newName = renameByRegex(f.name);
      else if (activeTab === 'mapping') newName = renameByMapping(f.name);
      else if (activeTab === 'pattern') newName = renameByPattern(f, i + 1);
    } catch (e) { reason = e.message; }
    const ok = newName && newName !== f.name && !used.has(newName);
    if (newName && used.has(newName)) reason = '与其它新名冲突';
    if (newName && newName === f.name) reason = '未变';
    if (!newName) reason = reason || '不匹配';
    if (ok) used.add(newName);
    preview.push({ from: f.path, fromName: f.name, to: newName, ok, reason });
  }
  $('kpi-matched').textContent = preview.filter(p => p.ok).length;
  renderPreview();
};

$('apply-btn').onclick = async () => {
  const toRun = preview.filter(p => p.ok);
  if (!toRun.length) return log('没有可执行的项', 'err');
  if (!confirm(`确定要重命名 ${toRun.length} 个文件吗？此操作不可一键撤销。`)) return;
  let ok = 0, fail = 0;
  for (const p of toRun) {
    try {
      const parsed = await window.api.pathParse(p.from);
      const newPath = await window.api.pathJoin(parsed.dir, p.to);
      await window.api.renameFile(p.from, newPath);
      ok++;
    } catch (e) { fail++; log(`✗ ${p.fromName}: ${e.message}`, 'err'); }
  }
  log(`完成 ✓${ok}  ✗${fail}`, fail ? 'err' : 'ok');
  await rescan();
};

function renameByRegex(name) {
  const find = $('r-find').value;
  const repl = $('r-repl').value;
  if (!find) return null;
  const flags = 'g' + ($('r-ci').checked ? 'i' : '');
  const re = new RegExp(find, flags);
  if ($('r-keep-ext').checked) {
    const dot = name.lastIndexOf('.');
    if (dot > 0) {
      const stem = name.slice(0, dot), ext = name.slice(dot);
      if (!re.test(stem)) return null;
      return stem.replace(re, repl) + ext;
    }
  }
  if (!re.test(name)) return null;
  return name.replace(re, repl);
}

function renameByMapping(name) {
  if (!mapData) throw new Error('未加载映射 Excel');
  const oldCol = $('m-col-old').value, newCol = $('m-col-new').value;
  const found = mapData.rows.find(r => String(r[oldCol] ?? '').trim() === name);
  if (!found) return null;
  return String(found[newCol] ?? '').trim() || null;
}

function renameByPattern(file, n) {
  const tpl = $('p-template').value;
  const dot = file.name.lastIndexOf('.');
  const stem = dot > 0 ? file.name.slice(0, dot) : file.name;
  const ext = dot > 0 ? file.name.slice(dot) : '';
  const d = new Date();
  const today = d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate());
  const datetime = today + '-' + pad(d.getHours()) + pad(d.getMinutes());
  const md = file.mtime ? new Date(file.mtime) : d;
  const mdate = md.getFullYear() + pad(md.getMonth() + 1) + pad(md.getDate());
  let out = tpl
    .replace(/\{n(?::(\d+))?\}/g, (_, w) => w ? String(n).padStart(+w, '0') : String(n))
    .replace(/\{name\}/g, stem)
    .replace(/\{ext\}/g, ext.replace(/^\./, ''))
    .replace(/\{date\}/g, today)
    .replace(/\{datetime\}/g, datetime)
    .replace(/\{mdate\}/g, mdate);
  if (!/\.[^.]+$/.test(out) && ext) out += ext;
  return out;
}

function renderPreview() {
  const tbody = document.querySelector('#preview-table tbody');
  tbody.innerHTML = preview.slice(0, 500).map(p =>
    `<tr><td>${escapeHtml(p.fromName)}</td><td>${escapeHtml(p.to || '-')}</td>
      <td>${p.ok ? '<span class="tag" style="background:#dcfce7;color:#166534">OK</span>' : `<span class="muted">${escapeHtml(p.reason)}</span>`}</td></tr>`
  ).join('');
  if (preview.length > 500) tbody.innerHTML += `<tr><td colspan="3" class="muted">…仅显示前 500 行，全部 ${preview.length}</td></tr>`;
}

function pad(n) { return String(n).padStart(2, '0'); }
function escapeHtml(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
