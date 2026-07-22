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

const VIEWPORT = { width: 1280, height: 800 }
const CONCURRENCY = 3

const args = process.argv.slice(2)
const force = args.includes('--force')
const onlyArg = args[args.indexOf('--only') + 1]
const only = args.includes('--only') ? new Set(onlyArg.split(',')) : null

const projects = JSON.parse(await readFile(dataFile, 'utf8'))
await mkdir(outDir, { recursive: true })

const wanted = projects
  .map((p) => ({ id: p.id, url: p.thumbnailUrl ?? p.links[0]?.url }))
  .filter((t) => t.url)
  .map((t) => ({ ...t, dest: path.join(outDir, `${thumbnailSlug(t.url)}.png`) }))

// Prune thumbnails whose URL no longer appears in software.json.
const wantedFiles = new Set(wanted.map((t) => path.basename(t.dest)))
for (const file of await readdir(outDir)) {
  if (file.endsWith('.png') && !wantedFiles.has(file)) {
    await unlink(path.join(outDir, file))
    console.log(`  pruned ${file} (no longer referenced)`)
  }
}

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
