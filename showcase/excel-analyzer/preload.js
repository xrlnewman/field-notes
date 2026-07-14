const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('api', {
  pickFile: () => ipcRenderer.invoke('pick-file'),
  readDropped: (filePath) => ipcRenderer.invoke('read-dropped', filePath),
  getDroppedPath: (file) => {
    try { return webUtils.getPathForFile(file); } catch { return null; }
  },
});
