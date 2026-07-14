import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runInNewContext } from 'node:vm';

import { describe, expect, it } from 'vitest';

const hostScriptPath = 'showcase/toolkit-box/renderer/tool-api-host.js';
const frameScriptPath = 'showcase/toolkit-box/renderer/tool-api-bridge.js';
const channel = 'toolkit-api-bridge';
const require = createRequire(import.meta.url);

const apiCases = [
  ['pickFiles', [{ title: '选择文件', multi: true }]],
  ['pickDir', [{ title: '选择目录' }]],
  ['saveFile', [{ defaultPath: 'output.xlsx' }]],
  ['readFile', ['C:\\data\\input.bin']],
  ['readText', ['C:\\data\\app.log', 'utf-8']],
  ['writeFile', ['C:\\data\\output.bin', new Uint8Array([1, 2, 3]).buffer]],
  ['listDir', ['C:\\data', true]],
  ['renameFile', ['C:\\data\\old.txt', 'C:\\data\\new.txt']],
  ['openPath', ['C:\\data']],
  ['showInFolder', ['C:\\data\\output.bin']],
  ['pathJoin', ['C:\\data', 'output.bin']],
  ['pathParse', ['C:\\data\\output.bin']],
] as const;

type MessageListener = (event: { source: unknown; origin: string; data: unknown }) => unknown;
type ToolkitApi = Record<string, (...args: any[]) => Promise<unknown>>;
type NavigationSecurity = Record<string, unknown>;

function loadNavigationSecurity(): NavigationSecurity {
  try {
    return require('../showcase/toolkit-box/lib/navigation-security.js') as NavigationSecurity;
  } catch {
    return {};
  }
}

function getNavigationHelper(name: string): (...args: any[]) => any {
  const helper = loadNavigationSecurity()[name];
  expect(helper, `${name} 必须是可调用的导航安全 helper`).toBeTypeOf('function');
  return helper as (...args: any[]) => any;
}

function getApiMethod(api: ToolkitApi, method: string) {
  const apiMethod = api[method];
  if (!apiMethod) throw new Error(`工具页 bridge 未暴露方法: ${method}`);
  return apiMethod;
}

function executeScript(path: string, context: Record<string, unknown>) {
  runInNewContext(readFileSync(path, 'utf8'), context, { filename: path });
}

function createBridgeHarness(
  preloadApi: ToolkitApi,
  { autoHost = true }: { autoHost?: boolean } = {},
) {
  let hostMessageListener: MessageListener | undefined;
  let frameMessageListener: MessageListener | undefined;
  let timerSequence = 0;
  const timers = new Map<number, { callback: () => void; delay: number; remaining: number }>();
  const hostRequests: any[] = [];
  const frameResponses: any[] = [];
  const hostTasks: Promise<unknown>[] = [];

  const parentWindow = {
    api: preloadApi,
    addEventListener(type: string, listener: MessageListener) {
      if (type === 'message') hostMessageListener = listener;
    },
    postMessage(message: unknown) {
      const request = structuredClone(message);
      hostRequests.push(request);
      if (autoHost && hostMessageListener) {
        hostTasks.push(Promise.resolve(hostMessageListener({
          source: frameWindow,
          origin: 'null',
          data: request,
        })));
      }
    },
  };

  const frameWindow: {
    api?: ToolkitApi;
    addEventListener: (type: string, listener: MessageListener) => void;
    postMessage: (message: unknown) => void;
    setTimeout: (callback: () => void, delay?: number) => number;
    clearTimeout: (timerId: number) => void;
  } = {
    addEventListener(type, listener) {
      if (type === 'message') frameMessageListener = listener;
    },
    postMessage(message) {
      const response = structuredClone(message);
      frameResponses.push(response);
      frameMessageListener?.({ source: parentWindow, origin: 'null', data: response });
    },
    setTimeout(callback, delay = 0) {
      const timerId = ++timerSequence;
      timers.set(timerId, { callback, delay, remaining: delay });
      return timerId;
    },
    clearTimeout(timerId) {
      timers.delete(timerId);
    },
  };

  executeScript(hostScriptPath, {
    console,
    document: {
      getElementById: (id: string) => id === 'tool-frame' ? { contentWindow: frameWindow } : null,
    },
    window: parentWindow,
  });
  executeScript(frameScriptPath, { console, parent: parentWindow, window: frameWindow });

  if (!frameWindow.api) throw new Error('工具页 bridge 未暴露 window.api');
  if (!hostMessageListener || !frameMessageListener) throw new Error('父子 bridge 未注册 message listener');

  return {
    api: frameWindow.api,
    frameResponses,
    frameWindow,
    hostRequests,
    hostTasks,
    pendingTimerCount: () => timers.size,
    timerDelays: () => [...timers.values()].map(timer => timer.delay),
    advanceTimersBy(duration: number) {
      for (const [timerId, timer] of [...timers]) {
        timer.remaining -= duration;
        if (timer.remaining > 0) continue;
        timers.delete(timerId);
        timer.callback();
      }
    },
    runTimers() {
      for (const [timerId, timer] of [...timers]) {
        timers.delete(timerId);
        timer.callback();
      }
    },
    deliverToFrame(source: unknown, data: unknown) {
      frameMessageListener?.({ source, origin: 'null', data: structuredClone(data) });
    },
    async deliverToHost(source: unknown, data: unknown, origin = 'null') {
      await hostMessageListener?.({ source, origin, data: structuredClone(data) });
    },
    parentWindow,
  };
}

describe('ToolkitBox iframe API bridge', () => {
  it.each(apiCases)('转发白名单方法 %s 的参数和结构化结果', async (method, args) => {
    const calls: unknown[][] = [];
    const expectedResult = { method, nested: { accepted: true }, args };
    const harness = createBridgeHarness({
      [method]: async (...received: unknown[]) => {
        calls.push(received);
        return expectedResult;
      },
    });

    expect(Object.keys(harness.api).sort()).toEqual(apiCases.map(([name]) => name).sort());
    await expect(getApiMethod(harness.api, method)(...args)).resolves.toEqual(expectedResult);
    expect(calls).toEqual([args]);
    expect(harness.pendingTimerCount()).toBe(0);
  });

  it('保留 ArrayBuffer 返回值，不经过 JSON 降级', async () => {
    const bytes = new Uint8Array([0, 127, 255]);
    const harness = createBridgeHarness({
      readFile: async () => bytes.buffer,
    });

    const result = await getApiMethod(harness.api, 'readFile')('C:\\data\\input.bin');

    expect(result).toBeInstanceOf(ArrayBuffer);
    expect([...new Uint8Array(result as ArrayBuffer)]).toEqual([...bytes]);
  });

  it('把 preload API 抛错结构化返回并在工具页拒绝 Promise', async () => {
    const harness = createBridgeHarness({
      pickDir: async () => { throw new TypeError('目录访问被拒绝'); },
    });

    await expect(getApiMethod(harness.api, 'pickDir')({})).rejects.toThrow('目录访问被拒绝');
    expect(harness.frameResponses.at(-1)).toMatchObject({
      channel,
      type: 'response',
      ok: false,
      error: { name: 'TypeError', message: '目录访问被拒绝' },
    });
  });

  it('对未知方法返回明确失败且不访问 preload API', async () => {
    let accessCount = 0;
    const preloadApi = new Proxy({}, {
      get() {
        accessCount += 1;
        return undefined;
      },
    }) as ToolkitApi;
    const harness = createBridgeHarness(preloadApi);

    await harness.deliverToHost(
      harness.frameWindow,
      { channel, type: 'request', id: 'unknown-1', method: 'deleteEverything', args: [] },
    );

    expect(accessCount).toBe(0);
    expect(harness.frameResponses.at(-1)).toMatchObject({
      channel,
      type: 'response',
      id: 'unknown-1',
      ok: false,
      error: { name: 'MethodNotAllowedError' },
    });
  });

  it('忽略非当前 iframe 来源伪造的请求', async () => {
    let callCount = 0;
    const harness = createBridgeHarness({
      readFile: async () => { callCount += 1; return new ArrayBuffer(0); },
    });
    const forgedResponses: unknown[] = [];
    const forgedSource = { postMessage: (message: unknown) => forgedResponses.push(message) };

    await harness.deliverToHost(forgedSource, {
      channel,
      type: 'request',
      id: 'forged-1',
      method: 'readFile',
      args: ['C:\\secret.txt'],
    });

    expect(callCount).toBe(0);
    expect(forgedResponses).toEqual([]);
  });

  it('拒绝当前 iframe 伪造的 https origin 请求', async () => {
    let callCount = 0;
    const harness = createBridgeHarness({
      readFile: async () => { callCount += 1; return new ArrayBuffer(0); },
    });

    await harness.deliverToHost(harness.frameWindow, {
      channel,
      type: 'request',
      id: 'forged-origin-1',
      method: 'readFile',
      args: ['C:\\secret.txt'],
    }, 'https://evil.example');

    expect(callCount).toBe(0);
    expect(harness.frameResponses).toEqual([]);
  });

  it('接受当前 iframe 的 file 页面 null origin 请求', async () => {
    const calls: unknown[][] = [];
    const harness = createBridgeHarness({
      pathParse: async (...args: unknown[]) => { calls.push(args); return { name: 'safe.txt' }; },
    });

    await harness.deliverToHost(harness.frameWindow, {
      channel,
      type: 'request',
      id: 'file-origin-1',
      method: 'pathParse',
      args: ['C:\\data\\safe.txt'],
    }, 'null');

    expect(calls).toEqual([['C:\\data\\safe.txt']]);
    expect(harness.frameResponses.at(-1)).toMatchObject({ id: 'file-origin-1', ok: true });
  });

  it('工具页只接受 parent 的响应', async () => {
    const harness = createBridgeHarness({}, { autoHost: false });
    const requestPromise = getApiMethod(harness.api, 'pathParse')('C:\\data\\input.txt');
    const request = harness.hostRequests.at(-1);

    harness.deliverToFrame({ forged: true }, {
      channel,
      type: 'response',
      id: request.id,
      ok: true,
      result: { dir: 'C:\\forged' },
    });
    harness.deliverToFrame(harness.parentWindow, {
      channel,
      type: 'response',
      id: request.id,
      ok: true,
      result: { dir: 'C:\\data' },
    });

    await expect(requestPromise).resolves.toEqual({ dir: 'C:\\data' });
    expect(harness.pendingTimerCount()).toBe(0);
  });

  it('请求超时后拒绝并清理 pending', async () => {
    const harness = createBridgeHarness({}, { autoHost: false });
    const requestPromise = getApiMethod(harness.api, 'readText')('C:\\data\\app.log', 'utf-8');
    const rejection = expect(requestPromise).rejects.toThrow('请求超时');

    expect(harness.pendingTimerCount()).toBe(1);
    harness.runTimers();

    await rejection;
    expect(harness.pendingTimerCount()).toBe(0);
  });

  it.each([
    ['pickFiles', [{ multi: true }], 30 * 60 * 1000],
    ['readFile', ['C:\\data\\input.bin'], 10 * 60 * 1000],
    ['pathJoin', ['C:\\data', 'input.bin'], 30 * 1000],
  ])('%s 使用对应操作分级的超时值', async (method, args, expectedDelay) => {
    const harness = createBridgeHarness({}, { autoHost: false });
    const requestPromise = getApiMethod(harness.api, method)(...args);
    const request = harness.hostRequests.at(-1);

    expect(harness.timerDelays()).toEqual([expectedDelay]);
    harness.deliverToFrame(harness.parentWindow, {
      channel,
      type: 'response',
      id: request.id,
      ok: true,
      result: 'ok',
    });
    await expect(requestPromise).resolves.toBe('ok');
  });

  it('pickFiles 等待 30 秒后仍保持 pending 并可正常完成', async () => {
    const harness = createBridgeHarness({}, { autoHost: false });
    const requestPromise = getApiMethod(harness.api, 'pickFiles')({ multi: true });
    void requestPromise.catch(() => {});
    const request = harness.hostRequests.at(-1);

    harness.advanceTimersBy(30 * 1000);
    expect(harness.pendingTimerCount()).toBe(1);
    harness.deliverToFrame(harness.parentWindow, {
      channel,
      type: 'response',
      id: request.id,
      ok: true,
      result: [],
    });
    await expect(requestPromise).resolves.toEqual([]);
  });
});

describe('ToolkitBox main-process navigation boundary', () => {
  it('只允许四个本地工具页作为子 frame 目标', () => {
    const createNavigationPolicy = getNavigationHelper('createNavigationPolicy');
    const isAllowedFrameNavigation = getNavigationHelper('isAllowedFrameNavigation');
    const toolkitRoot = resolve('showcase/toolkit-box');
    const policy = createNavigationPolicy(toolkitRoot);
    const allowedUrls = ['pdf', 'excel', 'rename', 'log'].map(tool => pathToFileURL(
      resolve(toolkitRoot, 'renderer', 'tools', tool, 'tool.html'),
    ).href);

    for (const url of allowedUrls) {
      expect(isAllowedFrameNavigation({ url, isMainFrame: false }, policy), url).toBe(true);
    }
    expect(isAllowedFrameNavigation({ url: 'https://evil.example/tool.html', isMainFrame: false }, policy)).toBe(false);
    expect(isAllowedFrameNavigation({
      url: pathToFileURL(resolve(toolkitRoot, 'renderer', 'tools', 'other', 'tool.html')).href,
      isMainFrame: false,
    }, policy)).toBe(false);
  });

  it('will-frame-navigate 阻止非法目标且 window.open 始终 deny', () => {
    const createNavigationPolicy = getNavigationHelper('createNavigationPolicy');
    const installNavigationGuards = getNavigationHelper('installNavigationGuards');
    const toolkitRoot = resolve('showcase/toolkit-box');
    const policy = createNavigationPolicy(toolkitRoot);
    let navigationListener: ((details: {
      preventDefault: () => void;
      url: string;
      isMainFrame: boolean;
    }) => void) | undefined;
    let windowOpenHandler: (() => { action: string }) | undefined;
    const webContents = {
      on(eventName: string, listener: typeof navigationListener) {
        if (eventName === 'will-frame-navigate') navigationListener = listener;
      },
      setWindowOpenHandler(handler: typeof windowOpenHandler) {
        windowOpenHandler = handler;
      },
    };

    installNavigationGuards(webContents, policy);
    expect(navigationListener).toBeTypeOf('function');
    expect(windowOpenHandler?.()).toEqual({ action: 'deny' });

    let preventCount = 0;
    for (const tool of ['pdf', 'excel', 'rename', 'log']) {
      navigationListener?.({
        preventDefault: () => { preventCount += 1; },
        url: pathToFileURL(resolve(toolkitRoot, 'renderer', 'tools', tool, 'tool.html')).href,
        isMainFrame: false,
      });
    }
    expect(preventCount).toBe(0);
    navigationListener?.({
      preventDefault: () => { preventCount += 1; },
      url: 'https://evil.example/tool.html',
      isMainFrame: false,
    });
    expect(preventCount).toBe(1);
  });

  it('main 创建窗口时安装导航守卫且打包包含安全 helper', () => {
    const main = readFileSync('showcase/toolkit-box/main.js', 'utf8');
    const packageJson = JSON.parse(readFileSync('showcase/toolkit-box/package.json', 'utf8'));

    expect(main).toContain("require('./lib/navigation-security')");
    expect(main).toContain('installNavigationGuards(win.webContents');
    expect(packageJson.build.files).toContain('lib/**/*');
  });
});

describe('ToolkitBox tool HTML bridge loading order', () => {
  it.each(['pdf', 'excel', 'rename', 'log'])('%s 在 tool.js 前加载共享 bridge', (tool) => {
    const html = readFileSync(`showcase/toolkit-box/renderer/tools/${tool}/tool.html`, 'utf8');
    const scriptSources = [...html.matchAll(/<script\b[^>]*\bsrc=(['"])(.*?)\1[^>]*>/gi)]
      .map((match) => match[2]);
    const bridgeIndex = scriptSources.indexOf('../../tool-api-bridge.js');
    const toolIndex = scriptSources.indexOf('tool.js');

    expect(bridgeIndex, `${tool} 必须加载共享 bridge`).toBeGreaterThanOrEqual(0);
    expect(toolIndex, `${tool} 必须加载 tool.js`).toBeGreaterThanOrEqual(0);
    expect(bridgeIndex, `${tool} 必须先加载 bridge 再加载 tool.js`).toBeLessThan(toolIndex);
  });
});
