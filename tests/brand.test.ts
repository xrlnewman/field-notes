import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { siteConfig } from '../src/config/site';

const readText = (path: string) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
const readOptional = (path: string) => existsSync(path) ? readText(path) : '';

const collectStyleSourcePaths = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name).replaceAll('\\', '/');
    if (entry.isDirectory()) return collectStyleSourcePaths(path);
    return /\.(?:astro|css)$/.test(entry.name) ? [path] : [];
  });

const styleSourcePaths = collectStyleSourcePaths('src').sort();

const findStyleViolations = (pattern: RegExp) =>
  styleSourcePaths.flatMap((path) =>
    [...readText(path).matchAll(pattern)].map((match) => `${path}: ${match[0]}`),
  );

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

  it('publishes the authenticated GitHub profile and a public contact email', () => {
    expect(siteConfig.social.github).toBe('https://github.com/xrlnewman');
    expect(siteConfig.social.email).toBe('1156479985@qq.com');
  });

  it('uses the three-theme cosmic visual contract with local Chinese-ready fonts', () => {
    const packageJson = JSON.parse(readText('package.json')) as {
      dependencies?: Record<string, string>;
    };
    const globalStyles = readText('src/styles/global.css');
    const layout = readText('src/layouts/BaseLayout.astro');
    const header = readText('src/components/Header.astro');
    const footer = readText('src/components/Footer.astro');

    expect(packageJson.dependencies).toMatchObject({
      '@fontsource-variable/inter': '5.2.8',
      '@fontsource-variable/noto-sans-sc': '5.2.10',
    });
    expect(layout).toContain("import '@fontsource-variable/inter/wght.css';");
    expect(layout).toContain("import '@fontsource-variable/noto-sans-sc/wght.css';");
    expect(globalStyles).toContain(':focus-visible {\n  outline: 3px solid var(--focus-ring);');
    expect(globalStyles).toContain('.skip-link:focus-visible {');
    expect(globalStyles).not.toContain('.skip-link:focus {');
    expect(globalStyles).toContain(':not(.cosmic-pointer-glow):not(.skip-link)');
    expect(header).toContain('<ThemeToggle />');
    expect(header).toContain('backdrop-filter: blur(');
    expect(footer).toContain('backdrop-filter: blur(');
  });

  it('scopes each cosmic theme token block to the root element', () => {
    const globalStyles = readText('src/styles/global.css');
    const themeTokens = (theme: string) =>
      globalStyles.match(new RegExp(`:root\\[data-theme='${theme}'\\]\\s*\\{([^}]*)\\}`))?.[1] ?? '';

    expect.soft(globalStyles).toContain(":root,\n:root[data-theme='observatory'] {");
    expect.soft(globalStyles).not.toMatch(/^\[data-theme=/m);
    expect.soft(themeTokens('observatory')).toContain('--space-0: #050816');
    expect.soft(themeTokens('observatory')).toContain('--ink: #eef4ff');
    expect.soft(themeTokens('observatory')).toContain('--accent: #8fb7ff');
    expect.soft(themeTokens('nebula')).toContain('--space-0: #090412');
    expect.soft(themeTokens('nebula')).toContain('--ink: #fff1ff');
    expect.soft(themeTokens('nebula')).toContain('--accent: #e879f9');
    expect.soft(themeTokens('terminal')).toContain('--space-0: #020806');
    expect.soft(themeTokens('terminal')).toContain('--ink: #d8ffe9');
    expect.soft(themeTokens('terminal')).toContain('--accent: #4dff9b');
  });

  it('normalizes typography across every Astro and CSS style source', () => {
    const globalStyles = readText('src/styles/global.css');

    expect.soft(globalStyles).toContain(
      "--font-sans: 'Inter Variable', 'Noto Sans SC Variable', 'PingFang SC', 'Microsoft YaHei', sans-serif;",
    );
    expect.soft(globalStyles).toContain('font-family: var(--font-sans);');
    expect.soft(findStyleViolations(/\bGeist(?: Mono)?\b/g)).toEqual([]);
    expect.soft(
      findStyleViolations(/font-weight:\s*(?!(?:400|500|600|700)\b)\d+\b/g),
    ).toEqual([]);
    expect.soft(findStyleViolations(/letter-spacing:\s*-[^;]+/g)).toEqual([]);
    expect.soft(findStyleViolations(/letter-spacing:[^;]*!important/g)).toEqual([]);
  });

  it('presents the home page as a four-product cosmic portfolio', () => {
    const home = readText('src/pages/index.astro');
    const card = readText('src/components/ProjectCard.astro');
    const layout = readText('src/layouts/BaseLayout.astro');

    expect.soft(home).toContain('data-cosmic-hero');
    expect.soft(home).toContain('把复杂业务，做成可运行的产品。');
    expect.soft(home).toContain('class="hero-studio__stats"');
    expect.soft(home).toContain('7 年经验');
    expect.soft(home).toContain('aria-label={`${projects.length} 个网站产品`}');
    expect.soft(home).toContain('data-project-count={projects.length}');
    expect.soft(home).toContain('站内互动');
    expect.soft(home).toContain('data-free-open-source');
    expect.soft(card).toContain('data-cosmic-card');
    expect.soft(layout).toContain('<CosmicInteractions />');
  });

  it('caps the mobile hero title at the 44px design maximum', () => {
    const home = readText('src/pages/index.astro');
    const mobileHeroRule = home.match(
      /@media \(max-width: 760px\) \{[\s\S]*?\.hero-studio h1 \{([^}]*)\}/,
    )?.[1] ?? '';

    expect.soft(mobileHeroRule).toContain('font-size: clamp(2.5rem, 10vw, 2.75rem);');
    expect.soft(mobileHeroRule).not.toContain('3.5rem');
  });

  it('clips only the oversized decorative hero orbit at the section boundary', () => {
    const home = readText('src/pages/index.astro');
    const heroRule = home.match(/\.hero-studio\s*\{([^}]*)\}/)?.[1] ?? '';
    const decorationRule = home.match(/\.hero-studio::before\s*\{([^}]*)\}/)?.[1] ?? '';

    expect.soft(heroRule).toContain('position: relative;');
    expect.soft(heroRule).toContain('overflow: clip;');
    expect.soft(decorationRule).toContain('right: -14%;');
    expect.soft(decorationRule).toContain("content: '';");
  });

  it('limits cosmic card motion and reveals content once on capable pointers', () => {
    const interactions = readOptional('src/components/CosmicInteractions.astro');
    const pendingRevealRule = interactions.match(/html\.cosmic-interactions-ready \[data-reveal\] \{([^}]*)\}/)?.[1] ?? '';

    expect.soft(interactions).toContain("querySelectorAll<HTMLElement>('[data-cosmic-card]')");
    expect.soft(interactions).toContain("matchMedia('(prefers-reduced-motion: reduce)')");
    expect.soft(interactions).toContain("matchMedia('(pointer: coarse)')");
    expect.soft(interactions).toContain('const maxTilt = 2.5;');
    expect.soft(interactions).toContain("setProperty('--card-highlight-x'");
    expect.soft(interactions).toContain('new IntersectionObserver');
    expect.soft(interactions).toContain('nextObserver.unobserve(entry.target);');
    expect.soft(pendingRevealRule).toContain('translate: 0 22px;');
    expect.soft(pendingRevealRule).not.toContain('transform:');
  });
});
