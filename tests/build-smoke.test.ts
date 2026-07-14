import { existsSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('static site build', () => {
  it('builds the home and 404 pages with the theme initializer', () => {
    expect(existsSync('dist/index.html')).toBe(true);
    expect(existsSync('dist/404.html')).toBe(true);

    const home = readFileSync('dist/index.html', 'utf8');
    expect(home).toContain('data-theme-toggle');
    expect(home).toContain('https://field-notes-2fi.pages.dev');
  });

  it('builds the project index and project details from content', () => {
    expect(existsSync('dist/projects/index.html')).toBe(true);
    expect(existsSync('dist/projects/field-notes/index.html')).toBe(true);
    expect(existsSync('dist/images/projects/field-notes.png')).toBe(true);

    const projects = readFileSync('dist/projects/index.html', 'utf8');
    const project = readFileSync('dist/projects/field-notes/index.html', 'utf8');
    expect(projects).toContain('许汝林个人博客');
    expect(projects).toContain('data-project-filter');
    expect(projects).toContain('data-project-category="网站产品"');
    expect(projects).toContain('https://github.com/xrlnewman/field-notes');
    expect(projects).toContain('/images/projects/field-notes.png');
    expect(project).toContain('project-showcase');
    expect(project).toContain('/images/projects/field-notes.png');
    expect(project).toContain('GitHub 源码');
    expect(project).toContain('https://field-notes-2fi.pages.dev');
  });

  it('builds article details and tag indexes', () => {
    expect(existsSync('dist/articles/redisearch-result-set/index.html')).toBe(true);
    expect(existsSync('dist/tags/git/index.html')).toBe(true);

    const article = readFileSync('dist/articles/redisearch-result-set/index.html', 'utf8');
    expect(article).toContain('文章目录');
  });

  it('publishes the product engineer story with projects before articles', () => {
    const home = readFileSync('dist/index.html', 'utf8');
    const about = readFileSync('dist/about/index.html', 'utf8');

    expect(home).toContain('把复杂业务，做成真正可用的产品。');
    expect(home.indexOf('项目作品')).toBeLessThan(home.indexOf('最近写下的内容'));
    expect(about).toContain('我不只写代码，也负责让产品落地。');
    expect(about).toContain('7 年');
    expect(about).toContain('PHP/Laravel');
    expect(home).not.toContain('Field Notes');
  });

  it('builds search, feeds, sitemap, and about outputs', () => {
    expect(existsSync('dist/search/index.html')).toBe(true);
    expect(existsSync('dist/about/index.html')).toBe(true);
    expect(existsSync('dist/rss.xml')).toBe(true);
    expect(existsSync('dist/sitemap-index.xml')).toBe(true);
    expect(existsSync('dist/pagefind/pagefind.js')).toBe(true);

    const search = readFileSync('dist/search/index.html', 'utf8');
    expect(search).toContain("import('/pagefind/pagefind.js')");
    expect(search).not.toContain('__VITE_PRELOAD__');
  });

  it('builds comment hosts and the fixed global guestbook mapping', () => {
    expect(existsSync('dist/guestbook/index.html')).toBe(true);

    const guestbook = readFileSync('dist/guestbook/index.html', 'utf8');
    const article = readFileSync('dist/articles/redisearch-result-set/index.html', 'utf8');
    const project = readFileSync('dist/projects/field-notes/index.html', 'utf8');
    expect(guestbook).toContain('global-guestbook');
    expect(article).toContain('data-giscus-host');
    expect(project).toContain('data-giscus-host');
  });

  it('publishes crawler and browser identity assets', () => {
    expect(existsSync('dist/robots.txt')).toBe(true);
    expect(existsSync('dist/favicon.svg')).toBe(true);

    const robots = readFileSync('dist/robots.txt', 'utf8');
    expect(robots).toContain('https://field-notes-2fi.pages.dev/sitemap-index.xml');
  });
});
