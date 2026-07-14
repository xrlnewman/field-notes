import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const electronProjects = [
  'toolkit-box',
  'api-bench',
  'bi-report',
  'db-snapshot-diff',
  'excel-analyzer',
  'invoice-ocr',
  'web-scraper',
] as const;

const minimumVersions = {
  electron: '43.1.0',
  'electron-builder': '26.15.3',
} as const;

function trackedFiles(...patterns: string[]): string[] {
  const result = spawnSync('git', ['ls-files', '--', ...patterns], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || 'git ls-files 执行失败');
  return result.stdout.split(/\r?\n/).filter(Boolean);
}

function isVersionAtLeast(actual: string, minimum: string): boolean {
  const parse = (value: string) => {
    const match = value.match(/\d+\.\d+\.\d+/);
    return match ? match[0].split('.').map(Number) : [0, 0, 0];
  };
  const actualParts = parse(actual);
  const minimumParts = parse(minimum);

  for (let index = 0; index < 3; index += 1) {
    if (actualParts[index] !== minimumParts[index]) {
      return (actualParts[index] ?? 0) > (minimumParts[index] ?? 0);
    }
  }
  return true;
}

const trackedJavaScript = trackedFiles('showcase/**/*.js');
const trackedPhp = trackedFiles('showcase/**/*.php');
const trackedJson = trackedFiles('showcase/**/*.json');
const trackedDocs = [...new Set([
  ...trackedFiles('*.md', '*.mdx'),
  ...trackedFiles('docs/**'),
])].sort();

describe('showcase Electron runtime baselines', () => {
  it.each(electronProjects)('%s 的 direct 与 lock 根依赖达到安全基线', (project) => {
    const packageJson = JSON.parse(readFileSync(`showcase/${project}/package.json`, 'utf8'));
    const lock = JSON.parse(readFileSync(`showcase/${project}/package-lock.json`, 'utf8'));
    const lockRoot = lock.packages?.[''];

    for (const [dependency, minimum] of Object.entries(minimumVersions)) {
      const directRange = packageJson.devDependencies?.[dependency];
      const lockRootRange = lockRoot?.devDependencies?.[dependency];
      const lockedVersion = lock.packages?.[`node_modules/${dependency}`]?.version;

      expect(directRange, `${project} package.json ${dependency}`).toBe(`^${minimum}`);
      expect(lockRootRange, `${project} lock 根 ${dependency}`).toBe(`^${minimum}`);
      expect(isVersionAtLeast(lockedVersion || '', minimum), `${project} 锁定 ${dependency}: ${lockedVersion}`).toBe(true);
    }
  });
});

describe('showcase tracked runtime files', () => {
  it.each(trackedJavaScript)('node --check %s', (file) => {
    const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    expect(result.status, result.stderr || result.stdout).toBe(0);
  });

  it.each(trackedPhp)('php -l %s', (file) => {
    const result = spawnSync('php', ['-l', file], { encoding: 'utf8' });
    expect(result.status, result.stderr || result.stdout).toBe(0);
  });

  it.each(trackedJson)('JSON.parse %s', (file) => {
    expect(() => JSON.parse(readFileSync(file, 'utf8')), file).not.toThrow();
  });
});

describe('tracked public documentation portability', () => {
  it.each(trackedDocs)('%s 不包含 Windows 绝对路径', (file) => {
    expect(readFileSync(file, 'utf8'), file).not.toMatch(/(?:^|[^A-Za-z0-9])[A-Za-z]:[\\/]/m);
  });
});
