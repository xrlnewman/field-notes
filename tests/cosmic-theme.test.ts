import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  COSMIC_THEME_STORAGE_KEY,
  DEFAULT_COSMIC_THEME,
  cosmicThemes,
  isCosmicTheme,
  resolveCosmicTheme,
} from '../src/lib/cosmic-theme';

const readText = (path: string) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

describe('cosmic theme model', () => {
  it('publishes the three themes in the required order', () => {
    expect(cosmicThemes.map(({ id, label }) => ({ id, label }))).toEqual([
      { id: 'observatory', label: '深空观测站' },
      { id: 'nebula', label: '梦幻银河' },
      { id: 'terminal', label: '宇宙终端' },
    ]);
  });

  it('uses a fixed storage key and the observatory fallback', () => {
    expect(COSMIC_THEME_STORAGE_KEY).toBe('cosmic-theme');
    expect(DEFAULT_COSMIC_THEME).toBe('observatory');
    expect(resolveCosmicTheme('unsupported')).toBe('observatory');
  });

  it('accepts only supported cosmic theme values', () => {
    expect(cosmicThemes.every(({ id }) => isCosmicTheme(id))).toBe(true);
    expect(isCosmicTheme('dark')).toBe(false);
    expect(isCosmicTheme(null)).toBe(false);
  });
});

describe('cosmic theme startup and controls', () => {
  it('applies a validated stored theme before first paint', () => {
    const layout = readText('src/layouts/BaseLayout.astro');

    expect(layout).toContain("localStorage.getItem('cosmic-theme')");
    expect(layout).toContain("['observatory', 'nebula', 'terminal']");
    expect(layout).toContain('document.documentElement.dataset.theme = theme;');
    expect(layout).toContain("document.documentElement.style.colorScheme = 'dark';");
  });

  it('renders one accessible button for each cosmic theme', () => {
    const toggle = readText('src/components/ThemeToggle.astro');

    expect(toggle).toContain('role="group"');
    expect(toggle).toContain('aria-label="星空主题"');
    expect(toggle).toContain('cosmicThemes.map');
    expect(toggle).toContain('type="button"');
    expect(toggle).toContain('aria-pressed');
    expect(toggle).toContain('data-theme={theme.id}');
  });
});
