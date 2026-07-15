import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs';
import { basename, extname, join, relative, sep } from 'node:path';

import { describe, expect, it } from 'vitest';

const expectedShowcaseProjects = [
  { slug: 'toolkit-box' },
  { slug: 'api-bench' },
  { slug: 'db-snapshot-diff' },
  { slug: 'web-scraper' },
  { slug: 'bi-report' },
  { slug: 'inventory-system' },
  { slug: 'invoice-ocr' },
  { slug: 'excel-analyzer' },
] as const;

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

    expect.soft(existsSync(readmePath), readmePath).toBe(true);
    expect.soft(existsSync(coverPath), coverPath).toBe(true);
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

  it('keeps public source snapshots outside the Astro type-check scope', () => {
    const tsconfig = JSON.parse(readFileSync('tsconfig.json', 'utf8')) as { exclude?: string[] };

    expect(tsconfig.exclude).toContain('showcase');
  });
});
