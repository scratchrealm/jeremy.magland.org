// Publish a draft: give it a date and move it, with its recording, into the posts.
//
//   npm run publish -- <slug>
//   npm run publish -- <slug> --date 2026-10-05
//
// Moves src/content/draft_posts/<slug>.md and, if present, its recording
// <slug>.md.awh.jsonl to src/content/posts/<date>-<slug>.md(.awh.jsonl). The
// date defaults to today (local time). Tracked files are moved with git mv, so
// their history follows them. The recording holds no file name, so moving it is
// safe. Close the draft in VS Code first, or the extension may keep saving to
// the old path. Existing posts are not overwritten.

import { existsSync, readFileSync, renameSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const draftsDir = path.join(root, 'src/content/draft_posts')
const postsDir = path.join(root, 'src/content/posts')

const args = process.argv.slice(2)
const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null)
const input = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'))
if (!input) {
  console.error('usage: npm run publish -- <slug> [--date YYYY-MM-DD]')
  process.exit(2)
}

function fail(msg) {
  console.error(`error: ${msg}`)
  process.exit(1)
}

// Accept "slug", "slug.md", or a path to the draft.
const slug = path.basename(input).replace(/\.md(\.awh\.jsonl)?$/, '')
const draft = path.join(draftsDir, `${slug}.md`)
if (!existsSync(draft)) fail(`${path.relative(root, draft)} not found`)

const date = opt('--date') ?? new Date().toLocaleDateString('en-CA')
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fail(`bad date ${date} (want YYYY-MM-DD)`)

// The build needs a title: a leading "# " line or a title in the frontmatter.
const text = readFileSync(draft, 'utf8')
const body = text.replace(/^---\n[\s\S]*?\n---\n/, '')
if (!/^\s*# .+/.test(body) && !/^---\n[\s\S]*?^title:/m.test(text))
  fail('no title (start the draft with a "# Title" line)')

const moves = [[draft, path.join(postsDir, `${date}-${slug}.md`)]]
const rec = `${draft}.awh.jsonl`
if (existsSync(rec)) moves.push([rec, path.join(postsDir, `${date}-${slug}.md.awh.jsonl`)])
else console.warn(`note: no recording ${path.relative(root, rec)}; the post will have no replay`)
for (const [, to] of moves) if (existsSync(to)) fail(`${path.relative(root, to)} already exists`)

const tracked = (file) => {
  try {
    execFileSync('git', ['ls-files', '--error-unmatch', file], { cwd: root, stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

for (const [from, to] of moves) {
  if (tracked(from)) execFileSync('git', ['mv', from, to], { cwd: root })
  else renameSync(from, to)
  console.log(`moved ${path.relative(root, from)} -> ${path.relative(root, to)}`)
}
