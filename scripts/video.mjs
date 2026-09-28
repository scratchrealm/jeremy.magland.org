// Publish a video to the media bucket and point a post at it.
//
// Videos are not committed to git. They live in the R2 bucket BUCKET in the
// personal Cloudflare account and are served from PUBLIC_BASE. Each upload is
// stored under a name that includes a hash of its contents, so a URL never
// changes meaning and can be cached forever; re-exporting a video produces a
// new URL, and this script updates the post to use it.
//
//   npm run video -- mochi                    # takes video whose folder matches "mochi"
//   npm run video -- ~/Videos/takes/<id>      # takes video folder
//   npm run video -- path/to/file.mp4         # any MP4 (poster: sibling .jpg, if any)
//   npm run video -- mochi --slug other-name  # override the name
//
// For a takes video (see ~/projects/takes), the MP4 is the latest export and
// the poster is its thumbnail. If a post already embeds this video (by slug),
// its <video> tag is replaced. Otherwise a new post is created with the title
// and description from takes and the raw transcript of the timeline, ready to
// be edited into a formatted transcript.
//
// Uploads go through wrangler, so it must be logged in to the personal account
// (the default profile). CLOUDFLARE_ACCOUNT_ID is pinned below, so a login to
// the wrong account fails instead of uploading somewhere else.

import { readFile, writeFile, readdir, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ACCOUNT_ID = 'cb02bd56f948bddd989c3d0e6e983c78' // personal Cloudflare account
const BUCKET = 'jeremy-magland-org-media'
const PUBLIC_BASE = 'https://media.magland.org'
const TAKES_LIBRARY = path.join(os.homedir(), 'Videos/takes')
// wrangler uploads objects through the Cloudflare API, which caps their size.
const MAX_BYTES = 300 * 1024 * 1024

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const postsDir = path.join(root, 'src/content/posts')

const args = process.argv.slice(2)
const slugArg = args.includes('--slug') ? args[args.indexOf('--slug') + 1] : null
const input = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--slug')
if (!input) {
  console.error('usage: npm run video -- <takes video folder | name fragment | file.mp4> [--slug NAME]')
  process.exit(2)
}

function fail(msg) {
  console.error(`error: ${msg}`)
  process.exit(1)
}

// Resolve the input to { mp4, poster, takesDir }.
async function resolveInput(arg) {
  const p = path.resolve(arg.replace(/^~(?=\/)/, os.homedir()))
  if (p.endsWith('.mp4')) {
    if (!existsSync(p)) fail(`${p} not found`)
    const jpg = p.replace(/\.mp4$/, '.jpg')
    return { mp4: p, poster: existsSync(jpg) ? jpg : null, takesDir: null }
  }
  let dir = p
  if (!existsSync(path.join(dir, 'video.json'))) {
    const matches = (await readdir(TAKES_LIBRARY)).filter((d) => d.includes(arg) && existsSync(path.join(TAKES_LIBRARY, d, 'video.json')))
    if (matches.length !== 1) fail(`${matches.length} takes videos match "${arg}"${matches.length ? ': ' + matches.join(', ') : ''}`)
    dir = path.join(TAKES_LIBRARY, matches[0])
  }
  const video = JSON.parse(await readFile(path.join(dir, 'video.json'), 'utf8'))
  if (!video.export?.file) fail(`${dir} has not been exported yet`)
  const mp4 = path.join(dir, video.export.file)
  const thumb = video.thumbnail?.file ? path.join(dir, video.thumbnail.file) : null
  return { mp4, poster: thumb && existsSync(thumb) ? thumb : null, takesDir: dir, video }
}

async function sha256(file) {
  return createHash('sha256').update(await readFile(file)).digest('hex')
}

// The query string keeps this check out of the URL's own cache entry;
// otherwise Cloudflare caches the 404 of a not-yet-uploaded object for a few
// minutes after the upload. A failed lookup (for example, while DNS for a new
// domain propagates) counts as not published; uploading again is harmless.
async function isPublished(url) {
  try {
    return (await fetch(`${url}?check=${Date.now()}`, { method: 'HEAD' })).ok
  } catch {
    return false
  }
}

function upload(file, key, contentType) {
  console.log(`uploading ${path.basename(file)} -> ${key}`)
  const r = spawnSync(
    'wrangler',
    ['r2', 'object', 'put', `${BUCKET}/${key}`, '--file', file, '--content-type', contentType,
      '--cache-control', 'public, max-age=31536000, immutable', '--remote'],
    { stdio: 'inherit', env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: ACCOUNT_ID } },
  )
  if (r.error) fail(`could not run wrangler: ${r.error.message}`)
  if (r.status !== 0) fail('upload failed (is wrangler logged in to the personal account?)')
}

// The words of a takes transcript that remain in the timeline, split into
// paragraphs at pauses of 2 s or more and at cuts.
async function rawTranscript(takesDir, video) {
  const transcripts = {}
  const paragraphs = []
  let current = []
  for (const seg of video.timeline) {
    if (!(seg.takeId in transcripts)) {
      const f = path.join(takesDir, 'takes', seg.takeId, 'transcript.json')
      transcripts[seg.takeId] = existsSync(f) ? JSON.parse(await readFile(f, 'utf8')).words : null
    }
    const words = transcripts[seg.takeId]
    if (!words) continue
    let prevEnd = null
    for (const w of words) {
      if (w.start < seg.start - 0.05 || w.end > seg.end + 0.05) continue
      if (prevEnd !== null && w.start - prevEnd >= 2 && current.length) {
        paragraphs.push(current.join(' '))
        current = []
      }
      current.push(w.text)
      prevEnd = w.end
    }
    if (current.length) {
      paragraphs.push(current.join(' '))
      current = []
    }
  }
  return paragraphs.join('\n\n')
}

function videoTag(mp4Url, posterUrl) {
  const poster = posterUrl ? ` poster="${posterUrl}"` : ''
  return `<video controls playsinline preload="metadata"${poster} style="width: 100%;" src="${mp4Url}"></video>`
}

async function findPost(slug) {
  const files = (await readdir(postsDir)).filter((f) => /\.mdx?$/.test(f))
  const embeds = new RegExp(`src="[^"]*/(?:media|videos)/${slug}(?:-[0-9a-f]{12})?\\.mp4"`)
  for (const f of files) {
    const text = await readFile(path.join(postsDir, f), 'utf8')
    if (embeds.test(text)) return path.join(postsDir, f)
  }
  const byName = files.find((f) => f.replace(/\.mdx?$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '') === slug)
  return byName ? path.join(postsDir, byName) : null
}

const { mp4, poster, takesDir, video } = await resolveInput(input)
const size = (await stat(mp4)).size
if (size > MAX_BYTES) fail(`${mp4} is ${(size / 1e6).toFixed(0)} MB; wrangler uploads are limited to ${MAX_BYTES / 1024 / 1024} MiB`)

const slug = slugArg ?? path.basename(mp4, '.mp4')
if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) fail(`"${slug}" is not a usable name; pass --slug with lowercase letters, digits, and hyphens`)
const hash = (await sha256(mp4)).slice(0, 12)
const mp4Key = `videos/${slug}-${hash}.mp4`
// The poster is keyed by its own hash, so replacing it gives a new URL even when the video is unchanged.
const posterKey = poster ? `videos/${slug}-${(await sha256(poster)).slice(0, 12)}.jpg` : null
const mp4Url = `${PUBLIC_BASE}/${mp4Key}`
const posterUrl = poster ? `${PUBLIC_BASE}/${posterKey}` : null

if (await isPublished(mp4Url)) console.log(`already uploaded: ${mp4Url}`)
else upload(mp4, mp4Key, 'video/mp4')
if (poster) {
  if (await isPublished(posterUrl)) console.log(`already uploaded: ${posterUrl}`)
  else upload(poster, posterKey, 'image/jpeg')
}

const tag = videoTag(mp4Url, posterUrl)
const postFile = await findPost(slug)
if (postFile) {
  const text = await readFile(postFile, 'utf8')
  const updated = text.replace(/<video\b[^>]*><\/video>/, tag)
  if (updated === text) console.log(`${path.relative(root, postFile)} already embeds this video`)
  else {
    await writeFile(postFile, updated)
    console.log(`updated the video in ${path.relative(root, postFile)}`)
  }
} else {
  const today = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD, local time
  const newFile = path.join(postsDir, `${today}-${slug}.md`)
  const yaml = (s) => JSON.stringify(s ?? '')
  const transcript = takesDir ? await rawTranscript(takesDir, video) : ''
  const body = [
    '---',
    `title: ${yaml(video?.title ?? slug)}`,
    `date: ${today}`,
    `summary: ${yaml(video?.description)}`,
    'authors:',
    '  - Jeremy Magland',
    'featured: true',
    '---',
    '',
    tag,
    '',
    '## Transcript',
    '',
    transcript || '(no transcript)',
    '',
  ].join('\n')
  await writeFile(newFile, body)
  console.log(`created ${path.relative(root, newFile)} with the raw transcript; edit it before publishing`)
}
console.log(mp4Url)
