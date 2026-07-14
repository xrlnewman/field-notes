export const siteConfig = {
  name: 'Field Notes',
  brand: 'Y / Field Notes',
  title: 'Field Notes · 项目与技术文章',
  description: '做有用的东西，写真实的过程。这里记录项目、技术文章与持续更新的个人实验。',
  author: {
    name: 'Y',
    bio: '独立开发者，关注产品、工程实践与互联网趋势。',
  },
  social: {
    github: '',
    email: '',
  },
  nav: [
    { href: '/', label: '首页' },
    { href: '/projects/', label: '项目' },
    { href: '/articles/', label: '文章' },
    { href: '/guestbook/', label: '留言' },
    { href: '/about/', label: '关于' },
  ],
} as const;

export type SiteConfig = typeof siteConfig;

