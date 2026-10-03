// Related posts, listed at the end of a post's page (components/RelatedPosts.astro).
//
// src/data/related.json is a list of groups, each a list of published post ids
// (file names without .md). Every post in a group is related to every other, so
// links go both ways; a pair is a group of two. A post may be in several groups.
// `topic` is only a label for whoever edits the file. An id that is not a
// published post fails the build.
import groups from '../data/related.json'
import { getPosts, type Post } from './posts'

// The posts related to `post`, newest first.
export async function getRelated(post: Post): Promise<Post[]> {
  if (post.draft) return []
  const byId = new Map((await getPosts()).map((p) => [p.id, p]))
  const related = new Set<Post>()
  for (const { topic, posts: ids } of groups) {
    for (const id of ids)
      if (!byId.has(id)) throw new Error(`src/data/related.json, group "${topic}": no published post ${id}`)
    if (ids.includes(post.id)) for (const id of ids) if (id !== post.id) related.add(byId.get(id)!)
  }
  return [...related].sort((a, b) => b.date.valueOf() - a.date.valueOf())
}
