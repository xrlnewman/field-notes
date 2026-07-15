import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

describe('project screenshot gallery', () => {
  it('renders a progressive gallery with captions, thumbnails, and dialog controls', () => {
    const gallery = read('src/components/ProjectScreenshots.astro');
    const layout = read('src/layouts/ProjectLayout.astro');

    expect(gallery).toContain('data-project-screenshots');
    expect(gallery).toContain('data-screenshot-stage');
    expect(gallery).toContain('aria-current');
    expect(gallery).toContain('<dialog');
    expect(gallery).toContain('aria-label="上一张截图"');
    expect(gallery).toContain('aria-label="下一张截图"');
    expect(gallery).toContain('aria-label="关闭大图"');
    expect(gallery).toContain('<noscript>');
    expect(gallery).toContain('min-height: 44px;');
    expect(gallery).toContain('@media (prefers-reduced-motion: reduce)');
    expect(layout).toContain('<ProjectScreenshots');
    expect(layout.indexOf('<ProjectScreenshots')).toBeLessThan(layout.indexOf('project-panorama'));
  });
});
