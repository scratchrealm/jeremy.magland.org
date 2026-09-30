// @ts-check
import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import remarkPostTitle from './src/lib/remark-post-title.mjs'

export default defineConfig({
  site: 'https://jeremy.magland.org',
  integrations: [mdx(), sitemap()],
  markdown: { remarkPlugins: [remarkPostTitle] },
})
