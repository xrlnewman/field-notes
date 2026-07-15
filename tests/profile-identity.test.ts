import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..');
const siteSource = readFileSync(resolve(root, 'src/config/site.ts'), 'utf8');
const componentSource = readFileSync(resolve(root, 'src/components/ProfileIdentity.astro'), 'utf8');

describe('personal profile contract', () => {
  it('keeps a real local avatar and structured profile copy', () => {
    expect(siteSource).toContain("avatarSrc: '/images/profile/xu-rulin-avatar.png'");
    expect(siteSource).toContain("availability: '可承接产品与复杂系统开发'");
    expect(siteSource).toContain('skills: [');
    expect(existsSync(resolve(root, 'public/images/profile/xu-rulin-avatar.png'))).toBe(true);
  });

  it('renders a reusable identity card with real actions', () => {
    expect(componentSource).toContain('data-profile-identity');
    expect(componentSource).toContain('data-profile-avatar');
    expect(componentSource).toContain('data-profile-skills');
    expect(componentSource).toContain('siteConfig.social.github');
    expect(componentSource).toContain('href="/guestbook/"');
  });

  it('removes unused tool screenshots', () => {
    for (const file of ['api-bench.png', 'bi-report.png', 'db-snapshot-diff.png', 'excel-analyzer.png', 'inventory-system.svg', 'invoice-ocr.png', 'toolkit-box.png', 'web-scraper.png']) {
      expect(existsSync(resolve(root, 'public/images/projects', file))).toBe(false);
    }
  });
});
