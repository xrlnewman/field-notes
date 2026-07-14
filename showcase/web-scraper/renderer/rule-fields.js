(function exposeRuleFields(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.WebScraperFields = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createRuleFields() {
  function syncAttributeInput(row) {
    const extract = row.querySelector('.f-extract');
    const attribute = row.querySelector('.f-attr');
    const enabled = extract.value === 'attr';
    attribute.hidden = !enabled;
    attribute.disabled = !enabled;
  }

  function bindFieldRow(row, field = {}) {
    row.querySelector('.f-name').value = field.name || '';
    row.querySelector('.f-sel').value = field.sel || '';
    row.querySelector('.f-extract').value = field.extract || 'text';
    row.querySelector('.f-attr').value = field.attr || '';
    row.querySelector('.f-extract').onchange = () => syncAttributeInput(row);
    syncAttributeInput(row);
    return row;
  }

  function readFieldRow(row) {
    const extract = row.querySelector('.f-extract').value;
    return {
      name: row.querySelector('.f-name').value.trim(),
      sel: row.querySelector('.f-sel').value.trim(),
      extract,
      attr: extract === 'attr' ? row.querySelector('.f-attr').value.trim() : '',
    };
  }

  function validateFields(fields) {
    for (const field of fields) {
      if (field.extract === 'attr' && !String(field.attr || '').trim()) {
        throw new TypeError(`字段“${field.name || '未命名'}”缺少属性名`);
      }
    }
    return fields;
  }

  return { bindFieldRow, readFieldRow, validateFields };
}));
