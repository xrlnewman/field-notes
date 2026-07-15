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

  it('keeps the home hero compact and every product in one shared grid', () => {
    const home = read('src/pages/index.astro');
    const card = read('src/components/ProjectCard.astro');

    expect(home).toContain('max-height: 620px;');
    expect(home).toContain('grid-template-columns: minmax(0, 7fr) minmax(320px, 5fr);');
    expect(home).toContain('font-size: clamp(3.25rem, 5vw, 4rem);');
    expect(card).not.toContain('grid-column: 1 / -1;');
    expect(card).toContain('min-height: 280px;');
  });

  it('keeps the narrow home hero visible and its title at or below 44px', () => {
    const home = read('src/pages/index.astro');
    const mobile = home.slice(home.indexOf('@media (max-width: 760px) {'));

    expect.soft(mobile).toContain('max-height: none;');
    expect.soft(mobile).toContain('font-size: clamp(2.5rem, 10vw, 2.75rem);');
  });

  it('keeps project directory cards in the same two-column editorial grid', () => {
    const page = read('src/pages/projects/index.astro');
    const gallery = read('src/components/ProjectGallery.astro');

    expect(page).toContain('grid-template-columns: minmax(0, 1fr) auto;');
    expect(gallery).toContain('grid-template-columns: repeat(2, minmax(0, 1fr));');
  });
});
