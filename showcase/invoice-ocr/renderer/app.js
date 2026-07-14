const $ = id => document.getElementById(id);
const logEl = $('log');
const log = (m, c = '') => { const d = document.createElement('div'); if (c) d.className = c; d.textContent = `[${new Date().toLocaleTimeString()}] ${m}`; logEl.appendChild(d); logEl.scrollTop = logEl.scrollHeight; };

let files = [];
let results = [];

$('add-btn').onclick = async () => {
  const fs = await window.api.pickFiles({ multi: true, filters: [{ name: 'Image', extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp'] }] });
  files.push(...fs);
  render();
};
$('clear-btn').onclick = () => { files = []; results = []; render(); renderResults(); };
function render() {
  $('count').textContent = `${files.length} 张`;
  $('file-list').innerHTML = files.map((f, i) => `<li><span class="name">${esc(f.name)}</span><span class="size">${fmtSize(f.size)}</span><div class="actions"><button class="danger" data-i="${i}">删</button></div></li>`).join('');
}
$('file-list').addEventListener('click', e => { const b = e.target.closest('button[data-i]'); if (b) { files.splice(+b.dataset.i, 1); render(); } });

$('run-btn').onclick = async () => {
  if (!files.length) return log('未添加图片', 'err');
  const lang = $('lang').value;
  log(`初始化 tesseract worker (lang=${lang})…`, 'info');
  const worker = await Tesseract.createWorker(lang, undefined, {
    logger: m => { if (m.status === 'recognizing text') $('progress').textContent = `${Math.round(m.progress * 100)}%`; },
  });
  results = [];
  for (let i = 0; i < files.length; i++) {
    log(`识别 ${i + 1}/${files.length}: ${files[i].name}`, 'info');
    try {
      const buf = await window.api.readFile(files[i].path);
      const blob = new Blob([buf]);
      const url = URL.createObjectURL(blob);
      const { data: { text } } = await worker.recognize(url);
      URL.revokeObjectURL(url);
      const extracted = extractFields(text);
      results.push({ file: files[i].name, ...extracted, fullText: text });
      renderResults();
    } catch (e) { log(`✗ ${files[i].name}: ${e.message}`, 'err'); }
  }
  await worker.terminate();
  log(`完成 ${results.length}/${files.length}`, 'ok');
  $('export-btn').disabled = !results.length;
};

function extractFields(text) {
  function tryRules(rules) {
    for (const r of rules) {
      const m = text.match(r.re);
      if (m && m[1]) return { value: m[1].trim(), confidence: r.conf };
    }
    return { value: '', confidence: 0 };
  }
  const amount = tryRules([
    { re: /价税合计[^\d¥￥]{0,8}[¥￥]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})|\d+\.\d{2})/, conf: 95 },
    { re: /(?:合计|总计|small\s*total)[^\d¥￥]{0,8}[¥￥]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})|\d+\.\d{2})/i, conf: 80 },
    { re: /[¥￥]\s*(\d{1,3}(?:,\d{3})*\.\d{2})/, conf: 60 },
    { re: /(\d{1,8}\.\d{2})/, conf: 35 },
  ]);
  const date = tryRules([
    { re: /(\d{4}\s*年\s*\d{1,2}\s*月\s*\d{1,2}\s*日)/, conf: 95 },
    { re: /(\d{4}[-/]\d{1,2}[-/]\d{1,2})/, conf: 85 },
    { re: /(20\d{2}\d{2}\d{2})/, conf: 50 },
  ]);
  const invoiceNo = tryRules([
    { re: /发票号码[:：\s]*(\d{8,20})/, conf: 95 },
    { re: /号\s*码[:：\s]*(\d{8,20})/, conf: 80 },
    { re: /invoice\s*no\.?[:：\s]*([0-9A-Z]{6,20})/i, conf: 75 },
    { re: /No\.?\s*(\d{8,20})/i, conf: 50 },
  ]);
  const title = tryRules([
    { re: /购买方\s*(?:名\s*称)?[:：\s]*([^\n\r]{2,40})/, conf: 90 },
    { re: /抬头[:：\s]*([^\n\r]{2,40})/, conf: 80 },
    { re: /名\s*称[:：\s]*([^\n\r]{2,40})/, conf: 50 },
  ]);
  const taxId = tryRules([
    { re: /纳税人识别号[:：\s]*([0-9A-Z]{15,20})/, conf: 95 },
    { re: /税号[:：\s]*([0-9A-Z]{15,20})/, conf: 85 },
    { re: /\b([0-9A-Z]{18})\b/, conf: 40 },
  ]);
  const category = classifyCategory(text);
  return {
    amount: amount.value, date: date.value, invoiceNo: invoiceNo.value,
    title: title.value, taxId: taxId.value, category,
    confidence: { amount: amount.confidence, date: date.confidence, invoiceNo: invoiceNo.confidence, title: title.confidence, taxId: taxId.confidence },
  };
}

function classifyCategory(text) {
  const rules = [
    { kw: /餐饮|餐费|饭店|酒楼|食堂|奶茶|咖啡/, cat: '餐饮' },
    { kw: /出租|滴滴|地铁|公交|火车|高铁|机票|加油/, cat: '交通' },
    { kw: /酒店|宾馆|住宿/, cat: '住宿' },
    { kw: /办公|文具|耗材|打印/, cat: '办公' },
    { kw: /话费|流量|电费|水费|网费/, cat: '通讯/水电' },
    { kw: /培训|教材|教育/, cat: '培训' },
  ];
  for (const r of rules) if (r.kw.test(text)) return r.cat;
  return '其他';
}

function renderResults() {
  const tbody = $('result-table').querySelector('tbody');
  tbody.innerHTML = results.map((r, idx) => {
    const cell = (field, val) => {
      const conf = r.confidence?.[field] ?? 0;
      const color = conf >= 80 ? '#dcfce7' : conf >= 50 ? '#fef3c7' : conf > 0 ? '#fee2e2' : '#f1f5f9';
      return `<td contenteditable="true" data-idx="${idx}" data-field="${field}" style="background:${color}" title="置信度 ${conf}">${esc(val)}</td>`;
    };
    return `<tr><td>${esc(r.file)}</td>${cell('amount', r.amount)}${cell('date', r.date)}${cell('invoiceNo', r.invoiceNo)}${cell('title', r.title)}${cell('taxId', r.taxId)}<td contenteditable="true" data-idx="${idx}" data-field="category">${esc(r.category)}</td><td><button class="secondary" data-idx="${idx}" data-show="full">原文</button></td></tr>`;
  }).join('');
  tbody.querySelectorAll('td[contenteditable]').forEach(td => {
    td.addEventListener('blur', () => {
      const idx = +td.dataset.idx, field = td.dataset.field;
      results[idx][field] = td.textContent.trim();
    });
  });
  tbody.querySelectorAll('button[data-show="full"]').forEach(b => {
    b.onclick = () => {
      const r = results[+b.dataset.idx];
      const w = window.open('', '_blank', 'width=600,height=400');
      w.document.body.innerHTML = `<pre style="font-family:ui-monospace,Consolas,monospace;white-space:pre-wrap">${esc(r.fullText || '')}</pre>`;
    };
  });
}

$('export-btn').onclick = async () => {
  const out = await window.api.saveFile({ defaultPath: '发票识别.xlsx', filters: [{ name: 'Excel', extensions: ['xlsx'] }] });
  if (!out) return;
  const wb = XLSX.utils.book_new();
  const rows = results.map(r => ({ 文件: r.file, 金额: r.amount, 日期: r.date, 发票号: r.invoiceNo, 抬头: r.title, 税号: r.taxId, 归类: r.category }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), '识别结果');
  const fullSheet = XLSX.utils.json_to_sheet(results.map(r => ({ 文件: r.file, OCR全文: r.fullText })));
  XLSX.utils.book_append_sheet(wb, fullSheet, 'OCR 全文');
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  await window.api.writeFile(out, buf);
  log('✓ ' + out, 'ok');
  window.api.showInFolder(out);
};

function fmtSize(n) { const u = ['B', 'KB', 'MB']; let i = 0; while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; } return n.toFixed(i ? 1 : 0) + ' ' + u[i]; }
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
