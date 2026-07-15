export const siteConfig = {
  name: '许汝林个人博客',
  brand: '许汝林 / PRODUCT ENGINEER',
  brandMark: '许',
  title: '许汝林个人博客｜产品型全栈工程师',
  description: '许汝林，27 岁，拥有 7 年开发经验的产品型全栈工程师。专注把复杂业务转化为稳定、易用、可持续迭代的产品。',
  author: {
    name: '许汝林',
    role: '产品型全栈工程师',
    age: 27,
    experienceYears: 7,
    bio: '我是一名拥有 7 年开发经验的产品型全栈工程师，能从需求梳理、系统设计、前后端开发一路做到部署交付与持续迭代。',
    avatarSrc: '/images/profile/xu-rulin-avatar.png',
    availability: '可承接产品与复杂系统开发',
    skills: ['PHP / Laravel', 'Go', 'Vue 3 / TypeScript', 'MySQL / Redis', '系统设计与交付'],
  },
  social: {
    github: 'https://github.com/xrlnewman',
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

