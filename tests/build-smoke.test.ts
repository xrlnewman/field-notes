import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

import { describe, expect, it } from 'vitest';

const publicProjects = [
  {
    slug: 'field-notes',
    title: '许汝林个人博客',
    cover: 'field-notes.png',
    repositories: ['https://github.com/xrlnewman/field-notes'],
  },
  {
    slug: 'multi-merchant-mall',
    title: '多商户商城',
    cover: 'multi-merchant-mall.png',
    repositories: [
      'https://github.com/xrlnewman/mall-h5',
      'https://github.com/xrlnewman/mall-admin',
      'https://github.com/xrlnewman/mall-system',
    ],
  },
  {
    slug: 'linli-community',
    title: '邻里社区服务平台',
    cover: 'linli-community.png',
    repositories: [
      'https://github.com/xrlnewman/linli-mp',
      'https://github.com/xrlnewman/linli-admin',
      'https://github.com/xrlnewman/linli-server',
    ],
  },
  {
    slug: 'skyboom-corporate',
    title: '天舶重工企业官网',
    cover: 'skyboom-corporate.png',
    repositories: [
      'https://github.com/xrlnewman/skyboom-web',
      'https://github.com/xrlnewman/skyboom-admin',
      'https://github.com/xrlnewman/skyboom-server',
    ],
  },
] as const;

const obsoleteProjectSlugs = [
  'toolkit-box',
  'api-bench',
  'db-snapshot-diff',
  'web-scraper',
  'bi-report',
  'inventory-system',
  'invoice-ocr',
  'excel-analyzer',
] as const;

const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function listHtmlFiles(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(root, entry.name);
    if (entry.isDirectory()) {
      return listHtmlFiles(entryPath);
    }

    return entry.isFile() && extname(entry.name) === '.html' ? [entryPath] : [];
  });
}

describe('static site build', () => {
  it('builds the home and 404 pages with three themes and the free promise', () => {
    expect(existsSync('dist/index.html')).toBe(true);
    expect(existsSync('dist/404.html')).toBe(true);

    const home = readFileSync('dist/index.html', 'utf8');
    expect(home).toContain('data-theme-toggle');
    expect(home.match(/<button\b[^>]*data-theme="(?:observatory|nebula|terminal)"[^>]*>/g)).toHaveLength(3);
    for (const theme of ['observatory', 'nebula', 'terminal']) {
      expect(home).toContain(`data-theme="${theme}"`);
    }
    expect(home).toContain('永久免费 · 零成本部署 · 完全开源');
    for (const { slug } of publicProjects) {
      expect(home).toContain(`/projects/${slug}/`);
    }
    expect(home).toContain('https://field-notes-2fi.pages.dev');
  });

  it('builds only the four public project details with their real covers and repositories', () => {
    expect(existsSync('dist/projects/index.html')).toBe(true);

    const projects = readFileSync('dist/projects/index.html', 'utf8');
    expect(projects).toContain('data-project-filter');

    const detailSlugs = readdirSync('dist/projects', { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && existsSync(join('dist/projects', entry.name, 'index.html')))
      .map((entry) => entry.name)
      .toSorted();
    expect(detailSlugs).toEqual(publicProjects.map(({ slug }) => slug).toSorted());

    for (const { slug, title, cover, repositories } of publicProjects) {
      const detailPath = `dist/projects/${slug}/index.html`;

      expect(existsSync(detailPath), detailPath).toBe(true);
      expect(existsSync(`dist/images/projects/${cover}`), cover).toBe(true);
      const coverBytes = readFileSync(`dist/images/projects/${cover}`);
      expect([...coverBytes.subarray(0, 8)], `${cover} must be a PNG`).toEqual(pngSignature);
      expect(coverBytes.readUInt32BE(16), `${cover} width`).toBe(1440);
      expect(coverBytes.readUInt32BE(20), `${cover} height`).toBe(900);
      const detail = readFileSync(detailPath, 'utf8');
      expect(projects).toContain(title);
      expect(projects).toContain(`/images/projects/${cover}`);
      expect(detail).toContain('project-showcase');
      expect(detail).toContain(`/images/projects/${cover}`);
      repositories.forEach((repository) => expect(detail).toContain(repository));
    }

    obsoleteProjectSlugs.forEach((slug) => {
      expect(existsSync(`dist/projects/${slug}/index.html`), slug).toBe(false);
    });
  });

  it('builds the expected 19 HTML pages', () => {
    expect(listHtmlFiles('dist')).toHaveLength(19);
  });

  it('builds article details and tag indexes', () => {
    expect(existsSync('dist/articles/redisearch-result-set/index.html')).toBe(true);
    expect(existsSync('dist/tags/git/index.html')).toBe(true);

    const article = readFileSync('dist/articles/redisearch-result-set/index.html', 'utf8');
    expect(article).toContain('文章目录');
  });

  it('publishes the product engineer story with projects before articles', () => {
    const home = readFileSync('dist/index.html', 'utf8');
    const about = readFileSync('dist/about/index.html', 'utf8');

    expect(home).toContain('把复杂业务，做成可运行的产品。');
    expect(home.indexOf('项目作品')).toBeLessThan(home.indexOf('最近写下的内容'));
    expect(about).toContain('我不只写代码，也负责让产品落地。');
    expect(about).toContain('7 年');
    expect(about).toContain('PHP/Laravel');
    expect(home).not.toContain('Field Notes');
  });

  it('puts the four real project cards in the home product catalog', () => {
    const home = readFileSync('dist/index.html', 'utf8');

    expect(home).toMatch(
      /<section class="hero-studio"[\s\S]*?<\/section>\s*<aside class="open-source-promise"[\s\S]*?<\/aside>\s*<section class="home-section home-section--projects"[^>]*data-home-project-catalog/,
    );

    const catalogStart = home.indexOf('data-home-project-catalog');

    expect(catalogStart).toBeGreaterThan(-1);
    expect(home.slice(catalogStart)).not.toContain('data-project-category-grid');
    for (const { slug, cover } of publicProjects) {
      expect(home.slice(catalogStart)).toContain(`/projects/${slug}/`);
      expect(home.slice(catalogStart)).toContain(`/images/projects/${cover}`);
    }
  });

  it('builds the four product category filters on the projects page', () => {
    const home = readFileSync('dist/index.html', 'utf8');
    const projects = readFileSync('dist/projects/index.html', 'utf8');
    const categories = ['个人品牌', '电商平台', '社区服务', '企业官网'];

    expect(home).toMatch(/data-project-count="4"[^>]*>4<\/strong>[\s\S]*?个网站产品/);
    expect(projects).toContain('data-project-catalog');
    expect(projects).toContain('四个可运行的网站产品');
    expect(projects).toContain('<h1');
    expect(projects.match(/data-project-filter=/g)).toHaveLength(5);
    const filterCounts = [4, 1, 1, 1, 1];
    ['全部', ...categories].forEach((category, index) => {
      const buttonStart = projects.indexOf(`data-project-filter="${category}"`);
      const filterButton = projects.slice(buttonStart, projects.indexOf('</button>', buttonStart));

      expect(buttonStart).toBeGreaterThan(-1);
      expect(filterButton).toContain(`data-project-filter-count="${filterCounts[index]}"`);
    });
  });

  it('builds search, feeds, sitemap, and about outputs', () => {
    expect(existsSync('dist/search/index.html')).toBe(true);
    expect(existsSync('dist/about/index.html')).toBe(true);
    expect(existsSync('dist/rss.xml')).toBe(true);
    expect(existsSync('dist/sitemap-index.xml')).toBe(true);
    expect(existsSync('dist/pagefind/pagefind.js')).toBe(true);

    const search = readFileSync('dist/search/index.html', 'utf8');
    expect(search).toContain("import('/pagefind/pagefind.js')");
    expect(search).toContain('min-width:44px');
    expect(search).toContain('min-height:44px');
    expect(search).not.toContain('__VITE_PRELOAD__');
  });

  it('builds GitHub-authenticated Giscus hosts for articles, projects, and the guestbook', () => {
    expect(existsSync('dist/guestbook/index.html')).toBe(true);

    const guestbook = readFileSync('dist/guestbook/index.html', 'utf8');
    const article = readFileSync('dist/articles/redisearch-result-set/index.html', 'utf8');
    const project = readFileSync('dist/projects/field-notes/index.html', 'utf8');
    expect(guestbook).toContain('data-giscus-host');
    expect(guestbook).toMatch(/<span class="guestbook-title-line"[^>]*>登录 GitHub，<\/span>/);
    expect(guestbook).toMatch(/<span class="guestbook-title-line"[^>]*>留下消息。<\/span>/);
    expect(guestbook).toContain('data-mapping="specific"');
    expect(guestbook).toContain('data-term="global-guestbook"');
    expect(article).toContain('data-giscus-host');
    expect(article).toContain('data-mapping="pathname"');
    expect(project).toContain('data-giscus-host');
    expect(project).toContain('data-mapping="pathname"');
    for (const page of [guestbook, article, project]) {
      expect(page).toContain('登录 GitHub 后即可参与');
      expect(page).toContain('https://giscus.app/client.js');
      expect(page).not.toContain('data-comment-form');
      expect(page).not.toContain('无需登录即可参与');
    }
  });

  it('removes the anonymous comment API and keeps public Giscus configuration', () => {
    const envExample = readFileSync('.env.example', 'utf8');
    const envTypes = readFileSync('src/env.d.ts', 'utf8');
    const wrangler = readFileSync('wrangler.jsonc', 'utf8');

    expect(existsSync('src/components/GiscusComments.astro')).toBe(true);
    expect(existsSync('src/components/Comments.astro')).toBe(false);
    expect(existsSync('functions/api/comments.ts')).toBe(false);
    expect(envExample).toContain('PUBLIC_GISCUS_REPO=xrlnewman/field-notes');
    expect(envTypes).toContain('PUBLIC_GISCUS_REPO');
    expect(wrangler).not.toContain('COMMENTS_DB');
  });

  it('publishes crawler and browser identity assets', () => {
    expect(existsSync('dist/robots.txt')).toBe(true);
    expect(existsSync('dist/favicon.svg')).toBe(true);

    const robots = readFileSync('dist/robots.txt', 'utf8');
    expect(robots).toContain('https://field-notes-2fi.pages.dev/sitemap-index.xml');
  });
});
