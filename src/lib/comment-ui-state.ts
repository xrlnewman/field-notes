export interface CommentUiState {
  tryBeginSubmission: () => boolean;
  finishSubmission: () => void;
  isSubmissionLocked: () => boolean;
  nextLoad: () => number;
  isCurrentLoad: (version: number) => boolean;
}

export interface ReplyDraftStore<T> {
  remember: (draft: T) => void;
  peek: () => T | undefined;
  clear: () => void;
}

export interface CommentDraft {
  authorName: string;
  content: string;
}

type CommentDraftErrors = Partial<Record<keyof CommentDraft, string>>;

export type CommentDraftValidation =
  | { ok: true; data: CommentDraft }
  | { ok: false; data: CommentDraft; errors: CommentDraftErrors };

export function createCommentUiState(): CommentUiState {
  let submissionInProgress = false;
  let loadVersion = 0;

  return {
    tryBeginSubmission() {
      if (submissionInProgress) {
        return false;
      }
      submissionInProgress = true;
      return true;
    },
    finishSubmission() {
      submissionInProgress = false;
    },
    isSubmissionLocked() {
      return submissionInProgress;
    },
    nextLoad() {
      loadVersion += 1;
      return loadVersion;
    },
    isCurrentLoad(version) {
      return version === loadVersion;
    },
  };
}

export function createReplyDraftStore<T>(): ReplyDraftStore<T> {
  let rememberedDraft: T | undefined;

  return {
    remember(draft) {
      rememberedDraft = draft;
    },
    peek() {
      return rememberedDraft;
    },
    clear() {
      rememberedDraft = undefined;
    },
  };
}

export function codePointLength(value: string): number {
  return Array.from(value).length;
}

export function validateCommentDraft(draft: CommentDraft): CommentDraftValidation {
  const data = {
    authorName: draft.authorName.trim(),
    content: draft.content.trim(),
  };
  const errors: CommentDraftErrors = {};

  const authorNameLength = codePointLength(data.authorName);
  if (authorNameLength < 2 || authorNameLength > 24) {
    errors.authorName = '昵称长度必须为 2–24 个字符';
  }

  const contentLength = codePointLength(data.content);
  if (contentLength < 2 || contentLength > 1000) {
    errors.content = '评论内容长度必须为 2–1000 个字符';
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, data, errors };
  }
  return { ok: true, data };
}
