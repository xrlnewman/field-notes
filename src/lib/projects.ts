export const projectCategories = ['个人品牌', '电商平台', '社区服务', '企业官网', '门店经营', '供应链管理', '教育培训', '物流运输', '医疗健康', '人力资源', '财务管理', '销售管理', '合同管理', '物业服务', '客户服务', '文体活动', '零售餐饮', '生活服务', '工业能源', '售后服务', '采购供应链', '旅游住宿', '内容创作', '法律服务', '场馆运营'] as const;

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
