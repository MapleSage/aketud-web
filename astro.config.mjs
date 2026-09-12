import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import rehypeSlug from 'rehype-slug';

export default defineConfig({
  site: 'https://www.aketud.com',
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  integrations: [sitemap()],
  markdown: {
    rehypePlugins: [rehypeSlug],
    remarkRehype: { footnoteLabel: 'Notes' },
  },
  vite: {
    build: { assetsInlineLimit: 0 },
    server: { allowedHosts: ['4321-idevu687wbd5b6ft35lya-c950989a.sg2.manus.computer'] },
  },
});
