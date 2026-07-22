# jeremy.magland.org

Personal website, built with [Astro](https://astro.build). Content is written
in Markdown and pre-rendered to static HTML at build time (fast, SEO-friendly;
the only client-side JavaScript is the tiny theme switcher and the analytics
counter).

## Development

```bash
npm install
npm run dev
```

## Content

- **Pages** live in `src/content/pages/*.md` (or `.mdx` for pages that embed
  components). Frontmatter: `title`, `order` (position in the nav),
  `description` (meta description for search/link previews). `home.mdx` is
  the front page; any other file `foo.md` is served at `/foo/`.
- **Posts** live in `src/content/posts/*.md`. Frontmatter: `title`, `date`
  (YYYY-MM-DD), optional `summary`. Posts are listed at `/posts`, newest
  first, and served at `/posts/<filename>/`.

Adding a Markdown file is all that is needed — no code changes.

## Themes

The site ships several visual styles, switchable from the dropdown in the
footer or by pressing `t` (next theme) / `Shift+T` (previous) anywhere on the
page (the choice is saved in localStorage). Every CSS file in
`src/styles/themes/` is a theme: the filename is its id, the switcher label
is derived from it, and it is discovered automatically — adding a theme means
dropping in one CSS file, no code changes.

A theme overrides the CSS variables from `src/styles/global.css` (colors and
fonts) under `html[data-theme='<name>']`, and may add extra rules scoped to
the same selector for anything variables don't cover. Set
`--color-scheme: dark` in dark themes so native controls render dark. The
default theme is `DEFAULT_THEME` in `src/lib/themes.ts`; the `:root` values
in `global.css` are a no-JS fallback and should mirror it.

## SEO

Each page is generated as static HTML with its own title, meta description,
canonical URL, and Open Graph tags (see `src/layouts/BaseLayout.astro`).
A sitemap is generated at build time and referenced from `public/robots.txt`;
the home page carries schema.org Person markup.

## Analytics

Pageviews are counted by [GoatCounter](https://www.goatcounter.com) — no
cookies, no personal data, ~3.5 KB of JavaScript. The script is emitted from
`BaseLayout.astro` in production builds only, so `npm run dev` and
`npm run preview` of a dev build do not pollute the stats. The account is set
by `GOATCOUNTER_CODE` in `src/lib/site.ts`; set it to `''` to turn analytics
off. Stats live at https://jeremy-magland.goatcounter.com.

## Deployment

Pushing to `main` triggers the GitHub Actions workflow in
`.github/workflows/deploy.yml`, which builds the site and deploys it to
GitHub Pages at jeremy.magland.org (custom domain via `public/CNAME`;
DNS is a CNAME record `jeremy` → `scratchrealm.github.io` in Cloudflare).
