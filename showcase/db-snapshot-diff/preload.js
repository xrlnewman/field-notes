const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  loadConfig: () => ipcRenderer.invoke('load-config'),
  saveConfig: (cfg) => ipcRenderer.invoke('save-config', cfg),
  testConn: (conn) => ipcRenderer.invoke('test-conn', conn),
  listTables: (conn) => ipcRenderer.invoke('list-tables', conn),
  getTableSchema: (conn, tbl) => ipcRenderer.invoke('get-table-schema', conn, tbl),
  countRows: (conn, tbl) => ipcRenderer.invoke('count-rows', conn, tbl),
  sampleRows: (conn, tbl, limit) => ipcRenderer.invoke('sample-rows', conn, tbl, limit),
  generateMigration: (snapshot) => ipcRenderer.invoke('generate-migration', snapshot),
  saveFile: (opts) => ipcRenderer.invoke('save-file', opts),
  writeFile: (p, ab) => ipcRenderer.invoke('write-file', p, ab),
});
