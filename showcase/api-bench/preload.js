const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  start: (opts) => ipcRenderer.invoke('bench-start', opts),
  stop: (id) => ipcRenderer.invoke('bench-stop', id),
  onProgress: (cb) => ipcRenderer.on('bench-progress', (_e, data) => cb(data)),
  onDone: (cb) => ipcRenderer.on('bench-done', (_e, data) => cb(data)),
  savePlan: (json) => ipcRenderer.invoke('save-plan', json),
  loadPlan: () => ipcRenderer.invoke('load-plan'),
});
