import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

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
  tags: z.array(z.string().min(1)).default([]),
  cover: z.string().optional(),
});

export const projectSchema = z.object({
  ...baseFields,
  status: z.enum(['active', 'completed', 'archived']),
  tech: z.array(z.string().min(1)).default([]),
  demoUrl: z.url().optional(),
  repoUrl: z.url().optional(),
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
export type ProjectData = z.infer<typeof projectSchema>;
