export const projectCategories = ['开发工具', '数据工具', 'AI 应用', '网站产品', '业务系统'] as const;

export type ProjectCategory = typeof projectCategories[number];
export type ProjectCategoryFilter = '全部' | ProjectCategory;

export function getProjectCategories<T extends { data: { category: ProjectCategory } }>(
  projects: readonly T[],
): ProjectCategoryFilter[] {
  const present = new Set(projects.map((project) => project.data.category));
  return ['全部', ...projectCategories.filter((category) => present.has(category))];
}

export function matchesProjectCategory(
  category: ProjectCategory,
  filter: ProjectCategoryFilter,
): boolean {
  return filter === '全部' || category === filter;
}
