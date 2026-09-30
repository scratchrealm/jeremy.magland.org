import rss from '@astrojs/rss'
import type { APIContext } from 'astro'
import { SITE_TITLE, SITE_DESCRIPTION } from '../lib/site'
import { getPosts } from '../lib/posts'

export async function GET(context: APIContext) {
  const posts = await getPosts()
  return rss({
    title: `${SITE_TITLE} — Posts`,
    description: SITE_DESCRIPTION,
    site: context.site!,
    items: posts.map((post) => ({
      title: post.title,
      description: post.summary,
      pubDate: post.date,
      link: `/posts/${post.id}/`,
    })),
  })
}
