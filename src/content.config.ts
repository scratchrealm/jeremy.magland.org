import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

// Pages: static site pages. `order` controls nav position; `description` is
// used for the meta description / link previews (falls back to site default).
const pages = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    order: z.number().optional(),
    description: z.string().optional(),
  }),
})

// Posts: dated writing, listed newest first at /posts.
const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string().optional(),
    authors: z.array(z.string()).optional(),
    // Where the post first appeared, if it is a repost.
    originalUrl: z.string().url().optional(),
    // Shows the "Written by Humans, Not by AI" badge (notbyai.fyi).
    writtenByHuman: z.boolean().optional(),
  }),
})

export const collections = { pages, posts }
