import { describe, expect, it } from 'vitest';

import {
  buildCommentThreads,
  parseCommentResource,
  validateCommentSubmission,
  type CommentRow,
} from '../src/lib/comments';

const parentRow: CommentRow = {
  id: 'parent-1',
  resource_type: 'guestbook',
  resource_id: 'global',
  parent_id: null,
  author_name: '许汝林',
  content: '顶级评论',
  status: 'published',
  created_at: '2026-07-14T10:00:00.000Z',
};

const replyRow: CommentRow = {
  id: 'reply-1',
  resource_type: 'guestbook',
  resource_id: 'global',
  parent_id: parentRow.id,
  author_name: '访客',
  content: '一条回复',
  status: 'published',
  created_at: '2026-07-14T10:01:00.000Z',
};

describe('parseCommentResource', () => {
  it('parses an article slug', () => {
    expect(parseCommentResource('article:redisearch-result-set')).toEqual({
      type: 'article',
      id: 'redisearch-result-set',
    });
  });

  it('parses project and guestbook resources', () => {
    expect(parseCommentResource('project:field-notes')).toEqual({
      type: 'project',
      id: 'field-notes',
    });
    expect(parseCommentResource('guestbook:global')).toEqual({
      type: 'guestbook',
      id: 'global',
    });
  });

  it.each([
    'unknown:anything',
    'article:',
    'article:Uppercase',
    'project:has_underscore',
    'guestbook:other',
    'guestbook:global:extra',
    42,
    null,
  ])('rejects an invalid resource: %s', (value) => {
    expect(parseCommentResource(value)).toBeNull();
  });
});

describe('validateCommentSubmission', () => {
  it('accepts a valid guestbook comment', () => {
    expect(validateCommentSubmission({
      resource: 'guestbook:global',
      authorName: '许汝林',
      content: '你好',
    }).ok).toBe(true);
  });

  it('trims and returns the cleaned submission', () => {
    const result = validateCommentSubmission({
      resource: 'article:redisearch-result-set',
      authorName: ' 许汝林 ',
      content: ' 你好，世界。 ',
      parentId: ' parent-1 ',
      website: ' example.com ',
    });

    expect(result).toEqual({
      ok: true,
      data: {
        resource: { type: 'article', id: 'redisearch-result-set' },
        authorName: '许汝林',
        content: '你好，世界。',
        parentId: 'parent-1',
        website: 'example.com',
      },
    });
  });

  it('rejects a nickname or body below the minimum length', () => {
    expect(validateCommentSubmission({
      resource: 'guestbook:global',
      authorName: 'A',
      content: 'x',
    }).ok).toBe(false);
  });

  it('counts a single emoji nickname as one character', () => {
    expect(validateCommentSubmission({
      resource: 'guestbook:global',
      authorName: '😀',
      content: '正常正文',
    }).ok).toBe(false);
  });

  it('accepts 12 and 13 emoji nicknames below the Unicode code point limit', () => {
    expect(validateCommentSubmission({
      resource: 'guestbook:global',
      authorName: '😀'.repeat(12),
      content: '正常正文',
    }).ok).toBe(true);
    expect(validateCommentSubmission({
      resource: 'guestbook:global',
      authorName: '😀'.repeat(13),
      content: '正常正文',
    }).ok).toBe(true);
  });

  it('counts emoji body length in Unicode code points', () => {
    expect(validateCommentSubmission({
      resource: 'guestbook:global',
      authorName: '访客',
      content: '😀',
    }).ok).toBe(false);
    expect(validateCommentSubmission({
      resource: 'guestbook:global',
      authorName: '访客',
      content: '😀😀',
    }).ok).toBe(true);
  });

  it('accepts the nickname and body limits after trimming', () => {
    expect(validateCommentSubmission({
      resource: 'guestbook:global',
      authorName: ` ${'a'.repeat(24)} `,
      content: ` ${'x'.repeat(1000)} `,
    }).ok).toBe(true);
  });

  it('rejects values above the nickname and body limits', () => {
    expect(validateCommentSubmission({
      resource: 'guestbook:global',
      authorName: 'a'.repeat(25),
      content: '正常正文',
    }).ok).toBe(false);
    expect(validateCommentSubmission({
      resource: 'guestbook:global',
      authorName: '访客',
      content: 'x'.repeat(1001),
    }).ok).toBe(false);
  });

  it.each([null, 1, '', '   '])('rejects an invalid parentId: %s', (parentId) => {
    expect(validateCommentSubmission({
      resource: 'guestbook:global',
      authorName: '访客',
      content: '正常正文',
      parentId,
    }).ok).toBe(false);
  });

  it('allows parentId and website to be omitted', () => {
    expect(validateCommentSubmission({
      resource: 'guestbook:global',
      authorName: '访客',
      content: '正常正文',
    })).toEqual({
      ok: true,
      data: {
        resource: { type: 'guestbook', id: 'global' },
        authorName: '访客',
        content: '正常正文',
      },
    });
  });
});

describe('buildCommentThreads', () => {
  it('attaches replies even when they appear before their parent', () => {
    expect(buildCommentThreads([replyRow, parentRow])[0]?.replies).toHaveLength(1);
  });

  it('sorts top-level comments and replies by creation time', () => {
    const earlierParent = {
      ...parentRow,
      id: 'parent-0',
      created_at: '2026-07-14T09:00:00.000Z',
    };
    const earlierReply = {
      ...replyRow,
      id: 'reply-0',
      parent_id: parentRow.id,
      created_at: '2026-07-14T09:30:00.000Z',
    };

    const threads = buildCommentThreads([replyRow, parentRow, earlierParent, earlierReply]);

    expect(threads.map((thread) => thread.id)).toEqual(['parent-0', 'parent-1']);
    expect(threads[1]?.replies.map((reply) => reply.id)).toEqual(['reply-0', 'reply-1']);
  });

  it('omits hidden comments, orphan replies, and replies to replies', () => {
    const hiddenParent = { ...parentRow, id: 'hidden', status: 'hidden' as const };
    const orphanReply = { ...replyRow, id: 'orphan', parent_id: 'missing' };
    const nestedReply = { ...replyRow, id: 'nested', parent_id: replyRow.id };

    const threads = buildCommentThreads([
      parentRow,
      replyRow,
      hiddenParent,
      orphanReply,
      nestedReply,
    ]);

    expect(threads).toHaveLength(1);
    expect(threads[0]?.id).toBe(parentRow.id);
    expect(threads[0]?.replies.map((reply) => reply.id)).toEqual([replyRow.id]);
  });

  it('does not mutate the input rows', () => {
    const rows = [replyRow, parentRow].map((row) => ({ ...row }));
    const snapshot = structuredClone(rows);

    buildCommentThreads(rows);

    expect(rows).toEqual(snapshot);
  });
});
