import { existsSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('static site build', () => {
  it('builds the home and 404 pages with the theme initializer', () => {
    expect(existsSync('dist/index.html')).toBe(true);
    expect(existsSync('dist/404.html')).toBe(true);

    const home = readFileSync('dist/index.html', 'utf8');
    expect(home).toContain('data-theme-toggle');
  });

  it('builds the project index and project details from content', () => {
    expect(existsSync('dist/projects/index.html')).toBe(true);
    expect(existsSync('dist/projects/field-notes/index.html')).toBe(true);

    const projects = readFileSync('dist/projects/index.html', 'utf8');
    expect(projects).toContain('Field Notes');
  });

  it('builds article details and tag indexes', () => {
    expect(existsSync('dist/articles/redisearch-result-set/index.html')).toBe(true);
    expect(existsSync('dist/tags/git/index.html')).toBe(true);

    const article = readFileSync('dist/articles/redisearch-result-set/index.html', 'utf8');
    expect(article).toContain('文章目录');
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
  });
});
