import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs';
import { basename, extname, join, relative, sep } from 'node:path';

import { describe, expect, it } from 'vitest';
import { parse as parseYaml } from 'yaml';

const expectedShowcaseProjects = [
  { slug: 'toolkit-box', category: '开发工具' },
  { slug: 'api-bench', category: '开发工具' },
  { slug: 'db-snapshot-diff', category: '数据与搜索' },
  { slug: 'web-scraper', category: '数据与搜索' },
  { slug: 'bi-report', category: '业务系统' },
  { slug: 'inventory-system', category: '业务系统' },
  { slug: 'invoice-ocr', category: 'AI 自动化' },
  { slug: 'excel-analyzer', category: '数据与搜索' },
] as const;

const expectedMetadata = {
  'toolkit-box': { category: '开发工具', tech: ['Electron', 'JavaScript', 'SheetJS', 'PDF.js'] },
  'api-bench': { category: '开发工具', tech: ['Electron', 'Node.js', 'Chart.js'] },
  'db-snapshot-diff': { category: '数据与搜索', tech: ['Electron', 'MySQL', 'PostgreSQL'] },
  'web-scraper': { category: '数据与搜索', tech: ['Electron', 'WebView', 'SheetJS'] },
  'bi-report': { category: '业务系统', tech: ['Electron', 'MySQL', 'Chart.js'] },
  'inventory-system': { category: '业务系统', tech: ['Laravel 12', 'PHP 8.3', 'MySQL', 'Redis'] },
  'invoice-ocr': { category: 'AI 自动化', tech: ['Electron', 'Tesseract.js', 'SheetJS'] },
  'excel-analyzer': { category: '数据与搜索', tech: ['Electron', 'SheetJS', 'JavaScript'] },
} as const;

const expectedPublishingMetadata = {
  'toolkit-box': { publishedAt: '2026-07-12', featured: true, cover: '/images/projects/toolkit-box.png' },
  'invoice-ocr': { publishedAt: '2026-07-11', featured: true, cover: '/images/projects/invoice-ocr.png' },
  'inventory-system': { publishedAt: '2026-07-10', featured: true, cover: '/images/projects/inventory-system.svg' },
  'api-bench': { publishedAt: '2026-07-09', featured: false, cover: '/images/projects/api-bench.png' },
  'db-snapshot-diff': { publishedAt: '2026-07-08', featured: false, cover: '/images/projects/db-snapshot-diff.png' },
  'web-scraper': { publishedAt: '2026-07-07', featured: false, cover: '/images/projects/web-scraper.png' },
  'bi-report': { publishedAt: '2026-07-06', featured: false, cover: '/images/projects/bi-report.png' },
  'excel-analyzer': { publishedAt: '2026-07-04', featured: false, cover: '/images/projects/excel-analyzer.png' },
} as const;

const expectedSectionHeadings = ['项目目标', '核心能力', '技术实现', '工程取舍'];

const forbiddenNames = new Set([
  '.git', '.env', '.gateway-token', 'memory.db', 'node_modules',
  'vendor', 'dist', 'logs', 'backups', 'db',
]);

const secretPatterns = [
  /-----BEGIN(?: [^\r\n]+)? PRIVATE KEY-----/i,
  /^PuTTY-User-Key-File-\d+:/mi,
  /---- BEGIN SSH2 (?:ENCRYPTED )?PRIVATE KEY ----/i,
  /\bcfat_[A-Za-z0-9_-]{20,}\b/,
  /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bBearer\s+[A-Za-z0-9._-]{24,}\b/i,
];

const textExtensions = new Set([
  '.js', '.mjs', '.cjs', '.jsx', '.ts', '.mts', '.cts', '.tsx',
  '.json', '.jsonc', '.md', '.mdx', '.php', '.html', '.htm', '.css',
  '.scss', '.sass', '.less', '.yml', '.yaml', '.toml', '.ini', '.conf',
  '.config', '.example', '.txt', '.csv', '.xml', '.svg', '.sql', '.graphql',
  '.gql', '.properties', '.py', '.rb', '.go', '.java', '.kt', '.rs', '.sh',
  '.bash', '.zsh', '.fish', '.ps1', '.bat', '.cmd', '.vue', '.svelte',
]);

const textFileNames = new Set([
  'dockerfile', 'makefile', 'procfile', 'gemfile', 'rakefile', '.npmrc',
  '.yarnrc', '.netrc', '.pypirc', '.gitconfig', '.gitignore', '.gitattributes',
  '.dockerignore', '.editorconfig',
]);

const privateKeyExtensions = new Set([
  '.key', '.pem', '.p8', '.pk8', '.ppk', '.p12', '.pfx', '.keystore', '.jks',
]);

const privateKeyFileNames = new Set([
  'id_rsa', 'id_dsa', 'id_ecdsa', 'id_ed25519', 'identity', 'private_key',
  'private-key', 'ssh_host_rsa_key', 'ssh_host_dsa_key', 'ssh_host_ecdsa_key',
  'ssh_host_ed25519_key',
]);

const databaseExtensions = new Set([
  '.db', '.db3', '.sqlite', '.sqlite3', '.duckdb', '.realm', '.mdb', '.accdb',
  '.db-wal', '.db-shm', '.db-journal', '.sqlite-wal', '.sqlite-shm',
  '.sqlite-journal', '.sqlite3-wal', '.sqlite3-shm', '.sqlite3-journal',
]);

const repositoryDirectoryUrl = 'https://github.com/xrlnewman/field-notes/tree/main/showcase';

interface SourceEntry {
  path: string;
  kind: 'directory' | 'file' | 'symbolic-link' | 'other';
}

interface PngChunk {
  type: string;
  length: number;
}

interface PngStructure {
  chunks: PngChunk[];
  complete: boolean;
}

function listEntries(root: string): SourceEntry[] {
  const rootStats = lstatSync(root, { throwIfNoEntry: false });
  if (!rootStats) {
    return [];
  }

  if (rootStats.isSymbolicLink() || !rootStats.isDirectory()) {
    return [];
  }

  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(root, entry.name);
    const sourceEntry: SourceEntry = {
      path: entryPath,
      kind: entry.isSymbolicLink()
        ? 'symbolic-link'
        : entry.isDirectory()
          ? 'directory'
          : entry.isFile()
            ? 'file'
            : 'other',
    };

    return entry.isDirectory()
      ? [sourceEntry, ...listEntries(entryPath)]
      : [sourceEntry];
  });
}

function readFrontmatter(filePath: string): Record<string, unknown> {
  const markdown = readFileSync(filePath, 'utf8');
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);

  if (!match) {
    throw new Error(`${filePath} 缺少有效 YAML frontmatter`);
  }

  const yaml = match[1];
  if (yaml === undefined) {
    throw new Error(`${filePath} 缺少 YAML frontmatter 内容`);
  }

  const frontmatter = parseYaml(yaml);
  if (!frontmatter || typeof frontmatter !== 'object' || Array.isArray(frontmatter)) {
    throw new Error(`${filePath} 的 YAML frontmatter 必须为对象`);
  }

  return frontmatter as Record<string, unknown>;
}

function isForbiddenPathName(name: string): boolean {
  const normalizedName = name.toLowerCase();
  return forbiddenNames.has(normalizedName)
    || normalizedName.startsWith('.env')
    || databaseExtensions.has(extname(normalizedName))
    || privateKeyFileNames.has(normalizedName)
    || privateKeyExtensions.has(extname(normalizedName));
}

function isScannableText(filePath: string): boolean {
  const name = basename(filePath).toLowerCase();
  const extension = extname(name);

  return name.startsWith('.env')
    || textFileNames.has(name)
    || privateKeyFileNames.has(name)
    || privateKeyExtensions.has(extension)
    || textExtensions.has(extension);
}

function inspectPngStructure(png: Buffer): PngStructure {
  const chunks: PngChunk[] = [];
  let offset = 8;

  while (offset + 12 <= png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.subarray(offset + 4, offset + 8).toString('ascii');
    const nextOffset = offset + 12 + length;

    if (nextOffset > png.length) {
      return { chunks, complete: false };
    }

    chunks.push({ type, length });
    offset = nextOffset;

    if (type === 'IEND') {
      return {
        chunks,
        complete: length === 0 && offset === png.length,
      };
    }
  }

  return { chunks, complete: false };
}

describe('showcase publishing contract', () => {
  it.each(expectedShowcaseProjects)('requires public artifacts for $slug', ({ slug }) => {
    const readmePath = `showcase/${slug}/README.md`;
    const coverExtension = slug === 'inventory-system' ? 'svg' : 'png';
    const coverPath = `public/images/projects/${slug}.${coverExtension}`;
    const contentPath = `src/content/projects/${slug}.md`;

    expect.soft(existsSync(readmePath), readmePath).toBe(true);
    expect.soft(existsSync(coverPath), coverPath).toBe(true);
    expect.soft(existsSync(contentPath), contentPath).toBe(true);
  });

  it('项目元数据与发布约束保持精确映射', () => {
    for (const { slug } of expectedShowcaseProjects) {
      const contentPath = `src/content/projects/${slug}.md`;

      expect.soft(existsSync(contentPath), contentPath).toBe(true);
      if (!existsSync(contentPath)) {
        continue;
      }

      const frontmatter = readFrontmatter(contentPath);
      const metadata = expectedMetadata[slug];
      const publishing = expectedPublishingMetadata[slug];

      expect(frontmatter.category).toBe(metadata.category);
      expect(frontmatter.tech).toEqual(metadata.tech);
      expect(frontmatter.publishedAt).toBe(publishing.publishedAt);
      expect(frontmatter.status).toBe('completed');
      expect(frontmatter.cover).toBe(publishing.cover);
      expect(frontmatter.repoUrl).toBe(`${repositoryDirectoryUrl}/${slug}`);
      expect(frontmatter.featured).toBe(publishing.featured);
      expect(frontmatter.draft).toBe(false);
    }
  });

  it.each(expectedShowcaseProjects)('$slug 详情只使用约定的四个二级章节', ({ slug }) => {
    const contentPath = `src/content/projects/${slug}.md`;

    expect.soft(existsSync(contentPath), contentPath).toBe(true);
    if (!existsSync(contentPath)) {
      return;
    }

    const markdown = readFileSync(contentPath, 'utf8');
    const headings = [...markdown.matchAll(/^##[ \t]+(.+?)\r?$/gm)].map((match) => match[1]);
    expect(headings).toEqual(expectedSectionHeadings);
  });

  it.each(expectedShowcaseProjects.filter(({ slug }) => slug !== 'inventory-system'))(
    'provides a valid non-empty PNG cover for $slug',
    ({ slug }) => {
      const coverPath = `public/images/projects/${slug}.png`;

      expect.soft(existsSync(coverPath), coverPath).toBe(true);
      if (!existsSync(coverPath)) {
        return;
      }

      const png = readFileSync(coverPath);
      expect.soft(png.length, `${coverPath} 必须包含 PNG 数据`).toBeGreaterThanOrEqual(24);
      if (png.length < 24) {
        return;
      }

      expect(png.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))).toBe(true);
      expect(png.readUInt32BE(8)).toBe(13);
      expect(png.subarray(12, 16).toString('ascii')).toBe('IHDR');
      expect(png.readUInt32BE(16), `${coverPath} 宽度过小`).toBeGreaterThanOrEqual(800);
      expect(png.readUInt32BE(20), `${coverPath} 高度过小`).toBeGreaterThanOrEqual(500);

      const structure = inspectPngStructure(png);
      expect(structure.complete, `${coverPath} 必须包含完整且末尾无附加数据的 IEND`).toBe(true);
      expect(
        structure.chunks.some(({ type, length }) => type === 'IDAT' && length > 0),
        `${coverPath} 必须包含非空 IDAT`,
      ).toBe(true);
      expect(structure.chunks.at(-1)?.type).toBe('IEND');
    },
  );

  it('provides a valid inventory system SVG architecture cover', () => {
    const coverPath = 'public/images/projects/inventory-system.svg';

    expect.soft(existsSync(coverPath), coverPath).toBe(true);
    if (!existsSync(coverPath)) {
      return;
    }

    const svg = readFileSync(coverPath, 'utf8');
    expect(Buffer.byteLength(svg), `${coverPath} 不得为空`).toBeGreaterThan(0);
    expect(svg).toMatch(/^\s*(?:<\?xml[\s\S]*?\?>\s*)?<svg\b[^>]*>[\s\S]*<\/svg>\s*$/i);
    expect(svg).toMatch(/<svg\b[^>]*\bxmlns=(['"])http:\/\/www\.w3\.org\/2000\/svg\1/i);
    expect(svg).toContain('系统架构');
  });

  it('excludes forbidden paths from every public source tree', () => {
    const violations = expectedShowcaseProjects.flatMap(({ slug }) => {
      const root = `showcase/${slug}`;
      return listEntries(root)
        .map(({ path: entryPath }) => relative(root, entryPath))
        .filter((entryPath) => entryPath.split(sep).some(isForbiddenPathName))
        .map((entryPath) => `${root}/${entryPath.split(sep).join('/')}`);
    });

    expect(violations).toEqual([]);
  });

  it('rejects symbolic links from every public source tree', () => {
    const violations = expectedShowcaseProjects.flatMap(({ slug }) => {
      const root = `showcase/${slug}`;
      const rootStats = lstatSync(root, { throwIfNoEntry: false });
      const rootViolation = rootStats?.isSymbolicLink() ? [root] : [];
      const nestedViolations = listEntries(root)
        .filter(({ kind }) => kind === 'symbolic-link')
        .map(({ path: entryPath }) => entryPath.split(sep).join('/'));

      return [...rootViolation, ...nestedViolations];
    });

    expect(violations).toEqual([]);
  });

  it('excludes secret patterns from public source text', () => {
    const violations = expectedShowcaseProjects.flatMap(({ slug }) => {
      const root = `showcase/${slug}`;
      return listEntries(root)
        .filter(({ kind, path: entryPath }) => kind === 'file' && isScannableText(entryPath))
        .flatMap(({ path: entryPath }) => {
          const text = readFileSync(entryPath, 'utf8');
          return secretPatterns
            .filter((pattern) => pattern.test(text))
            .map((pattern) => `${entryPath.split(sep).join('/')}: ${pattern.source}`);
        });
    });

    expect(violations).toEqual([]);
  });

  it('keeps ten project entries, one draft, and nine public projects', () => {
    const contentRoot = 'src/content/projects';
    const projects = listEntries(contentRoot)
      .filter(({ kind, path: filePath }) => (
        kind === 'file' && ['.md', '.mdx'].includes(extname(filePath).toLowerCase())
      ))
      .map(({ path: filePath }) => ({
        file: relative(contentRoot, filePath).split(sep).join('/'),
        frontmatter: readFrontmatter(filePath),
      }));
    const invalidDraftValues = projects
      .filter(({ frontmatter }) => typeof frontmatter.draft !== 'boolean')
      .map(({ file }) => file);
    const drafts = projects
      .filter(({ frontmatter }) => frontmatter.draft === true)
      .map(({ file }) => file);
    const publicProjects = projects
      .filter(({ frontmatter }) => frontmatter.draft === false);

    expect(projects).toHaveLength(10);
    expect(invalidDraftValues).toEqual([]);
    expect(drafts).toEqual(['trend-product-lab.md']);
    expect(publicProjects).toHaveLength(9);
  });

  it('keeps public source snapshots outside the Astro type-check scope', () => {
    const tsconfig = JSON.parse(readFileSync('tsconfig.json', 'utf8')) as { exclude?: string[] };

    expect(tsconfig.exclude).toContain('showcase');
  });
});
