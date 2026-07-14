import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { siteConfig } from '../src/config/site';

describe('personal brand configuration', () => {
  it('uses Xu Rulin identity and product engineer positioning', () => {
    expect(siteConfig.name).toBe('许汝林个人博客');
    expect(siteConfig.brand).toBe('许汝林 / PRODUCT ENGINEER');
    expect(siteConfig.brandMark).toBe('许');
    expect(siteConfig.author).toMatchObject({
      name: '许汝林',
      role: '产品型全栈工程师',
      age: 27,
      experienceYears: 7,
    });
  });

  it('publishes the authenticated GitHub profile without exposing email', () => {
    expect(siteConfig.social.github).toBe('https://github.com/xrlnewman');
    expect(siteConfig.social.email).toBe('');
  });

  it('uses the warm studio catalog visual contract', () => {
    const globalStyles = readFileSync('src/styles/global.css', 'utf8');
    const homePage = readFileSync('src/pages/index.astro', 'utf8');
    const projectsPage = readFileSync('src/pages/projects/index.astro', 'utf8');
    const projectCard = readFileSync('src/components/ProjectCard.astro', 'utf8');
    const header = readFileSync('src/components/Header.astro', 'utf8');
    const searchPanel = readFileSync('src/components/SearchPanel.astro', 'utf8');

    expect(globalStyles).toContain('--canvas: #f5f0e7');
    expect(globalStyles).toContain('--accent: #b63b17');
    expect(globalStyles).toContain('--secondary: #167c75');
    expect(globalStyles).toContain('--focus-ring: #0b6b5a');
    expect(globalStyles).toContain('--focus-ring: #63d8c2');
    expect(globalStyles).toContain(':focus-visible {\n  outline: 3px solid var(--focus-ring);');
    expect(globalStyles).toContain('color: var(--canvas);\n  background: var(--ink);');
    expect(homePage).toContain('class="hero-studio"');
    expect(homePage).toContain('projectCategories.length');
    expect(homePage).toContain('data-project-count');
    expect(projectsPage).toContain('data-project-catalog');
    expect(projectsPage).toContain('level="h1"');
    expect(projectCard).toContain('查看详情');
    expect(projectCard).toContain('源码 ↗');
    expect(header).toContain('class="brand-copy"');
    expect(searchPanel).toContain('min-width: 44px;');
    expect(searchPanel).toContain('min-height: 44px;');
  });
});
