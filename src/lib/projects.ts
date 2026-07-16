export const projectCategories = ['个人品牌', '电商平台', '社区服务', '企业官网', '门店经营'] as const;

export type ProjectCategory = typeof projectCategories[number];
export type ProjectCategoryFilter = '全部' | ProjectCategory;

export function getProjectCategories<T extends { data: { category: ProjectCategory } }>(
  projects: readonly T[],
): ProjectCategoryFilter[] {
  const present = new Set(projects.map((project) => project.data.category));
  return ['全部', ...projectCategories.filter((category) => present.has(category))];
}

export function getProjectCategoryStats<T extends { data: { category: ProjectCategory } }>(
  projects: readonly T[],
): Array<{ category: ProjectCategory; count: number }> {
  return projectCategories.map((category) => ({
    category,
    count: projects.filter((project) => project.data.category === category).length,
  }));
}

export function parseProjectCategory(value: string | null): ProjectCategoryFilter {
  return projectCategories.includes(value as ProjectCategory)
    ? value as ProjectCategory
    : '全部';
}

export function getProjectCategoryHref(category: ProjectCategory): string {
  return `/projects/?category=${encodeURIComponent(category)}`;
}

export function getProjectCategoryUrl(
  currentUrl: string,
  filter: ProjectCategoryFilter,
): string {
  const url = new URL(currentUrl);

  if (filter === '全部') {
    url.searchParams.delete('category');
  } else {
    url.searchParams.set('category', filter);
  }

  return url.toString();
}

export function matchesProjectCategory(
  category: ProjectCategory,
  filter: ProjectCategoryFilter,
): boolean {
  return filter === '全部' || category === filter;
}
