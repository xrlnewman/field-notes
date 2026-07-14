export type CommentResource = {
  type: 'article' | 'project' | 'guestbook';
  id: string;
};

export type CommentSubmission = {
  resource: CommentResource | null;
  authorName: string;
  content: string;
  parentId?: string;
  website?: string;
};

type ValidationErrors = Partial<Record<
  'resource' | 'authorName' | 'content' | 'parentId' | 'website',
  string
>>;

export type ValidationResult =
  | { ok: true; data: CommentSubmission & { resource: CommentResource } }
  | { ok: false; data: CommentSubmission; errors: ValidationErrors };

export type CommentRow = {
  id: string;
  resource_type: CommentResource['type'];
  resource_id: string;
  parent_id: string | null;
  author_name: string;
  content: string;
  status: string;
  created_at: string;
};

export type CommentItem = {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
};

export type CommentThread = CommentItem & {
  replies: CommentItem[];
};

export function parseCommentResource(value: unknown): CommentResource | null {
  if (typeof value !== 'string') {
    return null;
  }

  if (value === 'guestbook:global') {
    return { type: 'guestbook', id: 'global' };
  }

  const match = /^(article|project):([a-z0-9-]+)$/.exec(value);
  if (!match) {
    return null;
  }

  const type = match[1];
  const id = match[2];
  if ((type !== 'article' && type !== 'project') || !id) {
    return null;
  }

  return {
    type,
    id,
  };
}

export function validateCommentSubmission(value: unknown): ValidationResult {
  const input = isRecord(value) ? value : {};
  const resource = parseCommentResource(input.resource);
  const authorName = typeof input.authorName === 'string' ? input.authorName.trim() : '';
  const content = typeof input.content === 'string' ? input.content.trim() : '';
  const data: CommentSubmission = { resource, authorName, content };
  const errors: ValidationErrors = {};

  if (!resource) {
    errors.resource = '评论资源无效';
  }
  const authorNameLength = Array.from(authorName).length;
  if (authorNameLength < 2 || authorNameLength > 24) {
    errors.authorName = '昵称长度必须为 2–24 个字符';
  }
  const contentLength = Array.from(content).length;
  if (contentLength < 2 || contentLength > 1000) {
    errors.content = '评论内容长度必须为 2–1000 个字符';
  }

  if (input.parentId !== undefined) {
    if (typeof input.parentId !== 'string' || input.parentId.trim() === '') {
      errors.parentId = '回复目标无效';
    } else {
      data.parentId = input.parentId.trim();
    }
  }

  if (input.website !== undefined) {
    if (typeof input.website !== 'string') {
      errors.website = '网站字段无效';
    } else {
      data.website = input.website.trim();
    }
  }

  if (Object.keys(errors).length > 0 || !resource) {
    return { ok: false, data, errors };
  }

  return { ok: true, data: { ...data, resource } };
}

export function buildCommentThreads(rows: CommentRow[]): CommentThread[] {
  const publishedRows = rows
    .filter((row) => row.status === 'published')
    .slice()
    .sort((left, right) => (
      left.created_at.localeCompare(right.created_at)
      || left.id.localeCompare(right.id)
    ));
  const threads: CommentThread[] = [];
  const threadById = new Map<string, CommentThread>();

  for (const row of publishedRows) {
    if (row.parent_id !== null) {
      continue;
    }

    const thread = { ...toCommentItem(row), replies: [] };
    threads.push(thread);
    threadById.set(row.id, thread);
  }

  for (const row of publishedRows) {
    if (row.parent_id === null) {
      continue;
    }

    threadById.get(row.parent_id)?.replies.push(toCommentItem(row));
  }

  return threads;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toCommentItem(row: CommentRow): CommentItem {
  return {
    id: row.id,
    authorName: row.author_name,
    content: row.content,
    createdAt: row.created_at,
  };
}
