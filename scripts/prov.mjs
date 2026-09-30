// Create a post from an arewehuman provenance file (.prov.json).
//
//   npm run prov -- ~/Downloads/some-post.prov.json
//   npm run prov -- some-post.prov.json --slug other-name --date 2026-10-01
//
// The file is copied to public/provenance/<date>-<slug>.prov.json and a post
// src/content/posts/<date>-<slug>.md is created with its text as the body, so
// the post page offers a replay of the writing. The title is taken from a
// leading "# " header line of the text, which is then left out of the body
// (the page shows it as the title), or else from the file's title field. The
// date defaults to the day the document was created, the slug to the title,
// and the summary to the first sentence. Existing files are not overwritten.

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
  console.error('usage: npm run prov -- <file.prov.json> [--slug NAME] [--date YYYY-MM-DD]')
  process.exit(2)
}

function fail(msg) {
  console.error(`error: ${msg}`)
  process.exit(1)
}

const src = path.resolve(input.replace(/^~(?=\/)/, os.homedir()))
if (!existsSync(src)) fail(`${src} not found`)
const prov = JSON.parse(await readFile(src, 'utf8'))
if (prov.format !== 'arewehuman') fail(`${src} is not an arewehuman provenance file`)

let body = prov.text.trim()
let title = prov.title && prov.title !== 'Untitled' ? prov.title : null
const header = body.match(/^# (.*)\n/)
if (header) {
  title = header[1].trim()
  body = body.slice(header[0].length).trim()
}
if (!title) fail('no title: the text has no leading "# " header and the file has no title')

const date = opt('--date') ?? new Date(prov.created ?? prov.t0).toISOString().slice(0, 10)
const slug =
  opt('--slug') ??
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
const name = `${date}-${slug}`

// First sentence of the first paragraph, without Markdown links.
const summary = body
  .split(/\n\s*\n/)[0]
  .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
  .match(/^.*?[.!?](?=\s|$)/)?.[0]

const provPath = path.join(root, 'public/provenance', `${name}.prov.json`)
const postPath = path.join(root, 'src/content/posts', `${name}.md`)
for (const p of [provPath, postPath]) if (existsSync(p)) fail(`${path.relative(root, p)} already exists`)

const yaml = (s) => JSON.stringify(s)
const front = [
  '---',
  `title: ${yaml(title)}`,
  `date: ${date}`,
  ...(summary ? [`summary: ${yaml(summary)}`] : []),
  'authors:',
  '  - Jeremy Magland',
  'featured: true',
  'writtenByHuman: true',
  `provenance: /provenance/${name}.prov.json`,
  '---',
]
await copyFile(src, provPath)
await writeFile(postPath, `${front.join('\n')}\n\n${body}\n`)
console.log(`created ${path.relative(root, postPath)}`)
console.log(`created ${path.relative(root, provPath)}`)
