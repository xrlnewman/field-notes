const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('api', {
  pickFiles: (opts) => ipcRenderer.invoke('pick-files', opts),
  pickDir: (opts) => ipcRenderer.invoke('pick-dir', opts),
  saveFile: (opts) => ipcRenderer.invoke('save-file', opts),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  readText: (filePath, encoding) => ipcRenderer.invoke('read-text', filePath, encoding),
  writeFile: (filePath, arrayBuffer) => ipcRenderer.invoke('write-file', filePath, arrayBuffer),
  listDir: (dirPath, recursive) => ipcRenderer.invoke('list-dir', dirPath, recursive),
  renameFile: (from, to) => ipcRenderer.invoke('rename-file', from, to),
  openPath: (p) => ipcRenderer.invoke('open-path', p),
  showInFolder: (p) => ipcRenderer.invoke('show-in-folder', p),
  pathJoin: (...parts) => ipcRenderer.invoke('path-join', ...parts),
  pathParse: (p) => ipcRenderer.invoke('path-parse', p),
  getDroppedPath: (file) => { try { return webUtils.getPathForFile(file); } catch { return null; } },
});
