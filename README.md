# jeremy.magland.org

Personal website, built with [Astro](https://astro.build). Content is written
in Markdown and pre-rendered to static HTML at build time (fast, SEO-friendly;
the only client-side JavaScript is the tiny theme switcher, site search, the
analytics counter, and the comment widget on posts).

## Development

```bash
npm install
npm run dev
```

## Content

- **Pages** live in `src/content/pages/*.md` (or `.mdx` for pages that embed components). Frontmatter: `title`, `order` (position in the nav), `description` (meta description for search/link previews). `home.mdx` is the front page; any other file `foo.md` is served at `/foo/`.
- **Posts** live in `src/content/posts/`, one file `YYYY-MM-DD-<slug>.md` per post, served at `/posts/YYYY-MM-DD-<slug>/` and listed at `/posts` newest first.
- **Drafts** of posts live in `src/content/draft_posts/<slug>.md` (with their recordings), undated. Each is shown at `/drafts/<slug>/`, and all are listed at `/drafts/`. Nothing links there, the pages ask search engines not to index them, they are left out of the sitemap and RSS, and they have no comments, but they are not private: anyone with the URL can read them. They are committed, so they are backed up and their history is public. `npm run publish -- <slug> [--date YYYY-MM-DD]` gives a draft a date (default today) and moves it and its recording into `src/content/posts/`; close it in VS Code first. See `scripts/publish.mjs`.
- `drafts/ai-posts/` holds old posts drafted with AI; they are not published.

A post needs no frontmatter. Its title is a leading `# ` line (which the page shows as the title rather than in the body), its date comes from the file name, and its summary is its first sentence. Posts with the same date are listed in the order they were first committed, newest first. Frontmatter overrides these and sets the rest: `title`, `date`, `summary`, `authors` (default: Jeremy Magland), `featured` (default true; the home page lists the ten most recent featured posts), `originalUrl` (for a repost), `writtenByHuman` (the "Written by Humans" badge), `replayProminent`, and `thumbnails`. The schema is in `src/content.config.ts` and the defaults in `src/lib/posts.ts`.

## Recorded posts

A post can carry a recording of its writing, made with [arewehuman](https://github.com/magland/arewehuman): a file `YYYY-MM-DD-<slug>.md.awh.jsonl` next to the post. The post page then offers a replay ("Watch this being written"), shows the "Written by Humans" badge, and serves the recording at `/provenance/YYYY-MM-DD-<slug>.md.awh.jsonl`. The build fails if the post body (everything after the frontmatter) differs from the recorded text, since the replay would then not end in the text being shown.

To write a recorded post in VS Code with the arewehuman extension, right-click `src/content/posts` and choose "New Recorded Document…", name it `YYYY-MM-DD-<slug>.md`, and start with a `# Title` line. Saving brings the `.md.awh.jsonl` next to it up to date. Frontmatter, if any, goes in the editor's frontmatter field and is not recorded. Reopening the post later opens it in the recording editor again, so edits stay in the recording.

A post written in the arewehuman web app is added with

```bash
npm run prov -- ~/Downloads/<name>.md.awh.jsonl
```

which writes the post (the recorded text) and copies the recording next to it. See `scripts/prov.mjs`.

## Editing on the site

A post or draft can be edited on the site itself: press `e` on its page, or open it with `?edit` (needed the first time in a browser). The editor reads the post's file and its recording, if any, from GitHub (not from the built site, which can lag behind), and saves both in one commit to `main`, which rebuilds the site in a minute or two. A recorded post is edited in the arewehuman recording editor (`arewehuman/embed`, installed from GitHub), which extends its recording just as the VS Code extension does; other posts are edited without recording. Frontmatter is edited in a separate field and is not recorded. Saving is refused if the post or its recording changed on GitHub after the editor loaded them, so a stale copy never overwrites newer work; commits to other files are fine. Edits not yet saved are kept in the browser's localStorage and restored the next time the post is opened, unless the post changed on GitHub in the meantime, in which case they are offered as a download.

Saving needs a fine-grained GitHub personal access token for `scratchrealm/jeremy.magland.org` with only "Contents: read and write". The editor asks for it once and keeps it in localStorage of that browser, so use it only in your own browsers ("Forget token" removes it). The `e` key does nothing in a browser without a token. The editor code is loaded only when editing starts. See `src/components/LiveEdit.astro`, `src/lib/live-edit.ts`, and `src/lib/github.ts`.

## Videos

Video posts are screencasts recorded with [takes](https://vault1.magland.org/proof-of-concept/takes) plus a transcript. Videos are not committed to git; they are stored in the R2 bucket `jeremy-magland-org-media` (personal Cloudflare account) under `jeremy.magland.org/videos/` and served from https://media.magland.org/jeremy.magland.org/videos/. The bucket has one folder per site. After exporting a video in takes:

```bash
npm run video -- <name fragment of the takes folder>
```

This uploads the MP4 and its thumbnail (used as the poster) under names that include a content hash, then either updates the `<video>` tag of the post that already embeds the video, or creates `src/content/posts/<today>-<slug>.md` with the title, summary, and raw transcript from takes. Re-exporting and running it again gives a new URL, so cached copies never go stale. Any MP4 file also works as the argument, and `--slug NAME` overrides the name. See `scripts/video.mjs`. Uploads use wrangler, which must be logged in to the personal account.

## Widget libraries

A post can embed interactive widgets as web components. The post body uses the custom elements as raw HTML, and the frontmatter key `scripts` lists the full URLs of the JavaScript libraries (ES modules) that define them; the page loads each with a `<script type="module">`. The URLs go in the frontmatter rather than in the body because the body is the recorded text, and frontmatter can change without breaking the recording. See `src/content/draft_posts/widget-example.md`.

Libraries are built and uploaded by hand, not by CI, and stored in the media bucket under `jeremy.magland.org/libs/`. A post therefore keeps exactly the bytes it was published with, old libraries never need to be rebuilt, and large libraries stay out of git. A library is `libs/<name>/index.js`, bundled by esbuild into one file. `libs/` has its own `package.json` and lockfile, separate from the site's; widget code from proof-of-concept repos (on vault1.magland.org or GitHub) is installed there as git dependencies, built on install by each package's `prepare` script, so no repo commits build output.

While working on a post, serve the library locally and put its URL in the post's `scripts`:

```bash
npm run lib -- hello-counter --dev
```

This serves `http://localhost:5174/hello-counter.js`, rebuilt on every change; preview the post with `npm run dev`. To publish the library, commit and push, then run

```bash
npm run lib -- hello-counter
```

which refuses to run if `libs/` has uncommitted or unpushed changes, reinstalls `libs/` from its lockfile, bundles the library, and uploads it as `jeremy.magland.org/libs/<name>-<hash>.js`, named by a hash of its contents and never overwritten. Next to it goes `<name>-<hash>.json`, a record of the commit, the build command, and the tool versions. It then points every post and draft that refers to the library (a development URL or an earlier upload) at the new URL. To check that a library can be rebuilt, check out its recorded commit and run `npm run lib -- <name> --build`, which prints the hash. See `scripts/lib.mjs`.

The production build fails if a published post's `scripts` entry is not under `https://media.magland.org/jeremy.magland.org/libs/`. Drafts may point anywhere, so a draft deployed with a development URL just shows no widget. Browsers load module scripts from another origin only with CORS headers; the bucket's CORS rule is in `scripts/media-cors.json` (apply it with `wrangler r2 bucket cors set jeremy-magland-org-media --file scripts/media-cors.json`).

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

## Related posts

A post's page ends with a list of related posts, taken from `src/data/related.json`. That file is a list of groups, each a `topic` (a label for whoever edits the file, not shown) and a list of published post ids (file names without `.md`). Every post in a group links to every other, so links always go both ways; a pair is a group of two, and a post may be in several groups. This keeps the links out of the post bodies, which matters for recorded posts, whose body must match the recording. An id that is not a published post fails the build, so after `npm run publish` add the new dated id, not the draft slug. Drafts show no related posts. Code: `src/lib/related.ts`, `src/components/RelatedPosts.astro`.

## Search

The magnifier at the end of the nav (or the `/` key) opens a search dialog over all pages and posts, including video transcripts. The index is built by [Pagefind](https://pagefind.app), which runs after `astro build` (see the `build` script) and writes a static index to `dist/pagefind/`; the browser loads it from there on first use, so there is no server. A match under a subheading links to that section of the page. The dialog is `src/components/Search.astro` and its styles are in the Site search section of `src/styles/global.css`.

Only the `<main>` of pages built with `BaseLayout`'s `searchable` prop are indexed (`data-pagefind-body`). It defaults to on unless the page is `noindex`, so drafts and the 404 page are left out, and `/posts/` turns it off since it only repeats post titles and summaries. Page furniture (comments, the replay, the human badge, the recent-posts list on the home page) is marked `data-pagefind-ignore`. Under `npm run dev` there is no index and the dialog says so; to try search locally, run `npm run build && npm run preview`.

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
