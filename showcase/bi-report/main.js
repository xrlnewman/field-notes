const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const {
  buildReportSql,
  loadSafeConfigFile,
  saveSafeConfigFile,
} = require('./lib/security');

function createWindow() {
  const win = new BrowserWindow({
    width: 1300, height: 850,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false },
  });
  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}
app.whenReady().then(() => { createWindow(); app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); }); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

const CFG_FILE = path.join(app.getPath('userData'), 'bi-config.json');

ipcMain.handle('load-config', async () => loadSafeConfigFile(CFG_FILE, { conn: null, queries: [] }));
ipcMain.handle('save-config', async (_e, cfg) => { await saveSafeConfigFile(CFG_FILE, cfg); return true; });

ipcMain.handle('save-file', async (_e, opts) => { const r = await dialog.showSaveDialog({ defaultPath: opts.defaultPath, filters: opts.filters }); return r.canceled ? null : r.filePath; });
ipcMain.handle('write-file', async (_e, p, ab) => fsp.writeFile(p, Buffer.from(ab)));

ipcMain.handle('test-conn', async (_e, conn) => {
  try { await runQuery(conn, 'SELECT 1'); return { ok: true }; }
  catch (e) { return { ok: false, error: e.message }; }
});
ipcMain.handle('list-tables', async (_e, conn) => {
  const rows = await runQuery(conn, `SELECT table_name FROM information_schema.tables WHERE table_schema = ?`, [conn.database]);
  return rows.map(r => r.TABLE_NAME || r.table_name);
});
ipcMain.handle('list-columns', async (_e, conn, table) => {
  const rows = await runQuery(conn,
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = ? AND table_name = ? ORDER BY ordinal_position`, [conn.database, table]);
  return rows.map(r => ({ name: r.COLUMN_NAME || r.column_name, type: r.DATA_TYPE || r.data_type }));
});
ipcMain.handle('build-report-sql', async (_e, spec) => buildReportSql(spec));
ipcMain.handle('run-query', async (_e, conn, sql) => runQuery(conn, sql));

async function runQuery(conn, sql, params = []) {
  const mysql = require('mysql2/promise');
  const c = await mysql.createConnection({ host: conn.host, port: +conn.port || 3306, user: conn.user, password: conn.password, database: conn.database });
  try { const [r] = await c.execute(sql, params); return r; }
  finally { await c.end(); }
}
