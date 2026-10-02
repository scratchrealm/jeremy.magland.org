// The media bucket, shared by the scripts that publish to it (video.mjs, lib.mjs).
//
// Objects live in the R2 bucket BUCKET in the personal Cloudflare account,
// under SITE_PREFIX (the bucket holds one folder per site), and are served
// from PUBLIC_BASE. Uploads go through wrangler, so it must be logged in to
// the personal account (the default profile). ACCOUNT_ID is pinned, so a login
// to the wrong account fails instead of uploading somewhere else.

import { spawnSync } from 'node:child_process'
import path from 'node:path'

export const ACCOUNT_ID = 'cb02bd56f948bddd989c3d0e6e983c78' // personal Cloudflare account
export const BUCKET = 'jeremy-magland-org-media'
export const PUBLIC_BASE = 'https://media.magland.org'
export const SITE_PREFIX = 'jeremy.magland.org'

export function fail(msg) {
  console.error(`error: ${msg}`)
  process.exit(1)
}

// The query string keeps this check out of the URL's own cache entry;
// otherwise Cloudflare caches the 404 of a not-yet-uploaded object for a few
// minutes after the upload. A failed lookup (for example, while DNS for a new
// domain propagates) counts as not published; uploading again is harmless.
export async function isPublished(url) {
  try {
    return (await fetch(`${url}?check=${Date.now()}`, { method: 'HEAD' })).ok
  } catch {
    return false
  }
}

// Uploads with a year-long immutable cache lifetime: every key includes a hash
// of its contents, so its contents never change.
export function upload(file, key, contentType) {
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
