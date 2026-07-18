import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

import { projectSchema } from './lib/project-schema';
import { articleCategories } from './lib/articles';

const baseFields = {
  title: z.string().min(1),
  description: z.string().min(1),
  publishedAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  draft: z.boolean().default(false),
  featured: z.boolean().default(false),
};

export const articleSchema = z.object({
  ...baseFields,
  category: z.enum(articleCategories),
  tags: z.array(z.string().min(1)).default([]),
  cover: z.string().optional(),
});

const articles = defineCollection({
  loader: glob({ base: './src/content/articles', pattern: '**/*.{md,mdx}' }),
  schema: articleSchema,
});

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.{md,mdx}' }),
  schema: projectSchema,
});

export const collections = { articles, projects };

export type ArticleData = z.infer<typeof articleSchema>;
export { projectSchema } from './lib/project-schema';
export type { ProjectData } from './lib/project-schema';
