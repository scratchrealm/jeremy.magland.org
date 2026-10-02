// @ts-check
import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import remarkPostTitle from './src/lib/remark-post-title.mjs'

export default defineConfig({
  site: 'https://jeremy.magland.org',
  // Drafts are left out of the sitemap (see src/pages/drafts/).
  integrations: [mdx(), sitemap({ filter: (page) => !new URL(page).pathname.startsWith('/drafts/') })],
  markdown: { remarkPlugins: [remarkPostTitle] },
})
