import { describe, expect, it } from 'vitest';

import { siteConfig } from '../src/config/site';

describe('personal brand configuration', () => {
  it('uses Xu Rulin identity and product engineer positioning', () => {
    expect(siteConfig.name).toBe('许汝林个人博客');
    expect(siteConfig.brand).toBe('许汝林 / PRODUCT ENGINEER');
    expect(siteConfig.brandMark).toBe('许');
    expect(siteConfig.author).toMatchObject({
      name: '许汝林',
      role: '产品型全栈工程师',
      age: 27,
      experienceYears: 7,
    });
  });

  it('publishes the authenticated GitHub profile without exposing email', () => {
    expect(siteConfig.social.github).toBe('https://github.com/xrlnewman');
    expect(siteConfig.social.email).toBe('');
  });
});
