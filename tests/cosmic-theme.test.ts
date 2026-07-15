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

  it('falls back to the default theme when reading storage throws', () => {
    const layout = readText('src/layouts/BaseLayout.astro');
    const startupScript = layout.match(/<script is:inline>\s*([\s\S]*?)\s*<\/script>/)?.[1];
    const root = {
      dataset: {} as Record<string, string>,
      style: {} as Record<string, string>,
    };
    const storage = {
      getItem: () => {
        throw new Error('storage unavailable');
      },
    };

    expect(startupScript).toBeDefined();
    const runStartup = Function('localStorage', 'document', startupScript ?? '');
    expect(() => runStartup(storage, { documentElement: root })).not.toThrow();
    expect(root.dataset.theme).toBe('observatory');
    expect(root.style.colorScheme).toBe('dark');
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

  it('selects and synchronizes the stored theme before first paint', () => {
    const toggle = readText('src/components/ThemeToggle.astro');
    const inlineSync = toggle.indexOf('<script is:inline>');
    const interactiveScript = toggle.indexOf('<script>', inlineSync + 1);

    expect(toggle).not.toContain('DEFAULT_COSMIC_THEME');
    expect(toggle).toContain('aria-pressed="false"');
    expect(inlineSync).toBeGreaterThan(toggle.indexOf('</div>'));
    expect(interactiveScript).toBeGreaterThan(inlineSync);
    expect(toggle).toContain('document.currentScript?.previousElementSibling');
    for (const theme of cosmicThemes) {
      expect(toggle).toContain(
        `:global(:root[data-theme='${theme.id}']) .theme-toggle button[data-theme='${theme.id}']`,
      );
    }
  });

  it('updates controls and emits the theme event when writing storage throws', () => {
    const toggle = readText('src/components/ThemeToggle.astro');

    expect(toggle).toMatch(
      /try\s*{\s*localStorage\.setItem\(COSMIC_THEME_STORAGE_KEY, theme\);\s*}\s*catch\s*{[^}]*}\s*updateButtons\(theme\);\s*document\.dispatchEvent/s,
    );
  });

  it('uses full desktop labels, compact mobile labels, and motion-safe transitions', () => {
    const toggle = readText('src/components/ThemeToggle.astro');

    expect(toggle).toContain('{theme.label}');
    expect(toggle).toContain('{theme.shortLabel}');
    expect(toggle).toMatch(/\.theme-toggle__short-label\s*\{[^}]*display:\s*none;/);
    expect(toggle).toMatch(/@media\s*\(max-width:\s*520px\)/);
    expect(toggle).toContain('transition: color 280ms ease, background-color 280ms ease;');
    expect(toggle).toMatch(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.theme-toggle button\s*\{[^}]*transition:\s*none;/,
    );
  });
});
