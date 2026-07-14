import { describe, expect, it } from 'vitest';

import { readGiscusConfig } from '../src/lib/giscus';

describe('giscus configuration', () => {
  it('returns null when any required public value is absent', () => {
    expect(readGiscusConfig({ PUBLIC_GISCUS_REPO: 'owner/repo' })).toBeNull();
  });

  it('returns null when repository name is malformed', () => {
    expect(readGiscusConfig({
      PUBLIC_GISCUS_REPO: 'repo-only',
      PUBLIC_GISCUS_REPO_ID: 'R_1',
      PUBLIC_GISCUS_CATEGORY: 'Comments',
      PUBLIC_GISCUS_CATEGORY_ID: 'DIC_1',
    })).toBeNull();
  });

  it('returns a complete validated configuration', () => {
    const config = readGiscusConfig({
      PUBLIC_GISCUS_REPO: 'owner/repo',
      PUBLIC_GISCUS_REPO_ID: 'R_1',
      PUBLIC_GISCUS_CATEGORY: 'Comments',
      PUBLIC_GISCUS_CATEGORY_ID: 'DIC_1',
    });

    expect(config).toEqual({
      repo: 'owner/repo',
      repoId: 'R_1',
      category: 'Comments',
      categoryId: 'DIC_1',
    });
  });
});
