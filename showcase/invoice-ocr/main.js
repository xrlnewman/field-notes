const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const fsp = fs.promises;

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 880,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ---------- IPC: file system ----------

ipcMain.handle('pick-files', async (_e, opts = {}) => {
  const res = await dialog.showOpenDialog({
    title: opts.title || '选择文件',
    properties: ['openFile', ...(opts.multi ? ['multiSelections'] : [])],
    filters: opts.filters || [{ name: 'All', extensions: ['*'] }],
  });
  if (res.canceled) return [];
  return Promise.all(res.filePaths.map(async fp => ({
    path: fp,
    name: path.basename(fp),
    size: (await fsp.stat(fp)).size,
  })));
});

ipcMain.handle('pick-dir', async (_e, opts = {}) => {
  const res = await dialog.showOpenDialog({
    title: opts.title || '选择文件夹',
    properties: ['openDirectory'],
  });
  if (res.canceled) return null;
  return res.filePaths[0];
});

ipcMain.handle('save-file', async (_e, opts = {}) => {
  const res = await dialog.showSaveDialog({
    title: opts.title || '保存到',
    defaultPath: opts.defaultPath,
    filters: opts.filters || [{ name: 'All', extensions: ['*'] }],
  });
  if (res.canceled) return null;
  return res.filePath;
});

ipcMain.handle('read-file', async (_e, filePath) => {
  const buf = await fsp.readFile(filePath);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
});

ipcMain.handle('read-text', async (_e, filePath, encoding) => {
  return fsp.readFile(filePath, encoding || 'utf-8');
});

ipcMain.handle('write-file', async (_e, filePath, arrayBuffer) => {
  await fsp.writeFile(filePath, Buffer.from(arrayBuffer));
  return filePath;
});

ipcMain.handle('list-dir', async (_e, dirPath, recursive = false) => {
  async function walk(d) {
    const entries = await fsp.readdir(d, { withFileTypes: true });
    const out = [];
    for (const ent of entries) {
      const p = path.join(d, ent.name);
      if (ent.isDirectory()) {
        if (recursive) out.push(...(await walk(p)));
      } else {
        const stat = await fsp.stat(p);
        out.push({ path: p, name: ent.name, size: stat.size, mtime: stat.mtime.toISOString() });
      }
    }
    return out;
  }
  return walk(dirPath);
});

ipcMain.handle('rename-file', async (_e, fromPath, toPath) => {
  await fsp.mkdir(path.dirname(toPath), { recursive: true });
  await fsp.rename(fromPath, toPath);
  return toPath;
});

ipcMain.handle('open-path', async (_e, p) => shell.openPath(p));
ipcMain.handle('show-in-folder', async (_e, p) => shell.showItemInFolder(p));

ipcMain.handle('path-join', (_e, ...parts) => path.join(...parts));
ipcMain.handle('path-parse', (_e, p) => path.parse(p));
