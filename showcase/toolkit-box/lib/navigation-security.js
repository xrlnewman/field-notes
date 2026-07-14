const path = require('path');
const { pathToFileURL } = require('url');

const TOOL_ENTRY_RELATIVE_PATHS = Object.freeze([
  ['pdf', 'tool.html'],
  ['excel', 'tool.html'],
  ['rename', 'tool.html'],
  ['log', 'tool.html'],
]);

function createNavigationPolicy(toolkitRoot) {
  const rendererRoot = path.resolve(toolkitRoot, 'renderer');
  return {
    mainFrameUrl: pathToFileURL(path.join(rendererRoot, 'index.html')).href,
    toolFrameUrls: new Set(TOOL_ENTRY_RELATIVE_PATHS.map(parts => pathToFileURL(
      path.join(rendererRoot, 'tools', ...parts),
    ).href)),
  };
}

function isAllowedFrameNavigation(details, policy) {
  if (!details || typeof details.url !== 'string') return false;
  if (details.isMainFrame === true) return details.url === policy.mainFrameUrl;
  if (details.isMainFrame !== false) return false;
  return policy.toolFrameUrls.has(details.url);
}

function installNavigationGuards(webContents, policy) {
  webContents.on('will-frame-navigate', (details) => {
    if (!isAllowedFrameNavigation(details, policy)) details.preventDefault();
  });
  webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
}

module.exports = {
  TOOL_ENTRY_RELATIVE_PATHS,
  createNavigationPolicy,
  installNavigationGuards,
  isAllowedFrameNavigation,
};
