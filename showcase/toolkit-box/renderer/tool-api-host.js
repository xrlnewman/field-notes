(() => {
  const channel = 'toolkit-api-bridge';
  const allowedMethods = new Set([
    'pickFiles',
    'pickDir',
    'saveFile',
    'readFile',
    'readText',
    'writeFile',
    'listDir',
    'renameFile',
    'openPath',
    'showInFolder',
    'pathJoin',
    'pathParse',
  ]);
  const frame = document.getElementById('tool-frame');

  if (!frame) throw new Error('找不到 ToolkitBox 工具 iframe');

  function respond(target, payload) {
    target.postMessage({ channel, type: 'response', ...payload }, '*');
  }

  function serializeError(error) {
    if (error && typeof error === 'object') {
      return {
        name: typeof error.name === 'string' ? error.name : 'Error',
        message: typeof error.message === 'string' ? error.message : String(error),
      };
    }
    return { name: 'Error', message: String(error) };
  }

  window.addEventListener('message', async (event) => {
    if (event.source !== frame.contentWindow || event.origin !== 'null') return;

    const request = event.data;
    if (
      !request
      || request.channel !== channel
      || request.type !== 'request'
      || typeof request.id !== 'string'
    ) return;

    if (typeof request.method !== 'string' || !allowedMethods.has(request.method)) {
      respond(event.source, {
        id: request.id,
        ok: false,
        error: {
          name: 'MethodNotAllowedError',
          message: `不允许调用 Toolkit API 方法: ${String(request.method)}`,
        },
      });
      return;
    }

    if (!Array.isArray(request.args)) {
      respond(event.source, {
        id: request.id,
        ok: false,
        error: { name: 'TypeError', message: 'Toolkit API 参数必须是数组' },
      });
      return;
    }

    const apiMethod = window.api?.[request.method];
    if (typeof apiMethod !== 'function') {
      respond(event.source, {
        id: request.id,
        ok: false,
        error: {
          name: 'ApiUnavailableError',
          message: `Toolkit API 方法不可用: ${request.method}`,
        },
      });
      return;
    }

    try {
      const result = await apiMethod(...request.args);
      respond(event.source, { id: request.id, ok: true, result });
    } catch (error) {
      respond(event.source, {
        id: request.id,
        ok: false,
        error: serializeError(error),
      });
    }
  });
})();
