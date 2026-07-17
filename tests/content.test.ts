import { readdirSync, readFileSync } from 'node:fs';
import { extname, parse } from 'node:path';

import { describe, expect, it } from 'vitest';
import { parse as parseYaml } from 'yaml';

import {
  estimateReadingTime,
  isVisibleEntry,
  sortByPublishedAt,
  toTagSlug,
} from '../src/lib/content';
import { projectSchema } from '../src/lib/project-schema';

function isProductionProject(frontmatter: unknown): boolean {
  const data = projectSchema.parse(frontmatter);
  return isVisibleEntry({ data }, true);
}

describe('content helpers', () => {
  it('counts mixed Chinese and English text with a minimum of one minute', () => {
    expect(estimateReadingTime('这是中文内容 Astro static site')).toBe(1);
  });

  it('counts longer Chinese content independently from Latin words', () => {
    expect(estimateReadingTime('中'.repeat(600))).toBe(2);
  });

  it('sorts newest content first without mutating the input', () => {
    const entries = [
      { data: { publishedAt: new Date('2025-01-01') } },
      { data: { publishedAt: new Date('2026-01-01') } },
    ];

    const sorted = sortByPublishedAt(entries);

    expect(sorted[0]!.data.publishedAt.getUTCFullYear()).toBe(2026);
    expect(entries[0]!.data.publishedAt.getUTCFullYear()).toBe(2025);
  });

  it('hides drafts only in production', () => {
    expect(isVisibleEntry({ data: { draft: true } }, true)).toBe(false);
    expect(isVisibleEntry({ data: { draft: true } }, false)).toBe(true);
    expect(isVisibleEntry({ data: { draft: false } }, true)).toBe(true);
  });

  it('creates stable lower-case tag paths without discarding Chinese', () => {
    expect(toTagSlug('Git Worktree')).toBe('git-worktree');
    expect(toTagSlug('工程实践')).toBe('工程实践');
    expect(toTagSlug('API / 设计')).toBe('api-设计');
  });
});

describe('published project content', () => {
  const projectWithoutDraft = {
    title: '默认公开项目',
    description: '用于验证内容模型默认值。',
    publishedAt: '2026-07-14',
    status: 'active',
    category: '个人品牌',
    tech: ['Astro'],
    cover: '/images/projects/example.png',
    repoUrl: 'https://github.com/xrlnewman/example',
    screenshots: Array.from({ length: 4 }, (_, index) => ({
      src: `/images/projects/example/screen-${index + 1}.png`,
      alt: `默认公开项目页面 ${index + 1}`,
      title: `页面 ${index + 1}`,
      caption: '用于验证内容模型默认值的合法截图元数据。',
      viewport: 'desktop',
      width: 1440,
      height: 900,
    })),
  };

  it('treats an omitted draft flag as production-visible after schema defaults', () => {
    expect(isProductionProject(projectWithoutDraft)).toBe(true);
  });

  it('rejects invalid project frontmatter through the production contract', () => {
    expect(() => isProductionProject({
      ...projectWithoutDraft,
      category: '旧分类',
    })).toThrow();
  });

  it('publishes exactly the thirty website products', () => {
    const projectIds = readdirSync('src/content/projects', { withFileTypes: true })
      .filter((entry) => entry.isFile() && ['.md', '.mdx'].includes(extname(entry.name)))
      .filter((entry) => {
        const markdown = readFileSync(`src/content/projects/${entry.name}`, 'utf8');
        const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
        if (!match?.[1]) throw new Error(`${entry.name} 缺少 YAML frontmatter`);
        const frontmatter = parseYaml(match[1]);
        return isProductionProject(frontmatter);
      })
      .map((entry) => parse(entry.name).name)
      .toSorted();

    expect(projectIds).toEqual([
      'bookingflow-platform',
      'careflow-platform',
      'contractflow-platform',
      'creatorflow-platform',
      'crmflow-platform',
      'eduflow-platform',
      'energyflow-platform',
      'eventflow-platform',
      'feeflow-platform',
      'field-notes',
      'fleetflow-platform',
      'helpdeskflow-platform',
      'hireflow-platform',
      'homeflow-platform',
      'invoiceflow-platform',
      'labflow-platform',
      'legalflow-platform',
      'linli-community',
      'multi-merchant-mall',
      'payrollflow-platform',
      'petflow-platform',
      'propertyflow-platform',
      'repairflow-platform',
      'retailflow-platform',
      'skyboom-corporate',
      'stockflow-platform',
      'storeflow-platform',
      'supplyflow-platform',
      'travelflow-platform',
      'venueflow-platform',
    ]);
  });

  it('states the three free commitments and keeps comments on-site', () => {
    const fieldNotes = readFileSync('src/content/projects/field-notes.md', 'utf8');

    expect(fieldNotes).toContain('永久免费');
    expect(fieldNotes).toContain('零成本部署');
    expect(fieldNotes).toContain('完全开源');
    expect(fieldNotes).toMatch(/评论.*留言.*站内完成|评论和留言都在站内完成/);
  });
});
