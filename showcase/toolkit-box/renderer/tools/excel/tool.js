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

async function loadSheet(filePath) {
  const buf = await window.api.readFile(filePath);
  const wb = XLSX.read(buf, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: null });
  const cols = rows.length ? Object.keys(rows[0]) : [];
  return { rows, cols, sheetName: wb.SheetNames[0] };
}
function fillSelect(sel, cols) {
  sel.innerHTML = cols.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
}

// ---------- JOIN ----------
let jA = null, jB = null;
$('j-pick-a').onclick = async () => {
  const fs = await window.api.pickFiles({ filters: [{ name: 'Excel', extensions: ['xlsx', 'xls', 'csv'] }] });
  if (!fs[0]) return;
  jA = { ...fs[0], ...(await loadSheet(fs[0].path)) };
  $('j-file-a').textContent = `${jA.name} (${jA.rows.length} 行)`;
  fillSelect($('j-key-a'), jA.cols);
};
$('j-pick-b').onclick = async () => {
  const fs = await window.api.pickFiles({ filters: [{ name: 'Excel', extensions: ['xlsx', 'xls', 'csv'] }] });
  if (!fs[0]) return;
  jB = { ...fs[0], ...(await loadSheet(fs[0].path)) };
  $('j-file-b').textContent = `${jB.name} (${jB.rows.length} 行)`;
  fillSelect($('j-key-b'), jB.cols);
};
$('j-run').onclick = async () => {
  if (!jA || !jB) return log('请先选两个 Excel', 'err');
  const keyA = $('j-key-a').value, keyB = $('j-key-b').value;
  const type = $('j-type').value;
  const out = await window.api.saveFile({ defaultPath: 'joined.xlsx', filters: [{ name: 'Excel', extensions: ['xlsx'] }] });
  if (!out) return;
  try {
    const mapB = new Map();
    jB.rows.forEach(r => mapB.set(normalizeKey(r[keyB]), r));
    const seenB = new Set();
    const merged = [];
    for (const a of jA.rows) {
      const k = normalizeKey(a[keyA]);
      const b = mapB.get(k);
      if (b) {
        seenB.add(k);
        merged.push(combine(a, b, jA.cols, jB.cols, keyB));
      } else if (type !== 'inner') {
        merged.push(combine(a, null, jA.cols, jB.cols, keyB));
      }
    }
    if (type === 'outer') {
      for (const b of jB.rows) {
        const k = normalizeKey(b[keyB]);
        if (!seenB.has(k)) merged.push(combine(null, b, jA.cols, jB.cols, keyB, keyA));
      }
    }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(merged), 'merged');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    await window.api.writeFile(out, buf);
    log(`✓ Join 完成，输出 ${merged.length} 行 → ${out}`, 'ok');
    window.api.showInFolder(out);
  } catch (e) { log('Join 失败: ' + e.message, 'err'); }
};
function combine(a, b, colsA, colsB, keyB, keyA) {
  const r = {};
  for (const c of colsA) r[c] = a ? a[c] : null;
  for (const c of colsB) {
    if (c === keyB || c === keyA) continue;
    const target = colsA.includes(c) ? `${c}_b` : c;
    r[target] = b ? b[c] : null;
  }
  return r;
}

// ---------- DIFF ----------
let dA = null, dB = null;
$('d-pick-a').onclick = async () => {
  const fs = await window.api.pickFiles({ filters: [{ name: 'Excel', extensions: ['xlsx', 'xls', 'csv'] }] });
  if (!fs[0]) return;
  dA = { ...fs[0], ...(await loadSheet(fs[0].path)) };
  $('d-file-a').textContent = `${dA.name} (${dA.rows.length} 行)`;
  refreshDiffKey();
};
$('d-pick-b').onclick = async () => {
  const fs = await window.api.pickFiles({ filters: [{ name: 'Excel', extensions: ['xlsx', 'xls', 'csv'] }] });
  if (!fs[0]) return;
  dB = { ...fs[0], ...(await loadSheet(fs[0].path)) };
  $('d-file-b').textContent = `${dB.name} (${dB.rows.length} 行)`;
  refreshDiffKey();
};
function refreshDiffKey() {
  if (!dA || !dB) return;
  const common = dA.cols.filter(c => dB.cols.includes(c));
  fillSelect($('d-key'), common);
}
$('d-run').onclick = async () => {
  if (!dA || !dB) return log('请先选两个 Excel', 'err');
  const key = $('d-key').value;
  if (!key) return log('未选主键列', 'err');
  const out = await window.api.saveFile({ defaultPath: 'diff.xlsx', filters: [{ name: 'Excel', extensions: ['xlsx'] }] });
  if (!out) return;
  try {
    const mapA = new Map(dA.rows.map(r => [normalizeKey(r[key]), r]));
    const mapB = new Map(dB.rows.map(r => [normalizeKey(r[key]), r]));
    const onlyA = [], onlyB = [], changed = [];
    for (const [k, a] of mapA) {
      const b = mapB.get(k);
      if (!b) { onlyA.push(a); continue; }
      const diffs = {};
      let has = false;
      for (const c of dA.cols) {
        if (c === key) continue;
        const va = a[c], vb = b[c];
        if (String(va ?? '') !== String(vb ?? '')) { diffs[`${c} (A)`] = va; diffs[`${c} (B)`] = vb; has = true; }
      }
      if (has) changed.push({ [key]: a[key], ...diffs });
    }
    for (const [k, b] of mapB) if (!mapA.has(k)) onlyB.push(b);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(onlyA), '仅A有');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(onlyB), '仅B有');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(changed), '值不同');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    await window.api.writeFile(out, buf);
    log(`✓ 仅 A: ${onlyA.length}，仅 B: ${onlyB.length}，值不同: ${changed.length} → ${out}`, 'ok');
    window.api.showInFolder(out);
  } catch (e) { log('对比失败: ' + e.message, 'err'); }
};

// ---------- SPLIT ----------
let xSrc = null;
$('x-pick').onclick = async () => {
  const fs = await window.api.pickFiles({ filters: [{ name: 'Excel', extensions: ['xlsx', 'xls', 'csv'] }] });
  if (!fs[0]) return;
  xSrc = { ...fs[0], ...(await loadSheet(fs[0].path)) };
  $('x-file').textContent = `${xSrc.name} (${xSrc.rows.length} 行)`;
  fillSelect($('x-key'), xSrc.cols);
};
$('x-run').onclick = async () => {
  if (!xSrc) return log('未选源表', 'err');
  const key = $('x-key').value;
  const mode = $('x-mode').value;
  try {
    const groups = new Map();
    for (const r of xSrc.rows) {
      const k = sanitize(r[key]);
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(r);
    }
    log(`分成 ${groups.size} 组`, 'info');
    if (mode === 'sheets') {
      const out = await window.api.saveFile({ defaultPath: xSrc.name.replace(/\.[^.]+$/, '_split.xlsx'), filters: [{ name: 'Excel', extensions: ['xlsx'] }] });
      if (!out) return;
      const wb = XLSX.utils.book_new();
      for (const [k, rows] of groups) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), truncateSheetName(k));
      }
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      await window.api.writeFile(out, buf);
      log(`✓ ${groups.size} 个 sheet → ${out}`, 'ok');
      window.api.showInFolder(out);
    } else {
      const dir = await window.api.pickDir({ title: '输出目录' });
      if (!dir) return;
      let i = 0;
      for (const [k, rows] of groups) {
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'data');
        const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const out = await window.api.pathJoin(dir, `${sanitize(k)}.xlsx`);
        await window.api.writeFile(out, buf);
        log(`✓ ${++i}/${groups.size} ${out}`, 'ok');
      }
      window.api.openPath(dir);
    }
  } catch (e) { log('拆分失败: ' + e.message, 'err'); }
};

// utils
function normalizeKey(v) { return v == null ? '' : String(v).trim(); }
function sanitize(v) { return String(v ?? 'null').replace(/[\\/:*?"<>|]/g, '_').slice(0, 80); }
function truncateSheetName(v) { return sanitize(v).slice(0, 31) || 'sheet'; }
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
