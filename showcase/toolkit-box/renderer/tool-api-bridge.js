(() => {
  const channel = 'toolkit-api-bridge';
  const dialogTimeoutMs = 30 * 60 * 1000;
  const ioTimeoutMs = 10 * 60 * 1000;
  const pathTimeoutMs = 30 * 1000;
  const methodTimeouts = new Map([
    ['pickFiles', dialogTimeoutMs],
    ['pickDir', dialogTimeoutMs],
    ['saveFile', dialogTimeoutMs],
    ['readFile', ioTimeoutMs],
    ['readText', ioTimeoutMs],
    ['writeFile', ioTimeoutMs],
    ['listDir', ioTimeoutMs],
    ['renameFile', ioTimeoutMs],
    ['openPath', ioTimeoutMs],
    ['showInFolder', ioTimeoutMs],
    ['pathJoin', pathTimeoutMs],
    ['pathParse', pathTimeoutMs],
  ]);
  const methodNames = [...methodTimeouts.keys()];
  const pending = new Map();
  let requestSequence = 0;

  function invoke(method, args) {
    return new Promise((resolve, reject) => {
      const id = `${Date.now()}-${++requestSequence}`;
      const timer = window.setTimeout(() => {
        pending.delete(id);
        reject(new Error(`Toolkit API 请求超时: ${method}`));
      }, methodTimeouts.get(method));

      pending.set(id, { resolve, reject, timer });
      try {
        parent.postMessage({ channel, type: 'request', id, method, args }, '*');
      } catch (error) {
        pending.delete(id);
        window.clearTimeout(timer);
        reject(error);
      }
    });
  }

  window.addEventListener('message', (event) => {
    if (event.source !== parent) return;

    const response = event.data;
    if (
      !response
      || response.channel !== channel
      || response.type !== 'response'
      || typeof response.id !== 'string'
    ) return;

    const request = pending.get(response.id);
    if (!request) return;

    pending.delete(response.id);
    window.clearTimeout(request.timer);
    if (response.ok) {
      request.resolve(response.result);
      return;
    }

    const error = new Error(response.error?.message || 'Toolkit API 请求失败');
    error.name = response.error?.name || 'Error';
    request.reject(error);
  });

  window.api = Object.freeze(Object.fromEntries(
    methodNames.map((method) => [method, (...args) => invoke(method, args)]),
  ));
})();
