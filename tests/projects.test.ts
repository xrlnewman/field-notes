import { readFileSync } from 'node:fs';

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

function readProjectFrontmatter(slug: string): Record<string, unknown> {
  const markdown = readFileSync(`src/content/projects/${slug}.md`, 'utf8');
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);

  if (!match?.[1]) throw new Error(`${slug} 缺少 YAML frontmatter`);
  return parseYaml(match[1]) as Record<string, unknown>;
}

describe('project publishing rules', () => {
  it('rejects a public project without a cover and repository', () => {
    expect(projectSchema.safeParse(baseProject).success).toBe(false);
  });

  it('allows an incomplete project only while it remains a draft', () => {
    expect(projectSchema.safeParse({ ...baseProject, draft: true }).success).toBe(true);
  });

  it('accepts a public project with a local cover and GitHub repository', () => {
    const result = projectSchema.safeParse({
      ...baseProject,
      cover: '/images/projects/example.png',
      repoUrl: 'https://github.com/xrlnewman/example',
    });
    expect(result.success).toBe(true);
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
      repositories: [validRepository],
    }).success).toBe(true);
    expect(projectSchema.safeParse({
      ...baseProject,
      cover: '/images/projects/example.png',
      repoUrl: 'https://github.com/xrlnewman/example',
      repositories: [{ ...validRepository, url: 'http://github.com/xrlnewman/example-web' }],
    }).success).toBe(false);
    expect(projectSchema.safeParse({
      ...baseProject,
      cover: '/images/projects/example.png',
      repoUrl: 'https://github.com/xrlnewman/example',
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
    ]);
  });

  it('provides a project-page description for every public category', () => {
    const projectsPage = readFileSync('src/pages/projects/index.astro', 'utf8');

    for (const category of projectCategories) {
      expect(projectsPage).toContain(`${category}:`);
    }
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
});
