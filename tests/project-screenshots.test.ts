import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

describe('project screenshot gallery', () => {
  it('renders a progressive gallery with captions, thumbnails, and dialog controls', () => {
    const gallery = read('src/components/ProjectScreenshots.astro');
    const layout = read('src/layouts/ProjectLayout.astro');

    expect(gallery).toContain('data-project-screenshots');
    expect(gallery).toContain('data-screenshot-stage');
    expect(gallery).toContain('--screenshot-ratio:');
    expect(gallery).toContain("data-viewport={firstScreenshot.viewport}");
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

  it('keeps desktop stages proportional while framing mobile captures as devices', () => {
    const gallery = read('src/components/ProjectScreenshots.astro');

    expect(gallery).toContain("stage.style.setProperty('--screenshot-ratio'");
    expect(gallery).toContain(".project-screenshots__stage[data-viewport='mobile'] .project-screenshots__media::before");
    expect(gallery).toContain(".project-screenshots__stage[data-viewport='mobile'] .project-screenshots__media::after");
    expect(gallery).toContain('max-height: min(68vh, 680px);');
    expect(gallery).toContain('max-height: min(76vh, 720px);');
    expect(gallery).toContain("window.matchMedia('(max-width: 700px)')");
    expect(gallery).toContain('grid-template-columns: repeat(auto-fit, minmax(108px, 1fr));');
  });

  it('keeps the current screenshot explanation in the left column before the visual stage', () => {
    const gallery = read('src/components/ProjectScreenshots.astro');
    const stageIndex = gallery.indexOf('data-screenshot-stage');

    expect(stageIndex).toBeGreaterThan(-1);
    for (const hook of [
      'data-screenshot-progress',
      'data-screenshot-title',
      'data-screenshot-caption',
      'data-open-screenshot-dialog',
    ]) {
      expect(gallery.indexOf(hook), `${hook} should render before the screenshot stage`).toBeLessThan(stageIndex);
    }
  });

  it('uses a caller-provided stable heading id derived from the project id', () => {
    const gallery = read('src/components/ProjectScreenshots.astro');
    const layout = read('src/layouts/ProjectLayout.astro');

    expect(gallery).toContain('headingId: string;');
    expect(gallery).toContain('aria-labelledby={headingId}');
    expect(gallery).toContain('<h2 id={headingId}>');
    expect(gallery).not.toContain('id="project-screenshots-title"');

    expect(layout).toContain("project.id.replace(/\\.[^/.]+$/, '')");
    expect(layout).toContain("replace(/[^a-zA-Z0-9_-]+/g, '-')");
    expect(layout).toContain('headingId={projectScreenshotHeadingId}');
  });
});
