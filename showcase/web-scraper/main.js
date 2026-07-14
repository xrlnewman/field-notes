const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fsp = require('fs').promises;
const fs = require('fs');
const {
  isAllowedGuestUrl,
  normalizeRulesetName,
  parseHttpUrl,
  secureWebviewPreferences,
} = require('./lib/security');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400, height: 900,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, webviewTag: true },
  });
  win.setMenuBarVisibility(false);
  win.webContents.on('will-attach-webview', (event, webPreferences, params) => {
    secureWebviewPreferences(webPreferences);
    if (!isAllowedGuestUrl(params.src)) event.preventDefault();
  });
  win.webContents.on('did-attach-webview', (_event, guest) => {
    guest.setWindowOpenHandler(() => ({ action: 'deny' }));
    const guardNavigation = (details) => {
      if (!isAllowedGuestUrl(details?.url)) details.preventDefault();
    };
    guest.on('will-navigate', guardNavigation);
    guest.on('will-redirect', guardNavigation);
  });
  win.webContents.session.setPermissionCheckHandler(() => false);
  win.webContents.session.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}
app.whenReady().then(() => { createWindow(); app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); }); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

const RULES_DIR = path.join(app.getPath('userData'), 'rules');

ipcMain.handle('save-file', async (_e, opts) => { const r = await dialog.showSaveDialog({ defaultPath: opts.defaultPath, filters: opts.filters }); return r.canceled ? null : r.filePath; });
ipcMain.handle('write-file', async (_e, p, ab) => fsp.writeFile(p, Buffer.from(ab)));

ipcMain.handle('save-ruleset', async (_e, name, json) => {
  const safe = normalizeRulesetName(name);
  await fsp.mkdir(RULES_DIR, { recursive: true });
  await fsp.writeFile(path.join(RULES_DIR, safe + '.json'), json);
  return safe;
});
ipcMain.handle('load-ruleset', async (_e, name) => {
  const safe = normalizeRulesetName(name);
  return fsp.readFile(path.join(RULES_DIR, safe + '.json'), 'utf-8');
});
ipcMain.handle('list-rulesets', async () => {
  try {
    const entries = await fsp.readdir(RULES_DIR);
    return entries.filter(e => e.endsWith('.json')).map(e => e.replace(/\.json$/, ''));
  } catch { return []; }
});
ipcMain.handle('delete-ruleset', async (_e, name) => {
  const safe = normalizeRulesetName(name);
  try { await fsp.unlink(path.join(RULES_DIR, safe + '.json')); return true; } catch { return false; }
});

// 获取当前 webview 的 cookies
ipcMain.handle('get-cookies', async (_e, url) => {
  const ses = require('electron').session.defaultSession;
  const parsed = parseHttpUrl(url);
  return ses.cookies.get({ url: parsed.href });
});
