export interface CommentPage<T extends { id: string }> {
  items: readonly T[];
  nextCursor: string | null;
}

export interface CommentPaginationSnapshot<T extends { id: string }> {
  items: T[];
  nextCursor: string | null;
  isLoading: boolean;
  error: string | null;
}

export type CommentPageLoadOutcome<T extends { id: string }> =
  | {
      status: 'applied';
      mode: 'reset' | 'append';
      items: T[];
      addedItems: T[];
      nextCursor: string | null;
    }
  | { status: 'failed'; mode: 'reset' | 'append'; error: string }
  | { status: 'stale'; mode: 'reset' | 'append' }
  | { status: 'noop'; mode: 'append' };

interface RequestVersion {
  nextLoad: () => number;
  isCurrentLoad: (version: number) => boolean;
}

interface ReplyDraftStore<T> {
  peek: () => T | undefined;
}

interface CommentPaginationOptions<T extends { id: string }, D> {
  loadPage: (cursor: string | null) => Promise<CommentPage<T>>;
  requestVersion: RequestVersion;
  replyDraftStore: ReplyDraftStore<D>;
  getReplyDraftParentId: (draft: D) => string;
}

export function createCommentPaginationController<T extends { id: string }, D>(
  options: CommentPaginationOptions<T, D>,
) {
  let items: T[] = [];
  let nextCursor: string | null = null;
  let isLoading = false;
  let error: string | null = null;

  const snapshot = (): CommentPaginationSnapshot<T> => ({
    items: [...items],
    nextCursor,
    isLoading,
    error,
  });

  const applyPage = (page: CommentPage<T>, mode: 'reset' | 'append') => {
    const existingIds = new Set(mode === 'append' ? items.map((item) => item.id) : []);
    const addedItems = page.items.filter((item) => {
      if (existingIds.has(item.id)) {
        return false;
      }
      existingIds.add(item.id);
      return true;
    });

    items = mode === 'reset' ? [...addedItems] : [...items, ...addedItems];
    nextCursor = page.nextCursor;
    return addedItems;
  };

  const load = async (mode: 'reset' | 'append'): Promise<CommentPageLoadOutcome<T>> => {
    const cursor = mode === 'append' ? nextCursor : null;
    if (mode === 'append' && cursor === null) {
      return { status: 'noop', mode };
    }

    const loadVersion = options.requestVersion.nextLoad();
    if (mode === 'reset') {
      items = [];
      nextCursor = null;
    }
    isLoading = true;
    error = null;

    try {
      const page = await options.loadPage(cursor);
      if (!options.requestVersion.isCurrentLoad(loadVersion)) {
        return { status: 'stale', mode };
      }

      const addedItems = applyPage(page, mode);
      isLoading = false;
      return {
        status: 'applied',
        mode,
        items: [...items],
        addedItems: [...addedItems],
        nextCursor,
      };
    } catch (loadError) {
      if (!options.requestVersion.isCurrentLoad(loadVersion)) {
        return { status: 'stale', mode };
      }

      error = loadError instanceof Error && loadError.message
        ? loadError.message
        : '暂时无法加载留言，请稍后再试。';
      isLoading = false;
      return { status: 'failed', mode, error };
    }
  };

  return {
    snapshot,
    loadFirstPage: () => load('reset'),
    loadMore: () => load('append'),
    getRestorableReplyDraft(): D | undefined {
      const draft = options.replyDraftStore.peek();
      if (!draft) {
        return undefined;
      }
      const parentId = options.getReplyDraftParentId(draft);
      return items.some((item) => item.id === parentId) ? draft : undefined;
    },
  };
}
