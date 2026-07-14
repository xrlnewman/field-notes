(function exposeScrapeRuntime(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.WebScraperRuntime = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createScrapeRuntime() {
  function scrapeDocument(rules, activeDocument) {
    const doc = activeDocument || document;
    const items = [];
    const list = doc.querySelectorAll(rules.listSel || 'body');
    list.forEach((el) => {
      const item = {};
      for (const field of rules.fields) {
        if (field.extract === 'attr' && !String(field.attr || '').trim()) {
          throw new TypeError(`字段“${field.name || '未命名'}”缺少属性名`);
        }
        const sub = el.querySelector(field.sel);
        if (!sub) {
          item[field.name] = null;
        } else if (field.extract === 'html') {
          item[field.name] = sub.innerHTML;
        } else if (field.extract === 'href') {
          item[field.name] = sub.getAttribute('href');
        } else if (field.extract === 'src') {
          item[field.name] = sub.getAttribute('src');
        } else if (field.extract === 'attr') {
          item[field.name] = sub.getAttribute(field.attr);
        } else {
          item[field.name] = (sub.innerText || sub.textContent || '').trim();
        }
      }
      items.push(item);
    });
    return items;
  }

  function buildScrapeScript(rules) {
    return `(${scrapeDocument.toString()})(${JSON.stringify(rules)})`;
  }

  return { buildScrapeScript, scrapeDocument };
}));
