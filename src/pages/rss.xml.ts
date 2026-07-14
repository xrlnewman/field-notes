import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

import { siteConfig } from '../config/site';
import { isVisibleEntry, sortByPublishedAt } from '../lib/content';

export async function GET(context: { site?: URL }) {
  const articles = sortByPublishedAt(
    (await getCollection('articles')).filter((entry) => isVisibleEntry(entry, import.meta.env.PROD)),
  );

  return rss({
    title: siteConfig.title,
    description: siteConfig.description,
    site: context.site ?? new URL('https://field-notes.pages.dev'),
    customData: '<language>zh-CN</language>',
    items: articles.map((article) => ({
      title: article.data.title,
      description: article.data.description,
      pubDate: article.data.publishedAt,
      link: `/articles/${article.id}/`,
      categories: article.data.tags,
    })),
  });
}
