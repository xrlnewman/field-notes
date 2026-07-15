import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

describe('editorial cosmic layout', () => {
  it('defines the compact global rhythm and typography contract', () => {
    const globalStyles = read('src/styles/global.css');
    const header = read('src/components/Header.astro');

    expect(globalStyles).toContain('--content-narrow: 960px;');
    expect(globalStyles).toContain('--header-height: 68px;');
    expect(globalStyles).toContain('text-wrap: balance;');
    expect(globalStyles).toContain('overflow-wrap: anywhere;');
    expect(header).toContain('min-height: 44px;');
  });
});
