import { z } from 'astro/zod';

import { projectCategories } from './projects';

export const projectRepositoryRoles = ['frontend', 'admin', 'backend', 'content'] as const;

export type ProjectRepositoryRole = typeof projectRepositoryRoles[number];

const baseFields = {
  title: z.string().min(1),
  description: z.string().min(1),
  publishedAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  draft: z.boolean().default(false),
  featured: z.boolean().default(false),
};

const projectScreenshotSchema = z.object({
  src: z.string().startsWith('/'),
  alt: z.string().min(1),
  title: z.string().min(1),
  caption: z.string().min(1),
  viewport: z.enum(['desktop', 'mobile']),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export const projectSchema = z.object({
  ...baseFields,
  status: z.enum(['active', 'completed', 'archived']),
  category: z.enum(projectCategories),
  tech: z.array(z.string().min(1)).default([]),
  cover: z.string().startsWith('/').optional(),
  screenshots: z.array(projectScreenshotSchema).min(4).max(6).optional(),
  demoUrl: z.url().optional(),
  repoUrl: z.url().optional(),
  repositories: z.array(z.object({
    name: z.string().min(1),
    role: z.enum(projectRepositoryRoles),
    description: z.string().min(1),
    tech: z.array(z.string().min(1)).min(1),
    url: z.url().refine((url) => url.startsWith('https://github.com/')),
  })).optional(),
}).superRefine((project, context) => {
  if (project.draft) return;

  if (!project.cover) {
    context.addIssue({
      code: 'custom',
      path: ['cover'],
      message: '公开项目必须提供仓库内封面',
    });
  }

  if (!project.repoUrl) {
    context.addIssue({
      code: 'custom',
      path: ['repoUrl'],
      message: '公开项目必须提供 GitHub 源码地址',
    });
  }

  if (!project.screenshots) {
    context.addIssue({
      code: 'custom',
      path: ['screenshots'],
      message: '公开项目必须提供 4 到 6 张真实页面截图',
    });
  }
});

export type ProjectData = z.infer<typeof projectSchema>;
