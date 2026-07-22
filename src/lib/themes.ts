// Theme registry. Every CSS file in src/styles/themes/ is a theme: the
// filename is its id, the switcher label is derived from it, and the file
// is bundled automatically. Adding a theme = dropping in one CSS file.

export const DEFAULT_THEME = 'forest'

const themeFiles = import.meta.glob('../styles/themes/*.css', { eager: true })

const ids = Object.keys(themeFiles)
  .map((path) => path.split('/').pop()!.replace(/\.css$/, ''))
  .sort((a, b) =>
    a === DEFAULT_THEME ? -1 : b === DEFAULT_THEME ? 1 : a.localeCompare(b),
  )

export const THEMES = ids.map((id) => ({
  id,
  label: id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
}))
