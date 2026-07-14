(function exposeUrlPolicy(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.WebScraperUrlPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createUrlPolicy() {
  function normalizeHttpUrl(value) {
    let url;
    try {
      url = new URL(String(value ?? '').trim());
    } catch {
      throw new TypeError('页面地址必须是有效的 HTTP(S) URL');
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new TypeError('页面地址必须使用 HTTP(S) 协议');
    }
    return url.href;
  }

  function createSafeNavigation(webview, onError = () => {}) {
    function validate(value) {
      try {
        return normalizeHttpUrl(value);
      } catch (error) {
        onError(error);
        throw error;
      }
    }

    function load(value) {
      const url = validate(value);
      webview.loadURL(url);
      return url;
    }

    function pageTemplate(value) {
      const url = validate(value);
      return new Promise((resolve, reject) => {
        const cleanup = () => webview.removeEventListener('did-finish-load', onLoaded);
        const onLoaded = () => {
          cleanup();
          resolve(url);
        };
        webview.addEventListener('did-finish-load', onLoaded);
        try {
          const loading = webview.loadURL(url);
          if (loading && typeof loading.catch === 'function') {
            loading.catch((error) => {
              cleanup();
              reject(error);
            });
          }
        } catch (error) {
          cleanup();
          reject(error);
        }
      });
    }

    return Object.freeze({
      addressBar: load,
      pageTemplate,
      ruleset: load,
    });
  }

  return { createSafeNavigation, normalizeHttpUrl };
}));
