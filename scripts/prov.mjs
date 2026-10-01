// Add a post from a recording exported by the arewehuman web app.
//
//   npm run prov -- ~/Downloads/some-post.md.awh.jsonl
//   npm run prov -- some-post.md.awh.jsonl --slug other-name --date 2026-10-01
//
// Creates src/content/posts/<date>-<slug>.md containing the recorded text, and
// copies the recording next to it as <date>-<slug>.md.awh.jsonl. The date defaults to
// the day the document was created and the slug to the title, which comes from
// a leading "# " line of the text or else from the recording's title (in which
// case it is written to the post's frontmatter). Existing files are not
// overwritten. Posts written in VS Code with the arewehuman extension need none
// of this: they are recorded in place.

import { readFile, writeFile, copyFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

const args = process.argv.slice(2)
const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null)
const input = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'))
if (!input) {
  console.error('usage: npm run prov -- <file.md.awh.jsonl> [--slug NAME] [--date YYYY-MM-DD]')
  process.exit(2)
}

function fail(msg) {
  console.error(`error: ${msg}`)
  process.exit(1)
}

const src = path.resolve(input.replace(/^~(?=\/)/, os.homedir()))
if (!existsSync(src)) fail(`${src} not found`)
// The first line is the header and the last holds the text (see the arewehuman SPEC.md).
const lines = (await readFile(src, 'utf8')).split('\n').filter((l) => l.trim())
const head = JSON.parse(lines[0] ?? 'null')
if (head?.format !== 'arewehuman' || head.version !== 2) fail(`${src} is not an arewehuman recording (format version 2)`)
const prov = { ...head, ...JSON.parse(lines[lines.length - 1]) }

const heading = prov.text.match(/^\s*# (.+)/)?.[1].trim()
const title = heading ?? (prov.title && prov.title !== 'Untitled' ? prov.title : null)
if (!title) fail('no title: the text has no leading "# " line and the file has no title')

const date = opt('--date') ?? new Date(prov.created ?? prov.t0).toISOString().slice(0, 10)
const slug =
  opt('--slug') ??
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
const name = `${date}-${slug}`

const dir = path.join(root, 'src/content/posts')
const postPath = path.join(dir, `${name}.md`)
const provPath = path.join(dir, `${name}.md.awh.jsonl`)
for (const p of [postPath, provPath]) if (existsSync(p)) fail(`${path.relative(root, p)} already exists`)

const front = heading ? '' : `---\ntitle: ${JSON.stringify(title)}\n---\n\n`
await copyFile(src, provPath)
await writeFile(postPath, front + prov.text)
console.log(`created ${path.relative(root, postPath)}`)
console.log(`created ${path.relative(root, provPath)}`)
