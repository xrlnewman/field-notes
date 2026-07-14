const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  saveFile: (opts) => ipcRenderer.invoke('save-file', opts),
  writeFile: (p, ab) => ipcRenderer.invoke('write-file', p, ab),
  saveRuleset: (name, json) => ipcRenderer.invoke('save-ruleset', name, json),
  loadRuleset: (name) => ipcRenderer.invoke('load-ruleset', name),
  listRulesets: () => ipcRenderer.invoke('list-rulesets'),
  deleteRuleset: (name) => ipcRenderer.invoke('delete-ruleset', name),
  getCookies: (url) => ipcRenderer.invoke('get-cookies', url),
});
