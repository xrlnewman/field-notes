import { describe, expect, it } from 'vitest';

import {
  estimateReadingTime,
  isVisibleEntry,
  sortByPublishedAt,
} from '../src/lib/content';

describe('content helpers', () => {
  it('counts mixed Chinese and English text with a minimum of one minute', () => {
    expect(estimateReadingTime('这是中文内容 Astro static site')).toBe(1);
  });

  it('counts longer Chinese content independently from Latin words', () => {
    expect(estimateReadingTime('中'.repeat(600))).toBe(2);
  });

  it('sorts newest content first without mutating the input', () => {
    const entries = [
      { data: { publishedAt: new Date('2025-01-01') } },
      { data: { publishedAt: new Date('2026-01-01') } },
    ];

    const sorted = sortByPublishedAt(entries);

    expect(sorted[0]!.data.publishedAt.getUTCFullYear()).toBe(2026);
    expect(entries[0]!.data.publishedAt.getUTCFullYear()).toBe(2025);
  });

  it('hides drafts only in production', () => {
    expect(isVisibleEntry({ data: { draft: true } }, true)).toBe(false);
    expect(isVisibleEntry({ data: { draft: true } }, false)).toBe(true);
    expect(isVisibleEntry({ data: { draft: false } }, true)).toBe(true);
  });
});
