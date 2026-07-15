import { existsSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('giscus configuration', () => {
  it('restores the validated public repository config and cosmic theme mapping', async () => {
    expect(existsSync('src/lib/giscus.ts')).toBe(true);

    const {
      defaultGiscusConfig,
      readGiscusConfig,
      resolveGiscusConfig,
      resolveGiscusTheme,
    } = await import('../src/lib/giscus');

    expect(defaultGiscusConfig).toEqual({
      repo: 'xrlnewman/field-notes',
      repoId: 'R_kgDOTX84ug',
      category: 'General',
      categoryId: 'DIC_kwDOTX84us4DBKfw',
    });
    expect(readGiscusConfig({ PUBLIC_GISCUS_REPO: 'owner/repo' })).toBeNull();
    expect(readGiscusConfig({
      PUBLIC_GISCUS_REPO: 'owner/repo',
      PUBLIC_GISCUS_REPO_ID: 'R_1',
      PUBLIC_GISCUS_CATEGORY: 'Comments',
      PUBLIC_GISCUS_CATEGORY_ID: 'DIC_1',
    })).toEqual({
      repo: 'owner/repo',
      repoId: 'R_1',
      category: 'Comments',
      categoryId: 'DIC_1',
    });
    expect(resolveGiscusConfig({})).toEqual(defaultGiscusConfig);
    expect(() => resolveGiscusConfig({
      PUBLIC_GISCUS_REPO: 'staging/repo',
    })).toThrow('Giscus 环境变量必须四项同时配置且格式正确');
    expect(resolveGiscusTheme('observatory')).toBe('transparent_dark');
    expect(resolveGiscusTheme('nebula')).toBe('dark');
    expect(resolveGiscusTheme('terminal')).toBe('dark_high_contrast');
    expect(resolveGiscusTheme('unknown')).toBe('transparent_dark');
  });
});
