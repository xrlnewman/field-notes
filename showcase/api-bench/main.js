const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const http = require('http');
const https = require('https');
const { URL } = require('url');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280, height: 820,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false },
  });
  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}
app.whenReady().then(() => { createWindow(); app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); }); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

const sessions = new Map();

ipcMain.handle('bench-start', async (evt, opts) => {
  const id = String(Date.now()) + Math.random().toString(36).slice(2, 6);
  const ctx = { stop: false };
  sessions.set(id, ctx);
  runBench(id, opts, ctx, evt.sender);
  return id;
});
ipcMain.handle('bench-stop', (_e, id) => {
  const s = sessions.get(id);
  if (s) s.stop = true;
  return true;
});

ipcMain.handle('save-plan', async (_e, planJson) => {
  const res = await dialog.showSaveDialog({ defaultPath: 'plan.json', filters: [{ name: 'JSON', extensions: ['json'] }] });
  if (res.canceled) return null;
  await fsp.writeFile(res.filePath, planJson);
  return res.filePath;
});
ipcMain.handle('load-plan', async () => {
  const res = await dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'JSON', extensions: ['json'] }] });
  if (res.canceled) return null;
  return fsp.readFile(res.filePaths[0], 'utf-8');
});

function runBench(id, opts, ctx, sender) {
  const { mode, scenario, url, method, headers, body, concurrency, durationMs, rps, warmupMs } = opts;
  const startedAt = Date.now();
  const stats = { sent: 0, ok: 0, fail: 0, latencies: [], statusCodes: {}, errors: {}, warmupSent: 0 };

  const reportInterval = setInterval(() => {
    sender.send('bench-progress', { id, stats: snapshot(stats), elapsed: Date.now() - startedAt });
  }, 500);

  function snapshot(s) {
    const lat = s.latencies.slice().sort((a, b) => a - b);
    const p = q => lat.length ? lat[Math.min(lat.length - 1, Math.floor(lat.length * q))] : 0;
    return {
      sent: s.sent, ok: s.ok, fail: s.fail,
      p50: p(0.5), p95: p(0.95), p99: p(0.99),
      avg: lat.length ? lat.reduce((a, b) => a + b, 0) / lat.length : 0,
      max: lat.length ? lat[lat.length - 1] : 0,
      statusCodes: { ...s.statusCodes }, errors: { ...s.errors },
      warmupSent: s.warmupSent,
    };
  }

  function inWarmup() { return warmupMs > 0 && Date.now() - startedAt < warmupMs; }
  function totalMs() { return durationMs + (warmupMs || 0); }

  async function worker() {
    while (!ctx.stop && Date.now() - startedAt < totalMs()) {
      if (rps > 0 && !inWarmup()) {
        const elapsed = (Date.now() - startedAt - (warmupMs || 0)) / 1000;
        const expected = elapsed * rps;
        if (stats.sent >= expected) { await sleep(5); continue; }
      }
      if (mode === 'scenario' && Array.isArray(scenario) && scenario.length) {
        await runScenario();
      } else {
        await doRequest({ method, url, headers, body });
      }
    }
  }

  async function runScenario() {
    const vars = {};
    for (const step of scenario) {
      const url = interpolate(step.url, vars);
      const headers = {};
      Object.entries(step.headers || {}).forEach(([k, v]) => headers[k] = interpolate(v, vars));
      const body = step.body ? interpolate(step.body, vars) : null;
      const result = await doRequest({ method: step.method || 'GET', url, headers, body, returnBody: !!step.capture });
      if (step.capture && result && result.bodyText) {
        try {
          const obj = JSON.parse(result.bodyText);
          for (const [k, path] of Object.entries(step.capture)) {
            vars[k] = jsonpath(obj, path);
          }
        } catch {}
      }
    }
  }

  function doRequest({ method, url, headers, body, returnBody }) {
    return new Promise(resolve => {
      const startReq = Date.now();
      const warmup = inWarmup();
      let u;
      try { u = new URL(url); } catch (e) {
        if (warmup) stats.warmupSent++; else { stats.fail++; stats.errors['Invalid URL'] = (stats.errors['Invalid URL'] || 0) + 1; stats.sent++; }
        return resolve();
      }
      const lib = u.protocol === 'https:' ? https : http;
      const reqOpts = {
        method: method || 'GET', hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: u.pathname + u.search,
        headers: headers || {}, timeout: 30000,
      };
      if (warmup) stats.warmupSent++; else stats.sent++;
      const req = lib.request(reqOpts, res => {
        const chunks = [];
        res.on('data', c => { if (returnBody) chunks.push(c); });
        res.on('end', () => {
          const dur = Date.now() - startReq;
          if (!warmup) {
            stats.latencies.push(dur);
            stats.statusCodes[res.statusCode] = (stats.statusCodes[res.statusCode] || 0) + 1;
            if (res.statusCode >= 200 && res.statusCode < 400) stats.ok++; else stats.fail++;
          }
          resolve(returnBody ? { bodyText: Buffer.concat(chunks).toString('utf-8') } : null);
        });
      });
      req.on('error', err => {
        if (!warmup) {
          stats.fail++;
          stats.errors[err.code || err.message] = (stats.errors[err.code || err.message] || 0) + 1;
        }
        resolve(null);
      });
      req.on('timeout', () => { req.destroy(new Error('timeout')); });
      if (body) req.write(body);
      req.end();
    });
  }

  Promise.all(Array.from({ length: concurrency }, () => worker())).then(() => {
    clearInterval(reportInterval);
    sessions.delete(id);
    sender.send('bench-done', { id, stats: snapshot(stats), elapsed: Date.now() - startedAt });
  });
}

function interpolate(str, vars) {
  if (typeof str !== 'string') return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => vars[k] != null ? String(vars[k]) : `{${k}}`);
}

function jsonpath(obj, path) {
  // 简易：$.a.b 或 a.b 或 a[0].b
  let p = path.replace(/^\$\.?/, '');
  for (const seg of p.split(/\.|\[|\]/).filter(Boolean)) {
    if (obj == null) return null;
    obj = obj[seg];
  }
  return obj;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
