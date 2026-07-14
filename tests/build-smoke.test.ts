import { existsSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('static site build', () => {
  it('builds the home and 404 pages with the theme initializer', () => {
    expect(existsSync('dist/index.html')).toBe(true);
    expect(existsSync('dist/404.html')).toBe(true);

    const home = readFileSync('dist/index.html', 'utf8');
    expect(home).toContain('data-theme-toggle');
    expect(home).toContain('https://field-notes-2fi.pages.dev');
  });

  it('builds the project index and project details from content', () => {
    expect(existsSync('dist/projects/index.html')).toBe(true);
    expect(existsSync('dist/projects/field-notes/index.html')).toBe(true);
    expect(existsSync('dist/images/projects/field-notes.png')).toBe(true);

    const projects = readFileSync('dist/projects/index.html', 'utf8');
    const project = readFileSync('dist/projects/field-notes/index.html', 'utf8');
    expect(projects).toContain('许汝林个人博客');
    expect(projects).toContain('data-project-filter');
    expect(projects).toContain('data-project-category="网站产品"');
    expect(projects).toContain('https://github.com/xrlnewman/field-notes');
    expect(projects).toContain('/images/projects/field-notes.png');
    expect(project).toContain('project-showcase');
    expect(project).toContain('/images/projects/field-notes.png');
    expect(project).toContain('GitHub 源码');
    expect(project).toContain('https://field-notes-2fi.pages.dev');
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

    expect(home).toContain('把复杂业务，做成真正可用的产品。');
    expect(home.indexOf('项目作品')).toBeLessThan(home.indexOf('最近写下的内容'));
    expect(about).toContain('我不只写代码，也负责让产品落地。');
    expect(about).toContain('7 年');
    expect(about).toContain('PHP/Laravel');
    expect(home).not.toContain('Field Notes');
  });

  it('puts the compact category navigation directly before real project cards on home', () => {
    const home = readFileSync('dist/index.html', 'utf8');

    expect(home).toMatch(
      /<section class="hero-studio"[\s\S]*?<\/section>\s*<section class="home-section home-section--projects"[^>]*data-home-project-catalog/,
    );
    expect(home).toMatch(
      /data-project-category-grid[\s\S]*?<\/nav>\s*<div class="home-grid home-grid--projects"[^>]*>/,
    );

    const catalogStart = home.indexOf('data-home-project-catalog');
    const categoryNavigation = home.indexOf('data-project-category-grid', catalogStart);
    const firstProjectCard = home.indexOf('data-project-category="网站产品"', categoryNavigation);

    expect(catalogStart).toBeGreaterThan(-1);
    expect(categoryNavigation).toBeGreaterThan(catalogStart);
    expect(firstProjectCard).toBeGreaterThan(categoryNavigation);
    expect(home.slice(categoryNavigation, firstProjectCard)).toContain('/projects/?category=');
    expect(home.slice(firstProjectCard)).toContain('/images/projects/field-notes.png');
  });

  it('builds the complete project category navigation on home and projects pages', () => {
    const home = readFileSync('dist/index.html', 'utf8');
    const projects = readFileSync('dist/projects/index.html', 'utf8');
    const categories = ['网站产品', '业务系统', '开发工具', '数据与搜索', 'AI 自动化'];

    expect(home).toContain('data-project-category-grid');
    expect(home).toContain('公开项目');
    expect(home).not.toContain('PROJECT CATALOG');
    expect(home).toMatch(/data-project-count="1"[^>]*>1<\/strong>[\s\S]*?公开项目/);
    expect(home).toMatch(/<strong[^>]*>5<\/strong>[\s\S]*?项目分类/);
    expect(home).toMatch(/<strong[^>]*>7 年<\/strong>[\s\S]*?开发经验/);
    expect(projects).toContain('data-project-catalog');
    expect(projects).toContain('业务系统');
    expect(projects).toContain('数据与搜索');
    expect(projects).toContain('AI 自动化');
    expect(projects).toContain('<h1');
    categories.forEach((category, index) => {
      const href = `/projects/?category=${encodeURIComponent(category)}`;
      const linkStart = home.indexOf(`href="${href}"`);
      const categoryLink = home.slice(linkStart, home.indexOf('</a>', linkStart));

      expect(linkStart).toBeGreaterThan(-1);
      expect(categoryLink).toContain(category);
      expect(categoryLink).toContain(`data-project-category-count="${index === 0 ? 1 : 0}"`);
    });

    expect(projects.match(/data-project-filter=/g)).toHaveLength(6);
    ['全部', ...categories].forEach((category, index) => {
      const buttonStart = projects.indexOf(`data-project-filter="${category}"`);
      const filterButton = projects.slice(buttonStart, projects.indexOf('</button>', buttonStart));

      expect(buttonStart).toBeGreaterThan(-1);
      expect(filterButton).toContain(`data-project-filter-count="${index <= 1 ? 1 : 0}"`);
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

  it('builds native comment hosts for articles, projects, and the guestbook', () => {
    expect(existsSync('dist/guestbook/index.html')).toBe(true);

    const guestbook = readFileSync('dist/guestbook/index.html', 'utf8');
    const article = readFileSync('dist/articles/redisearch-result-set/index.html', 'utf8');
    const project = readFileSync('dist/projects/field-notes/index.html', 'utf8');
    expect(guestbook).toContain('data-comment-resource="guestbook:global"');
    expect(article).toContain('data-comment-resource="article:redisearch-result-set"');
    expect(project).toContain('data-comment-resource="project:field-notes"');
    expect(guestbook).toContain('data-comments-root');
    expect(guestbook).toContain('data-comment-form');
    expect(guestbook).toContain('data-comment-list');
    expect(guestbook).toContain('data-comment-reply');
    expect(guestbook).not.toContain('GitHub Discussions');
    expect(guestbook).not.toContain('giscus.app');
    for (const page of [guestbook, article, project]) {
      expect(page).not.toContain('Giscus');
      expect(page).not.toContain('GitHub Discussions');
    }
  });

  it('removes obsolete public comment service configuration from source', () => {
    const envExample = readFileSync('.env.example', 'utf8');
    const envTypes = readFileSync('src/env.d.ts', 'utf8');
    const commentsSource = readFileSync('src/components/Comments.astro', 'utf8');

    expect(envExample).not.toContain('PUBLIC_GISCUS');
    expect(envTypes).not.toContain('PUBLIC_GISCUS');
    expect(commentsSource).not.toContain('innerHTML');
    expect(commentsSource).not.toContain('minlength=');
    expect(commentsSource).not.toContain('maxlength=');
    expect(commentsSource).toContain('author.textContent = item.authorName');
    expect(commentsSource).toContain('content.textContent = item.content');
    expect(commentsSource).toContain("from '../lib/comment-ui-state'");
    expect(commentsSource).toContain('createCommentUiState()');
    expect(commentsSource).toContain('createReplyDraftStore');
    expect(commentsSource).toContain('replyDraftStore.remember(');
    expect(commentsSource).toContain('replyDraftStore.clear()');
    expect(commentsSource).toContain('tryBeginSubmission()');
    expect(commentsSource).toContain('isSubmissionLocked()');
    expect(commentsSource).toContain('nextLoad()');
    expect(commentsSource).toContain('isCurrentLoad(loadVersion)');
    expect(commentsSource).toContain('validateCommentDraft({');
    expect(commentsSource).toContain("root.querySelectorAll<HTMLButtonElement>('button')");
    expect(commentsSource).not.toContain("[data-comment-form] button[type=\"submit\"]");
    expect(commentsSource).toContain('captureReplyDraft');
    expect(commentsSource).toContain('restoreReplyDraft');
    expect(commentsSource).toContain('preserveReplyDraft');
    expect(commentsSource).toContain('closeReplyForm(true)');
    expect(commentsSource).toContain(`.comment-meta [data-comment-author] {
    min-width: 0;
    overflow-wrap: anywhere;
  }`);
  });

  it('publishes crawler and browser identity assets', () => {
    expect(existsSync('dist/robots.txt')).toBe(true);
    expect(existsSync('dist/favicon.svg')).toBe(true);

    const robots = readFileSync('dist/robots.txt', 'utf8');
    expect(robots).toContain('https://field-notes-2fi.pages.dev/sitemap-index.xml');
  });
});
