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
});
