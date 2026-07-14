const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const {
  buildCountRowsSql,
  buildSampleRowsSql,
  generateMigrationSql,
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

const CFG_DIR = path.join(app.getPath('userData'));
const CFG_FILE = path.join(CFG_DIR, 'connections.json');

ipcMain.handle('save-file', async (_e, opts = {}) => {
  const res = await dialog.showSaveDialog({ title: opts.title || '保存', defaultPath: opts.defaultPath, filters: opts.filters });
  return res.canceled ? null : res.filePath;
});
ipcMain.handle('write-file', async (_e, p, ab) => { await fsp.writeFile(p, Buffer.from(ab)); return p; });

ipcMain.handle('load-config', async () => {
  return loadSafeConfigFile(CFG_FILE, { saved: [] });
});
ipcMain.handle('save-config', async (_e, cfg) => {
  await saveSafeConfigFile(CFG_FILE, cfg);
  return true;
});

ipcMain.handle('test-conn', async (_e, conn) => {
  try { await runQuery(conn, conn.type === 'postgres' ? 'SELECT 1' : 'SELECT 1'); return { ok: true }; }
  catch (e) { return { ok: false, error: e.message }; }
});

ipcMain.handle('list-tables', async (_e, conn) => {
  if (conn.type === 'mysql') {
    return (await runQuery(conn, `SELECT table_name FROM information_schema.tables WHERE table_schema = ? ORDER BY table_name`, [conn.database])).map(r => r.TABLE_NAME || r.table_name);
  } else {
    return (await runQuery(conn, `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`)).map(r => r.table_name);
  }
});

ipcMain.handle('get-table-schema', async (_e, conn, tableName) => {
  if (conn.type === 'mysql') {
    return runQuery(conn,
      `SELECT column_name, column_type, is_nullable, column_default, column_key FROM information_schema.columns
       WHERE table_schema = ? AND table_name = ? ORDER BY ordinal_position`, [conn.database, tableName]);
  } else {
    return runQuery(conn,
      `SELECT column_name, data_type as column_type, is_nullable, column_default FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position`, [tableName]);
  }
});

ipcMain.handle('count-rows', async (_e, conn, tableName) => {
  const r = await runQuery(conn, buildCountRowsSql(conn.type, tableName));
  return Number(r[0].c || r[0].C || r[0].count);
});

ipcMain.handle('sample-rows', async (_e, conn, tableName, limit) => {
  return runQuery(conn, buildSampleRowsSql(conn.type, tableName, limit));
});

ipcMain.handle('generate-migration', async (_e, snapshot) => {
  return generateMigrationSql(snapshot, new Date().toISOString());
});

async function runQuery(conn, sql, params = []) {
  if (conn.type === 'postgres') {
    const { Client } = require('pg');
    const c = new Client({ host: conn.host, port: +conn.port || 5432, user: conn.user, password: conn.password, database: conn.database });
    await c.connect();
    try { const r = await c.query(sql, params); return r.rows; }
    finally { await c.end(); }
  } else {
    const mysql = require('mysql2/promise');
    const c = await mysql.createConnection({ host: conn.host, port: +conn.port || 3306, user: conn.user, password: conn.password, database: conn.database });
    try { const [r] = await c.execute(sql, params); return r; }
    finally { await c.end(); }
  }
}
