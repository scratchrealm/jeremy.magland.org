// Maps a URL to the filename (sans extension) of its cached thumbnail in
// src/assets/software/. Because the name is derived from the URL, changing a
// project's URL automatically invalidates its thumbnail: the generation
// script sees the new name as missing and regenerates, and prunes the orphan.
// Plain .mjs so both scripts/generate-thumbnails.mjs and Astro can import it.

export function thumbnailSlug(url) {
  return url
    .replace(/^https?:\/\//, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
