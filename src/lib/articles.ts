export const articleCategories = [
  '高并发',
  '大数据',
  'AI 应用',
  'Agent 架构',
  '云原生',
  '安全工程',
  '数据工程',
  '实时系统',
  '工程实践',
] as const;

export type ArticleCategory = typeof articleCategories[number];

export function getArticleCategoryStats<T extends { data: { category: ArticleCategory } }>(
  articles: readonly T[],
): Array<{ category: ArticleCategory; count: number }> {
  return articleCategories.map((category) => ({
    category,
    count: articles.filter((article) => article.data.category === category).length,
  }));
}

export function parseArticleCategory(value: string | null): ArticleCategory | '全部' {
  return articleCategories.includes(value as ArticleCategory)
    ? value as ArticleCategory
    : '全部';
}
