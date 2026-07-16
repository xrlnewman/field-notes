import { existsSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';
import { parse as parseYaml } from 'yaml';

import { projectSchema } from '../src/lib/project-schema';
import {
  getProjectCategoryHref,
  getProjectCategories,
  getProjectCategoryStats,
  getProjectCategoryUrl,
  matchesProjectCategory,
  parseProjectCategory,
  projectCategories,
} from '../src/lib/projects';

const baseProject = {
  title: '示例网站',
  description: '解决一个明确问题。',
  publishedAt: '2026-07-14',
  status: 'completed' as const,
  category: '个人品牌' as const,
  tech: ['TypeScript'],
  draft: false,
};

const screenshot = {
  src: '/images/projects/example/home.png',
  alt: '示例网站首页',
  title: '网站首页',
  caption: '展示网站的主要入口。',
  viewport: 'desktop' as const,
  width: 1440,
  height: 900,
};

function createScreenshots(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    ...screenshot,
    src: `/images/projects/example/screen-${index + 1}.png`,
  }));
}

function readProjectFrontmatter(slug: string): Record<string, unknown> {
  const markdown = readFileSync(`src/content/projects/${slug}.md`, 'utf8');
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);

  if (!match?.[1]) throw new Error(`${slug} 缺少 YAML frontmatter`);
  return parseYaml(match[1]) as Record<string, unknown>;
}

function readOptional(path: string): string {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function readPngDimensions(path: string): { width: number; height: number } {
  const png = readFileSync(path);
  return {
    width: png.readUInt32BE(16),
    height: png.readUInt32BE(20),
  };
}

describe('project publishing rules', () => {
  it('rejects a public project without a cover and repository', () => {
    const result = projectSchema.safeParse({
      ...baseProject,
      screenshots: createScreenshots(4),
    });

    expect(result.success).toBe(false);
    if (result.success) throw new Error('缺少封面和仓库的公开项目不应通过');
    expect(result.error.issues.map((issue) => issue.path[0]).toSorted()).toEqual([
      'cover',
      'repoUrl',
    ]);
  });

  it('allows an incomplete project only while it remains a draft', () => {
    expect(projectSchema.safeParse({ ...baseProject, draft: true }).success).toBe(true);
  });

  it('accepts a public project with a local cover and GitHub repository', () => {
    const result = projectSchema.safeParse({
      ...baseProject,
      cover: '/images/projects/example.png',
      repoUrl: 'https://github.com/xrlnewman/example',
      screenshots: createScreenshots(4),
    });
    expect(result.success).toBe(true);
  });

  it('rejects a public project without screenshots while drafts may omit them', () => {
    const publicProject = {
      ...baseProject,
      cover: '/images/projects/example.png',
      repoUrl: 'https://github.com/xrlnewman/example',
    };

    expect(projectSchema.safeParse(publicProject).success).toBe(false);
    expect(projectSchema.safeParse({ ...publicProject, draft: true }).success).toBe(true);
  });

  it('accepts the four and six screenshot publishing boundaries', () => {
    const publicProject = {
      ...baseProject,
      cover: '/images/projects/example.png',
      repoUrl: 'https://github.com/xrlnewman/example',
    };

    expect(projectSchema.safeParse({
      ...publicProject,
      screenshots: createScreenshots(4),
    }).success).toBe(true);
    expect(projectSchema.safeParse({
      ...publicProject,
      screenshots: createScreenshots(6),
    }).success).toBe(true);
  });

  it('rejects the three and seven screenshot publishing boundaries', () => {
    const publicProject = {
      ...baseProject,
      cover: '/images/projects/example.png',
      repoUrl: 'https://github.com/xrlnewman/example',
    };

    expect(projectSchema.safeParse({
      ...publicProject,
      screenshots: createScreenshots(3),
    }).success).toBe(false);
    expect(projectSchema.safeParse({
      ...publicProject,
      screenshots: createScreenshots(7),
    }).success).toBe(false);
  });

  it('rejects malformed screenshot metadata', () => {
    const screenshots = Array.from({ length: 4 }, () => screenshot);
    const publicProject = {
      ...baseProject,
      cover: '/images/projects/example.png',
      repoUrl: 'https://github.com/xrlnewman/example',
      screenshots: createScreenshots(4),
    };

    expect(projectSchema.safeParse({
      ...publicProject,
      screenshots: [{ ...screenshot, viewport: 'tablet' }, ...screenshots.slice(1)],
    }).success).toBe(false);
    expect(projectSchema.safeParse({
      ...publicProject,
      screenshots: [{ ...screenshot, width: 0 }, ...screenshots.slice(1)],
    }).success).toBe(false);
  });

  it('accepts repository nodes only when every URL is GitHub HTTPS', () => {
    const validRepository = {
      name: 'example-web',
      role: 'frontend',
      description: '网站前台。',
      tech: ['Vue 3'],
      url: 'https://github.com/xrlnewman/example-web',
    };

    expect(projectSchema.safeParse({
      ...baseProject,
      cover: '/images/projects/example.png',
      repoUrl: 'https://github.com/xrlnewman/example',
      screenshots: createScreenshots(4),
      repositories: [validRepository],
    }).success).toBe(true);
    expect(projectSchema.safeParse({
      ...baseProject,
      cover: '/images/projects/example.png',
      repoUrl: 'https://github.com/xrlnewman/example',
      screenshots: createScreenshots(4),
      repositories: [{ ...validRepository, url: 'http://github.com/xrlnewman/example-web' }],
    }).success).toBe(false);
    expect(projectSchema.safeParse({
      ...baseProject,
      cover: '/images/projects/example.png',
      repoUrl: 'https://github.com/xrlnewman/example',
      screenshots: createScreenshots(4),
      repositories: [{ ...validRepository, url: 'https://example.com/example-web' }],
    }).success).toBe(false);
  });

  it.each(['multi-merchant-mall', 'linli-community', 'skyboom-corporate'])(
    '%s links one frontend, admin, and backend repository',
    (slug) => {
      const frontmatter = readProjectFrontmatter(slug);
      const repositories = frontmatter.repositories as Array<{ role: string }>;
      const roles = repositories.map(({ role }) => role);

      expect(repositories).toHaveLength(3);
      expect(new Set(roles).size).toBe(3);
      expect(roles.toSorted()).toEqual(['admin', 'backend', 'frontend']);
      expect(projectSchema.safeParse(frontmatter).success).toBe(true);
    },
  );

  it.each([
    ['field-notes', 4],
    ['linli-community', 5],
    ['multi-merchant-mall', 5],
    ['skyboom-corporate', 5],
    ['storeflow-platform', 4],
    ['stockflow-platform', 4],
    ['eduflow-platform', 4],
  ] as const)(
    '%s publishes its complete real screenshot set',
    (slug, count) => {
      const frontmatter = readProjectFrontmatter(slug);
      const screenshots = frontmatter.screenshots as Array<{
        src: string;
        width: number;
        height: number;
      }>;

      expect(screenshots).toHaveLength(count);
      for (const screenshot of screenshots) {
        const imagePath = `public${screenshot.src}`;
        expect(existsSync(imagePath), screenshot.src).toBe(true);
        expect(screenshot.width).toBeGreaterThan(0);
        expect(screenshot.height).toBeGreaterThan(0);
        expect(readPngDimensions(imagePath)).toEqual({
          width: screenshot.width,
          height: screenshot.height,
        });
      }
    },
  );

  it('pins the exact nine public repositories to an auditable root snapshot', () => {
    const expected = [
      ['linli-admin', '3d056d8'],
      ['linli-mp', '318421a'],
      ['linli-server', '693e779'],
      ['mall-admin', 'f87f004'],
      ['mall-h5', 'ebfffbf'],
      ['mall-system', '1020d07'],
      ['skyboom-admin', '47c717b'],
      ['skyboom-server', 'cb01d5e'],
      ['skyboom-web', 'b006d02'],
    ] as const;
    const actualUrls = ['multi-merchant-mall', 'linli-community', 'skyboom-corporate']
      .flatMap((slug) => {
        const frontmatter = readProjectFrontmatter(slug);
        return (frontmatter.repositories as Array<{ url: string }>).map(({ url }) => url);
      })
      .toSorted();
    const expectedUrls = expected
      .map(([repository]) => `https://github.com/xrlnewman/${repository}`)
      .toSorted();
    const audit = readOptional('docs/public-website-repositories-audit.md');

    expect(actualUrls).toEqual(expectedUrls);
    for (const [repository, commit] of expected) {
      expect(audit).toContain(`https://github.com/xrlnewman/${repository}`);
      expect(audit).toContain(commit);
    }
    expect(audit).toContain('无父提交的源码快照');
    expect(audit).toContain('private=false');
  });
});

describe('project category helpers', () => {
  const projects = [
    { data: { category: '电商平台' as const } },
    { data: { category: '企业官网' as const } },
    { data: { category: '电商平台' as const } },
  ];

  it('uses the fixed public category order', () => {
    expect(projectCategories).toEqual([
      '个人品牌',
      '电商平台',
      '社区服务',
      '企业官网',
      '门店经营',
      '供应链管理',
      '教育培训',
      '物流运输',
      '医疗健康',
      '人力资源',
      '财务管理',
      '销售管理',
      '合同管理',
      '物业服务',
      '客户服务',
      '文体活动',
      '零售餐饮',
      '生活服务',
      '工业能源',
    ]);
  });

  it('introduces the directory as a constellation of complete products', () => {
    const projectsPage = readFileSync('src/pages/projects/index.astro', 'utf8');

    expect(projectsPage).toContain('二十个可运行的网站产品');
    expect(projectsPage).toContain('前台、运营后台与服务端之间的关联');
  });

  it('returns unique categories in configured order', () => {
    expect(getProjectCategories(projects)).toEqual(['全部', '电商平台', '企业官网']);
  });

  it('matches all or one category', () => {
    expect(matchesProjectCategory('电商平台', '全部')).toBe(true);
    expect(matchesProjectCategory('电商平台', '企业官网')).toBe(false);
  });

  it('returns every configured category with a public project count', () => {
    expect(getProjectCategoryStats([
      { data: { category: '个人品牌' as const } },
      { data: { category: '个人品牌' as const } },
    ])).toEqual([
      { category: '个人品牌', count: 2 },
      { category: '电商平台', count: 0 },
      { category: '社区服务', count: 0 },
      { category: '企业官网', count: 0 },
      { category: '门店经营', count: 0 },
      { category: '供应链管理', count: 0 },
      { category: '教育培训', count: 0 },
      { category: '物流运输', count: 0 },
      { category: '医疗健康', count: 0 },
      { category: '人力资源', count: 0 },
      { category: '财务管理', count: 0 },
      { category: '销售管理', count: 0 },
      { category: '合同管理', count: 0 },
      { category: '物业服务', count: 0 },
      { category: '客户服务', count: 0 },
      { category: '文体活动', count: 0 },
      { category: '零售餐饮', count: 0 },
      { category: '生活服务', count: 0 },
      { category: '工业能源', count: 0 },
    ]);
  });

  it('restores only a configured category from the query string', () => {
    expect(parseProjectCategory('社区服务')).toBe('社区服务');
    expect(parseProjectCategory('不存在的分类')).toBe('全部');
    expect(parseProjectCategory(null)).toBe('全部');
  });

  it('builds an encoded project category link', () => {
    expect(getProjectCategoryHref('企业官网')).toBe(
      '/projects/?category=%E4%BC%81%E4%B8%9A%E5%AE%98%E7%BD%91',
    );
  });

  it('sets a configured category while preserving other URL parts', () => {
    expect(getProjectCategoryUrl(
      'https://example.com/projects/?sort=recent#gallery',
      '社区服务',
    )).toBe(
      'https://example.com/projects/?sort=recent&category=%E7%A4%BE%E5%8C%BA%E6%9C%8D%E5%8A%A1#gallery',
    );
  });

  it('removes only the category parameter for the all filter', () => {
    expect(getProjectCategoryUrl(
      'https://example.com/projects/?category=%E7%94%B5%E5%95%86%E5%B9%B3%E5%8F%B0&sort=recent',
      '全部',
    )).toBe('https://example.com/projects/?sort=recent');
  });

  it('renders category links as a compact touch-friendly navigation', () => {
    const categoryGrid = readFileSync('src/components/ProjectCategoryGrid.astro', 'utf8');

    expect(categoryGrid).toContain('overflow-x: auto;');
    expect(categoryGrid).toMatch(/\.project-category-grid a \{[^}]*min-height: 44px;/);
    expect(categoryGrid).not.toContain('min-height: 150px;');
    expect(categoryGrid).not.toContain('project-category-grid__action');
  });

  it('gives project filters a 44px minimum height in their base rule', () => {
    const gallery = readFileSync('src/components/ProjectGallery.astro', 'utf8');

    expect(gallery).toMatch(/\.project-filters button \{[^}]*min-height: 44px;/);
  });

  it('keeps filtered project cards visually hidden despite their flex layout', () => {
    const card = readFileSync('src/components/ProjectCard.astro', 'utf8');

    expect(card).toMatch(/\.project-card\[hidden\] \{[^}]*display: none;/);
  });

  it('renders every project image at the real 1440 by 900 ratio without cropping', () => {
    const card = readFileSync('src/components/ProjectCard.astro', 'utf8');
    const layout = readFileSync('src/layouts/ProjectLayout.astro', 'utf8');

    for (const source of [card, layout]) {
      expect(source).toContain('width="1440" height="900"');
      expect(source).toContain('aspect-ratio: 16 / 10;');
      expect(source).toContain('object-fit: contain;');
    }
    expect(card).not.toContain('aspect-ratio: auto;');
  });

  it('documents single-repository, multi-repository, and hidden showcase conventions', () => {
    const readme = readFileSync('README.md', 'utf8');

    expect(readme).toContain('单仓项目使用 `repoUrl`');
    expect(readme).toContain('多仓项目使用 `repositories`');
    expect(readme).toContain('`showcase/` 保留的是已隐藏工具项目的脱敏源码快照');
    expect(readme).toContain('不会出现在网站项目列表');
  });

  it('renders every related repository as a semantic product panorama', () => {
    const layout = readFileSync('src/layouts/ProjectLayout.astro', 'utf8');
    const constellation = readOptional('src/components/RepositoryConstellation.astro');

    expect.soft(layout).toContain('产品全景');
    expect.soft(layout).toContain('<RepositoryConstellation repositories={data.repositories ?? []} />');
    expect.soft(constellation).toContain('<ul');
    expect.soft(constellation).toContain('repositories.map((repository)');
    expect.soft(constellation).toContain('{repository.name}');
    expect.soft(constellation).toContain('{roleLabels[repository.role]}');
    expect.soft(constellation).toContain('{repository.description}');
    expect.soft(constellation).toContain('repository.tech.map');
    expect.soft(constellation).toContain('href={repository.url}');
    expect.soft(constellation).toContain('target="_blank"');
    expect.soft(constellation).toContain('rel="noopener noreferrer"');
  });

  it('describes single and multi-repository products without contradicting their structure', () => {
    const layout = readFileSync('src/layouts/ProjectLayout.astro', 'utf8');

    expect.soft(layout).toContain(
      'const hasMultipleRepositories = (data.repositories?.length ?? 0) > 1;',
    );
    expect.soft(layout).toContain('hasMultipleRepositories');
    expect.soft(layout).toContain('按用户前台、运营后台和服务端拆分职责');
    expect.soft(layout).toContain('由一个仓库完整维护产品与源码');
  });

  it('treats a missing or explicitly empty repositories list as the primary repository', () => {
    const card = readFileSync('src/components/ProjectCard.astro', 'utf8');

    expect.soft(card).toContain('const repositoryCount = repositories?.length || 1;');
    expect.soft(card).not.toContain('repositories?.length ?? 1');
    expect.soft(card.match(/repositoryCount/g)).toHaveLength(3);
  });

  it('keeps product descriptions readable instead of truncating them to one line', () => {
    const card = readFileSync('src/components/ProjectCard.astro', 'utf8');
    const descriptionRule = card.match(/\.project-card__description\s*\{([^}]*)\}/)?.[1] ?? '';

    expect.soft(card).toContain('class="project-card__description"');
    expect.soft(descriptionRule).not.toContain('white-space: nowrap');
    expect.soft(descriptionRule).not.toContain('text-overflow: ellipsis');
  });

  it('does not restore the old tool-category explainer grid', () => {
    const home = readFileSync('src/pages/index.astro', 'utf8');
    const projectsPage = readFileSync('src/pages/projects/index.astro', 'utf8');

    expect.soft(home).not.toContain('<ProjectCategoryGrid');
    expect.soft(projectsPage).not.toContain('categoryDescriptions');
    expect.soft(projectsPage).not.toContain('project-catalog__categories');
    expect.soft(projectsPage).not.toContain('grid-template-columns: repeat(5');
  });
});
