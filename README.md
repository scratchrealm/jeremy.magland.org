# jeremy.magland.org

Personal website, built with [Astro](https://astro.build). Content is written
in Markdown and pre-rendered to static HTML at build time (fast, SEO-friendly;
the only client-side JavaScript is the tiny theme switcher, the analytics
counter, and the comment widget on posts).

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
  (YYYY-MM-DD), optional `summary`, optional `featured`. Posts are listed at
  `/posts`, newest first, and served at `/posts/<filename>/`. Setting
  `featured: true` makes a post a candidate for the short list on the home
  page, which shows the ten most recent candidates.

Adding a Markdown file is all that is needed — no code changes.

## Provenance posts

Posts written in [arewehuman](https://magland.github.io/arewehuman/) can be published together with their provenance file, which adds a "Watch this post being written" replay to the post page:

```bash
npm run prov -- ~/Downloads/<name>.prov.json
```

This copies the file to `public/provenance/<date>-<slug>.prov.json` and creates `src/content/posts/<date>-<slug>.md` with the `provenance` frontmatter field set. The title comes from a leading `# ` header line of the text (left out of the body, since the page shows it as the title), or else from the file's title. The build fails if the post body differs from the text in the provenance file, so edits must be made in arewehuman and re-exported. See `scripts/prov.mjs`.

## Videos

Video posts are screencasts recorded with [takes](https://vault1.magland.org/proof-of-concept/takes) plus a transcript. Videos are not committed to git; they are stored in the R2 bucket `jeremy-magland-org-media` (personal Cloudflare account) and served from https://media.magland.org. After exporting a video in takes:

```bash
npm run video -- <name fragment of the takes folder>
```

This uploads the MP4 and its thumbnail (used as the poster) under names that include a content hash, then either updates the `<video>` tag of the post that already embeds the video, or creates `src/content/posts/<today>-<slug>.md` with the title, description, and raw transcript from takes. Re-exporting and running it again gives a new URL, so cached copies never go stale. Any MP4 file also works as the argument, and `--slug NAME` overrides the name. See `scripts/video.mjs`. Uploads use wrangler, which must be logged in to the personal account.

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

## Comments

Posts have anonymous comments, served by a self-hosted [Isso](https://isso-comments.de) server at https://jeremy-comments.magland.org (Fly.io app `jeremy-comments`, with a SQLite database on a Fly volume). The server lives in `comments-server/`, which is not part of the Astro build or the Pages deploy; its README has the one-time deploy steps and the Cloudflare DNS record. `src/components/Comments.astro` embeds the widget above the "All posts" link on each post page, in production builds only (dev shows a placeholder), keyed by the thread id `/posts/<slug>/`. Voting is off, and the name, email, and website fields and the reply-notification checkbox are hidden, so every comment is shown as "Anonymous". The widget's styles are in the Comments section of `src/styles/global.css`, which maps Isso's color variables to the theme variables. The server is set by `ISSO_URL` in `src/lib/site.ts`; set it to `''` to remove comments.

Every comment is held for moderation and becomes visible only after approval at https://jeremy-comments.magland.org/admin (password in the Fly secret `ISSO_ADMIN_PASSWORD`). Unapproved comments are deleted after 30 days. There are no email notifications; new comments show up in the admin queue and in `fly logs`. Note that hiding the fields is only a client-side measure: a hand-made request to the API can still include a name or website, which moderation would catch.

## Deployment

Pushing to `main` triggers the GitHub Actions workflow in
`.github/workflows/deploy.yml`, which builds the site and deploys it to
GitHub Pages at jeremy.magland.org (custom domain via `public/CNAME`;
DNS is a CNAME record `jeremy` → `scratchrealm.github.io` in Cloudflare).
