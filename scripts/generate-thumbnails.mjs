// Generate thumbnails for the software page by screenshotting each project's
// live page (first link in src/data/software.json, or `thumbnailUrl` if set).
//
// Each screenshot is saved to src/assets/software/<slug-of-url>.png — the
// filename is derived from the URL, so changing a project's URL invalidates
// its thumbnail: the new name is missing (gets generated) and the old file is
// orphaned (gets pruned). Thumbnails are committed to git, so this does NOT
// run on every build. Run it when adding a project or changing a URL:
//
//   npm run thumbnails                 # generate missing, prune orphans
//   npm run thumbnails -- --force      # regenerate all
//   npm run thumbnails -- --only neurosift,figpack
//
// Uses playwright-core with the system Chrome (no browser download). Point
// CHROME_PATH at a Chrome/Chromium binary to override.

import { readFile, writeFile, mkdir, readdir, unlink } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'
import { thumbnailSlug } from '../src/lib/thumbnail-slug.mjs'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const dataFile = path.join(root, 'src/data/software.json')
const outDir = path.join(root, 'src/assets/software')
const postsDir = path.join(root, 'src/content/posts')
const postThumbDir = path.join(root, 'src/assets/thumbnails')

const VIEWPORT = { width: 1280, height: 800 }
const CONCURRENCY = 3

const args = process.argv.slice(2)
const force = args.includes('--force')
const onlyArg = args[args.indexOf('--only') + 1]
const only = args.includes('--only') ? new Set(onlyArg.split(',')) : null

// Read the `thumbnails` URLs out of every post's YAML frontmatter. Supports
// both inline (`thumbnails: ["a", "b"]`) and block (`- a` per line) styles.
async function collectPostThumbnails() {
  if (!existsSync(postsDir)) return []
  const out = []
  for (const file of await readdir(postsDir)) {
    if (!/\.mdx?$/.test(file)) continue
    const text = await readFile(path.join(postsDir, file), 'utf8')
    const fm = text.match(/^---\n([\s\S]*?)\n---/)
    if (!fm) continue
    const id = file.replace(/\.mdx?$/, '')
    const inline = fm[1].match(/^thumbnails:\s*\[(.*)\]\s*$/m)
    const block = fm[1].match(/^thumbnails:\s*\n((?:[ \t]*-[ \t]*.*\n?)+)/m)
    let urls = []
    if (inline) {
      urls = inline[1].split(',')
    } else if (block) {
      urls = block[1].split('\n').map((l) => l.replace(/^[ \t]*-[ \t]*/, ''))
    }
    for (const raw of urls) {
      const url = raw.trim().replace(/^["']|["']$/g, '')
      if (url) out.push({ id, url })
    }
  }
  return out
}

// Remove *.png in `dir` whose source URL is no longer in `wantedInDir`.
async function prune(dir, wantedInDir) {
  const keep = new Set(wantedInDir.map((t) => path.basename(t.dest)))
  for (const file of await readdir(dir)) {
    if (file.endsWith('.png') && !keep.has(file)) {
      await unlink(path.join(dir, file))
      console.log(`  pruned ${file} (no longer referenced)`)
    }
  }
}

const projects = JSON.parse(await readFile(dataFile, 'utf8'))
await mkdir(outDir, { recursive: true })
await mkdir(postThumbDir, { recursive: true })

// Software page: one screenshot per project (its primary link or thumbnailUrl).
const softwareWanted = projects
  .map((p) => ({ id: p.id, url: p.thumbnailUrl ?? p.links[0]?.url }))
  .filter((t) => t.url)
  .map((t) => ({ ...t, dest: path.join(outDir, `${thumbnailSlug(t.url)}.png`) }))

// Posts: screenshot each URL listed in a post's `thumbnails` frontmatter.
const postWanted = (await collectPostThumbnails()).map((t) => ({
  ...t,
  dest: path.join(postThumbDir, `${thumbnailSlug(t.url)}.png`),
}))

const wanted = [...softwareWanted, ...postWanted]

// Prune screenshots whose source URL is no longer referenced, per directory.
await prune(outDir, softwareWanted)
await prune(postThumbDir, postWanted)

const targets = wanted.filter((t) => {
  if (only) return only.has(t.id)
  return force || !existsSync(t.dest)
})

if (targets.length === 0) {
  console.log('All thumbnails up to date (use --force to regenerate).')
  process.exit(0)
}

console.log(`Generating ${targets.length} thumbnail(s)...`)

const browser = await chromium.launch({
  channel: process.env.CHROME_PATH ? undefined : 'chrome',
  executablePath: process.env.CHROME_PATH,
  headless: true,
  // WebGPU in headless Chrome (several of the screenshotted apps need it to
  // render anything). Requires a GPU with a Vulkan driver on the host.
  args: [
    '--enable-unsafe-webgpu',
    '--enable-features=Vulkan',
    '--use-angle=vulkan',
    '--ignore-gpu-blocklist',
  ],
})

const failures = []

// Try to clear cookie/consent banners (e.g. nature.com) before shooting.
const CONSENT_BUTTONS = [
  /reject (optional|all|additional)( cookies)?/i,
  /accept all( cookies)?/i,
  /^(accept|agree|i agree|got it|ok)$/i,
]

async function dismissConsent(page) {
  for (const pattern of CONSENT_BUTTONS) {
    try {
      const button = page.getByRole('button', { name: pattern }).first()
      if (await button.isVisible()) {
        await button.click({ timeout: 2000 })
        await page.waitForTimeout(1000)
        return
      }
    } catch {}
  }
}

async function capture({ id, url, dest }) {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 45000 })
    // Give SPAs and late-loading content a chance to settle.
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
    await page.waitForTimeout(2500)
    await dismissConsent(page)
    let shot = await page.screenshot()
    // A tiny PNG means a near-blank page — likely an SPA that hadn't
    // rendered yet. Give it one more generous wait.
    if (shot.length < 15000) {
      await page.waitForTimeout(6000)
      shot = await page.screenshot()
    }
    await writeFile(dest, shot)
    console.log(`  ok    ${id}  (${url})`)
  } catch (err) {
    failures.push(id)
    console.error(`  FAIL  ${id}  (${url}): ${err.message.split('\n')[0]}`)
  } finally {
    await context.close()
  }
}

const queue = [...targets]
await Promise.all(
  Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
    while (queue.length > 0) await capture(queue.shift())
  }),
)

await browser.close()

if (failures.length > 0) {
  console.error(`\n${failures.length} failed: ${failures.join(', ')}`)
  process.exit(1)
}
console.log('Done.')
