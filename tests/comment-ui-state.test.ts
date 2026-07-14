import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  codePointLength,
  createCommentUiState,
  createReplyDraftStore,
  validateCommentDraft,
} from '../src/lib/comment-ui-state';
import {
  createCommentPaginationController,
  type CommentPage,
} from '../src/lib/comment-pagination';

type PageItem = { id: string };
type ReplyDraft = { parentId: string; authorName: string; content: string };

function page(ids: string[], nextCursor: string | null): CommentPage<PageItem> {
  return { items: ids.map((id) => ({ id })), nextCursor };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function createPaginationHarness() {
  const requests: Array<{
    cursor: string | null;
    response: ReturnType<typeof deferred<CommentPage<PageItem>>>;
  }> = [];
  const replyDraftStore = createReplyDraftStore<ReplyDraft>();
  const requestVersion = createCommentUiState();
  const controller = createCommentPaginationController<PageItem, ReplyDraft>({
    loadPage(cursor) {
      const response = deferred<CommentPage<PageItem>>();
      requests.push({ cursor, response });
      return response.promise;
    },
    requestVersion,
    replyDraftStore,
    getReplyDraftParentId: (draft) => draft.parentId,
  });
  return { controller, replyDraftStore, requests };
}

describe('comment UI state', () => {
  it('allows only one submission until the root lock is released', () => {
    const state = createCommentUiState();

    expect(state.isSubmissionLocked()).toBe(false);
    expect(state.tryBeginSubmission()).toBe(true);
    expect(state.isSubmissionLocked()).toBe(true);
    expect(state.tryBeginSubmission()).toBe(false);
    expect(state.isSubmissionLocked()).toBe(true);

    state.finishSubmission();

    expect(state.isSubmissionLocked()).toBe(false);
    expect(state.tryBeginSubmission()).toBe(true);
  });

  it('accepts render work only from the latest load version', () => {
    const state = createCommentUiState();
    const firstLoad = state.nextLoad();
    const secondLoad = state.nextLoad();

    expect(secondLoad).toBe(firstLoad + 1);
    expect(state.isCurrentLoad(firstLoad)).toBe(false);
    expect(state.isCurrentLoad(secondLoad)).toBe(true);
  });
});

describe('reply draft store', () => {
  it('keeps a remembered draft through a failed load and clears it after restore', () => {
    const store = createReplyDraftStore<{
      parentId: string;
      authorName: string;
      content: string;
    }>();
    const draft = {
      parentId: 'comment-1',
      authorName: '访客',
      content: '失败后仍要保留的回复',
    };

    store.remember(draft);
    expect(store.peek()).toEqual(draft);

    // GET 失败时不调用 clear，下一次重试仍能读取草稿。
    expect(store.peek()).toEqual(draft);

    const restoredDraft = store.peek();
    expect(restoredDraft).toEqual(draft);
    store.clear();

    expect(store.peek()).toBeUndefined();
  });
});

describe('comment draft validation', () => {
  it('counts Unicode code points instead of UTF-16 code units', () => {
    expect(codePointLength('😀')).toBe(1);
    expect(codePointLength('😀访客')).toBe(3);
  });

  it('rejects a single-emoji nickname', () => {
    expect(validateCommentDraft({ authorName: '😀', content: '正文' })).toMatchObject({
      ok: false,
      errors: { authorName: '昵称长度必须为 2–24 个字符' },
    });
  });

  it('accepts a 13-emoji nickname', () => {
    expect(validateCommentDraft({ authorName: '😀'.repeat(13), content: '正文' })).toMatchObject({
      ok: true,
    });
  });

  it('rejects a single-emoji body', () => {
    expect(validateCommentDraft({ authorName: '访客', content: '😀' })).toMatchObject({
      ok: false,
      errors: { content: '评论内容长度必须为 2–1000 个字符' },
    });
  });

  it('accepts a two-emoji body', () => {
    expect(validateCommentDraft({ authorName: '访客', content: '😀😀' })).toMatchObject({
      ok: true,
    });
  });

  it('trims fields and rejects values beyond the server limits', () => {
    const result = validateCommentDraft({
      authorName: ` ${'访'.repeat(25)} `,
      content: ` ${'文'.repeat(1001)} `,
    });

    expect(result).toMatchObject({
      ok: false,
      data: {
        authorName: '访'.repeat(25),
        content: '文'.repeat(1001),
      },
      errors: {
        authorName: '昵称长度必须为 2–24 个字符',
        content: '评论内容长度必须为 2–1000 个字符',
      },
    });
  });
});

describe('comment pagination behavior', () => {
  it('ignores an older response that resolves after a newer first-page load', async () => {
    const { controller, requests } = createPaginationHarness();

    const olderLoad = controller.loadFirstPage();
    const newerLoad = controller.loadFirstPage();
    requests[1]!.response.resolve(page(['new-parent'], null));
    await expect(newerLoad).resolves.toMatchObject({ status: 'applied', mode: 'reset' });
    requests[0]!.response.resolve(page(['old-parent'], null));
    await expect(olderLoad).resolves.toMatchObject({ status: 'stale', mode: 'reset' });

    expect(controller.snapshot().items).toEqual([{ id: 'new-parent' }]);
  });

  it('keeps rendered items and the cursor after append failure so retry can continue', async () => {
    const { controller, requests } = createPaginationHarness();
    const firstPage = controller.loadFirstPage();
    requests[0]!.response.resolve(page(['parent-a'], 'cursor-a'));
    await firstPage;

    const failedAppend = controller.loadMore();
    expect(requests[1]!.cursor).toBe('cursor-a');
    requests[1]!.response.reject(new Error('网络中断'));
    await expect(failedAppend).resolves.toMatchObject({
      status: 'failed',
      mode: 'append',
      error: '网络中断',
    });
    expect(controller.snapshot()).toMatchObject({
      items: [{ id: 'parent-a' }],
      nextCursor: 'cursor-a',
    });

    const retry = controller.loadMore();
    expect(requests[2]!.cursor).toBe('cursor-a');
    requests[2]!.response.resolve(page(['parent-b'], null));
    await retry;
    expect(controller.snapshot()).toMatchObject({
      items: [{ id: 'parent-a' }, { id: 'parent-b' }],
      nextCursor: null,
    });
  });

  it('replaces appended pages with a fresh first page after publishing', async () => {
    const { controller, requests } = createPaginationHarness();
    const firstPage = controller.loadFirstPage();
    requests[0]!.response.resolve(page(['parent-a'], 'cursor-a'));
    await firstPage;
    const append = controller.loadMore();
    requests[1]!.response.resolve(page(['parent-b'], null));
    await append;

    const refreshAfterPublish = controller.loadFirstPage();
    expect(requests[2]!.cursor).toBeNull();
    requests[2]!.response.resolve(page(['fresh-parent'], 'fresh-cursor'));
    await refreshAfterPublish;

    expect(controller.snapshot()).toMatchObject({
      items: [{ id: 'fresh-parent' }],
      nextCursor: 'fresh-cursor',
    });
  });

  it('exposes a pending reply draft only after its parent page is appended', async () => {
    const { controller, replyDraftStore, requests } = createPaginationHarness();
    const draft = { parentId: 'parent-b', authorName: '访客', content: '跨页回复草稿' };
    replyDraftStore.remember(draft);
    const firstPage = controller.loadFirstPage();
    requests[0]!.response.resolve(page(['parent-a'], 'cursor-a'));
    await firstPage;

    expect(controller.getRestorableReplyDraft()).toBeUndefined();

    const append = controller.loadMore();
    requests[1]!.response.resolve(page(['parent-b'], null));
    await append;

    expect(controller.getRestorableReplyDraft()).toEqual(draft);
    replyDraftStore.clear();
    expect(controller.getRestorableReplyDraft()).toBeUndefined();
  });
});

describe('comment pagination page integration', () => {
  it('uses the tested pagination controller for first-page and append requests', () => {
    const source = readFileSync('src/components/Comments.astro', 'utf8');

    expect(source).toContain("from '../lib/comment-pagination'");
    expect(source).toContain('createCommentPaginationController<CommentThread, ReplyDraft>({');
    expect(source).toContain('paginationController.loadFirstPage()');
    expect(source).toContain('paginationController.loadMore()');
    expect(source).not.toContain('let nextCursor: string | null');
  });
});
