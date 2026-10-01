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

- **Pages** live in `src/content/pages/*.md` (or `.mdx` for pages that embed components). Frontmatter: `title`, `order` (position in the nav), `description` (meta description for search/link previews). `home.mdx` is the front page; any other file `foo.md` is served at `/foo/`.
- **Posts** live in `src/content/posts/`, one file `YYYY-MM-DD-<slug>.md` per post, served at `/posts/YYYY-MM-DD-<slug>/` and listed at `/posts` newest first.
- **Drafts** that are not published live in `drafts/` (for example `drafts/ai-posts/`, posts drafted with AI).

A post needs no frontmatter. Its title is a leading `# ` line (which the page shows as the title rather than in the body), its date comes from the file name, and its summary is its first sentence. Posts with the same date are listed in the order they were first committed, newest first. Frontmatter overrides these and sets the rest: `title`, `date`, `summary`, `authors` (default: Jeremy Magland), `featured` (default true; the home page lists the ten most recent featured posts), `originalUrl` (for a repost), `writtenByHuman` (the "Written by Humans" badge), `replayProminent`, and `thumbnails`. The schema is in `src/content.config.ts` and the defaults in `src/lib/posts.ts`.

## Recorded posts

A post can carry a recording of its writing, made with [arewehuman](https://github.com/magland/arewehuman): a file `YYYY-MM-DD-<slug>.md.awh.jsonl` next to the post. The post page then offers a replay ("Watch this being written"), shows the "Written by Humans" badge, and serves the recording at `/provenance/YYYY-MM-DD-<slug>.md.awh.jsonl`. The build fails if the post body (everything after the frontmatter) differs from the recorded text, since the replay would then not end in the text being shown.

To write a recorded post in VS Code with the arewehuman extension, right-click `src/content/posts` and choose "New Recorded Document…", name it `YYYY-MM-DD-<slug>.md`, and start with a `# Title` line. Saving brings the `.md.awh.jsonl` next to it up to date. Frontmatter, if any, goes in the editor's frontmatter field and is not recorded. Reopening the post later opens it in the recording editor again, so edits stay in the recording.

A post written in the arewehuman web app is added with

```bash
npm run prov -- ~/Downloads/<name>.md.awh.jsonl
```

which writes the post (the recorded text) and copies the recording next to it. See `scripts/prov.mjs`.

## Videos

Video posts are screencasts recorded with [takes](https://vault1.magland.org/proof-of-concept/takes) plus a transcript. Videos are not committed to git; they are stored in the R2 bucket `jeremy-magland-org-media` (personal Cloudflare account) and served from https://media.magland.org. After exporting a video in takes:

```bash
npm run video -- <name fragment of the takes folder>
```

This uploads the MP4 and its thumbnail (used as the poster) under names that include a content hash, then either updates the `<video>` tag of the post that already embeds the video, or creates `src/content/posts/<today>-<slug>.md` with the title, summary, and raw transcript from takes. Re-exporting and running it again gives a new URL, so cached copies never go stale. Any MP4 file also works as the argument, and `--slug NAME` overrides the name. See `scripts/video.mjs`. Uploads use wrangler, which must be logged in to the personal account.

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

Every comment is held for moderation and becomes visible only after approval at https://jeremy-comments.magland.org/admin (password in the Fly secret `ISSO_ADMIN_PASSWORD`). Unapproved comments are deleted after 30 days. Each new comment is also emailed to the address in the Fly secret `ISSO_SMTP_USER` (sent through Gmail), with links to activate or delete it. Note that hiding the fields is only a client-side measure: a hand-made request to the API can still include a name or website, which moderation would catch.

## Deployment

Pushing to `main` triggers the GitHub Actions workflow in
`.github/workflows/deploy.yml`, which builds the site and deploys it to
GitHub Pages at jeremy.magland.org (custom domain via `public/CNAME`;
DNS is a CNAME record `jeremy` → `scratchrealm.github.io` in Cloudflare).
