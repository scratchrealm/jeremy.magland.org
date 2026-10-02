// Build a widget library, and publish it to the media bucket or serve it for
// development.
//
//   npm run lib -- hello-counter           # build, upload, and point posts at it
//   npm run lib -- hello-counter --dev     # rebuild on change and serve it locally
//   npm run lib -- hello-counter --build   # build only and print its hash
//
// A library is libs/<name>/index.js, bundled by esbuild into one ES module that
// defines custom elements. libs/ has its own package.json and lockfile, so the
// widget code it bundles (usually proof-of-concept repos installed as git
// dependencies) and the esbuild version are pinned there.
//
// Publishing refuses to run if libs/ or these scripts have uncommitted changes
// or the commit is not pushed, since the commit is what a rebuild starts from.
// It reinstalls libs/ from its lockfile, bundles the library, and uploads it as
// <SITE_PREFIX>/libs/<name>-<hash>.js, named by a hash of its contents, so an
// uploaded library never changes. Next to it goes <name>-<hash>.json, a record
// of how it was built. Then every post and draft whose `scripts` frontmatter
// refers to the library (a development URL or an earlier upload) is pointed at
// the new URL. To check a rebuild, check out the recorded commit and run with
// --build; the hash should match.
//
// --dev serves the library at http://localhost:5174/<name>.js, rebuilt on every
// change. Put that URL in a post's `scripts` while working on it.

import { readFile, writeFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { execFileSync, spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PUBLIC_BASE, SITE_PREFIX, fail, isPublished, upload } from './media.mjs'

const DEV_PORT = 5174

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const libsDir = path.join(root, 'libs')
const distDir = path.join(libsDir, 'dist')
const contentDirs = ['src/content/posts', 'src/content/draft_posts'].map((d) => path.join(root, d))

const args = process.argv.slice(2)
const name = args.find((a) => !a.startsWith('--'))
if (!name) {
  console.error('usage: npm run lib -- <name> [--dev | --build]')
  process.exit(2)
}
if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) fail(`"${name}" is not a usable name: use lowercase letters, digits, and hyphens`)
const entry = path.join(libsDir, name, 'index.js')
if (!existsSync(entry)) fail(`${path.relative(root, entry)} not found`)

const git = (...a) => execFileSync('git', a, { cwd: root, encoding: 'utf8' }).trim()

function npmCi() {
  console.log('installing libs/ from its lockfile')
  const r = spawnSync('npm', ['ci', '--no-audit', '--no-fund'], { cwd: libsDir, stdio: 'inherit' })
  if (r.status !== 0) fail('npm ci failed in libs/')
}

async function loadEsbuild() {
  if (!existsSync(path.join(libsDir, 'node_modules'))) npmCi()
  return createRequire(path.join(libsDir, 'package.json'))('esbuild')
}

const buildOptions = (minify) => ({
  absWorkingDir: libsDir,
  entryPoints: [entry],
  outfile: path.join(distDir, `${name}.js`),
  bundle: true,
  format: 'esm',
  target: 'es2020',
  minify,
  logLevel: 'warning',
})

async function build() {
  const esbuild = await loadEsbuild()
  await esbuild.build(buildOptions(true))
  const file = path.join(distDir, `${name}.js`)
  const sha256 = createHash('sha256').update(await readFile(file)).digest('hex')
  return { file, sha256, esbuildVersion: esbuild.version }
}

// Points the `scripts` entries that refer to this library at url, in the
// frontmatter of every post and draft. Frontmatter is not part of a post's
// recording, so this never breaks one.
async function updatePosts(url) {
  const ref = new RegExp(`https?://[^\\s"']+/${name}(?:-[0-9a-f]{12})?\\.js`, 'g')
  for (const dir of contentDirs.filter(existsSync)) {
    for (const f of (await readdir(dir)).filter((f) => f.endsWith('.md'))) {
      const file = path.join(dir, f)
      const text = await readFile(file, 'utf8')
      const fm = text.match(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/)?.[0]
      if (!fm) continue
      const updated = fm.replace(ref, url)
      if (updated === fm) continue
      await writeFile(file, updated + text.slice(fm.length))
      console.log(`updated ${path.relative(root, file)}`)
    }
  }
}

if (args.includes('--dev')) {
  const esbuild = await loadEsbuild()
  const ctx = await esbuild.context(buildOptions(false))
  await ctx.watch()
  await ctx.serve({ servedir: distDir, port: DEV_PORT, cors: { origin: '*' } })
  console.log(`serving http://localhost:${DEV_PORT}/${name}.js (rebuilt on change; Ctrl+C to stop)`)
} else if (args.includes('--build')) {
  npmCi()
  const { file, sha256 } = await build()
  console.log(`${path.relative(root, file)}\nsha256 ${sha256}\nname   ${name}-${sha256.slice(0, 12)}.js`)
} else {
  const dirty = git('status', '--porcelain', '--', 'libs', 'scripts/lib.mjs', 'scripts/media.mjs')
  if (dirty) fail(`commit these first, so the recorded commit can rebuild the library:\n${dirty}`)
  const commit = git('rev-parse', 'HEAD')
  if (!git('branch', '-r', '--contains', commit)) fail(`push ${commit.slice(0, 7)} first, so the recorded commit can be fetched`)

  npmCi()
  const { file, sha256, esbuildVersion } = await build()
  const base = `${name}-${sha256.slice(0, 12)}`
  const key = `${SITE_PREFIX}/libs/${base}.js`
  const url = `${PUBLIC_BASE}/${key}`

  if (await isPublished(url)) console.log(`already uploaded: ${url}`)
  else {
    const record = {
      library: name,
      url,
      sha256,
      repo: git('remote', 'get-url', 'origin'),
      commit,
      source: `libs/${name}/index.js`,
      rebuild: `git checkout ${commit} && npm run lib -- ${name} --build`,
      node: process.version,
      npm: execFileSync('npm', ['--version'], { encoding: 'utf8' }).trim(),
      esbuild: esbuildVersion,
      uploaded: new Date().toISOString(),
    }
    const recordFile = path.join(distDir, `${base}.json`)
    await writeFile(recordFile, JSON.stringify(record, null, 2) + '\n')
    // The record goes first, so an uploaded library always has one.
    upload(recordFile, `${SITE_PREFIX}/libs/${base}.json`, 'application/json')
    upload(file, key, 'text/javascript')
  }
  await updatePosts(url)
  console.log(url)
}
