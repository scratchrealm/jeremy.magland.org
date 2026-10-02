// Posts, with the defaults filled in. Every page that lists or shows posts goes
// through getPosts() rather than reading the collection directly.
//
// A post is src/content/posts/YYYY-MM-DD-<slug>.md. Frontmatter is optional:
//   title    defaults to a leading "# " line of the body (left out of the page,
//            which shows the title itself; see remark-post-title.mjs)
//   date     defaults to the date in the file name
//   summary  defaults to the first sentence of the body
//   authors  defaults to [AUTHOR]
//   featured defaults to true
// A post may have an arewehuman recording, <same name>.md.awh.jsonl, next to it.
// The post then offers a replay, gets the "written by humans" badge, and its
// body must be exactly the recorded text, or the build fails.
//
// Drafts are src/content/draft_posts/<slug>.md, read the same way through
// getDrafts(). They need no date and are shown only at /drafts/<slug>/.
//
// The `scripts` of a published post must be libraries uploaded with
// `npm run lib` (under LIBS_BASE), or the production build fails; during
// development, and in drafts, they may point anywhere, such as at a library
// served by `npm run lib -- <name> --dev`.
import { getCollection, type CollectionEntry } from 'astro:content'
import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { parseRecording } from './provenance'

export const AUTHOR = 'Jeremy Magland'
export const LIBS_BASE = 'https://media.magland.org/jeremy.magland.org/libs/'

type Entry = CollectionEntry<'posts'> | CollectionEntry<'draft_posts'>

export interface Post {
  id: string
  entry: Entry
  draft: boolean
  // The page's path, /posts/<id>/ or /drafts/<id>/.
  url: string
  title: string
  // For a draft without a date in its frontmatter, the time of the build.
  date: Date
  summary?: string
  authors: string[]
  featured: boolean
  writtenByHuman: boolean
  scripts: string[]
  // The recording: its path on disk and the URL it is served at.
  provenance?: { file: string; url: string }
}

const TITLE_LINE = /^\s*# (.+)(?:\r?\n|$)/

function firstSentence(body: string): string | undefined {
  const para = body.replace(TITLE_LINE, '').trim().split(/\n\s*\n/)[0] ?? ''
  const plain = para.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\s+/g, ' ')
  return plain.match(/^.*?[.!?](?=\s|$)/)?.[0]
}

function toPost(entry: Entry): Post {
  const { data, id } = entry
  const draft = entry.collection === 'draft_posts'
  const body = entry.body ?? ''
  const fail = (msg: string): never => {
    throw new Error(`Post ${entry.filePath ?? id}: ${msg}`)
  }

  const title = data.title ?? body.match(TITLE_LINE)?.[1].trim() ?? fail('no title (add a leading "# Title" line or a title in the frontmatter)')
  const named = id.match(/^(\d{4}-\d{2}-\d{2})-/)?.[1]
  const date =
    data.date ??
    (named ? new Date(`${named}T00:00:00Z`) : draft ? new Date() : fail('no date (name the file YYYY-MM-DD-<slug>.md)'))

  const scripts = data.scripts ?? []
  if (import.meta.env.PROD && !draft)
    for (const src of scripts)
      if (!src.startsWith(LIBS_BASE)) fail(`script ${src} is not a library uploaded with \`npm run lib\``)

  let provenance: Post['provenance']
  const file = entry.filePath && `${entry.filePath}.awh.jsonl`
  if (file && existsSync(file)) {
    // A replay is only honest if it ends in exactly the text being shown.
    const rec = parseRecording(readFileSync(file, 'utf8'))
    if (body.trim() !== rec.text.trim())
      fail(`the text differs from its recording ${file}; edit it in the recording editor`)
    provenance = { file, url: draft ? `/drafts/${id}.md.awh.jsonl` : `/provenance/${id}.md.awh.jsonl` }
  }

  return {
    id,
    entry,
    draft,
    url: draft ? `/drafts/${id}/` : `/posts/${id}/`,
    title,
    date,
    summary: data.summary ?? firstSentence(body),
    authors: data.authors ?? [AUTHOR],
    featured: data.featured ?? true,
    writtenByHuman: data.writtenByHuman ?? !!provenance,
    scripts,
    provenance,
  }
}

// When a post was first committed, in seconds, to order posts of the same date;
// Infinity if it is not committed yet. Needs the full git history (see
// fetch-depth in .github/workflows/deploy.yml).
function firstCommitted(post: Post): number {
  const file = post.entry.filePath
  if (!file) return Infinity
  try {
    const times = execFileSync('git', ['log', '--follow', '--format=%ct', '--', file], { encoding: 'utf8' }).trim()
    return times ? Number(times.split('\n').pop()) : Infinity
  } catch {
    return Infinity
  }
}

let cache: Promise<Post[]> | undefined

// All posts, newest first. Posts of the same date are in the order they were
// first committed, newest first.
export function getPosts(): Promise<Post[]> {
  cache ??= getCollection('posts').then((all) => {
    const posts = all.map(toPost)
    const committed = new Map(posts.map((p) => [p, firstCommitted(p)]))
    return posts.sort((a, b) => b.date.valueOf() - a.date.valueOf() || committed.get(b)! - committed.get(a)!)
  })
  return cache
}

let draftCache: Promise<Post[]> | undefined

// All drafts, by title.
export function getDrafts(): Promise<Post[]> {
  draftCache ??= getCollection('draft_posts').then((all) => all.map(toPost).sort((a, b) => a.title.localeCompare(b.title)))
  return draftCache
}
