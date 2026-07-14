import * as pdfjs from '../../../node_modules/pdfjs-dist/build/pdf.min.mjs';
pdfjs.GlobalWorkerOptions.workerSrc = '../../../node_modules/pdfjs-dist/build/pdf.worker.min.mjs';

const { PDFDocument, rgb, degrees, StandardFonts } = PDFLib;

const $ = id => document.getElementById(id);
const logEl = $('log');
const log = (msg, cls = '') => {
  const line = document.createElement('div');
  if (cls) line.className = cls;
  line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  logEl.appendChild(line);
  logEl.scrollTop = logEl.scrollHeight;
};

// tabs
document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x === t));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.dataset.panel === t.dataset.tab));
}));

// ---------- merge ----------
let mergeFiles = [];
$('m-add').onclick = async () => {
  const files = await window.api.pickFiles({ multi: true, filters: [{ name: 'PDF', extensions: ['pdf'] }], title: '选择 PDF（可多选）' });
  mergeFiles.push(...files);
  renderMergeList();
};
$('m-clear').onclick = () => { mergeFiles = []; renderMergeList(); };
$('m-run').onclick = async () => {
  if (mergeFiles.length < 2) return log('至少选 2 个 PDF', 'err');
  const out = await window.api.saveFile({ title: '保存合并 PDF', defaultPath: 'merged.pdf', filters: [{ name: 'PDF', extensions: ['pdf'] }] });
  if (!out) return;
  try {
    const merged = await PDFDocument.create();
    for (const f of mergeFiles) {
      const buf = await window.api.readFile(f.path);
      const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
      const pages = await merged.copyPages(doc, doc.getPageIndices());
      pages.forEach(p => merged.addPage(p));
      log(`已合并: ${f.name} (${doc.getPageCount()} 页)`, 'info');
    }
    const bytes = await merged.save();
    await window.api.writeFile(out, bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
    log(`✓ 合并完成 → ${out}`, 'ok');
    window.api.showInFolder(out);
  } catch (e) { log('合并失败: ' + e.message, 'err'); }
};
function renderMergeList() {
  $('m-list').innerHTML = mergeFiles.map((f, i) =>
    `<li><span class="name">${i + 1}. ${escapeHtml(f.name)}</span><span class="size">${fmtSize(f.size)}</span>
      <div class="actions">
        <button class="secondary" data-act="up" data-i="${i}">↑</button>
        <button class="secondary" data-act="down" data-i="${i}">↓</button>
        <button class="danger" data-act="del" data-i="${i}">删</button>
      </div></li>`).join('');
}
$('m-list').addEventListener('click', e => {
  const btn = e.target.closest('button[data-act]');
  if (!btn) return;
  const i = +btn.dataset.i;
  if (btn.dataset.act === 'del') mergeFiles.splice(i, 1);
  else if (btn.dataset.act === 'up' && i > 0) [mergeFiles[i], mergeFiles[i - 1]] = [mergeFiles[i - 1], mergeFiles[i]];
  else if (btn.dataset.act === 'down' && i < mergeFiles.length - 1) [mergeFiles[i], mergeFiles[i + 1]] = [mergeFiles[i + 1], mergeFiles[i]];
  renderMergeList();
});

// ---------- split ----------
let splitFile = null;
$('s-pick').onclick = async () => {
  const fs = await window.api.pickFiles({ filters: [{ name: 'PDF', extensions: ['pdf'] }] });
  splitFile = fs[0]; if (splitFile) $('s-file').textContent = splitFile.name + ' (' + fmtSize(splitFile.size) + ')';
};
$('s-run').onclick = async () => {
  if (!splitFile) return log('未选 PDF', 'err');
  const outDir = await window.api.pickDir({ title: '选择输出目录' });
  if (!outDir) return;
  const step = Math.max(1, +$('s-step').value || 1);
  try {
    const buf = await window.api.readFile(splitFile.path);
    const src = await PDFDocument.load(buf, { ignoreEncryption: true });
    const total = src.getPageCount();
    const baseName = splitFile.name.replace(/\.pdf$/i, '');
    let part = 0;
    for (let start = 0; start < total; start += step) {
      const end = Math.min(start + step, total);
      const doc = await PDFDocument.create();
      const idxs = Array.from({ length: end - start }, (_, k) => start + k);
      const pages = await doc.copyPages(src, idxs);
      pages.forEach(p => doc.addPage(p));
      const bytes = await doc.save();
      const outPath = await window.api.pathJoin(outDir, `${baseName}_p${start + 1}-${end}.pdf`);
      await window.api.writeFile(outPath, bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
      part++;
      log(`✓ 第 ${part} 份 (${start + 1}-${end}) → ${outPath}`, 'ok');
    }
    log(`完成，共 ${part} 份`, 'ok');
    window.api.openPath(outDir);
  } catch (e) { log('拆分失败: ' + e.message, 'err'); }
};

// ---------- extract ----------
let extractFile = null;
$('e-pick').onclick = async () => {
  const fs = await window.api.pickFiles({ filters: [{ name: 'PDF', extensions: ['pdf'] }] });
  extractFile = fs[0]; if (extractFile) $('e-file').textContent = extractFile.name;
};
$('e-run').onclick = async () => {
  if (!extractFile) return log('未选 PDF', 'err');
  const out = await window.api.saveFile({ title: '保存提取的 PDF', defaultPath: 'extracted.pdf', filters: [{ name: 'PDF', extensions: ['pdf'] }] });
  if (!out) return;
  try {
    const buf = await window.api.readFile(extractFile.path);
    const src = await PDFDocument.load(buf, { ignoreEncryption: true });
    const total = src.getPageCount();
    const idxs = parseRange($('e-range').value, total);
    if (!idxs.length) return log('页范围无效', 'err');
    const doc = await PDFDocument.create();
    const pages = await doc.copyPages(src, idxs);
    pages.forEach(p => doc.addPage(p));
    const bytes = await doc.save();
    await window.api.writeFile(out, bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
    log(`✓ 提取 ${idxs.length} 页 → ${out}`, 'ok');
    window.api.showInFolder(out);
  } catch (e) { log('提取失败: ' + e.message, 'err'); }
};

// ---------- watermark ----------
let watermarkFiles = [];
$('w-pick').onclick = async () => {
  watermarkFiles = await window.api.pickFiles({ multi: true, filters: [{ name: 'PDF', extensions: ['pdf'] }] });
  $('w-files').textContent = watermarkFiles.length ? `已选 ${watermarkFiles.length} 个` : '未选择';
};
$('w-run').onclick = async () => {
  if (!watermarkFiles.length) return log('未选 PDF', 'err');
  const outDir = await window.api.pickDir({ title: '输出目录' });
  if (!outDir) return;
  const text = $('w-text').value || 'WATERMARK';
  const size = +$('w-size').value || 60;
  const opacity = parseFloat($('w-opacity').value) || 0.3;
  const rotate = +$('w-rotate').value || 0;
  for (const f of watermarkFiles) {
    try {
      const buf = await window.api.readFile(f.path);
      const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      for (const page of doc.getPages()) {
        const { width, height } = page.getSize();
        const tw = font.widthOfTextAtSize(text, size);
        page.drawText(text, {
          x: width / 2 - tw / 2,
          y: height / 2,
          size, font, color: rgb(0.85, 0.1, 0.1), opacity, rotate: degrees(rotate),
        });
      }
      const bytes = await doc.save();
      const outPath = await window.api.pathJoin(outDir, f.name.replace(/\.pdf$/i, '_watermarked.pdf'));
      await window.api.writeFile(outPath, bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
      log(`✓ ${f.name} → ${outPath}`, 'ok');
    } catch (e) { log(`✗ ${f.name}: ${e.message}`, 'err'); }
  }
  window.api.openPath(outDir);
};

// ---------- to image ----------
let imgFile = null;
$('i-pick').onclick = async () => {
  const fs = await window.api.pickFiles({ filters: [{ name: 'PDF', extensions: ['pdf'] }] });
  imgFile = fs[0]; if (imgFile) $('i-file').textContent = imgFile.name;
};
$('i-run').onclick = async () => {
  if (!imgFile) return log('未选 PDF', 'err');
  const outDir = await window.api.pickDir({ title: '输出目录' });
  if (!outDir) return;
  const scale = parseFloat($('i-scale').value) || 2;
  const format = $('i-format').value;
  const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  try {
    const buf = await window.api.readFile(imgFile.path);
    const doc = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
    const baseName = imgFile.name.replace(/\.pdf$/i, '');
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width; canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      const blob = await new Promise(r => canvas.toBlob(r, mime, 0.92));
      const ab = await blob.arrayBuffer();
      const outPath = await window.api.pathJoin(outDir, `${baseName}_p${String(p).padStart(3, '0')}.${format}`);
      await window.api.writeFile(outPath, ab);
      log(`✓ 第 ${p}/${doc.numPages} 页`, 'ok');
    }
    log('完成', 'ok');
    window.api.openPath(outDir);
  } catch (e) { log('转换失败: ' + e.message, 'err'); }
};

// utils
function parseRange(s, total) {
  const out = new Set();
  for (const part of String(s || '').split(',')) {
    const m = part.trim().match(/^(\d+)(?:-(\d+))?$/);
    if (!m) continue;
    const a = +m[1], b = +(m[2] ?? m[1]);
    for (let i = Math.max(1, a); i <= Math.min(total, b); i++) out.add(i - 1);
  }
  return [...out].sort((a, b) => a - b);
}
function fmtSize(n) { const u = ['B', 'KB', 'MB', 'GB']; let i = 0; while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; } return n.toFixed(i ? 1 : 0) + ' ' + u[i]; }
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
