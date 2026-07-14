import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: process.env.SITE_URL ?? 'https://field-notes-2fi.pages.dev',
  output: 'static',
  trailingSlash: 'always',
  integrations: [mdx(), sitemap()],
});

