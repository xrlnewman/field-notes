'use strict';

function isAllowedGuestUrl(value) {
  if (value === 'about:blank') return true;
  try {
    const url = new URL(String(value));
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function secureWebviewPreferences(preferences) {
  delete preferences.preload;
  delete preferences.preloadURL;
  preferences.nodeIntegration = false;
  preferences.contextIsolation = true;
  preferences.sandbox = true;
  preferences.webSecurity = true;
  return preferences;
}

function normalizeRulesetName(value) {
  const name = String(value ?? '').trim();
  const baseName = name.split('.')[0];
  const isWindowsDevice = /^(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i.test(baseName);
  if (!name || name.length > 80 || name === '.' || name === '..' || name.endsWith('.')
    || isWindowsDevice || /[\\/:*?"<>|\0]/.test(name)) {
    throw new TypeError('规则集名称必须为 1 到 80 个字符，且不能包含路径或文件名保留字符');
  }
  return name;
}

function parseHttpUrl(value) {
  let url;
  try {
    url = new URL(String(value));
  } catch {
    throw new TypeError('URL 必须是有效的 HTTP(S) 地址');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new TypeError('URL 必须使用 HTTP(S) 协议');
  }
  return url;
}

module.exports = {
  isAllowedGuestUrl,
  normalizeRulesetName,
  parseHttpUrl,
  secureWebviewPreferences,
};
