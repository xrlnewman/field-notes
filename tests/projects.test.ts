import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

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
  title: '示例工具',
  description: '解决一个明确问题。',
  publishedAt: '2026-07-14',
  status: 'completed' as const,
  category: '开发工具' as const,
  tech: ['TypeScript'],
  draft: false,
};

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
});

describe('project category helpers', () => {
  const projects = [
    { data: { category: '开发工具' as const } },
    { data: { category: '数据与搜索' as const } },
    { data: { category: '开发工具' as const } },
  ];

  it('uses the fixed public category order', () => {
    expect(projectCategories).toEqual([
      '网站产品',
      '业务系统',
      '开发工具',
      '数据与搜索',
      'AI 自动化',
    ]);
  });

  it('returns unique categories in configured order', () => {
    expect(getProjectCategories(projects)).toEqual(['全部', '开发工具', '数据与搜索']);
  });

  it('matches all or one category', () => {
    expect(matchesProjectCategory('开发工具', '全部')).toBe(true);
    expect(matchesProjectCategory('开发工具', '数据与搜索')).toBe(false);
  });

  it('returns every configured category with a public project count', () => {
    expect(getProjectCategoryStats([
      { data: { category: '网站产品' as const } },
      { data: { category: '网站产品' as const } },
    ])).toEqual([
      { category: '网站产品', count: 2 },
      { category: '业务系统', count: 0 },
      { category: '开发工具', count: 0 },
      { category: '数据与搜索', count: 0 },
      { category: 'AI 自动化', count: 0 },
    ]);
  });

  it('restores only a configured category from the query string', () => {
    expect(parseProjectCategory('数据与搜索')).toBe('数据与搜索');
    expect(parseProjectCategory('不存在的分类')).toBe('全部');
    expect(parseProjectCategory(null)).toBe('全部');
  });

  it('builds an encoded project category link', () => {
    expect(getProjectCategoryHref('AI 自动化')).toBe(
      '/projects/?category=AI%20%E8%87%AA%E5%8A%A8%E5%8C%96',
    );
  });

  it('sets a configured category while preserving other URL parts', () => {
    expect(getProjectCategoryUrl(
      'https://example.com/projects/?sort=recent#gallery',
      '数据与搜索',
    )).toBe(
      'https://example.com/projects/?sort=recent&category=%E6%95%B0%E6%8D%AE%E4%B8%8E%E6%90%9C%E7%B4%A2#gallery',
    );
  });

  it('removes only the category parameter for the all filter', () => {
    expect(getProjectCategoryUrl(
      'https://example.com/projects/?category=%E5%BC%80%E5%8F%91%E5%B7%A5%E5%85%B7&sort=recent',
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
