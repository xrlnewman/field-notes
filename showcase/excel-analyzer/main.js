const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
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

ipcMain.handle('pick-file', async () => {
  const res = await dialog.showOpenDialog({
    title: 'Select an Excel file',
    properties: ['openFile'],
    filters: [{ name: 'Excel / CSV', extensions: ['xlsx', 'xls', 'xlsm', 'csv'] }],
  });
  if (res.canceled || !res.filePaths[0]) return null;
  const filePath = res.filePaths[0];
  const buffer = fs.readFileSync(filePath);
  return { filePath, name: path.basename(filePath), buffer: buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) };
});

ipcMain.handle('read-dropped', async (_evt, filePath) => {
  const buffer = fs.readFileSync(filePath);
  return { filePath, name: path.basename(filePath), buffer: buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) };
});
