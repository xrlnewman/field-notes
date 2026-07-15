import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { siteConfig } from '../src/config/site';

const readText = (path: string) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

describe('personal brand configuration', () => {
  it('uses Xu Rulin identity and product engineer positioning', () => {
    expect(siteConfig.name).toBe('许汝林个人博客');
    expect(siteConfig.brand).toBe('许汝林 / PRODUCT ENGINEER');
    expect(siteConfig.brandMark).toBe('许');
    expect(siteConfig.author).toMatchObject({
      name: '许汝林',
      role: '产品型全栈工程师',
      age: 27,
      experienceYears: 7,
    });
  });

  it('publishes the authenticated GitHub profile without exposing email', () => {
    expect(siteConfig.social.github).toBe('https://github.com/xrlnewman');
    expect(siteConfig.social.email).toBe('');
  });

  it('uses the three-theme cosmic visual contract with local Chinese-ready fonts', () => {
    const packageJson = JSON.parse(readText('package.json')) as {
      dependencies?: Record<string, string>;
    };
    const globalStyles = readText('src/styles/global.css');
    const layout = readText('src/layouts/BaseLayout.astro');
    const header = readText('src/components/Header.astro');
    const footer = readText('src/components/Footer.astro');
    const styledSources = [globalStyles, header, footer].join('\n');
    const themeTokens = (theme: string) =>
      globalStyles.match(new RegExp(`\\[data-theme='${theme}'\\]\\s*\\{([^}]*)\\}`))?.[1];

    expect(packageJson.dependencies).toMatchObject({
      '@fontsource-variable/inter': '5.2.8',
      '@fontsource-variable/noto-sans-sc': '5.2.10',
    });
    expect(layout).toContain("import '@fontsource-variable/inter/wght.css';");
    expect(layout).toContain("import '@fontsource-variable/noto-sans-sc/wght.css';");
    expect(globalStyles).toContain(
      "font-family: 'Inter Variable', 'Noto Sans SC Variable', 'PingFang SC', 'Microsoft YaHei', sans-serif;",
    );
    expect(globalStyles).toContain(":root,\n[data-theme='observatory'] {");

    expect(themeTokens('observatory')).toContain('--space-0: #050816');
    expect(themeTokens('observatory')).toContain('--ink: #eef4ff');
    expect(themeTokens('observatory')).toContain('--accent: #8fb7ff');
    expect(themeTokens('nebula')).toContain('--space-0: #090412');
    expect(themeTokens('nebula')).toContain('--ink: #fff1ff');
    expect(themeTokens('nebula')).toContain('--accent: #e879f9');
    expect(themeTokens('terminal')).toContain('--space-0: #020806');
    expect(themeTokens('terminal')).toContain('--ink: #d8ffe9');
    expect(themeTokens('terminal')).toContain('--accent: #4dff9b');

    expect(styledSources).not.toMatch(/font-family:\s*['"]?Geist/);
    expect(styledSources).not.toMatch(/font-weight:\s*(?:560|620|650|680|720)\b/);
    expect(globalStyles).toContain(':where(h1, h2, h3, h4, h5, h6) {\n  letter-spacing: normal !important;');
    expect(globalStyles).toContain(':focus-visible {\n  outline: 3px solid var(--focus-ring);');
    expect(header).toContain('<ThemeToggle />');
    expect(header).toContain('backdrop-filter: blur(');
    expect(footer).toContain('backdrop-filter: blur(');
  });
});
