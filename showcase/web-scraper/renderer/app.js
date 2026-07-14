const $ = id => document.getElementById(id);
const logEl = $('log');
const log = (m, c = '') => { const d = document.createElement('div'); if (c) d.className = c; d.textContent = `[${new Date().toLocaleTimeString()}] ${m}`; logEl.appendChild(d); logEl.scrollTop = logEl.scrollHeight; };

const wv = $('web');
const fieldRules = window.WebScraperFields;
const scrapeRuntime = window.WebScraperRuntime;
const navigation = window.WebScraperUrlPolicy.createSafeNavigation(
  wv,
  error => log('导航失败: ' + error.message, 'err'),
);
let results = [];

function wireFieldRow(row, field = {}) {
  fieldRules.bindFieldRow(row, field);
  row.querySelector('.del-field').onclick = () => row.remove();
}

document.querySelectorAll('.field-row').forEach(row => wireFieldRow(row));

// 初始化规则集列表
(async () => {
  const list = await window.api.listRulesets();
  $('ruleset-select').innerHTML = '<option value="">（无）</option>' + list.map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join('');
})();

$('ruleset-save').onclick = async () => {
  const name = $('ruleset-name').value.trim();
  if (!name) return log('未填规则集名称', 'err');
  try {
    const fields = [...document.querySelectorAll('.field-row')].map(fieldRules.readFieldRow);
    fieldRules.validateFields(fields);
    const ruleset = {
      url: $('url').value,
      listSel: $('list-sel').value,
      fields,
      pageMode: $('page-mode').value,
      nextSel: $('next-sel').value,
      urlTpl: $('url-tpl').value,
      maxPages: $('max-pages').value,
      delay: $('delay').value,
    };
    const saved = await window.api.saveRuleset(name, JSON.stringify(ruleset, null, 2));
    log(`✓ 规则集已保存: ${saved}`, 'ok');
    const list = await window.api.listRulesets();
    $('ruleset-select').innerHTML = '<option value="">（无）</option>' + list.map(n => `<option value="${esc(n)}"${n === saved ? ' selected' : ''}>${esc(n)}</option>`).join('');
  } catch (e) { log('保存失败: ' + e.message, 'err'); }
};

$('ruleset-load').onclick = async () => {
  const name = $('ruleset-select').value;
  if (!name) return;
  try {
    const text = await window.api.loadRuleset(name);
    const r = JSON.parse(text);
    if (r.url) { $('url').value = r.url; navigation.ruleset(r.url); }
    $('list-sel').value = r.listSel || '';
    $('fields').innerHTML = '';
    (r.fields || []).forEach(f => addField(f.name, f.sel, f.extract, f.attr));
    if (!r.fields?.length) addField();
    if (r.pageMode) { $('page-mode').value = r.pageMode; $('page-mode').onchange(); }
    if (r.nextSel) $('next-sel').value = r.nextSel;
    if (r.urlTpl) $('url-tpl').value = r.urlTpl;
    if (r.maxPages) $('max-pages').value = r.maxPages;
    if (r.delay) $('delay').value = r.delay;
    $('ruleset-name').value = name;
    log(`✓ 已加载规则集: ${name}`, 'ok');
  } catch (e) { log('加载失败: ' + e.message, 'err'); }
};

$('ruleset-delete').onclick = async () => {
  const name = $('ruleset-select').value;
  if (!name) return;
  if (!confirm(`确认删除规则集 "${name}"？`)) return;
  try {
    await window.api.deleteRuleset(name);
    const list = await window.api.listRulesets();
    $('ruleset-select').innerHTML = '<option value="">（无）</option>' + list.map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join('');
    log(`已删除 ${name}`, 'ok');
  } catch (e) { log('删除失败: ' + e.message, 'err'); }
};

$('export-cookies').onclick = async () => {
  const url = $('url').value;
  if (!url) return log('未导航', 'err');
  try {
    const cookies = await window.api.getCookies(url);
    const out = await window.api.saveFile({ defaultPath: 'cookies.json', filters: [{ name: 'JSON', extensions: ['json'] }] });
    if (!out) return;
    await window.api.writeFile(out, new TextEncoder().encode(JSON.stringify(cookies, null, 2)).buffer);
    log(`✓ 导出 ${cookies.length} 个 cookie → ${out}`, 'ok');
  } catch (e) { log('失败: ' + e.message, 'err'); }
};

$('go').onclick = () => {
  const url = $('url').value.trim();
  if (!url) return;
  try { navigation.addressBar(url); } catch { /* URL policy 已记录错误 */ }
};
$('back').onclick = () => wv.canGoBack() && wv.goBack();
$('fwd').onclick = () => wv.canGoForward() && wv.goForward();
wv.addEventListener('did-navigate', e => { $('url').value = e.url; });
wv.addEventListener('did-navigate-in-page', e => { $('url').value = e.url; });

$('add-field').onclick = () => addField();
function addField(name = '', sel = '', extract = 'text', attr = '') {
  const row = document.createElement('div');
  row.className = 'field-row';
  row.innerHTML = `<input class="f-name" placeholder="字段名" value="${esc(name)}" />
    <input class="f-sel" placeholder="选择器" value="${esc(sel)}" />
    <select class="f-extract"><option value="text">text</option><option value="html">html</option><option value="href">href</option><option value="src">src</option><option value="attr">attr...</option></select>
    <input class="f-attr" placeholder="属性名，如 data-id" />
    <button class="danger del-field">删</button>`;
  $('fields').appendChild(row);
  wireFieldRow(row, { name, sel, extract, attr });
}

$('page-mode').onchange = () => {
  const m = $('page-mode').value;
  $('next-sel-row').hidden = m !== 'next';
  $('url-tpl-row').hidden = m !== 'url';
};

function readRules() {
  const fields = [...document.querySelectorAll('.field-row')]
    .map(fieldRules.readFieldRow)
    .filter(f => f.name && f.sel);
  fieldRules.validateFields(fields);
  return { listSel: $('list-sel').value.trim(), fields };
}

async function scrapeCurrent() {
  const rules = readRules();
  if (!rules.listSel || !rules.fields.length) throw new Error('请设置 list 选择器和至少一个字段');
  const script = scrapeRuntime.buildScrapeScript(rules);
  return wv.executeJavaScript(script);
}

$('test-btn').onclick = async () => {
  try {
    log('试运行…', 'info');
    const items = await scrapeCurrent();
    results = items;
    renderResults();
    log(`✓ 提取 ${items.length} 条`, 'ok');
  } catch (e) { log('失败: ' + e.message, 'err'); }
};

$('run-btn').onclick = async () => {
  try {
    results = [];
    const mode = $('page-mode').value;
    const maxPages = +$('max-pages').value || 1;
    const delay = +$('delay').value || 1000;
    for (let p = 1; p <= maxPages; p++) {
      log(`第 ${p} 页…`, 'info');
      await new Promise(r => setTimeout(r, delay));
      const items = await scrapeCurrent();
      results.push(...items);
      renderResults();
      log(`  +${items.length} 条 (累计 ${results.length})`, 'ok');
      if (p === maxPages) break;
      if (mode === 'url') {
        const u = $('url-tpl').value.replace('{n}', p + 1);
        await navigation.pageTemplate(u);
      } else if (mode === 'next') {
        const sel = $('next-sel').value;
        const ok = await wv.executeJavaScript(`(function(){const e=document.querySelector(${JSON.stringify(sel)}); if(e){e.click();return true;}return false;})()`);
        if (!ok) { log('  未找到下一页按钮，停止', 'info'); break; }
        await new Promise(r => setTimeout(r, 1500));
      } else { break; }
    }
    $('export-btn').disabled = !results.length;
    log(`总计 ${results.length} 条`, 'ok');
  } catch (e) { log('失败: ' + e.message, 'err'); }
};

function renderResults() {
  $('result-count').textContent = results.length;
  if (!results.length) { $('result-table').innerHTML = '<tr><td class="muted">无</td></tr>'; return; }
  const cols = [...new Set(results.flatMap(r => Object.keys(r)))];
  const head = '<thead><tr>' + cols.map(c => `<th>${esc(c)}</th>`).join('') + '</tr></thead>';
  const body = results.slice(0, 50).map(r => '<tr>' + cols.map(c => `<td>${esc(String(r[c] ?? '')).slice(0, 100)}</td>`).join('') + '</tr>').join('');
  $('result-table').innerHTML = head + '<tbody>' + body + '</tbody>';
}

$('export-btn').onclick = async () => {
  if (!results.length) return;
  const out = await window.api.saveFile({ defaultPath: 'scraped.xlsx', filters: [{ name: 'Excel', extensions: ['xlsx'] }] });
  if (!out) return;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(results), 'data');
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  await window.api.writeFile(out, buf);
  log('✓ ' + out, 'ok');
};

function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
