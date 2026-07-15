import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..');
const siteSource = readFileSync(resolve(root, 'src/config/site.ts'), 'utf8');
const componentSource = readFileSync(resolve(root, 'src/components/ProfileIdentity.astro'), 'utf8');
const homeSource = readFileSync(resolve(root, 'src/pages/index.astro'), 'utf8');
const aboutSource = readFileSync(resolve(root, 'src/pages/about.astro'), 'utf8');

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
    expect(componentSource).toContain('data-project-count={projectCount}');
    expect(componentSource).toContain('siteConfig.social.github');
    expect(componentSource).toContain('href="/guestbook/"');
  });

  it('lets the responsive avatar height follow its square width', () => {
    expect(componentSource).toMatch(/\[data-profile-avatar\]\s*\{[^}]*height:\s*auto;/s);
  });

  it('uses the shared profile on home and about pages', () => {
    expect(homeSource).toContain('variant="compact"');
    expect(homeSource).toContain('projectCount={projects.length}');
    expect(aboutSource).toContain('variant="full"');
    expect(homeSource).toContain('了解我');
  });

  it('builds the home profile label from live profile and project data', () => {
    expect(homeSource).toContain('aria-label={`${siteConfig.author.experienceYears} 年经验 · ${projects.length} 个网站产品`}');
    expect(homeSource).not.toContain('aria-label="7 年经验 · 4 个网站产品"');
  });

  it('removes unused tool screenshots', () => {
    for (const file of ['api-bench.png', 'bi-report.png', 'db-snapshot-diff.png', 'excel-analyzer.png', 'inventory-system.svg', 'invoice-ocr.png', 'toolkit-box.png', 'web-scraper.png']) {
      expect(existsSync(resolve(root, 'public/images/projects', file))).toBe(false);
    }
  });
});
