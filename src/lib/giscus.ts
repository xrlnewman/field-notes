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
