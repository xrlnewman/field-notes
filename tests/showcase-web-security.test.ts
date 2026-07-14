import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

import { describe, expect, it } from 'vitest';

type ModuleApi = Record<string, (...args: any[]) => any>;

const require = createRequire(import.meta.url);

function loadModule(path: string): ModuleApi {
  try {
    return require(path) as ModuleApi;
  } catch {
    return {};
  }
}

function getFunction(module: ModuleApi, name: string): (...args: any[]) => any {
  const fn = module[name];
  expect(fn, `${name} 必须是可调用 helper`).toBeTypeOf('function');
  return fn as (...args: any[]) => any;
}

function executeWebMain() {
  const mainListeners = new Map<string, (...args: any[]) => any>();
  const permissionHandlers: Record<string, (...args: any[]) => any> = {};
  const ipcHandlers = new Map<string, (...args: any[]) => any>();
  const fileCalls = { mkdir: [] as any[][], writeFile: [] as any[][], readFile: [] as any[][], unlink: [] as any[][] };
  const cookieCalls: any[] = [];

  const filePromises = {
    mkdir: async (...args: any[]) => { fileCalls.mkdir.push(args); },
    writeFile: async (...args: any[]) => { fileCalls.writeFile.push(args); },
    readFile: async (...args: any[]) => { fileCalls.readFile.push(args); return '{}'; },
    unlink: async (...args: any[]) => { fileCalls.unlink.push(args); },
    readdir: async () => [],
  };
  const session = {
    webRequest: { onHeadersReceived: () => {} },
    cookies: { get: async (...args: any[]) => { cookieCalls.push(args); return []; } },
    setPermissionCheckHandler: (handler: (...args: any[]) => any) => { permissionHandlers.check = handler; },
    setPermissionRequestHandler: (handler: (...args: any[]) => any) => { permissionHandlers.request = handler; },
  };
  const webContents = {
    session,
    on: (event: string, handler: (...args: any[]) => any) => mainListeners.set(event, handler),
  };
  class BrowserWindow {
    static windows: BrowserWindow[] = [];
    webContents = webContents;
    constructor() { BrowserWindow.windows.push(this); }
    setMenuBarVisibility() {}
    loadFile() {}
    static getAllWindows() { return BrowserWindow.windows; }
  }
  const electron = {
    app: {
      whenReady: () => ({ then: (handler: () => void) => handler() }),
      on: () => {},
      getPath: () => 'C:\\app-data',
      quit: () => {},
    },
    BrowserWindow,
    ipcMain: { handle: (channel: string, handler: (...args: any[]) => any) => ipcHandlers.set(channel, handler) },
    dialog: { showSaveDialog: async () => ({ canceled: true }) },
    session: { defaultSession: session },
  };

  runInNewContext(readFileSync('showcase/web-scraper/main.js', 'utf8'), {
    Buffer,
    URL,
    console,
    process,
    __dirname: 'E:\\project\\field-notes\\.worktrees\\showcase-projects\\showcase\\web-scraper',
    require: (name: string) => {
      if (name === 'electron') return electron;
      if (name === 'fs') return { promises: filePromises };
      if (name === './lib/security') return security;
      return require(name);
    },
  }, { filename: 'showcase/web-scraper/main.js' });

  return { cookieCalls, fileCalls, ipcHandlers, mainListeners, permissionHandlers };
}

function executeWebRenderer() {
  const navigationCalls: Array<[string, string]> = [];
  const nodes = new Map<string, any>();
  const fieldRows: any[] = [];

  function createNode(): any {
    const controls = new Map<string, any>();
    return {
      value: '',
      innerHTML: '',
      textContent: '',
      hidden: false,
      disabled: false,
      scrollHeight: 0,
      scrollTop: 0,
      appendChild: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      remove: () => {},
      querySelector(selector: string) {
        if (!controls.has(selector)) controls.set(selector, createNode());
        return controls.get(selector);
      },
    };
  }

  const fieldsNode = createNode();
  fieldsNode.appendChild = (row: any) => fieldRows.push(row);
  nodes.set('fields', fieldsNode);
  const webview = createNode();
  webview.canGoBack = () => false;
  webview.canGoForward = () => false;
  webview.executeJavaScript = async () => [];
  nodes.set('web', webview);

  const loadRuleset = async () => JSON.stringify({ url: 'https://rules.example/list', fields: [] });
  const window = {
    api: {
      listRulesets: async () => [],
      loadRuleset,
    },
    WebScraperFields: {
      bindFieldRow: () => {},
      readFieldRow: () => ({ name: '标题', sel: '.title', extract: 'text', attr: '' }),
      validateFields: (fields: unknown) => fields,
    },
    WebScraperRuntime: { buildScrapeScript: () => '[]' },
    WebScraperUrlPolicy: {
      createSafeNavigation: () => ({
        addressBar: (url: string) => { navigationCalls.push(['addressBar', url]); return url; },
        ruleset: (url: string) => { navigationCalls.push(['ruleset', url]); return url; },
        pageTemplate: async (url: string) => { navigationCalls.push(['pageTemplate', url]); return url; },
      }),
    },
  };
  const document = {
    getElementById(id: string) {
      if (!nodes.has(id)) nodes.set(id, createNode());
      return nodes.get(id);
    },
    querySelectorAll(selector: string) {
      return selector === '.field-row' ? fieldRows : [];
    },
    createElement: () => createNode(),
  };

  runInNewContext(readFileSync('showcase/web-scraper/renderer/app.js', 'utf8'), {
    console,
    confirm: () => true,
    document,
    navigator: { clipboard: { writeText: async () => {} } },
    setTimeout: (callback: () => void) => { callback(); return 1; },
    TextEncoder,
    window,
    XLSX: {},
  }, { filename: 'showcase/web-scraper/renderer/app.js' });

  return { fieldRows, navigationCalls, node: (id: string) => document.getElementById(id) };
}

const security = loadModule('../showcase/web-scraper/lib/security.js');
const fieldRules = loadModule('../showcase/web-scraper/renderer/rule-fields.js');
const scrapeRuntime = loadModule('../showcase/web-scraper/renderer/scrape-runtime.js');
const urlPolicy = loadModule('../showcase/web-scraper/renderer/url-policy.js');

describe('Web Scraper security helper', () => {
  it.each([
    ['about:blank', true],
    ['https://example.com/list', true],
    ['http://127.0.0.1:8080/', true],
    ['file:///etc/passwd', false],
    ['javascript:alert(1)', false],
    ['data:text/html,unsafe', false],
    ['about:srcdoc', false],
  ])('判定 guest URL %s = %s', (url, expected) => {
    expect(getFunction(security, 'isAllowedGuestUrl')(url)).toBe(expected);
  });

  it('强制 webview 安全偏好且不保留远程 preload', () => {
    const preferences = {
      nodeIntegration: true,
      contextIsolation: false,
      sandbox: false,
      webSecurity: false,
      preload: 'C:\\unsafe-preload.js',
    };

    getFunction(security, 'secureWebviewPreferences')(preferences);

    expect(preferences).toEqual({
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    });
  });

  it.each([
    '../escape', '..\\escape', '', '.', '..', 'bad/name', 'CON', 'prn.json', 'COM1', 'LPT9.txt', 'rules.',
  ])('拒绝危险规则集名称 %s', (name) => {
    expect(() => getFunction(security, 'normalizeRulesetName')(name)).toThrow(/规则集名称/);
  });

  it('保留安全的中文规则集名称', () => {
    expect(getFunction(security, 'normalizeRulesetName')(' 商品列表 ')).toBe('商品列表');
  });
});

describe('Web Scraper main-process wiring', () => {
  it('阻止危险 webview 附加并强制安全偏好', () => {
    const harness = executeWebMain();
    const handler = harness.mainListeners.get('will-attach-webview');
    expect(handler).toBeTypeOf('function');

    const dangerousEvent = { prevented: false, preventDefault() { this.prevented = true; } };
    const preferences = { nodeIntegration: true, preload: 'C:\\evil.js' };
    handler?.(dangerousEvent, preferences, { src: 'file:///C:/secret.html' });
    expect(dangerousEvent.prevented).toBe(true);
    expect(preferences).toMatchObject({
      nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true,
    });
    expect(preferences).not.toHaveProperty('preload');

    const safeEvent = { prevented: false, preventDefault() { this.prevented = true; } };
    handler?.(safeEvent, {}, { src: 'https://example.com/list' });
    expect(safeEvent.prevented).toBe(false);
  });

  it('guest 禁止新窗口与非 http(s) 导航', () => {
    const harness = executeWebMain();
    const attach = harness.mainListeners.get('did-attach-webview');
    expect(attach).toBeTypeOf('function');
    const guestListeners = new Map<string, (...args: any[]) => any>();
    let openHandler: (() => unknown) | undefined;
    const guest = {
      setWindowOpenHandler: (handler: () => unknown) => { openHandler = handler; },
      on: (event: string, handler: (...args: any[]) => any) => guestListeners.set(event, handler),
    };
    attach?.({}, guest);

    expect(openHandler?.()).toEqual({ action: 'deny' });
    for (const eventName of ['will-navigate', 'will-redirect']) {
      const event = { url: 'javascript:alert(1)', prevented: false, preventDefault() { this.prevented = true; } };
      guestListeners.get(eventName)?.(event);
      expect(event.prevented, eventName).toBe(true);

      const allowed = { url: 'https://example.com/next', prevented: false, preventDefault() { this.prevented = true; } };
      guestListeners.get(eventName)?.(allowed);
      expect(allowed.prevented, eventName).toBe(false);
    }
  });

  it('session 权限检查与请求默认拒绝', () => {
    const harness = executeWebMain();
    expect(harness.permissionHandlers.check?.({}, 'geolocation', 'https://example.com')).toBe(false);
    let decision: boolean | undefined;
    harness.permissionHandlers.request?.({}, 'geolocation', (allowed: boolean) => { decision = allowed; });
    expect(decision).toBe(false);
  });

  it.each(['save-ruleset', 'load-ruleset', 'delete-ruleset'])('%s 在文件 IO 前拒绝路径穿越名称', async (channel) => {
    const harness = executeWebMain();
    const handler = harness.ipcHandlers.get(channel);
    expect(handler).toBeTypeOf('function');
    await expect(Promise.resolve(handler?.({}, '../escape', '{}'))).rejects.toThrow(/规则集名称/);
    expect(harness.fileCalls.writeFile).toEqual([]);
    expect(harness.fileCalls.readFile).toEqual([]);
    expect(harness.fileCalls.unlink).toEqual([]);
  });

  it('get-cookies 只接受 http(s) URL', async () => {
    const harness = executeWebMain();
    const handler = harness.ipcHandlers.get('get-cookies');
    expect(handler).toBeTypeOf('function');
    await expect(Promise.resolve(handler?.({}, 'file:///C:/secret.html'))).rejects.toThrow(/HTTP/);
    await expect(Promise.resolve(handler?.({}, 'https://example.com/path'))).resolves.toEqual([]);
    expect(harness.cookieCalls).toEqual([[{ url: 'https://example.com/path' }]]);
  });
});

describe('Web Scraper renderer programmatic navigation policy', () => {
  function createNavigationHarness() {
    const listeners = new Map<string, () => void>();
    const loadCalls: string[] = [];
    const errors: string[] = [];
    const webview = {
      addEventListener: (event: string, listener: () => void) => listeners.set(event, listener),
      removeEventListener: (event: string) => listeners.delete(event),
      loadURL: (url: string) => {
        loadCalls.push(url);
        listeners.get('did-finish-load')?.();
      },
    };
    const navigation = getFunction(urlPolicy, 'createSafeNavigation')(
      webview,
      (error: Error) => errors.push(error.message),
    );
    return { errors, loadCalls, navigation };
  }

  it.each([
    ['addressBar', 'file:///C:/secret.txt'],
    ['ruleset', 'data:text/html,unsafe'],
    ['pageTemplate', 'javascript:alert(1)'],
  ])('%s 在调用 webview.loadURL 前拒绝非 HTTP(S) 并记录错误', (entry, url) => {
    const { errors, loadCalls, navigation } = createNavigationHarness();
    expect(() => navigation[entry](url)).toThrow(/HTTP\(S\)/);
    expect(loadCalls).toEqual([]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/HTTP\(S\)/);
  });

  it('地址栏、规则集和 URL 模板入口均通过同一策略加载 HTTP(S)', async () => {
    const { errors, loadCalls, navigation } = createNavigationHarness();

    expect(navigation.addressBar(' https://example.com/list ')).toBe('https://example.com/list');
    expect(navigation.ruleset('http://127.0.0.1/items')).toBe('http://127.0.0.1/items');
    await expect(navigation.pageTemplate('https://example.com/page/2')).resolves.toBe('https://example.com/page/2');

    expect(loadCalls).toEqual([
      'https://example.com/list',
      'http://127.0.0.1/items',
      'https://example.com/page/2',
    ]);
    expect(errors).toEqual([]);
  });

  it('真实 renderer app 将地址栏、规则集和 URL 模板分别接入安全导航器', async () => {
    const harness = executeWebRenderer();
    harness.node('url').value = 'https://address.example/list';
    harness.node('go').onclick();

    harness.node('ruleset-select').value = 'saved';
    await harness.node('ruleset-load').onclick();

    harness.node('list-sel').value = '.item';
    harness.node('page-mode').value = 'url';
    harness.node('url-tpl').value = 'https://pages.example/{n}';
    harness.node('max-pages').value = '2';
    harness.fieldRows.push(createNavigationHarness());
    await harness.node('run-btn').onclick();

    expect(harness.navigationCalls).toEqual([
      ['addressBar', 'https://address.example/list'],
      ['ruleset', 'https://rules.example/list'],
      ['pageTemplate', 'https://pages.example/2'],
    ]);
  });
});

describe('Web Scraper attr extraction behavior', () => {
  function createRow() {
    const controls: Record<string, any> = {
      '.f-name': { value: '' },
      '.f-sel': { value: '' },
      '.f-extract': { value: 'text', onchange: undefined },
      '.f-attr': { value: '', hidden: true, disabled: true },
    };
    return { controls, row: { querySelector: (selector: string) => controls[selector] } };
  }

  it('初始与动态字段绑定会保留 attr 名并切换输入框', () => {
    const { controls, row } = createRow();
    getFunction(fieldRules, 'bindFieldRow')(row, {
      name: '编号', sel: '.item', extract: 'attr', attr: 'data-id',
    });

    expect(controls['.f-extract'].value).toBe('attr');
    expect(controls['.f-attr']).toMatchObject({ value: 'data-id', hidden: false, disabled: false });
    expect(getFunction(fieldRules, 'readFieldRow')(row)).toEqual({
      name: '编号', sel: '.item', extract: 'attr', attr: 'data-id',
    });

    controls['.f-extract'].value = 'text';
    controls['.f-extract'].onchange();
    expect(controls['.f-attr']).toMatchObject({ hidden: true, disabled: true });
  });

  it('attr 模式缺少属性名时明确失败', () => {
    expect(() => getFunction(fieldRules, 'validateFields')([
      { name: '编号', sel: '.item', extract: 'attr', attr: '' },
    ])).toThrow(/属性名/);
  });

  it('注入脚本按指定属性名调用 getAttribute', () => {
    const requestedAttributes: string[] = [];
    const sub = {
      innerHTML: '<b>商品</b>',
      innerText: '商品',
      textContent: '商品',
      getAttribute(name: string) { requestedAttributes.push(name); return name === 'data-id' ? 'sku-1' : null; },
    };
    const document = {
      querySelectorAll: () => [{ querySelector: () => sub }],
    };
    const rules = {
      listSel: '.item',
      fields: [{ name: '编号', sel: '.name', extract: 'attr', attr: 'data-id' }],
    };

    const direct = getFunction(scrapeRuntime, 'scrapeDocument')(rules, document);
    expect(direct).toEqual([{ 编号: 'sku-1' }]);
    expect(requestedAttributes).toEqual(['data-id']);

    const script = getFunction(scrapeRuntime, 'buildScrapeScript')(rules);
    const injected = runInNewContext(script, { document });
    expect(JSON.parse(JSON.stringify(injected))).toEqual([{ 编号: 'sku-1' }]);
    expect(requestedAttributes).toEqual(['data-id', 'data-id']);
  });
});
