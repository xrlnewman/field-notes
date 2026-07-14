import {
  buildCommentThreads,
  parseCommentResource,
  validateCommentSubmission,
  type CommentItem,
  type CommentRow,
} from '../../src/lib/comments';

type D1Result<T = unknown> = {
  success?: boolean;
  results?: T[];
};

type D1PreparedStatement = {
  bind: (...values: unknown[]) => D1PreparedStatement;
  all: <T>() => Promise<D1Result<T>>;
  first: <T>() => Promise<T | null>;
  run: () => Promise<D1Result>;
};

type D1Database = {
  prepare: (sql: string) => D1PreparedStatement;
};

type CommentsEnv = {
  COMMENTS_DB?: D1Database;
  COMMENT_HASH_SECRET?: string;
};

type RequestContext = {
  request: Request;
  env: CommentsEnv;
};

type ApiErrorCode =
  | 'INVALID_JSON'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'FORBIDDEN_ORIGIN'
  | 'PAYLOAD_TOO_LARGE'
  | 'INVALID_PAGINATION'
  | 'INVALID_RESOURCE'
  | 'INVALID_SUBMISSION'
  | 'PARENT_NOT_FOUND'
  | 'INVALID_PARENT'
  | 'RATE_LIMITED'
  | 'SERVICE_UNAVAILABLE';

type CommentCursor = {
  createdAt: string;
  id: string;
};

const DEFAULT_PAGE_LIMIT = 20;
const MAX_PAGE_LIMIT = 50;
const MAX_JSON_BYTES = 16 * 1024;

export async function onRequestGet(context: RequestContext): Promise<Response> {
  const searchParams = new URL(context.request.url).searchParams;
  const resource = parseCommentResource(searchParams.get('resource'));
  if (!resource) {
    return errorResponse(400, 'INVALID_RESOURCE', '评论资源无效');
  }

  const limit = parsePageLimit(searchParams.get('limit'));
  const cursor = parseCommentCursor(searchParams.get('cursor'));
  if (limit === null || cursor === undefined) {
    return errorResponse(400, 'INVALID_PAGINATION', '分页参数无效');
  }

  const db = context.env.COMMENTS_DB;
  if (!db) {
    return unavailableResponse();
  }

  try {
    const cursorFilter = cursor
      ? 'AND (created_at > ? OR (created_at = ? AND id > ?))'
      : '';
    const parentStatement = db.prepare(`
      SELECT id, resource_type, resource_id, parent_id, author_name, content, created_at, status
      FROM comments
      WHERE resource_type = ?
        AND resource_id = ?
        AND status = ?
        AND parent_id IS NULL
        ${cursorFilter}
      ORDER BY created_at ASC, id ASC
      LIMIT ?
    `);
    const parentResult = cursor
      ? await parentStatement.bind(
        resource.type,
        resource.id,
        'published',
        cursor.createdAt,
        cursor.createdAt,
        cursor.id,
        limit + 1,
      ).all<CommentRow>()
      : await parentStatement.bind(
        resource.type,
        resource.id,
        'published',
        limit + 1,
      ).all<CommentRow>();
    const fetchedParents = parentResult.results ?? [];
    const hasNextPage = fetchedParents.length > limit;
    const parents = fetchedParents.slice(0, limit);
    let replies: CommentRow[] = [];

    if (parents.length > 0) {
      const placeholders = parents.map(() => '?').join(', ');
      const replyResult = await db.prepare(`
        SELECT id, resource_type, resource_id, parent_id, author_name, content, created_at, status
        FROM comments
        WHERE resource_type = ?
          AND resource_id = ?
          AND status = ?
          AND parent_id IN (${placeholders})
        ORDER BY created_at ASC, id ASC
      `).bind(
        resource.type,
        resource.id,
        'published',
        ...parents.map((parent) => parent.id),
      ).all<CommentRow>();
      replies = replyResult.results ?? [];
    }

    const lastParent = hasNextPage ? parents.at(-1) : undefined;

    return jsonResponse(200, {
      ok: true,
      data: {
        comments: buildCommentThreads([...parents, ...replies]),
        nextCursor: lastParent
          ? encodeCommentCursor({ createdAt: lastParent.created_at, id: lastParent.id })
          : null,
      },
    });
  } catch {
    return unavailableResponse();
  }
}

export async function onRequestPost(context: RequestContext): Promise<Response> {
  const contentType = context.request.headers.get('content-type')
    ?.split(';', 1)[0]
    ?.trim()
    .toLowerCase();
  if (contentType !== 'application/json') {
    return errorResponse(415, 'UNSUPPORTED_MEDIA_TYPE', '仅支持 JSON 请求');
  }

  const requestOrigin = new URL(context.request.url).origin;
  const origin = context.request.headers.get('origin');
  const fetchSite = context.request.headers.get('sec-fetch-site')?.toLowerCase();
  if ((origin !== null && origin !== requestOrigin) || fetchSite === 'cross-site') {
    return errorResponse(403, 'FORBIDDEN_ORIGIN', '仅允许同源提交评论');
  }

  const contentLength = parseContentLength(context.request.headers.get('content-length'));
  if (contentLength !== null && contentLength > MAX_JSON_BYTES) {
    return errorResponse(413, 'PAYLOAD_TOO_LARGE', '请求内容不能超过 16KiB');
  }

  const bodyResult = await readBoundedJson(context.request, MAX_JSON_BYTES);
  if (bodyResult.status === 'too-large') {
    return errorResponse(413, 'PAYLOAD_TOO_LARGE', '请求内容不能超过 16KiB');
  }
  if (bodyResult.status === 'invalid') {
    return errorResponse(400, 'INVALID_JSON', '请求内容不是有效的 JSON');
  }
  const body = bodyResult.value;

  if (isFilledHoneypot(body)) {
    return jsonResponse(201, {
      ok: true,
      data: { comment: createDecoyComment(body) },
    });
  }

  const validation = validateCommentSubmission(body);
  if (!validation.ok) {
    const code = validation.errors.resource ? 'INVALID_RESOURCE' : 'INVALID_SUBMISSION';
    return errorResponse(400, code, '评论提交内容无效');
  }

  const db = context.env.COMMENTS_DB;
  const secret = context.env.COMMENT_HASH_SECRET;
  if (!db || !secret) {
    return unavailableResponse();
  }

  const { resource, authorName, content, parentId } = validation.data;

  try {
    if (parentId) {
      const parent = await db.prepare(`
        SELECT id, resource_type, resource_id, parent_id, author_name, content, created_at, status
        FROM comments
        WHERE id = ?
        LIMIT 1
      `).bind(parentId).first<CommentRow>();

      if (!parent) {
        return errorResponse(404, 'PARENT_NOT_FOUND', '回复目标不存在');
      }
      if (
        parent.resource_type !== resource.type
        || parent.resource_id !== resource.id
        || parent.status !== 'published'
        || parent.parent_id !== null
      ) {
        return errorResponse(400, 'INVALID_PARENT', '回复目标无效');
      }
    }

    const ip = context.request.headers.get('CF-Connecting-IP') ?? 'unknown';
    const ipHash = await hashIp(secret, ip);
    const cutoff = new Date(Date.now() - 45_000).toISOString();
    const recent = await db.prepare(`
      SELECT id
      FROM comments
      WHERE ip_hash = ? AND created_at >= ?
      ORDER BY created_at DESC
      LIMIT 1
    `).bind(ipHash, cutoff).first<{ id: string }>();

    if (recent) {
      return errorResponse(429, 'RATE_LIMITED', '评论提交过于频繁，请稍后再试');
    }

    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const result = await db.prepare(`
      INSERT INTO comments (
        id,
        resource_type,
        resource_id,
        parent_id,
        author_name,
        content,
        created_at,
        status,
        ip_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      resource.type,
      resource.id,
      parentId ?? null,
      authorName,
      content,
      createdAt,
      'published',
      ipHash,
    ).run();

    if (result.success === false) {
      throw new Error('D1 insert failed');
    }

    return jsonResponse(201, {
      ok: true,
      data: {
        comment: {
          id,
          authorName,
          content,
          createdAt,
        },
      },
    });
  } catch (error) {
    if (hasErrorMarker(error, 'comment_rate_limited')) {
      return errorResponse(429, 'RATE_LIMITED', '评论提交过于频繁，请稍后再试');
    }
    if (hasErrorMarker(error, 'invalid_parent')) {
      return errorResponse(404, 'PARENT_NOT_FOUND', '回复目标不存在');
    }
    return unavailableResponse();
  }
}

function isFilledHoneypot(value: unknown): boolean {
  return isRecord(value) && typeof value.website === 'string' && value.website.trim() !== '';
}

function parsePageLimit(value: string | null): number | null {
  if (value === null) {
    return DEFAULT_PAGE_LIMIT;
  }
  if (!/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    return null;
  }
  return Math.min(parsed, MAX_PAGE_LIMIT);
}

function encodeCommentCursor(cursor: CommentCursor): string {
  return btoa(JSON.stringify(cursor))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/u, '');
}

function parseCommentCursor(value: string | null): CommentCursor | null | undefined {
  if (value === null) {
    return null;
  }
  if (value.length === 0 || value.length > 512 || !/^[A-Za-z0-9_-]+$/.test(value)) {
    return undefined;
  }

  try {
    const base64 = value.replaceAll('-', '+').replaceAll('_', '/');
    const padding = '='.repeat((4 - (base64.length % 4)) % 4);
    const decoded: unknown = JSON.parse(atob(base64 + padding));
    if (
      !isRecord(decoded)
      || typeof decoded.createdAt !== 'string'
      || decoded.createdAt.length === 0
      || typeof decoded.id !== 'string'
      || decoded.id.length === 0
    ) {
      return undefined;
    }
    return { createdAt: decoded.createdAt, id: decoded.id };
  } catch {
    return undefined;
  }
}

function parseContentLength(value: string | null): number | null {
  if (value === null || !/^\d+$/.test(value)) {
    return null;
  }
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : Number.POSITIVE_INFINITY;
}

async function readBoundedJson(
  request: Request,
  maxBytes: number,
): Promise<
  | { status: 'ok'; value: unknown }
  | { status: 'invalid' }
  | { status: 'too-large' }
> {
  const reader = request.body?.getReader();
  if (!reader) {
    return { status: 'invalid' };
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        try {
          await reader.cancel();
        } catch {
          // 已确认正文超限；上游取消失败不应把 413 降级成 JSON 格式错误。
        }
        return { status: 'too-large' };
      }
      chunks.push(value);
    }
  } catch {
    return { status: 'invalid' };
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return { status: 'ok', value: JSON.parse(new TextDecoder().decode(bytes)) };
  } catch {
    return { status: 'invalid' };
  }
}

function createDecoyComment(value: unknown): CommentItem {
  const input = isRecord(value) ? value : {};
  return {
    id: crypto.randomUUID(),
    authorName: typeof input.authorName === 'string' ? input.authorName.trim() : '',
    content: typeof input.content === 'string' ? input.content.trim() : '',
    createdAt: new Date().toISOString(),
  };
}

async function hashIp(secret: string, ip: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${secret}:${ip}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasErrorMarker(error: unknown, marker: string): boolean {
  let current = error;
  for (let depth = 0; depth < 5 && current !== undefined; depth += 1) {
    if (typeof current === 'string') {
      return current.includes(marker);
    }
    if (!isRecord(current)) {
      return false;
    }

    if (typeof current.message === 'string' && current.message.includes(marker)) {
      return true;
    }
    current = current.cause;
  }
  return false;
}

function unavailableResponse(): Response {
  return errorResponse(503, 'SERVICE_UNAVAILABLE', '评论服务暂时不可用');
}

function errorResponse(status: number, code: ApiErrorCode, message: string): Response {
  return jsonResponse(status, {
    ok: false,
    error: { code, message },
  });
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'cache-control': 'no-store',
      'content-type': 'application/json; charset=utf-8',
    },
  });
}
