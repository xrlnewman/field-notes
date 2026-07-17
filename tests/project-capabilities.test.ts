import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { projectSchema } from '../src/lib/project-schema';

const read = (path: string) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

describe('project capability model', () => {
  const validProject = {
    title: '预约平台',
    description: '用于测试结构化产品能力。',
    publishedAt: '2026-07-17',
    status: 'active',
    category: '生活服务',
    tech: ['Astro'],
    cover: '/images/projects/bookingflow-platform/shot-1.png',
    repoUrl: 'https://github.com/xrlnewman/bookingflow-admin',
    screenshots: Array.from({ length: 4 }, (_, index) => ({
      src: `/images/projects/bookingflow-platform/shot-${index + 1}.png`,
      alt: `预约页面 ${index + 1}`,
      title: `页面 ${index + 1}`,
      caption: '用于测试截图元数据。',
      viewport: index > 1 ? 'mobile' : 'desktop',
      width: index > 1 ? 390 : 1440,
      height: index > 1 ? 844 : 960,
    })),
    modules: [{ name: '预约中心', description: '管理预约和时段。', features: ['时段锁定', '改期'] }],
    roles: [{ name: '门店管理员', scope: '维护服务和排班' }],
    workflow: [{ label: '提交预约', status: '待确认' }],
    metrics: [{ label: '今日预约', value: '86', trend: '+14%' }],
    integrations: ['MySQL 8.4', 'Redis 8'],
  };

  it('accepts structured capability fields on a published project', () => {
    const data = projectSchema.parse(validProject);

    expect(data.modules?.[0]?.features).toContain('时段锁定');
    expect(data.roles?.[0]?.scope).toContain('排班');
    expect(data.workflow?.[0]?.status).toBe('待确认');
    expect(data.metrics?.[0]?.trend).toBe('+14%');
    expect(data.integrations).toContain('Redis 8');
  });

  it('rejects capability records without required names and labels', () => {
    expect(() => projectSchema.parse({
      ...validProject,
      modules: [{ name: '', description: '缺少模块名', features: ['功能'] }],
    })).toThrow();
    expect(() => projectSchema.parse({
      ...validProject,
      workflow: [{ label: '', status: '待确认' }],
    })).toThrow();
  });

  it('renders the capability panel from the project layout', () => {
    const panel = read('src/components/ProjectCapabilityPanel.astro');
    const layout = read('src/layouts/ProjectLayout.astro');

    expect(panel).toContain('data-project-capabilities');
    expect(panel).toContain('产品模块');
    expect(panel).toContain('角色与权限');
    expect(panel).toContain('业务流程');
    expect(panel).toContain('运营指标');
    expect(layout).toContain('<ProjectCapabilityPanel');
  });

  it('includes concrete capabilities in the first five product pages', () => {
    for (const slug of ['invoiceflow-platform', 'repairflow-platform', 'supplyflow-platform', 'payrollflow-platform', 'bookingflow-platform']) {
      const source = read(`src/content/projects/${slug}.md`);
      expect(source).toContain('modules:');
      expect(source).toContain('roles:');
      expect(source).toContain('workflow:');
      expect(source).toContain('metrics:');
      expect(source).toContain('integrations:');
    }
  });
});

