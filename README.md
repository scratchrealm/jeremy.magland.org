# jeremy.magland.org

Personal website, built with [Astro](https://astro.build). Content is written
in Markdown and pre-rendered to static HTML at build time (fast, SEO-friendly,
no client-side JavaScript).

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

## SEO

Each page is generated as static HTML with its own title, meta description,
canonical URL, and Open Graph tags (see `src/layouts/BaseLayout.astro`).
A sitemap is generated at build time and referenced from `public/robots.txt`;
the home page carries schema.org Person markup.

## Deployment

Pushing to `main` triggers the GitHub Actions workflow in
`.github/workflows/deploy.yml`, which builds the site and deploys it to
GitHub Pages at jeremy.magland.org (custom domain via `public/CNAME`;
DNS is a CNAME record `jeremy` → `scratchrealm.github.io` in Cloudflare).
