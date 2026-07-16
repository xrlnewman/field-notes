import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..');
const siteSource = readFileSync(resolve(root, 'src/config/site.ts'), 'utf8');
const homeSource = readFileSync(resolve(root, 'src/pages/index.astro'), 'utf8');
const aboutSource = readFileSync(resolve(root, 'src/pages/about.astro'), 'utf8');
const profileComponentPath = resolve(root, 'src/components/ProfileIdentity.astro');

describe('personal profile contract', () => {
  it('keeps the shared profile component out of the home page', () => {
    expect(homeSource).not.toContain('ProfileIdentity');
  });

  it('restores the three studio stats on the home page', () => {
    expect(homeSource).toContain('class="hero-studio__stats"');
    expect(homeSource).toContain('7 年经验');
    expect(homeSource).toContain('永久免费');
  });

  it('keeps the shared profile component out of the about page', () => {
    expect(aboutSource).not.toContain('ProfileIdentity');
  });

  it('keeps the blog site config free of profile-only avatar data', () => {
    expect(siteSource).not.toContain('avatarSrc');
  });

  it('removes the reusable profile component from the blog', () => {
    expect(existsSync(profileComponentPath)).toBe(false);
  });

  it('removes unused tool screenshots', () => {
    for (const file of ['api-bench.png', 'bi-report.png', 'db-snapshot-diff.png', 'excel-analyzer.png', 'inventory-system.svg', 'invoice-ocr.png', 'toolkit-box.png', 'web-scraper.png']) {
      expect(existsSync(resolve(root, 'public/images/projects', file))).toBe(false);
    }
  });
});
