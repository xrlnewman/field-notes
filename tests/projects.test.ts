import { describe, expect, it } from 'vitest';

import { projectSchema } from '../src/lib/project-schema';
import { getProjectCategories, matchesProjectCategory } from '../src/lib/projects';

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
    { data: { category: '数据工具' as const } },
    { data: { category: '开发工具' as const } },
  ];

  it('returns unique categories in configured order', () => {
    expect(getProjectCategories(projects)).toEqual(['全部', '开发工具', '数据工具']);
  });

  it('matches all or one category', () => {
    expect(matchesProjectCategory('开发工具', '全部')).toBe(true);
    expect(matchesProjectCategory('开发工具', '数据工具')).toBe(false);
  });
});
