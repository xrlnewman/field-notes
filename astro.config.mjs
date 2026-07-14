import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: process.env.SITE_URL ?? 'https://field-notes.pages.dev',
  output: 'static',
  trailingSlash: 'always',
  integrations: [mdx(), sitemap()],
});

