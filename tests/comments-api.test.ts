import { describe, expect, it } from 'vitest';

import { onRequestGet, onRequestPost } from '../functions/api/comments';
import type { CommentRow } from '../src/lib/comments';

type StoredComment = CommentRow & { ip_hash: string };

type FakeD1Options = {
  fail?: boolean;
  synchronizeRateReads?: boolean;
  invalidateParentAfterRead?: 'hide' | 'delete';
};

class FakeD1 {
  readonly rows: StoredComment[];
  readonly statements: Array<{ sql: string; bindings: unknown[] }> = [];
  private rateReadCount = 0;
  private releaseRateReads: (() => void) | undefined;
  private readonly rateReadBarrier: Promise<void>;

  constructor(rows: StoredComment[] = [], readonly options: FakeD1Options = {}) {
    this.rows = rows.map((row) => ({ ...row }));
    this.rateReadBarrier = new Promise((resolve) => {
      this.releaseRateReads = resolve;
    });
  }

  prepare(sql: string) {
    if (this.options.fail) {
      throw new Error('D1 unavailable');
    }

    return new FakeStatement(this, sql);
  }

  async waitForConcurrentRateReads() {
    if (!this.options.synchronizeRateReads) {
      return;
    }

    this.rateReadCount += 1;
    if (this.rateReadCount === 2) {
      this.releaseRateReads?.();
    }
    await this.rateReadBarrier;
  }

  readParent(id: unknown): StoredComment | null {
    const index = this.rows.findIndex((row) => row.id === id);
    if (index < 0) {
      return null;
    }

    const snapshot: StoredComment = { ...this.rows[index]! };
    if (this.options.invalidateParentAfterRead === 'hide') {
      this.rows[index]!.status = 'hidden';
    } else if (this.options.invalidateParentAfterRead === 'delete') {
      this.rows.splice(index, 1);
    }
    return snapshot;
  }
}

class FakeStatement {
  private bindings: unknown[] = [];

  constructor(private readonly db: FakeD1, private readonly sql: string) {}

  bind(...bindings: unknown[]) {
    this.bindings = bindings;
    this.db.statements.push({ sql: this.sql, bindings: [...bindings] });
    return this;
  }

  async all<T>() {
    const [resourceType, resourceId, status] = this.bindings;
    const rows = this.db.rows
      .filter((row) => row.resource_type === resourceType)
      .filter((row) => row.resource_id === resourceId)
      .filter((row) => row.status === status)
      .sort((left, right) => (
        left.created_at.localeCompare(right.created_at)
        || left.id.localeCompare(right.id)
      ));

    if (/parent_id\s+is\s+null/i.test(this.sql)) {
      const hasCursor = /created_at\s*>\s*\?/i.test(this.sql);
      const cursorCreatedAt = hasCursor ? String(this.bindings[3]) : undefined;
      const cursorId = hasCursor ? String(this.bindings[5]) : undefined;
      const limit = Number(this.bindings[hasCursor ? 6 : 3]);
      const results = rows
        .filter((row) => row.parent_id === null)
        .filter((row) => !hasCursor || (
          row.created_at > cursorCreatedAt!
          || (row.created_at === cursorCreatedAt && row.id > cursorId!)
        ))
        .slice(0, limit);
      return { success: true, results: results as T[] };
    }

    if (/parent_id\s+in\s*\(/i.test(this.sql)) {
      const parentIds = new Set(this.bindings.slice(3).map(String));
      const results = rows.filter((row) => row.parent_id !== null && parentIds.has(row.parent_id));
      return { success: true, results: results as T[] };
    }

    throw new Error(`Unsupported SELECT: ${this.sql}`);
  }

  async first<T>() {
    if (/\bip_hash\b/i.test(this.sql)) {
      await this.db.waitForConcurrentRateReads();
      const [ipHash, cutoff] = this.bindings;
      const cutoffTime = new Date(String(cutoff)).getTime();
      const row = this.db.rows.find((candidate) => (
        candidate.ip_hash === ipHash
        && new Date(candidate.created_at).getTime() >= cutoffTime
      ));
      return (row ?? null) as T | null;
    }

    const [id] = this.bindings;
    return this.db.readParent(id) as T | null;
  }

  async run() {
    const columns = /insert\s+into\s+comments\s*\(([^)]+)\)/i.exec(this.sql)?.[1]
      ?.split(',')
      .map((column) => column.trim());
    if (!columns) {
      throw new Error(`Unsupported SQL: ${this.sql}`);
    }

    const values = Object.fromEntries(columns.map((column, index) => [column, this.bindings[index]]));
    const createdAt = String(values.created_at ?? new Date().toISOString());
    const recentCutoff = new Date(createdAt).getTime() - 45_000;
    const recent = this.db.rows.some((row) => (
      row.ip_hash === values.ip_hash
      && new Date(row.created_at).getTime() >= recentCutoff
    ));
    if (recent) {
      throw new Error('comment_rate_limited');
    }

    if (values.parent_id !== null) {
      const validParent = this.db.rows.some((row) => (
        row.id === values.parent_id
        && row.resource_type === values.resource_type
        && row.resource_id === values.resource_id
        && row.status === 'published'
        && row.parent_id === null
      ));
      if (!validParent) {
        throw new Error('invalid_parent');
      }
    }

    this.db.rows.push({
      id: String(values.id),
      resource_type: values.resource_type as StoredComment['resource_type'],
      resource_id: String(values.resource_id),
      parent_id: values.parent_id === null ? null : String(values.parent_id),
      author_name: String(values.author_name),
      content: String(values.content),
      created_at: createdAt,
      status: String(values.status ?? 'published'),
      ip_hash: String(values.ip_hash),
    });

    return { success: true };
  }
}

const parent: StoredComment = {
  id: 'parent-1',
  resource_type: 'guestbook',
  resource_id: 'global',
  parent_id: null,
  author_name: '许汝林',
  content: '顶级评论',
  created_at: '2026-07-14T10:00:00.000Z',
  status: 'published',
  ip_hash: 'parent-hash',
};

const reply: StoredComment = {
  ...parent,
  id: 'reply-1',
  parent_id: parent.id,
  author_name: '访客',
  content: '一条回复',
  created_at: '2026-07-14T10:01:00.000Z',
  ip_hash: 'reply-hash',
};

const validSubmission = {
  resource: 'guestbook:global',
  authorName: '测试访客',
  content: '这是一条测试评论',
};
const maxJsonBytes = 16 * 1024;

function createContext(
  request: Request,
  db: FakeD1 | undefined,
  secret: string | null = 'unit-test-fixture',
) {
  return {
    request,
    env: {
      COMMENTS_DB: db,
      COMMENT_HASH_SECRET: secret ?? undefined,
    },
  } as never;
}

function postRequest(
  body: unknown,
  ip = '203.0.113.8',
  headers: Record<string, string> = {},
) {
  return new Request('https://example.com/api/comments', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'CF-Connecting-IP': ip,
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

async function json(response: Response) {
  return response.json() as Promise<Record<string, any>>;
}

describe('GET /api/comments', () => {
  it('returns published comments grouped into threads', async () => {
    const hidden = { ...parent, id: 'hidden', status: 'hidden' };
    const db = new FakeD1([reply, hidden, parent]);
    const request = new Request('https://example.com/api/comments?resource=guestbook%3Aglobal');

    const response = await onRequestGet(createContext(request, db));

    expect(response.status).toBe(200);
    expect(await json(response)).toEqual({
      ok: true,
      data: {
        comments: [{
          id: parent.id,
          authorName: parent.author_name,
          content: parent.content,
          createdAt: parent.created_at,
          replies: [{
            id: reply.id,
            authorName: reply.author_name,
            content: reply.content,
            createdAt: reply.created_at,
          }],
        }],
        nextCursor: null,
      },
    });
    expect(response.headers.has('access-control-allow-origin')).toBe(false);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(db.statements[0]?.bindings).toEqual(['guestbook', 'global', 'published', 21]);
    expect(db.statements[1]?.bindings).toEqual(['guestbook', 'global', 'published', parent.id]);
  });

  it('paginates top-level comments with a stable created_at and id cursor', async () => {
    const createdAt = '2026-07-14T10:00:00.000Z';
    const parents = ['parent-a', 'parent-b', 'parent-c'].map((id) => ({
      ...parent,
      id,
      created_at: createdAt,
      ip_hash: `${id}-hash`,
    }));
    const replies = [
      { ...reply, id: 'reply-a', parent_id: 'parent-a', ip_hash: 'reply-a-hash' },
      { ...reply, id: 'reply-c', parent_id: 'parent-c', ip_hash: 'reply-c-hash' },
    ];
    const db = new FakeD1([parents[2]!, replies[1]!, parents[0]!, replies[0]!, parents[1]!]);

    const firstResponse = await onRequestGet(createContext(new Request(
      'https://example.com/api/comments?resource=guestbook%3Aglobal&limit=2',
    ), db));
    const firstPayload = await json(firstResponse);

    expect(firstPayload.data.comments.map((comment: { id: string }) => comment.id)).toEqual([
      'parent-a',
      'parent-b',
    ]);
    expect(firstPayload.data.comments[0].replies.map((item: { id: string }) => item.id)).toEqual(['reply-a']);
    expect(firstPayload.data.comments[1].replies).toEqual([]);
    expect(firstPayload.data.nextCursor).toEqual(expect.any(String));
    expect(db.statements[1]?.bindings).toEqual([
      'guestbook',
      'global',
      'published',
      'parent-a',
      'parent-b',
    ]);

    const secondUrl = new URL('https://example.com/api/comments');
    secondUrl.searchParams.set('resource', 'guestbook:global');
    secondUrl.searchParams.set('limit', '2');
    secondUrl.searchParams.set('cursor', firstPayload.data.nextCursor);
    const secondResponse = await onRequestGet(createContext(new Request(secondUrl), db));
    const secondPayload = await json(secondResponse);

    expect(secondPayload.data.comments.map((comment: { id: string }) => comment.id)).toEqual(['parent-c']);
    expect(secondPayload.data.comments[0].replies.map((item: { id: string }) => item.id)).toEqual(['reply-c']);
    expect(secondPayload.data.nextCursor).toBeNull();
    expect(db.statements[2]?.bindings).toEqual([
      'guestbook',
      'global',
      'published',
      createdAt,
      createdAt,
      'parent-b',
      3,
    ]);
    expect(db.statements[3]?.bindings).toEqual([
      'guestbook',
      'global',
      'published',
      'parent-c',
    ]);
  });

  it('caps a requested page size at 50 top-level comments', async () => {
    const db = new FakeD1();
    const request = new Request(
      'https://example.com/api/comments?resource=guestbook%3Aglobal&limit=999',
    );

    const response = await onRequestGet(createContext(request, db));

    expect(response.status).toBe(200);
    expect(db.statements[0]?.bindings).toEqual(['guestbook', 'global', 'published', 51]);
  });

  it.each(['0', '1.5', 'not-a-number'])(
    'rejects an invalid page limit: %s',
    async (limit) => {
      const db = new FakeD1();
      const url = new URL('https://example.com/api/comments');
      url.searchParams.set('resource', 'guestbook:global');
      url.searchParams.set('limit', limit);

      const response = await onRequestGet(createContext(new Request(url), db));

      expect(response.status).toBe(400);
      expect(await json(response)).toMatchObject({
        ok: false,
        error: { code: 'INVALID_PAGINATION' },
      });
      expect(db.statements).toHaveLength(0);
    },
  );

  it('treats an explicitly empty cursor as invalid pagination', async () => {
    const db = new FakeD1();
    const request = new Request(
      'https://example.com/api/comments?resource=guestbook%3Aglobal&cursor=',
    );

    const response = await onRequestGet(createContext(request, db));

    expect(response.status).toBe(400);
    expect(await json(response)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_PAGINATION' },
    });
    expect(db.statements).toHaveLength(0);
  });

  it.each([
    ['invalid Base64URL', 'not+base64'],
    ['invalid cursor JSON', 'bm90IGpzb24'],
    ['oversized cursor', 'a'.repeat(513)],
  ])('rejects %s', async (_caseName, cursor) => {
    const db = new FakeD1();
    const url = new URL('https://example.com/api/comments');
    url.searchParams.set('resource', 'guestbook:global');
    url.searchParams.set('cursor', cursor);

    const response = await onRequestGet(createContext(new Request(url), db));

    expect(response.status).toBe(400);
    expect(await json(response)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_PAGINATION' },
    });
    expect(db.statements).toHaveLength(0);
  });

  it('rejects an invalid resource with 400', async () => {
    const db = new FakeD1();
    const request = new Request('https://example.com/api/comments?resource=guestbook%3Aother');

    const response = await onRequestGet(createContext(request, db));

    expect(response.status).toBe(400);
    expect(await json(response)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_RESOURCE' },
    });
    expect(db.statements).toHaveLength(0);
  });

  it('returns 503 when the database is unavailable or unbound', async () => {
    for (const db of [undefined, new FakeD1([], { fail: true })]) {
      const request = new Request('https://example.com/api/comments?resource=guestbook%3Aglobal');
      const response = await onRequestGet(createContext(request, db));

      expect(response.status).toBe(503);
      expect(await json(response)).toMatchObject({
        ok: false,
        error: { code: 'SERVICE_UNAVAILABLE' },
      });
    }
  });
});

describe('POST /api/comments', () => {
  it('rejects cross-origin text/plain before parsing the body', async () => {
    const db = new FakeD1();
    const request = new Request('https://example.com/api/comments', {
      method: 'POST',
      headers: {
        'content-type': 'text/plain',
        origin: 'https://attacker.example',
      },
      body: JSON.stringify(validSubmission),
    });

    const response = await onRequestPost(createContext(request, db));

    expect(response.status).toBe(415);
    expect(await json(response)).toMatchObject({
      ok: false,
      error: { code: 'UNSUPPORTED_MEDIA_TYPE' },
    });
    expect(db.statements).toHaveLength(0);
  });

  it('rejects a foreign Origin and a cross-site fetch', async () => {
    for (const headers of [
      { origin: 'https://attacker.example' },
      { 'sec-fetch-site': 'cross-site' },
    ]) {
      const db = new FakeD1();
      const response = await onRequestPost(createContext(postRequest(
        validSubmission,
        '203.0.113.9',
        headers,
      ), db));

      expect(response.status).toBe(403);
      expect(await json(response)).toMatchObject({
        ok: false,
        error: { code: 'FORBIDDEN_ORIGIN' },
      });
      expect(db.statements).toHaveLength(0);
    }
  });

  it('accepts same-origin JSON and JSON without Origin', async () => {
    for (const headers of [
      { origin: 'https://example.com' },
      {},
    ]) {
      const db = new FakeD1();
      const response = await onRequestPost(createContext(postRequest(
        validSubmission,
        '203.0.113.10',
        headers,
      ), db));

      expect(response.status).toBe(201);
      expect((await json(response)).ok).toBe(true);
      expect(db.rows).toHaveLength(1);
    }
  });

  it('creates a valid comment with parameterized SQL and returns 201', async () => {
    const db = new FakeD1();

    const response = await onRequestPost(createContext(postRequest(validSubmission), db));
    const payload = await json(response);

    expect(response.status).toBe(201);
    expect(payload).toMatchObject({
      ok: true,
      data: {
        comment: {
          authorName: validSubmission.authorName,
          content: validSubmission.content,
        },
      },
    });
    expect(payload.data.comment.id).toEqual(expect.any(String));
    expect(payload.data.comment.createdAt).toEqual(expect.any(String));
    expect(db.rows).toHaveLength(1);
    expect(db.rows[0]).toMatchObject({
      resource_type: 'guestbook',
      resource_id: 'global',
      parent_id: null,
      author_name: validSubmission.authorName,
      content: validSubmission.content,
      status: 'published',
    });
    expect(db.statements.every(({ sql }) => !sql.includes(validSubmission.authorName))).toBe(true);
    expect(response.headers.has('access-control-allow-origin')).toBe(false);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('rejects an oversized Content-Length before reading JSON', async () => {
    const db = new FakeD1();
    const request = postRequest(validSubmission, '203.0.113.11', {
      'content-length': String((16 * 1024) + 1),
    });

    const response = await onRequestPost(createContext(request, db));

    expect(response.status).toBe(413);
    expect(await json(response)).toMatchObject({
      ok: false,
      error: { code: 'PAYLOAD_TOO_LARGE' },
    });
    expect(db.statements).toHaveLength(0);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('does not consume the body when Content-Length already exceeds 16KiB', async () => {
    const db = new FakeD1();
    let readAttempts = 0;
    const body = new ReadableStream<Uint8Array>({
      pull() {
        readAttempts += 1;
        throw new Error('the oversized request body must not be consumed');
      },
    }, { highWaterMark: 0 });
    const request = new Request('https://example.com/api/comments', {
      method: 'POST',
      headers: {
        'content-length': String(maxJsonBytes + 1),
        'content-type': 'application/json',
      },
      body,
      duplex: 'half',
    } as RequestInit & { duplex: 'half' });

    const response = await onRequestPost(createContext(request, db));

    expect(response.status).toBe(413);
    expect(readAttempts).toBe(0);
    expect(db.statements).toHaveLength(0);
    await request.body?.cancel();
  });

  it('allows an exactly 16KiB JSON body to reach parsing', async () => {
    const db = new FakeD1();
    const baseBody = {
      ...validSubmission,
      padding: '',
      website: 'https://spam.example',
    };
    const emptyPaddingJson = JSON.stringify(baseBody);
    const body = JSON.stringify({
      ...baseBody,
      padding: 'x'.repeat(maxJsonBytes - new TextEncoder().encode(emptyPaddingJson).byteLength),
    });
    expect(new TextEncoder().encode(body)).toHaveLength(maxJsonBytes);
    const request = new Request('https://example.com/api/comments', {
      method: 'POST',
      headers: {
        'content-length': String(maxJsonBytes),
        'content-type': 'application/json',
      },
      body,
    });

    const response = await onRequestPost(createContext(request, db));

    expect(response.status).toBe(201);
    expect(await json(response)).toMatchObject({
      ok: true,
      data: { comment: { id: expect.any(String) } },
    });
    expect(db.statements).toHaveLength(0);
  });

  it('rejects an oversized streamed body without Content-Length', async () => {
    const db = new FakeD1();
    const bytes = new TextEncoder().encode(JSON.stringify({
      ...validSubmission,
      padding: 'x'.repeat(17 * 1024),
    }));
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes.slice(0, 8 * 1024));
        controller.enqueue(bytes.slice(8 * 1024));
      },
      cancel() {
        throw new Error('upstream cancellation failed');
      },
    });
    const request = new Request('https://example.com/api/comments', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      duplex: 'half',
    } as RequestInit & { duplex: 'half' });
    expect(request.headers.get('content-length')).toBeNull();

    const response = await onRequestPost(createContext(request, db));

    expect(response.status).toBe(413);
    expect(await json(response)).toMatchObject({
      ok: false,
      error: { code: 'PAYLOAD_TOO_LARGE' },
    });
    expect(db.statements).toHaveLength(0);
  });

  it('rate limits the same IP hash for 45 seconds', async () => {
    const db = new FakeD1();
    const ip = '198.51.100.23';
    const first = await onRequestPost(createContext(postRequest(validSubmission, ip), db));

    const second = await onRequestPost(createContext(postRequest(validSubmission, ip), db));

    expect(first.status).toBe(201);
    expect(second.status).toBe(429);
    expect(await json(second)).toMatchObject({
      ok: false,
      error: { code: 'RATE_LIMITED' },
    });
    expect(db.rows).toHaveLength(1);
    expect(db.rows[0]?.ip_hash).not.toBe(ip);
  });

  it('atomically allows only one of two concurrent requests from the same IP', async () => {
    const db = new FakeD1([], { synchronizeRateReads: true });
    const ip = '198.51.100.24';

    const responses = await Promise.all([
      onRequestPost(createContext(postRequest(validSubmission, ip), db)),
      onRequestPost(createContext(postRequest(validSubmission, ip), db)),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([201, 429]);
    expect(db.rows).toHaveLength(1);
  });

  it('treats a filled honeypot as an ordinary success without touching D1', async () => {
    const db = new FakeD1();
    const response = await onRequestPost(createContext(postRequest({
      resource: 'invalid',
      authorName: '',
      content: '',
      website: 'https://spam.example',
    }), db));

    expect(response.status).toBe(201);
    expect(await json(response)).toMatchObject({
      ok: true,
      data: { comment: { id: expect.any(String) } },
    });
    expect(db.rows).toHaveLength(0);
    expect(db.statements).toHaveLength(0);
  });

  it('returns 404 for a missing parent and rejects replies to replies', async () => {
    const db = new FakeD1([parent, reply]);
    const missingResponse = await onRequestPost(createContext(postRequest({
      ...validSubmission,
      parentId: 'missing',
    }, '192.0.2.1'), db));

    const nestedResponse = await onRequestPost(createContext(postRequest({
      ...validSubmission,
      parentId: reply.id,
    }, '192.0.2.2'), db));

    expect(missingResponse.status).toBe(404);
    expect(await json(missingResponse)).toMatchObject({
      ok: false,
      error: { code: 'PARENT_NOT_FOUND' },
    });
    expect(nestedResponse.status).toBe(400);
    expect(await json(nestedResponse)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_PARENT' },
    });
  });

  it('rejects a parent from another resource or a hidden parent', async () => {
    const wrongResource = { ...parent, id: 'wrong-resource', resource_type: 'article' as const, resource_id: 'hello' };
    const hidden = { ...parent, id: 'hidden-parent', status: 'hidden' };
    const db = new FakeD1([wrongResource, hidden]);

    for (const [parentId, ip] of [['wrong-resource', '192.0.2.3'], ['hidden-parent', '192.0.2.4']]) {
      const response = await onRequestPost(createContext(postRequest({
        ...validSubmission,
        parentId,
      }, ip), db));

      expect(response.status).toBe(400);
      expect(await json(response)).toMatchObject({
        ok: false,
        error: { code: 'INVALID_PARENT' },
      });
    }
  });

  it.each(['hide', 'delete'] as const)(
    'maps an atomic invalid_parent after the parent is %s to 404',
    async (invalidateParentAfterRead) => {
      const db = new FakeD1([parent], { invalidateParentAfterRead });
      const response = await onRequestPost(createContext(postRequest({
        ...validSubmission,
        parentId: parent.id,
      }, `192.0.2.${invalidateParentAfterRead === 'hide' ? '5' : '6'}`), db));

      expect(response.status).toBe(404);
      expect(await json(response)).toMatchObject({
        ok: false,
        error: { code: 'PARENT_NOT_FOUND' },
      });
      expect(db.rows.every((row) => row.parent_id === null)).toBe(true);
    },
  );

  it('returns client errors for invalid JSON and invalid fields', async () => {
    const db = new FakeD1();
    const invalidJson = new Request('https://example.com/api/comments', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{',
    });

    for (const request of [invalidJson, postRequest({ ...validSubmission, content: 'x' })]) {
      const response = await onRequestPost(createContext(request, db));
      expect(response.status).toBe(400);
      expect((await json(response)).ok).toBe(false);
    }
  });

  it('returns 503 on database or binding failures', async () => {
    for (const context of [
      createContext(postRequest(validSubmission), undefined),
      createContext(postRequest(validSubmission), new FakeD1([], { fail: true })),
      createContext(postRequest(validSubmission), new FakeD1(), null),
    ]) {
      const response = await onRequestPost(context);
      expect(response.status).toBe(503);
      expect(await json(response)).toMatchObject({
        ok: false,
        error: { code: 'SERVICE_UNAVAILABLE' },
      });
    }
  });
});
