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

  it('releases the home hero height as soon as it stacks at tablet widths', () => {
    const home = read('src/pages/index.astro');
    const tabletHero = home.match(
      /@media \(max-width: 960px\) \{[\s\S]*?\.hero-studio \{([^}]*)\}/,
    )?.[1] ?? '';

    expect(tabletHero).toContain('max-height: none;');
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

  it('uses a restrained split project hero and prose-aligned comments', () => {
    const layout = read('src/layouts/ProjectLayout.astro');

    expect(layout).toContain('grid-template-columns: minmax(0, 8fr) minmax(280px, 4fr);');
    expect(layout).toContain('font-size: clamp(3.25rem, 6vw, 4.5rem);');
    expect(layout).toContain('max-width: var(--prose);');
    expect(layout).toContain('<GiscusComments mapping="pathname" />');
  });

  it('caps the project detail title at 44px on narrow screens', () => {
    const layout = read('src/layouts/ProjectLayout.astro');
    const mobile = layout.slice(layout.indexOf('@media (max-width: 760px) {'));

    expect(mobile).toContain('font-size: clamp(2.5rem, 10vw, 2.75rem);');
  });

  it('integrates the guestbook explanation and GitHub discussion in one split layout', () => {
    const guestbook = read('src/pages/guestbook.astro');
    const comments = read('src/components/GiscusComments.astro');

    expect(guestbook).toContain('grid-template-columns: minmax(240px, 4fr) minmax(0, 8fr);');
    expect(guestbook).toContain('font-size: clamp(3rem, 5vw, 4rem);');
    expect(guestbook).toContain('mapping="specific" term="global-guestbook"');
    expect(comments).toContain('登录 GitHub 后即可参与');
  });

  it('caps the guestbook title at 44px on narrow screens', () => {
    const guestbook = read('src/pages/guestbook.astro');
    const mobile = guestbook.slice(guestbook.indexOf('@media (max-width: 760px) {'));

    expect(mobile).toContain('font-size: clamp(2.5rem, 10vw, 2.75rem);');
  });
});
