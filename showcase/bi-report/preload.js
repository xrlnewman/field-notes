const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  loadConfig: () => ipcRenderer.invoke('load-config'),
  saveConfig: (cfg) => ipcRenderer.invoke('save-config', cfg),
  testConn: (conn) => ipcRenderer.invoke('test-conn', conn),
  listTables: (conn) => ipcRenderer.invoke('list-tables', conn),
  listColumns: (conn, t) => ipcRenderer.invoke('list-columns', conn, t),
  buildReportSql: (spec) => ipcRenderer.invoke('build-report-sql', spec),
  runQuery: (conn, sql) => ipcRenderer.invoke('run-query', conn, sql),
  saveFile: (opts) => ipcRenderer.invoke('save-file', opts),
  writeFile: (p, ab) => ipcRenderer.invoke('write-file', p, ab),
});
