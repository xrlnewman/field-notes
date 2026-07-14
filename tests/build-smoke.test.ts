import { existsSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('static site build', () => {
  it('builds the home and 404 pages with the theme initializer', () => {
    expect(existsSync('dist/index.html')).toBe(true);
    expect(existsSync('dist/404.html')).toBe(true);

    const home = readFileSync('dist/index.html', 'utf8');
    expect(home).toContain('data-theme-toggle');
  });
});
