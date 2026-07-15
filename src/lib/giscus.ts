export interface GiscusEnvironment {
  PUBLIC_GISCUS_REPO?: string;
  PUBLIC_GISCUS_REPO_ID?: string;
  PUBLIC_GISCUS_CATEGORY?: string;
  PUBLIC_GISCUS_CATEGORY_ID?: string;
}

export interface GiscusConfig {
  repo: string;
  repoId: string;
  category: string;
  categoryId: string;
}

export type GiscusTheme = 'transparent_dark' | 'dark' | 'dark_high_contrast';

export const defaultGiscusConfig: GiscusConfig = {
  repo: 'xrlnewman/field-notes',
  repoId: 'R_kgDOTX84ug',
  category: 'General',
  categoryId: 'DIC_kwDOTX84us4DBKfw',
};

export function readGiscusConfig(environment: GiscusEnvironment): GiscusConfig | null {
  const repo = environment.PUBLIC_GISCUS_REPO?.trim();
  const repoId = environment.PUBLIC_GISCUS_REPO_ID?.trim();
  const category = environment.PUBLIC_GISCUS_CATEGORY?.trim();
  const categoryId = environment.PUBLIC_GISCUS_CATEGORY_ID?.trim();

  if (!repo || !repoId || !category || !categoryId || !/^[^/\s]+\/[^/\s]+$/.test(repo)) {
    return null;
  }

  return { repo, repoId, category, categoryId };
}

export function resolveGiscusConfig(environment: GiscusEnvironment): GiscusConfig {
  const overrides = [
    environment.PUBLIC_GISCUS_REPO,
    environment.PUBLIC_GISCUS_REPO_ID,
    environment.PUBLIC_GISCUS_CATEGORY,
    environment.PUBLIC_GISCUS_CATEGORY_ID,
  ];

  if (overrides.every((value) => value === undefined)) {
    return defaultGiscusConfig;
  }

  const config = readGiscusConfig(environment);
  if (!config) {
    throw new Error('Giscus 环境变量必须四项同时配置且格式正确');
  }

  return config;
}

export function resolveGiscusTheme(theme: unknown): GiscusTheme {
  if (theme === 'nebula') return 'dark';
  if (theme === 'terminal') return 'dark_high_contrast';
  return 'transparent_dark';
}
